import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe, getTierFromPriceId } from '../../../../utils/stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') as string;

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: any) {
  const userId = session.metadata?.userId || session.client_reference_id;
  
  if (!userId || !session.subscription) {
    console.error('No user ID or subscription found in checkout session');
    return;
  }

  try {
    // Get the subscription details
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    const priceId = subscription.items.data[0].price.id;
    const tier = getTierFromPriceId(priceId);

    // Update user subscription in database
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        stripe_customer_id: session.customer,
        stripe_subscription_id: subscription.id,
        subscription_tier: tier,
        status: 'active',
        current_period_start: new Date(subscription.billing_cycle_anchor * 1000).toISOString(),
        current_period_end: new Date(subscription.billing_cycle_anchor * 1000 + (30 * 24 * 60 * 60 * 1000)).toISOString(), // Approximate next billing
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error updating subscription:', error);
    } else {
      console.log(`Subscription activated for user ${userId}, tier: ${tier}`);
    }
  } catch (error) {
    console.error('Error handling checkout completed:', error);
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    const userId = subscription.metadata?.userId;
    if (!userId) {
      console.error('No user ID found in subscription metadata');
      return;
    }

    const priceId = subscription.items.data[0].price.id;
    const tier = getTierFromPriceId(priceId);

    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        subscription_tier: tier,
        status: subscription.status,
        current_period_start: new Date(subscription.billing_cycle_anchor * 1000).toISOString(),
        current_period_end: new Date(subscription.billing_cycle_anchor * 1000 + (30 * 24 * 60 * 60 * 1000)).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error updating subscription:', error);
    } else {
      console.log(`Subscription updated for user ${userId}, tier: ${tier}`);
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  try {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        subscription_tier: 'free',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error updating cancelled subscription:', error);
    } else {
      console.log(`Subscription cancelled: ${subscription.id}`);
    }
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handlePaymentSucceeded(invoice: any) {
  try {
    if (!invoice.subscription) return;
    
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const userId = subscription.metadata?.userId;
    
    if (userId) {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          current_period_end: new Date(subscription.billing_cycle_anchor * 1000 + (30 * 24 * 60 * 60 * 1000)).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('Error updating payment succeeded:', error);
      }
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(invoice: any) {
  try {
    if (!invoice.subscription) return;
    
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', invoice.subscription);

    if (error) {
      console.error('Error updating payment failed:', error);
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
} 