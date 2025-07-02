import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { SUBSCRIPTION_LIMITS } from '@/utils/stripe-constants';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check current subscription - EXACT same logic as useSubscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get current usage
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const { data: usage, error: usageError } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('month_year', currentMonth);

    // Process usage data - same as useSubscription
    const usageData = {
      transactions: 0,
      receipts: 0,
      aiChats: 0
    };

    usage?.forEach((item) => {
      if (item.feature_type === 'transactions') usageData.transactions = item.usage_count;
      if (item.feature_type === 'receipts') usageData.receipts = item.usage_count;
      if (item.feature_type === 'ai_chats') usageData.aiChats = item.usage_count;
    });

    // EXACT same getCurrentTier logic as useSubscription
    let currentTier = 'free';
    if (subscription && subscription.status === 'active') {
      currentTier = subscription.subscription_tier;
    }

    const limits = SUBSCRIPTION_LIMITS[currentTier as keyof typeof SUBSCRIPTION_LIMITS];

    // EXACT same checkFeatureAccess logic as usePaywall
    const checkAiChat = () => {
      if (!limits) {
        return { allowed: true, reason: 'No limits found' };
      }
      
      const aiLimit = limits.aiChats;
      const currentAIUsage = usageData.aiChats;
      
      if (aiLimit === -1) {
        return { allowed: true, reason: 'Unlimited access' };
      }
      
      if (currentAIUsage >= aiLimit) {
        return { 
          allowed: false, 
          reason: `Used ${currentAIUsage}/${aiLimit} for ${currentTier} tier` 
        };
      }
      
      return { 
        allowed: true, 
        reason: `Used ${currentAIUsage}/${aiLimit} for ${currentTier} tier` 
      };
    };

    const aiChatResult = checkAiChat();

    return NextResponse.json({
      user: { email: user.email },
      subscription: subscription,
      subscriptionError: subError,
      usageData: usageData,
      currentTier: currentTier,
      limits: limits,
      aiChatCheck: aiChatResult,
      debug: {
        hasSubscription: !!subscription,
        subscriptionStatus: subscription?.status,
        tierFromDb: subscription?.subscription_tier,
        statusCheck: subscription?.status === 'active',
        finalTier: currentTier
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 