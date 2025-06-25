import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SUBSCRIPTION_LIMITS } from '@/utils/stripe-constants';

export async function POST(request: NextRequest) {
  try {
    const { featureType } = await request.json();
    
    if (!featureType) {
      return NextResponse.json({ error: 'Feature type is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('subscription_tier, status')
      .eq('user_id', user.id)
      .single();

    // Determine subscription tier (default to free)
    const tier = subscription?.status === 'active' ? subscription.subscription_tier : 'free';
    const limits = SUBSCRIPTION_LIMITS[tier as keyof typeof SUBSCRIPTION_LIMITS];
    
    // Get feature limit
    const featureLimit = limits[featureType as keyof typeof limits] as number;
    
    // If unlimited (-1), user can always use it
    if (featureLimit === -1) {
      return NextResponse.json({ canUse: true, tier, limit: -1, usage: 0 });
    }

    // Get current usage for this month
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usageData } = await supabase
      .from('user_usage')
      .select('usage_count')
      .eq('user_id', user.id)
      .eq('feature_type', featureType)
      .eq('month_year', currentMonth)
      .single();

    const currentUsage = usageData?.usage_count || 0;
    
    // Simple boolean check - can user use this feature?
    const canUse = currentUsage < featureLimit;

    return NextResponse.json({ 
      canUse, 
      tier, 
      limit: featureLimit, 
      usage: currentUsage,
      remaining: Math.max(0, featureLimit - currentUsage)
    });

  } catch (error) {
    console.error('Error checking usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 