import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Map price amounts to subscription tiers (since these are payment links)
function getTierFromAmount(amount: number): string {
  switch (amount) {
    case 999: // $9.99
      return 'starter';
    case 2499: // $24.99
      return 'pro';
    case 4999: // $49.99
      return 'premium';
    default:
      return 'free';
  }
}

// Map price IDs to subscription tiers (if you have specific price IDs)
function getTierFromPriceId(priceId: string): string {
  // You can add your actual Stripe price IDs here if needed
  const priceMap: Record<string, string> = {
    // Add your actual price IDs from Stripe dashboard
    // 'price_1234567890': 'starter',
    // 'price_0987654321': 'pro',
    // 'price_1111111111': 'premium',
  };
  
  return priceMap[priceId] || 'free';
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    const error = err as Error;
    console.log(`Webhook signature verification failed.`, error.message);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('🔄 Processing checkout completion:', session.id);
  
  try {
    const supabase = await createClient();
    
    // Get customer email to find user in database
    const customerEmail = session.customer_email || session.customer_details?.email;
    
    if (!customerEmail) {
      console.error('❌ No customer email found in checkout session');
      return;
    }

    // Find user by email
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching users:', authError);
      return;
    }

    let user = authUsers.users.find(u => u.email === customerEmail);
    
    // If user doesn't exist, create a new account
    if (!user) {
      console.log(`🆕 Creating new user account for: ${customerEmail}`);
      
      // Generate a temporary password (user will need to reset it)
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: customerEmail,
        password: tempPassword,
        email_confirm: true, // Auto-confirm since they paid
        user_metadata: {
          full_name: session.customer_details?.name || customerEmail.split('@')[0],
          created_via: 'stripe_payment',
          payment_session_id: session.id
        }
      });
      
      if (createError) {
        console.error('❌ Error creating user:', createError);
        return;
      }
      
      if (newUser.user) {
        user = newUser.user;
        console.log(`✅ Created new user: ${user.email} (${user.id})`);
      } else {
        console.error('❌ Failed to create user - no user object returned');
        return;
      }
      
      // TODO: Send welcome email with password reset link
      // You can implement this later with your email service
      
    } else {
      console.log(`💡 Found existing user: ${user.email} (${user.id})`);
    }

    // Determine subscription tier from the session
    let tier = 'free';
    
    if (session.subscription) {
      // If it's a subscription, get the subscription details
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0]?.price.id;
      tier = getTierFromPriceId(priceId);
      
      // If tier is still 'free', try to determine from amount
      if (tier === 'free' && session.amount_total) {
        tier = getTierFromAmount(session.amount_total);
      }
    } else if (session.amount_total) {
      // For one-time payments or payment links, determine tier from amount
      tier = getTierFromAmount(session.amount_total);
    }

    console.log(`💡 Determined tier: ${tier} for user: ${user.email}`);

    // Create or update user subscription
    const subscriptionData = {
      user_id: user.id,
      subscription_tier: tier,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string || null,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from('user_subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('❌ Error updating subscription:', upsertError);
    } else {
      console.log(`✅ Subscription activated for user ${user.email}, tier: ${tier}`);
    }

  } catch (error) {
    console.error('❌ Error handling checkout completed:', error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('🔄 Processing subscription created:', subscription.id);
  
  try {
    const supabase = await createClient();
    const userId = subscription.metadata?.userId;
    if (!userId) {
      console.error('❌ No user ID found in subscription metadata');
      return;
    }

    const priceId = subscription.items.data[0]?.price.id;
    const tier = getTierFromPriceId(priceId);

    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        stripe_customer_id: subscription.customer as string,
        stripe_subscription_id: subscription.id,
        subscription_tier: tier,
        status: subscription.status,
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('❌ Error creating subscription:', error);
    } else {
      console.log(`✅ Subscription created for user ${userId}, tier: ${tier}`);
    }
  } catch (error) {
    console.error('❌ Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const supabase = await createClient();
    const priceId = subscription.items.data[0]?.price.id;
    const tier = getTierFromPriceId(priceId);

    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        subscription_tier: tier,
        status: subscription.status,
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('❌ Error updating subscription:', error);
    } else {
      console.log(`✅ Subscription updated: ${subscription.id}, tier: ${tier}`);
    }
  } catch (error) {
    console.error('❌ Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        subscription_tier: 'free',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('❌ Error updating cancelled subscription:', error);
    } else {
      console.log(`✅ Subscription cancelled: ${subscription.id}`);
    }
  } catch (error) {
    console.error('❌ Error handling subscription deleted:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = (invoice as any).subscription;
    if (!subscriptionId) return;
    
    const supabase = await createClient();
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId as string);

    if (error) {
      console.error('❌ Error updating payment succeeded:', error);
    } else {
      console.log(`✅ Payment succeeded for subscription: ${subscriptionId}`);
    }
  } catch (error) {
    console.error('❌ Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = (invoice as any).subscription;
    if (!subscriptionId) return;
    
    const supabase = await createClient();
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId as string);

    if (error) {
      console.error('❌ Error updating payment failed:', error);
    } else {
      console.log(`⚠️ Payment failed for subscription: ${subscriptionId}`);
    }
  } catch (error) {
    console.error('❌ Error handling payment failed:', error);
  }
} 