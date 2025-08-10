-- Updated Database Query for Monthly Goals Feature
-- Safe Monthly Goals Setup - Checks if columns exist before adding

-- Check if monthly goal columns exist and add them only if needed
DO $$ 
BEGIN
    -- Add monthly_goal_target column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_preferences' 
        AND column_name = 'monthly_goal_target'
    ) THEN
        ALTER TABLE user_preferences ADD COLUMN monthly_goal_target INTEGER DEFAULT 30;
        RAISE NOTICE 'Added monthly_goal_target column';
    ELSE
        RAISE NOTICE 'monthly_goal_target column already exists';
    END IF;

    -- Add monthly_goal_completed column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_preferences' 
        AND column_name = 'monthly_goal_completed'
    ) THEN
        ALTER TABLE user_preferences ADD COLUMN monthly_goal_completed INTEGER DEFAULT 0;
        RAISE NOTICE 'Added monthly_goal_completed column';
    ELSE
        RAISE NOTICE 'monthly_goal_completed column already exists';
    END IF;

    -- Add monthly_goal_month column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_preferences' 
        AND column_name = 'monthly_goal_month'
    ) THEN
        ALTER TABLE user_preferences ADD COLUMN monthly_goal_month VARCHAR(7) DEFAULT NULL;
        RAISE NOTICE 'Added monthly_goal_month column';
    ELSE
        RAISE NOTICE 'monthly_goal_month column already exists';
    END IF;

    -- Add monthly_goal_last_updated column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_preferences' 
        AND column_name = 'monthly_goal_last_updated'
    ) THEN
        ALTER TABLE user_preferences ADD COLUMN monthly_goal_last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added monthly_goal_last_updated column';
    ELSE
        RAISE NOTICE 'monthly_goal_last_updated column already exists';
    END IF;
END $$;

-- Create indexes for faster queries (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_user_preferences_goal_month 
ON user_preferences(monthly_goal_month);

CREATE INDEX IF NOT EXISTS idx_user_preferences_id 
ON user_preferences(id);

-- Verify the monthly goals setup
DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Monthly Goals Setup Verification';
    RAISE NOTICE '===========================================';
    
    -- Check if all required columns exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_preferences' 
        AND column_name IN ('monthly_goal_target', 'monthly_goal_completed', 'monthly_goal_month', 'monthly_goal_last_updated')
        GROUP BY table_name
        HAVING COUNT(*) = 4
    ) THEN
        RAISE NOTICE '✅ All monthly goal columns are present';
    ELSE
        RAISE NOTICE '❌ Some monthly goal columns are missing';
    END IF;
    
    RAISE NOTICE '===========================================';
END $$;

-- Sample data structure after update:
/*
user_preferences table will have:
- id (primary key, also serves as user_id)
- monthly_goal_target (integer, default 30) - Number of problems to solve this month
- monthly_goal_completed (integer, default 0) - Number of problems solved this month
- monthly_goal_month (string, format 'YYYY-MM') - Which month this goal is for
- monthly_goal_last_updated (timestamp) - When goal was last updated
- ...other existing columns
*/

-- MAIN QUERIES FOR MONTHLY GOALS:
-- Note: These are example queries. Replace $1, $2, etc. with actual values when using

-- 1. Get current month's goal for a user:
-- SELECT monthly_goal_target, monthly_goal_completed, monthly_goal_month, monthly_goal_last_updated 
-- FROM user_preferences 
-- WHERE id = $1 AND monthly_goal_month = $2;

-- 2. Update monthly goal target (when user selects new goal):
-- UPDATE user_preferences 
-- SET monthly_goal_target = $1, monthly_goal_month = $2, monthly_goal_last_updated = CURRENT_TIMESTAMP 
-- WHERE id = $3;

-- 3. Update monthly goal progress (when user solves problems):
-- UPDATE user_preferences 
-- SET monthly_goal_completed = $1, monthly_goal_last_updated = CURRENT_TIMESTAMP 
-- WHERE id = $2 AND monthly_goal_month = $3;

-- 4. Reset for new month (auto-called on month change):
-- UPDATE user_preferences 
-- SET monthly_goal_completed = 0, monthly_goal_month = $1, monthly_goal_last_updated = CURRENT_TIMESTAMP 
-- WHERE id = $2;

-- 5. Insert new user goal record:
-- INSERT INTO user_preferences (id, monthly_goal_target, monthly_goal_completed, monthly_goal_month, monthly_goal_last_updated)
-- VALUES ($1, $2, 0, $3, CURRENT_TIMESTAMP)
-- ON CONFLICT (id) DO UPDATE SET
--     monthly_goal_target = EXCLUDED.monthly_goal_target,
--     monthly_goal_month = EXCLUDED.monthly_goal_month,
--     monthly_goal_last_updated = CURRENT_TIMESTAMP;

-- 6. Get monthly goal history for analytics:
-- SELECT monthly_goal_month, monthly_goal_target, monthly_goal_completed, 
--        ROUND((monthly_goal_completed::FLOAT / monthly_goal_target) * 100, 2) as completion_percentage
-- FROM user_preferences 
-- WHERE id = $1 AND monthly_goal_month IS NOT NULL
-- ORDER BY monthly_goal_month DESC;

-- Optional: Update existing users with default monthly goals for current month
-- Uncomment and run if you want to initialize goals for existing users:
/*
INSERT INTO user_preferences (id, monthly_goal_target, monthly_goal_completed, monthly_goal_month, monthly_goal_last_updated)
SELECT 
    auth.uid(),
    30,
    0,
    TO_CHAR(CURRENT_DATE, 'YYYY-MM'),
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM user_preferences 
    WHERE id = auth.uid() 
    AND monthly_goal_month = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
)
ON CONFLICT (id) DO UPDATE SET
    monthly_goal_target = COALESCE(user_preferences.monthly_goal_target, 30),
    monthly_goal_month = COALESCE(user_preferences.monthly_goal_month, TO_CHAR(CURRENT_DATE, 'YYYY-MM'));
*/
