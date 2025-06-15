import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { stripe, getTierFromPriceId } from '../../../../utils/stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

interface CheckoutSession {
  id: string;
  customer: string | null;
  customer_email: string | null;
  metadata: Record<string, string> | null;
  subscription: string | null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: StripeEvent;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret) as StripeEvent;
  } catch (err) {
    const error = err as Error;
    console.log(`Webhook signature verification failed.`, error.message);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  const supabase = await createClient();

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as CheckoutSession;
      
      // Update user subscription status
      if (session.customer && session.metadata?.userId) {
        const { error } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: session.metadata.userId,
            stripe_customer_id: session.customer,
            subscription_id: session.subscription,
            status: 'active',
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error updating subscription:', error);
        }
      }
      break;

    case 'customer.subscription.updated':
      const subscription = event.data.object as Record<string, unknown>;
      
      // Update subscription status
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          status: subscription.status as string,
          updated_at: new Date().toISOString()
        })
        .eq('subscription_id', subscription.id as string);

      if (updateError) {
        console.error('Error updating subscription status:', updateError);
      }
      break;

    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object as Record<string, unknown>;
      
      // Mark subscription as cancelled
      const { error: deleteError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('subscription_id', deletedSubscription.id as string);

      if (deleteError) {
        console.error('Error cancelling subscription:', deleteError);
      }
      break;

    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Record<string, unknown>;
      
      // Log successful payment
      console.log('Payment succeeded for invoice:', invoice.id);
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object as Record<string, unknown>;
      
      // Handle failed payment
      console.log('Payment failed for invoice:', failedInvoice.id);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
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