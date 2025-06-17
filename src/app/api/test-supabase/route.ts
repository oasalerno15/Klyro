import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Check if environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase environment variables not configured');
      return NextResponse.json({ 
        error: 'Server configuration error - Supabase not configured',
        connected: false,
        environmentVariables: {
          supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          supabaseServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      }, { status: 500 });
    }

    // Create Supabase client inside the function to avoid build-time issues
const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

    const cookieStore = await cookies()
    
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name)
            return cookie?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // Handle cookie setting error
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.delete(name)
            } catch (error) {
              // Handle cookie deletion error
            }
          },
        },
      }
    )

    const { data, error } = await supabaseServer.auth.getSession()
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Supabase connection successful',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      session: data.session ? 'Active' : 'None',
    })
  } catch (error: any) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check if environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase environment variables not configured');
      return NextResponse.json({ 
        error: 'Server configuration error - Supabase not configured'
      }, { status: 500 });
    }

    // Create Supabase client inside the function to avoid build-time issues
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { action } = await req.json();
    
    if (action === 'check-user') {
      // Get the user from the session/auth header
      const authHeader = req.headers.get('authorization');
      console.log('🔍 Auth header:', authHeader);
      
      // Try multiple ways to get user
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log('👤 User from auth:', user, error);
      
      return NextResponse.json({
        success: true,
        user: user,
        authError: error
      });
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    
  } catch (error) {
    console.error('❌ POST test error:', error);
    return NextResponse.json({ 
      error: 'POST test failed', 
      details: error 
    }, { status: 500 });
  }
} 