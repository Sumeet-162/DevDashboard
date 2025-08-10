-- Database functions for follower/following count management

-- Function to increment followers count
CREATE OR REPLACE FUNCTION increment_followers_count(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles 
  SET followers_count = followers_count + 1, 
      updated_at = NOW()
  WHERE id = user_id;
END;
$$;

-- Function to decrement followers count
CREATE OR REPLACE FUNCTION decrement_followers_count(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles 
  SET followers_count = GREATEST(followers_count - 1, 0), 
      updated_at = NOW()
  WHERE id = user_id;
END;
$$;

-- Function to increment following count
CREATE OR REPLACE FUNCTION increment_following_count(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles 
  SET following_count = following_count + 1, 
      updated_at = NOW()
  WHERE id = user_id;
END;
$$;

-- Function to decrement following count
CREATE OR REPLACE FUNCTION decrement_following_count(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles 
  SET following_count = GREATEST(following_count - 1, 0), 
      updated_at = NOW()
  WHERE id = user_id;
END;
$$;

-- Function to refresh all counts for a user (backup method)
CREATE OR REPLACE FUNCTION refresh_user_counts(user_id UUID)
RETURNS TABLE(followers_count INTEGER, following_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_followers_count INTEGER;
  new_following_count INTEGER;
BEGIN
  -- Count actual followers
  SELECT COUNT(*) INTO new_followers_count
  FROM user_follows 
  WHERE following_id = user_id;
  
  -- Count actual following
  SELECT COUNT(*) INTO new_following_count
  FROM user_follows 
  WHERE follower_id = user_id;
  
  -- Update the profile
  UPDATE profiles 
  SET followers_count = new_followers_count,
      following_count = new_following_count,
      updated_at = NOW()
  WHERE id = user_id;
  
  -- Return the counts
  RETURN QUERY SELECT new_followers_count, new_following_count;
END;
$$;
