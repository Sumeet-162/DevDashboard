-- Check Monthly Goals Setup Status
-- Run this to see what's already in your database

-- Check if monthly goal columns exist
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_preferences' 
AND column_name LIKE 'monthly_goal%'
ORDER BY column_name;

-- Check if indexes exist
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'user_preferences' 
AND indexname LIKE '%goal%';

-- Check current data (if any users have goals set)
SELECT 
    COUNT(*) as total_users_with_preferences,
    COUNT(monthly_goal_target) as users_with_monthly_goals,
    AVG(monthly_goal_target) as avg_goal_target,
    COUNT(DISTINCT monthly_goal_month) as distinct_months_tracked
FROM user_preferences;

-- Sample of existing monthly goal data (if any)
SELECT 
    id,
    monthly_goal_target,
    monthly_goal_completed,
    monthly_goal_month,
    monthly_goal_last_updated
FROM user_preferences 
WHERE monthly_goal_target IS NOT NULL
LIMIT 5;
