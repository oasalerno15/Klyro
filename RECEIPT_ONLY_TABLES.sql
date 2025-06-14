-- Clean receipt-only database schema for Vireo
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security (RLS) for all tables
ALTER DATABASE postgres SET timezone TO 'UTC';

-- Create mood_logs table for mood tracking
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

-- Create spending_logs table for spending tracking
CREATE TABLE IF NOT EXISTS spending_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(19,4) NOT NULL,
    date DATE NOT NULL,
    category TEXT DEFAULT 'General',
    merchant TEXT,
    source TEXT DEFAULT 'receipt',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table for receipt-based transactions only
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount DECIMAL(19,4) NOT NULL,
    date DATE NOT NULL,
    category TEXT[] DEFAULT '{General}',
    source TEXT DEFAULT 'receipt',
    confidence DECIMAL(3,2) DEFAULT 0.80,
    items JSONB,
    file_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for mood_logs
CREATE POLICY "Users can view their own mood logs" ON mood_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mood logs" ON mood_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mood logs" ON mood_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mood logs" ON mood_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for spending_logs
CREATE POLICY "Users can view their own spending logs" ON spending_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spending logs" ON spending_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spending logs" ON spending_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spending logs" ON spending_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for transactions
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" ON transactions
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mood_logs_user_date ON mood_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_spending_logs_user_date ON spending_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_source ON transactions(source);

-- Grant usage on UUID extension (needed for gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; 