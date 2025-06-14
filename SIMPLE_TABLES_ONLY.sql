-- Simple table creation only - no RLS policies

-- Create mood_logs table
CREATE TABLE IF NOT EXISTS mood_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 10),
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Create spending_logs table
CREATE TABLE IF NOT EXISTS spending_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    amount DECIMAL(19,4) NOT NULL,
    date DATE NOT NULL,
    category TEXT,
    merchant TEXT,
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    plaid_transaction_id TEXT UNIQUE,
    name TEXT NOT NULL,
    amount DECIMAL(19,4) NOT NULL,
    date DATE NOT NULL,
    category TEXT[] DEFAULT '{}',
    account_id TEXT,
    pending BOOLEAN DEFAULT false,
    merchant_name TEXT,
    payment_channel TEXT,
    source TEXT DEFAULT 'plaid',
    confidence DECIMAL(3,2),
    items JSONB,
    file_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
); 