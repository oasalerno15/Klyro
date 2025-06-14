-- Create calendar_data table
CREATE TABLE calendar_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_form JSONB NOT NULL,
  task_statuses JSONB DEFAULT '{}',
  step_statuses JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create RLS policies
ALTER TABLE calendar_data ENABLE ROW LEVEL SECURITY;

-- Users can only access their own calendar data
CREATE POLICY "Users can view their own calendar data" ON calendar_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar data" ON calendar_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar data" ON calendar_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar data" ON calendar_data
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_calendar_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calendar_data_updated_at
  BEFORE UPDATE ON calendar_data
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_data_updated_at(); 