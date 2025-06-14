-- Add AI insights fields to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS need_vs_want TEXT CHECK (need_vs_want IN ('Need', 'Want')),
ADD COLUMN IF NOT EXISTS mood_at_purchase TEXT,
ADD COLUMN IF NOT EXISTS ai_insight TEXT; 