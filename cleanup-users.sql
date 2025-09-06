-- SQL queries to clean up test/placeholder users from the database
-- Run these queries in your Supabase SQL Editor

-- First, let's see what users we have to identify the problematic ones
SELECT id, full_name, username, created_at FROM profiles 
ORDER BY created_at;

-- 1. Delete all posts by test/placeholder users (this will cascade to likes and comments)
DELETE FROM community_posts 
WHERE author_id IN (
  SELECT id FROM profiles 
  WHERE full_name IN ('Unknown User', 'Private User', 'Anonymous User', 'Anonymous') 
  OR username IN ('Unknown User', 'Private User', 'Anonymous User', 'Anonymous')
  OR full_name ILIKE '%unknown%'
  OR full_name ILIKE '%anonymous%'
  OR username ILIKE '%unknown%'
  OR username ILIKE '%anonymous%'
  OR (full_name IS NULL AND username IS NULL)
);

-- 2. Delete all follows involving test/placeholder users  
DELETE FROM user_follows 
WHERE follower_id IN (
  SELECT id FROM profiles 
  WHERE full_name IN ('Unknown User', 'Private User', 'Anonymous User', 'Anonymous') 
  OR username IN ('Unknown User', 'Private User', 'Anonymous User', 'Anonymous')
  OR full_name ILIKE '%unknown%'
  OR full_name ILIKE '%anonymous%'
  OR username ILIKE '%unknown%'
  OR username ILIKE '%anonymous%'
  OR (full_name IS NULL AND username IS NULL)
) OR following_id IN (
  SELECT id FROM profiles 
  WHERE full_name IN ('Unknown User', 'Private User', 'Anonymous User', 'Anonymous') 
  OR username IN ('Unknown User', 'Private User', 'Anonymous User', 'Anonymous')
  OR full_name ILIKE '%unknown%'
  OR full_name ILIKE '%anonymous%'
  OR username ILIKE '%unknown%'
  OR username ILIKE '%anonymous%'
  OR (full_name IS NULL AND username IS NULL)
);

-- 3. Delete test/placeholder user profiles
DELETE FROM profiles 
WHERE full_name IN ('Unknown User', 'Private User', 'Anonymous User', 'Anonymous') 
OR username IN ('Unknown User', 'Private User', 'Anonymous User', 'Anonymous')
OR full_name ILIKE '%unknown%'
OR full_name ILIKE '%anonymous%'
OR username ILIKE '%unknown%'
OR username ILIKE '%anonymous%'
OR (full_name IS NULL AND username IS NULL);

-- 4. Set all remaining profiles to public (removing privacy feature)
UPDATE profiles 
SET is_profile_public = true 
WHERE is_profile_public = false OR is_profile_public IS NULL;

-- 5. Verify deletion - this should return 0 rows
SELECT id, full_name, username FROM profiles 
WHERE full_name IN ('Unknown User', 'Private User', 'Anonymous User', 'Anonymous') 
OR username IN ('Unknown User', 'Private User', 'Anonymous User', 'Anonymous')
OR full_name ILIKE '%unknown%'
OR full_name ILIKE '%anonymous%'
OR username ILIKE '%unknown%'
OR username ILIKE '%anonymous%'
OR (full_name IS NULL AND username IS NULL);

-- 6. Verify all profiles are now public
SELECT COUNT(*) as total_profiles, 
       COUNT(CASE WHEN is_profile_public = true THEN 1 END) as public_profiles
FROM profiles;
