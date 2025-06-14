-- Fix Remaining Security Warnings
-- This script addresses the function search path warnings

-- ========================================
-- FIX FUNCTION SEARCH PATH WARNINGS
-- ========================================

-- Fix update_updated_at_column function (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
  END IF;
END $$;

-- Fix update_calendar_data_updated_at function (if it exists as a standalone function)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_calendar_data_updated_at') THEN
    DROP FUNCTION IF EXISTS public.update_calendar_data_updated_at() CASCADE;
  END IF;
END $$;

-- Recreate the main trigger function with secure settings
CREATE OR REPLACE FUNCTION public.update_updated_at_col()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Recreate all triggers to ensure they use the secure function
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_mood_logs_updated_at ON public.mood_logs;
DROP TRIGGER IF EXISTS update_spending_logs_updated_at ON public.spending_logs;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
DROP TRIGGER IF EXISTS update_accounts_updated_at ON public.accounts;
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
DROP TRIGGER IF EXISTS update_plaid_items_updated_at ON public.plaid_items;
DROP TRIGGER IF EXISTS update_calendar_data_updated_at ON public.calendar_data;

-- Recreate triggers for tables that exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    CREATE TRIGGER update_users_updated_at 
      BEFORE UPDATE ON public.users 
      FOR EACH ROW 
      EXECUTE FUNCTION public.update_updated_at_col();
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mood_logs') THEN
    CREATE TRIGGER update_mood_logs_updated_at 
      BEFORE UPDATE ON public.mood_logs 
      FOR EACH ROW 
      EXECUTE FUNCTION public.update_updated_at_col();
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'spending_logs') THEN
    CREATE TRIGGER update_spending_logs_updated_at 
      BEFORE UPDATE ON public.spending_logs 
      FOR EACH ROW 
      EXECUTE FUNCTION public.update_updated_at_col();
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
    CREATE TRIGGER update_transactions_updated_at 
      BEFORE UPDATE ON public.transactions 
      FOR EACH ROW 
      EXECUTE FUNCTION public.update_updated_at_col();
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounts') THEN
    CREATE TRIGGER update_accounts_updated_at 
      BEFORE UPDATE ON public.accounts 
      FOR EACH ROW 
      EXECUTE FUNCTION public.update_updated_at_col();
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
    CREATE TRIGGER update_categories_updated_at 
      BEFORE UPDATE ON public.categories 
      FOR EACH ROW 
      EXECUTE FUNCTION public.update_updated_at_col();
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'plaid_items') THEN
    CREATE TRIGGER update_plaid_items_updated_at 
      BEFORE UPDATE ON public.plaid_items 
      FOR EACH ROW 
      EXECUTE FUNCTION public.update_updated_at_col();
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'calendar_data') THEN
    CREATE TRIGGER update_calendar_data_updated_at 
      BEFORE UPDATE ON public.calendar_data 
      FOR EACH ROW 
      EXECUTE FUNCTION public.update_updated_at_col();
  END IF;
END $$;

-- Verify the function is secure
SELECT 
  proname as function_name,
  prosecdef as security_definer,
  proconfig as config_settings
FROM pg_proc 
WHERE proname = 'update_updated_at_col'; 