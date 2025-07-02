-- Add plan column to auth.users table for quick access
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'premium'));

-- Create a function to automatically set plan to 'free' for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Set default plan to 'free' if not already set
  IF NEW.plan IS NULL THEN
    NEW.plan = 'free';
  END IF;
  
  -- Also create a user_subscriptions record for consistency
  INSERT INTO public.user_subscriptions (user_id, subscription_tier, status)
  VALUES (NEW.id, COALESCE(NEW.plan, 'free'), 'active')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update plan
CREATE OR REPLACE FUNCTION public.update_user_plan(user_id UUID, new_plan TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Validate plan
  IF new_plan NOT IN ('free', 'starter', 'pro', 'premium') THEN
    RAISE EXCEPTION 'Invalid plan: %', new_plan;
  END IF;
  
  -- Update auth.users
  UPDATE auth.users 
  SET plan = new_plan, updated_at = NOW()
  WHERE id = user_id;
  
  -- Update user_subscriptions table for consistency
  INSERT INTO public.user_subscriptions (user_id, subscription_tier, status, updated_at)
  VALUES (user_id, new_plan, 'active', NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    subscription_tier = EXCLUDED.subscription_tier,
    status = 'active',
    updated_at = NOW();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user plan
CREATE OR REPLACE FUNCTION public.get_user_plan(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_plan TEXT;
BEGIN
  SELECT plan INTO user_plan 
  FROM auth.users 
  WHERE id = user_id;
  
  RETURN COALESCE(user_plan, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.update_user_plan(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_plan(UUID) TO authenticated;

-- Update existing users to have 'free' plan if NULL
UPDATE auth.users SET plan = 'free' WHERE plan IS NULL; 