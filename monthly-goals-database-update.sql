-- Monthly Goals Database Update
-- Add monthly goal support to user_preferences table

-- Add monthly goal columns to user_preferences table
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS monthly_goal_target INTEGER DEFAULT 30;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS monthly_goal_month TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM');
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS monthly_goal_completed INTEGER DEFAULT 0;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS monthly_goal_last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_preferences_monthly_goal 
ON user_preferences(id, monthly_goal_month);

-- Create trigger to auto-reset monthly goals when month changes
CREATE OR REPLACE FUNCTION reset_monthly_goal_if_new_month()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if current month is different from stored month
  IF NEW.monthly_goal_month != TO_CHAR(NOW(), 'YYYY-MM') THEN
    NEW.monthly_goal_month = TO_CHAR(NOW(), 'YYYY-MM');
    NEW.monthly_goal_completed = 0;
    NEW.monthly_goal_last_updated = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for monthly goal reset
DROP TRIGGER IF EXISTS trigger_reset_monthly_goal ON user_preferences;
CREATE TRIGGER trigger_reset_monthly_goal
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION reset_monthly_goal_if_new_month();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Monthly goals database update completed successfully!';
    RAISE NOTICE 'Monthly goal columns added to user_preferences table.';
    RAISE NOTICE 'Auto-reset trigger created for new months.';
END $$;
