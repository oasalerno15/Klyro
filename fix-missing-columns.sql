-- Fix Missing Columns and Table Structure
-- Run this BEFORE the security script to ensure all required columns exist

-- 1. First, let's check what tables and columns actually exist
-- You can run these queries individually to see your current structure

-- Check if tables exist and their columns:
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'transactions', 'mood_logs', 'spending_logs', 'accounts', 'categories', 'plaid_items')
ORDER BY table_name, ordinal_position;

-- 2. Add missing user_id column to transactions if it doesn't exist
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Add missing user_id columns to other tables if they don't exist
ALTER TABLE public.mood_logs 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.spending_logs 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create accounts table if it doesn't exist  
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  account_type TEXT,
  balance DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create plaid_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.plaid_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  access_token TEXT,
  institution_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Ensure transactions table has all required columns
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS need_vs_want TEXT CHECK (need_vs_want IN ('Need', 'Want'));

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS mood_at_purchase TEXT;

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS ai_insight TEXT;

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- 9. Make user_id NOT NULL where it should be (but only if data exists)
-- First check if there are any rows without user_id
DO $$
BEGIN
  -- Only make user_id NOT NULL if all rows have a user_id value
  IF NOT EXISTS (SELECT 1 FROM public.transactions WHERE user_id IS NULL) THEN
    ALTER TABLE public.transactions ALTER COLUMN user_id SET NOT NULL;
  ELSE
    RAISE NOTICE 'Some transactions have NULL user_id - please fix data first';
  END IF;
END $$;

-- 10. Create calendar_data table from your script
CREATE TABLE IF NOT EXISTS public.calendar_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_form JSONB NOT NULL,
  task_statuses JSONB DEFAULT '{}',
  step_statuses JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 11. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_col()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 12. Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_col();

DROP TRIGGER IF EXISTS update_mood_logs_updated_at ON public.mood_logs;
CREATE TRIGGER update_mood_logs_updated_at
  BEFORE UPDATE ON public.mood_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_col();

DROP TRIGGER IF EXISTS update_spending_logs_updated_at ON public.spending_logs;
CREATE TRIGGER update_spending_logs_updated_at
  BEFORE UPDATE ON public.spending_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_col();

DROP TRIGGER IF EXISTS update_calendar_data_updated_at ON public.calendar_data;
CREATE TRIGGER update_calendar_data_updated_at
  BEFORE UPDATE ON public.calendar_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_col();

-- 13. Verify all tables now have user_id columns
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND column_name = 'user_id'
  AND table_name IN ('users', 'transactions', 'mood_logs', 'spending_logs', 'accounts', 'categories', 'plaid_items', 'calendar_data')
ORDER BY table_name; 