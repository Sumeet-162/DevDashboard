-- Run this in your Supabase SQL Editor to fix the +2 comment count issue:

-- First, drop the trigger (this removes the dependency)
DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON post_comments;

-- Now we can drop the function safely
DROP FUNCTION IF EXISTS update_post_comments_count() CASCADE;

-- Alternative: If the above still fails, use CASCADE to force removal
-- DROP FUNCTION IF EXISTS update_post_comments_count CASCADE;

-- Verify only one trigger remains
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'post_comments' 
AND trigger_name LIKE '%comment%';

-- Refresh all comment counts to fix existing discrepancies
UPDATE community_posts 
SET comments_count = (
  SELECT COUNT(*) 
  FROM post_comments 
  WHERE post_comments.post_id = community_posts.id
);

SELECT 'Comment count triggers cleaned up - duplicate trigger removed' as status;
