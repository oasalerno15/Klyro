import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { checkRateLimit } from '@/lib/rate-limit';

// Validate Stripe key format
const stripeKey = process.env.STRIPE_SECRET_KEY || '';
if (!stripeKey) {
  throw new Error('STRIPE_SECRET_KEY must be defined');
}

if (!stripeKey.startsWith('sk_test_') && !stripeKey.startsWith('sk_live_')) {
  throw new Error('STRIPE_SECRET_KEY must start with sk_test_ or sk_live_');
}

// Initialize Stripe outside the handler
let stripe: Stripe;
try {
  stripe = new Stripe(stripeKey, {
    apiVersion: '2025-05-28.basil',
  });
} catch (error) {
  throw error;
}

export async function POST(request: NextRequest) {
  // Add CORS headers
  const headers = new Headers({
    'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers });
  }

  if (request.method !== 'POST') {
    return new NextResponse(
      JSON.stringify({ error: 'Method not allowed' }), 
      { status: 405, headers }
    );
  }

  try {
    const body = await request.json();
    const { priceId, userId, successUrl, cancelUrl } = body;

    if (!priceId || !userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields: priceId and userId' }),
        { status: 400, headers }
      );
    }

    // Rate limiting - 5 checkout attempts per minute per user
    const rateLimitResult = await checkRateLimit('checkout', userId);
    if (!rateLimitResult.success) {
      const retryAfter = rateLimitResult.reset ? Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000) : 60;
      return new NextResponse(
        JSON.stringify({ 
          error: 'Too many checkout attempts. Please try again later.',
          retryAfter
        }),
        { 
          status: 429, 
          headers: {
            ...Object.fromEntries(headers.entries()),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'Retry-After': retryAfter.toString(),
          }
        }
      );
    }

    // Create Supabase client for auth verification
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Handle cookie setting errors silently
            }
          },
        },
      }
    );

    // Verify user authentication
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers }
      );
    }

    // Verify user ID matches authenticated user
    if (authUser.id !== userId) {
      return new NextResponse(
        JSON.stringify({ error: 'User ID mismatch' }),
        { status: 403, headers }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: authUser.email,
      metadata: {
        userId: userId,
      },
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/#pricing?payment=cancelled`,
    });

    return new NextResponse(
      JSON.stringify({ url: session.url }),
      { status: 200, headers }
    );

  } catch (stripeError: any) {
    return new NextResponse(
      JSON.stringify({ error: 'Payment processing failed' }),
      { status: 500, headers }
    );
  }
} 