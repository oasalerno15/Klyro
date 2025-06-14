-- Add archived column to transactions table
ALTER TABLE transactions ADD COLUMN archived BOOLEAN DEFAULT FALSE;

-- Update existing transactions to not be archived by default  
UPDATE transactions SET archived = FALSE WHERE archived IS NULL;
 
-- Optional: Add an index for better performance when filtering by archived status
CREATE INDEX IF NOT EXISTS idx_transactions_archived ON transactions(archived); 