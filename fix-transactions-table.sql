-- Fix transactions table schema
-- This will drop and recreate the transactions table with the correct columns

-- Drop the existing transactions table if it exists
DROP TABLE IF EXISTS transactions;

-- Create the correct transactions table
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
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