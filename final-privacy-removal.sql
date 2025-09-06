-- Final Privacy Removal Script
-- This script completes the removal of privacy features from DevDashboard

BEGIN;

-- 1. Remove the is_profile_public column entirely
ALTER TABLE profiles DROP COLUMN IF EXISTS is_profile_public;

-- 2. Update any remaining references in database functions/triggers (if any)
-- Note: This would need to be customized based on your specific database functions

-- 3. Final verification - ensure no privacy-related constraints remain
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Show final profile structure
\d profiles;

-- 5. Summary of changes
SELECT 
    'Privacy features completely removed from DevDashboard' as status,
    count(*) as total_profiles
FROM profiles;

COMMIT;

-- Additional notes:
-- - All frontend components have been updated to remove privacy controls
-- - Community service methods no longer filter by privacy settings
-- - Profile setup no longer sets privacy flags
-- - All users are now effectively "public" by default
