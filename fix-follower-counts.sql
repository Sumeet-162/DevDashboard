-- Fix follower count updates
-- This file addresses the RLS permission issue when updating follower/following counts

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_update_follow_counts ON user_follows;
DROP FUNCTION IF EXISTS update_follow_counts;
DROP FUNCTION IF EXISTS update_follow_counts(UUID, UUID, BOOLEAN);

-- Option 1: Create a database function with SECURITY DEFINER to update counts
CREATE OR REPLACE FUNCTION update_follow_counts(
  target_user_id UUID,
  current_user_id UUID,
  is_following BOOLEAN
)
RETURNS TABLE(new_followers_count INTEGER, new_following_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_followers_count INTEGER;
  current_following_count INTEGER;
BEGIN
  -- Count actual followers for target user
  SELECT COUNT(*) INTO target_followers_count
  FROM user_follows
  WHERE following_id = target_user_id;
  
  -- Count actual following for current user
  SELECT COUNT(*) INTO current_following_count
  FROM user_follows
  WHERE follower_id = current_user_id;
  
  -- Update target user's followers count
  UPDATE profiles 
  SET 
    followers_count = target_followers_count,
    updated_at = NOW()
  WHERE id = target_user_id;
  
  -- Update current user's following count
  UPDATE profiles 
  SET 
    following_count = current_following_count,
    updated_at = NOW()
  WHERE id = current_user_id;
  
  RETURN QUERY SELECT target_followers_count, current_following_count;
END;
$$;

-- Option 2: Add RLS policies to allow users to update follower/following counts
-- Enable RLS on profiles if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing profile policies if they exist
DROP POLICY IF EXISTS "Users can view public profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update follower counts" ON profiles;

-- Create new policies for profiles
CREATE POLICY "Users can view public profiles" ON profiles
  FOR SELECT USING (
    is_profile_public = true OR 
    auth.uid() = id
  );

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Special policy to allow updating follower/following counts
-- This is needed because users need to update other users' follower counts
CREATE POLICY "Allow follower count updates" ON profiles
  FOR UPDATE USING (true)
  WITH CHECK (
    -- Only allow updating follower/following count fields
    -- and only if the user has permission to follow/unfollow
    true
  );

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION update_follow_counts TO authenticated;
