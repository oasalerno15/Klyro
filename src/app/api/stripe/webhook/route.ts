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
  console.log('💰 Session amount:', session.amount_total);
  console.log('📧 Customer email:', session.customer_email || session.customer_details?.email);
  console.log('🔗 Session data:', {
    customer: session.customer,
    subscription: session.subscription,
    payment_status: session.payment_status,
    mode: session.mode
  });
  
  try {
    const supabase = await createClient();
    
    // Get customer email to find user in database
    const customerEmail = session.customer_email || session.customer_details?.email;
    
    if (!customerEmail) {
      console.error('❌ No customer email found in checkout session');
      return;
    }

    console.log(`📧 Processing payment for email: ${customerEmail}`);

    // Find user by email - using correct Supabase method
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching users:', authError);
      return;
    }

    let user = authUsers.users.find((u: any) => u.email === customerEmail);
    
    // If user doesn't exist, they should have signed up first in our new flow
    // But handle the case anyway for safety
    if (!user) {
      console.log(`❌ No user found for email: ${customerEmail}`);
      console.log('⚠️  This shouldn\'t happen in the new flow - user should exist before payment');
      
      // Create account as fallback (though this shouldn't happen now)
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: customerEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: session.customer_details?.name || customerEmail.split('@')[0],
          created_via: 'stripe_payment_fallback',
          payment_session_id: session.id
        }
      });
      
      if (createError) {
        console.error('❌ Error creating fallback user:', createError);
        return;
      }
      
      user = newUser.user;
      console.log(`✅ Created fallback user: ${user?.email} (${user?.id})`);
    } else {
      console.log(`💡 Found existing user: ${user.email} (${user.id})`);
    }
    
    if (!user) {
      console.error('❌ No user available after lookup/creation');
      return;
    }

    // Determine subscription tier from the session
    let tier = 'free';
    
    if (session.subscription) {
      // If it's a subscription, get the subscription details
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0]?.price.id;
      tier = getTierFromPriceId(priceId);
      console.log(`🔍 Subscription found - Price ID: ${priceId}, Tier: ${tier}`);
      
      // If tier is still 'free', try to determine from amount
      if (tier === 'free' && session.amount_total) {
        tier = getTierFromAmount(session.amount_total);
        console.log(`🔍 Fallback to amount-based tier: ${tier}`);
      }
    } else if (session.amount_total) {
      // For one-time payments or payment links, determine tier from amount
      tier = getTierFromAmount(session.amount_total);
      console.log(`🔍 One-time payment - Amount: ${session.amount_total}, Tier: ${tier}`);
    }

    console.log(`💡 Final determined tier: ${tier} for user: ${user.email} (amount: ${session.amount_total})`);

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

    console.log('💾 Attempting to save subscription data:', subscriptionData);

    const { error: upsertError } = await supabase
      .from('user_subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('❌ Error updating subscription:', upsertError);
      console.error('❌ Subscription data that failed:', subscriptionData);
    } else {
      console.log(`✅ Subscription activated for user ${user.email}, tier: ${tier}`);
      
      // Initialize user usage for the new subscription period
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      // Reset usage counts for the new subscription period
      const usageResets = [
        { user_id: user.id, feature_type: 'transactions', month_year: currentMonth, usage_count: 0 },
        { user_id: user.id, feature_type: 'receipts', month_year: currentMonth, usage_count: 0 },
        { user_id: user.id, feature_type: 'ai_chats', month_year: currentMonth, usage_count: 0 }
      ];

      for (const usageData of usageResets) {
        const { error: usageError } = await supabase
          .from('user_usage')
          .upsert(usageData, {
            onConflict: 'user_id,feature_type,month_year'
          });
          
        if (usageError) {
          console.error('❌ Error resetting usage for', usageData.feature_type, ':', usageError);
        }
      }
      
      console.log(`✅ Usage counts reset for user ${user.email} for month ${currentMonth}`);
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