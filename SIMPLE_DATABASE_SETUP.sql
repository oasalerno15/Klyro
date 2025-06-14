-- SIMPLE DATABASE SETUP FOR VIREO
-- Copy this entire script and paste it into Supabase SQL Editor
-- Then click "Run"

-- Create transactions table (the main one for receipts)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    category TEXT[] DEFAULT ARRAY['General'],
    source TEXT DEFAULT 'receipt',
    confidence DECIMAL(3,2) DEFAULT 0.80,
    items JSONB,
    file_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create spending_logs table
CREATE TABLE IF NOT EXISTS spending_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    category TEXT DEFAULT 'General',
    merchant TEXT,
    source TEXT DEFAULT 'receipt',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create mood_logs table  
CREATE TABLE IF NOT EXISTS mood_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 10),
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies - users can only see their own data
CREATE POLICY "users_own_transactions" ON transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_spending" ON spending_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_moods" ON mood_logs FOR ALL USING (auth.uid() = user_id);

-- Done! Your database is ready for receipt uploads. 