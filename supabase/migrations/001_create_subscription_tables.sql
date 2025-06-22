-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'premium')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'incomplete')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create user_usage table
CREATE TABLE IF NOT EXISTS user_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_type TEXT NOT NULL CHECK (feature_type IN ('transactions', 'receipts', 'ai_chats')),
    month_year TEXT NOT NULL, -- Format: YYYY-MM
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, feature_type, month_year)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_month_year ON user_usage(month_year);

-- Create RLS policies
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- Policy for user_subscriptions: users can only see their own subscription
CREATE POLICY "Users can view their own subscription" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" ON user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy for user_usage: users can only see their own usage
CREATE POLICY "Users can view their own usage" ON user_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON user_usage
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow service role to insert/update for webhooks
CREATE POLICY "Service role can manage subscriptions" ON user_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage usage" ON user_usage
    FOR ALL USING (auth.role() = 'service_role');

-- Create function to increment usage
CREATE OR REPLACE FUNCTION increment_user_usage(
    p_user_id UUID,
    p_feature_type TEXT,
    p_increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_usage (user_id, feature_type, month_year, usage_count)
    VALUES (
        p_user_id,
        p_feature_type,
        TO_CHAR(NOW(), 'YYYY-MM'),
        p_increment
    )
    ON CONFLICT (user_id, feature_type, month_year)
    DO UPDATE SET
        usage_count = user_usage.usage_count + p_increment,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 