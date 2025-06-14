-- Create user_subscriptions table to track Stripe subscriptions
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'premium')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_subscription_id ON user_subscriptions(stripe_subscription_id);
CREATE INDEX idx_user_subscriptions_tier ON user_subscriptions(subscription_tier);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);

-- Update users table to add subscription tier column for easier access
ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'premium'));

-- Create usage tracking table to monitor feature usage
CREATE TABLE user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL, -- 'transaction', 'receipt', 'ai_chat', etc.
  usage_count INTEGER DEFAULT 0,
  month_year TEXT NOT NULL, -- Format: 'YYYY-MM'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature_type, month_year)
);

-- Add indexes for usage tracking
CREATE INDEX idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX idx_user_usage_feature_type ON user_usage(feature_type);
CREATE INDEX idx_user_usage_month_year ON user_usage(month_year);

-- Function to update subscription tier in users table when subscription changes
CREATE OR REPLACE FUNCTION update_user_subscription_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the subscription_tier in users table
  UPDATE users 
  SET subscription_tier = NEW.subscription_tier 
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update users table when subscription changes
CREATE TRIGGER trigger_update_user_subscription_tier
  AFTER INSERT OR UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_subscription_tier();

-- Function to get current usage for a user and feature
CREATE OR REPLACE FUNCTION get_user_usage(
  p_user_id UUID,
  p_feature_type TEXT,
  p_month_year TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM')
)
RETURNS INTEGER AS $$
DECLARE
  usage_count INTEGER := 0;
BEGIN
  SELECT COALESCE(usage_count, 0)
  INTO usage_count
  FROM user_usage
  WHERE user_id = p_user_id 
    AND feature_type = p_feature_type 
    AND month_year = p_month_year;
    
  RETURN usage_count;
END;
$$ LANGUAGE plpgsql;

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_user_usage(
  p_user_id UUID,
  p_feature_type TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  current_month TEXT := TO_CHAR(NOW(), 'YYYY-MM');
BEGIN
  INSERT INTO user_usage (user_id, feature_type, usage_count, month_year)
  VALUES (p_user_id, p_feature_type, p_increment, current_month)
  ON CONFLICT (user_id, feature_type, month_year)
  DO UPDATE SET 
    usage_count = user_usage.usage_count + p_increment,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Add sample data for testing (optional)
-- INSERT INTO user_subscriptions (user_id, subscription_tier, status) 
-- SELECT id, 'free', 'active' FROM users WHERE subscription_tier IS NULL; 