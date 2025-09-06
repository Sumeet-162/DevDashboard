-- DISABLE DUPLICATE COMMENT COUNT TRIGGER
-- This file conflicts with community-database-update.sql
-- Drop the duplicate trigger to fix +2 comment count issue

DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON post_comments;
DROP FUNCTION IF EXISTS update_post_comments_count();

-- Comment count is already handled by community-database-update.sql trigger
-- which uses update_comment_counts() function

SELECT 'Duplicate comment count trigger removed successfully!' as result;
