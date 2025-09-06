-- FIXED: Proper order to remove duplicate trigger and function
-- Run this in your Supabase SQL Editor to fix the +2 comment count issue:

-- Step 1: Drop the duplicate trigger first (removes dependency)
DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON post_comments;

-- Step 2: Now drop the function with CASCADE to handle any remaining dependencies
DROP FUNCTION IF EXISTS update_post_comments_count CASCADE;

-- Step 3: Verify only one trigger remains
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'post_comments' 
AND trigger_name LIKE '%comment%';

-- Step 4: Fix all existing comment counts that were doubled
UPDATE community_posts 
SET comments_count = (
  SELECT COUNT(*) 
  FROM post_comments 
  WHERE post_comments.post_id = community_posts.id
);

-- Step 5: Verify the fix worked
SELECT 
  id, 
  title, 
  comments_count as stored_count,
  (SELECT COUNT(*) FROM post_comments WHERE post_id = community_posts.id) as actual_count,
  CASE 
    WHEN comments_count = (SELECT COUNT(*) FROM post_comments WHERE post_id = community_posts.id) 
    THEN '✅ FIXED' 
    ELSE '❌ MISMATCH' 
  END as status
FROM community_posts 
WHERE comments_count > 0;

SELECT '🎉 Comment count duplicate trigger removed successfully!' as result;
