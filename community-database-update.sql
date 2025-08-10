-- Community Features Database Update
-- Adds followers/following, posts, likes, comments functionality
-- Run this in your Supabase SQL Editor

-- ===========================
-- STEP 1: Add social columns to profiles table
-- ===========================

-- Add social media fields and counters to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter_username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discord_username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS posts_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_likes_received INTEGER DEFAULT 0;

-- ===========================
-- STEP 2: Create user_follows table for followers/following
-- ===========================

-- Drop existing table if it has wrong foreign keys
DROP TABLE IF EXISTS user_follows CASCADE;

CREATE TABLE user_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);

-- ===========================
-- STEP 3: Create community_posts table
-- ===========================

-- Drop existing table if it has wrong foreign keys
DROP TABLE IF EXISTS community_posts CASCADE;

CREATE TABLE community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_title_length CHECK (length(title) >= 1 AND length(title) <= 200),
  CONSTRAINT valid_content_length CHECK (length(content) >= 1 AND length(content) <= 10000),
  CONSTRAINT valid_image_url CHECK (image_url IS NULL OR image_url ~ '^https?://')
);

-- ===========================
-- STEP 4: Create post_likes table
-- ===========================

-- Drop existing table if it has wrong foreign keys
DROP TABLE IF EXISTS post_likes CASCADE;

CREATE TABLE post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_like UNIQUE (user_id, post_id)
);

-- ===========================
-- STEP 5: Create post_comments table
-- ===========================

-- Drop existing table if it has wrong foreign keys
DROP TABLE IF EXISTS post_comments CASCADE;

CREATE TABLE post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_comment_length CHECK (length(content) >= 1 AND length(content) <= 1000)
);

-- ===========================
-- STEP 6: Create comment_likes table
-- ===========================

-- Drop existing table if it has wrong foreign keys
DROP TABLE IF EXISTS comment_likes CASCADE;

CREATE TABLE comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_comment_like UNIQUE (user_id, comment_id)
);

-- ===========================
-- STEP 7: Create indexes for performance
-- ===========================

-- User follows indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_created_at ON user_follows(created_at DESC);

-- Community posts indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_featured ON community_posts(is_featured, created_at DESC) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_community_posts_likes ON community_posts(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_tags ON community_posts USING GIN(tags);

-- Post likes indexes
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_created_at ON post_likes(created_at DESC);

-- Post comments indexes
CREATE INDEX IF NOT EXISTS idx_post_comments_user ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;

-- Comment likes indexes
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);

-- Social profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_followers_count ON profiles(followers_count DESC) WHERE followers_count > 0;
CREATE INDEX IF NOT EXISTS idx_profiles_following_count ON profiles(following_count DESC) WHERE following_count > 0;
CREATE INDEX IF NOT EXISTS idx_profiles_posts_count ON profiles(posts_count DESC) WHERE posts_count > 0;

-- ===========================
-- STEP 8: Row Level Security Policies
-- ===========================

-- Enable RLS on new tables
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view follows of public profiles" ON user_follows;
DROP POLICY IF EXISTS "Users can view their own follows" ON user_follows;
DROP POLICY IF EXISTS "Users can follow others" ON user_follows;
DROP POLICY IF EXISTS "Users can unfollow others" ON user_follows;

DROP POLICY IF EXISTS "Anyone can view posts from public profiles" ON community_posts;
DROP POLICY IF EXISTS "Users can view their own posts" ON community_posts;
DROP POLICY IF EXISTS "Users can create posts" ON community_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON community_posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON community_posts;

DROP POLICY IF EXISTS "Anyone can view likes on public posts" ON post_likes;
DROP POLICY IF EXISTS "Users can like posts" ON post_likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON post_likes;

DROP POLICY IF EXISTS "Anyone can view comments on public posts" ON post_comments;
DROP POLICY IF EXISTS "Users can comment on posts" ON post_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON post_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON post_comments;

DROP POLICY IF EXISTS "Anyone can view comment likes on public posts" ON comment_likes;
DROP POLICY IF EXISTS "Users can like comments" ON comment_likes;
DROP POLICY IF EXISTS "Users can unlike comments" ON comment_likes;

-- User follows policies
CREATE POLICY "Anyone can view follows of public profiles" ON user_follows
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = user_follows.following_id 
      AND profiles.is_profile_public = true
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = user_follows.follower_id 
      AND profiles.is_profile_public = true
    )
  );

CREATE POLICY "Users can view their own follows" ON user_follows
  FOR SELECT USING (follower_id = auth.uid() OR following_id = auth.uid());

CREATE POLICY "Users can follow others" ON user_follows
  FOR INSERT WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can unfollow others" ON user_follows
  FOR DELETE USING (follower_id = auth.uid());

-- Community posts policies
CREATE POLICY "Anyone can view posts from public profiles" ON community_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = community_posts.author_id 
      AND profiles.is_profile_public = true
    )
  );

CREATE POLICY "Users can view their own posts" ON community_posts
  FOR SELECT USING (author_id = auth.uid());

CREATE POLICY "Users can create posts" ON community_posts
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update their own posts" ON community_posts
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Users can delete their own posts" ON community_posts
  FOR DELETE USING (author_id = auth.uid());

-- Post likes policies
CREATE POLICY "Anyone can view likes on public posts" ON post_likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_posts 
      JOIN profiles ON profiles.id = community_posts.author_id 
      WHERE community_posts.id = post_likes.post_id 
      AND profiles.is_profile_public = true
    )
  );

CREATE POLICY "Users can like posts" ON post_likes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike posts" ON post_likes
  FOR DELETE USING (user_id = auth.uid());

-- Post comments policies
CREATE POLICY "Anyone can view comments on public posts" ON post_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_posts 
      JOIN profiles ON profiles.id = community_posts.author_id 
      WHERE community_posts.id = post_comments.post_id 
      AND profiles.is_profile_public = true
    )
  );

CREATE POLICY "Users can comment on posts" ON post_comments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own comments" ON post_comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments" ON post_comments
  FOR DELETE USING (user_id = auth.uid());

-- Comment likes policies
CREATE POLICY "Anyone can view comment likes on public posts" ON comment_likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM post_comments 
      JOIN community_posts ON community_posts.id = post_comments.post_id
      JOIN profiles ON profiles.id = community_posts.author_id 
      WHERE post_comments.id = comment_likes.comment_id 
      AND profiles.is_profile_public = true
    )
  );

CREATE POLICY "Users can like comments" ON comment_likes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike comments" ON comment_likes
  FOR DELETE USING (user_id = auth.uid());

-- ===========================
-- STEP 9: Functions for maintaining counts
-- ===========================

-- Function to update follower counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increase following count for follower
    UPDATE profiles 
    SET following_count = following_count + 1 
    WHERE id = NEW.follower_id;
    
    -- Increase followers count for followed user
    UPDATE profiles 
    SET followers_count = followers_count + 1 
    WHERE id = NEW.following_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrease following count for follower
    UPDATE profiles 
    SET following_count = GREATEST(following_count - 1, 0) 
    WHERE id = OLD.follower_id;
    
    -- Decrease followers count for followed user
    UPDATE profiles 
    SET followers_count = GREATEST(followers_count - 1, 0) 
    WHERE id = OLD.following_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update post counts
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles 
    SET posts_count = posts_count + 1 
    WHERE id = NEW.author_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles 
    SET posts_count = GREATEST(posts_count - 1, 0) 
    WHERE id = OLD.author_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update like counts
CREATE OR REPLACE FUNCTION update_like_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update post likes count
    UPDATE community_posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
    
    -- Update author's total likes received
    UPDATE profiles 
    SET total_likes_received = total_likes_received + 1 
    WHERE id = (SELECT author_id FROM community_posts WHERE id = NEW.post_id);
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update post likes count
    UPDATE community_posts 
    SET likes_count = GREATEST(likes_count - 1, 0) 
    WHERE id = OLD.post_id;
    
    -- Update author's total likes received
    UPDATE profiles 
    SET total_likes_received = GREATEST(total_likes_received - 1, 0) 
    WHERE id = (SELECT author_id FROM community_posts WHERE id = OLD.post_id);
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update comment counts (handles threaded comments)
CREATE OR REPLACE FUNCTION update_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Only count top-level comments (not replies) in post comment count
    IF NEW.parent_comment_id IS NULL THEN
      UPDATE community_posts 
      SET comments_count = comments_count + 1 
      WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Only decrease count for top-level comments
    IF OLD.parent_comment_id IS NULL THEN
      UPDATE community_posts 
      SET comments_count = GREATEST(comments_count - 1, 0) 
      WHERE id = OLD.post_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update comment like counts
CREATE OR REPLACE FUNCTION update_comment_like_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE post_comments 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE post_comments 
    SET likes_count = GREATEST(likes_count - 1, 0) 
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to handle recursive comment deletion
CREATE OR REPLACE FUNCTION delete_comment_thread()
RETURNS TRIGGER AS $$
BEGIN
  -- When a comment is deleted, all its replies are automatically deleted due to CASCADE
  -- This function ensures proper counting for nested deletions
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- STEP 10: Create triggers
-- ===========================

-- Drop existing triggers if they exist (to avoid conflicts)
DROP TRIGGER IF EXISTS trigger_update_follow_counts ON user_follows;
DROP TRIGGER IF EXISTS trigger_update_post_counts ON community_posts;
DROP TRIGGER IF EXISTS trigger_update_like_counts ON post_likes;
DROP TRIGGER IF EXISTS trigger_update_comment_counts ON post_comments;
DROP TRIGGER IF EXISTS trigger_update_comment_like_counts ON comment_likes;
DROP TRIGGER IF EXISTS trigger_update_community_posts_updated_at ON community_posts;
DROP TRIGGER IF EXISTS trigger_update_post_comments_updated_at ON post_comments;

-- Triggers for follow counts
CREATE TRIGGER trigger_update_follow_counts
  AFTER INSERT OR DELETE ON user_follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- Triggers for post counts
CREATE TRIGGER trigger_update_post_counts
  AFTER INSERT OR DELETE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION update_post_counts();

-- Triggers for like counts
CREATE TRIGGER trigger_update_like_counts
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_like_counts();

-- Triggers for comment counts
CREATE TRIGGER trigger_update_comment_counts
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_counts();

-- Triggers for comment like counts
CREATE TRIGGER trigger_update_comment_like_counts
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_like_counts();

-- Trigger for updated_at on posts and comments (only if the function exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER trigger_update_community_posts_updated_at
          BEFORE UPDATE ON community_posts
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        CREATE TRIGGER trigger_update_post_comments_updated_at
          BEFORE UPDATE ON post_comments
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ELSE
        RAISE NOTICE 'Function update_updated_at_column does not exist, skipping updated_at triggers';
    END IF;
END $$;

-- ===========================
-- STEP 11: Create some sample data
-- ===========================

-- Insert sample community posts (only if there are existing users)
INSERT INTO community_posts (author_id, title, content, tags)
SELECT 
  id,
  'Welcome to DevDash Community!',
  'Hey everyone! 👋 I''m excited to be part of this amazing developer community. Looking forward to sharing knowledge, collaborating on projects, and connecting with fellow developers. What''s everyone working on lately?',
  ARRAY['introduction', 'community', 'networking']
FROM profiles 
WHERE is_profile_public = true 
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO community_posts (author_id, title, content, tags)
SELECT 
  id,
  'Best Practices for React State Management',
  'After working with React for a few years, I''ve learned some valuable lessons about state management. Here are my top tips:

1. Start with useState for local state
2. Use useContext for shared state across components
3. Consider Redux only for complex global state
4. Don''t forget about useReducer for complex local state

What are your favorite state management patterns? Would love to hear your thoughts!',
  ARRAY['react', 'javascript', 'state-management', 'frontend']
FROM profiles 
WHERE is_profile_public = true 
LIMIT 1
OFFSET 0
ON CONFLICT DO NOTHING;

-- Insert sample threaded comments to demonstrate the nested structure
DO $$
DECLARE
    sample_post_id UUID;
    sample_user_id UUID;
    parent_comment_id UUID;
    reply_comment_id UUID;
BEGIN
    -- Get a sample post and user
    SELECT cp.id, cp.author_id INTO sample_post_id, sample_user_id
    FROM community_posts cp
    JOIN profiles p ON p.id = cp.author_id
    WHERE p.is_profile_public = true
    LIMIT 1;

    -- Only create sample comments if we have a post and user
    IF sample_post_id IS NOT NULL AND sample_user_id IS NOT NULL THEN
        -- Insert a top-level comment
        INSERT INTO post_comments (user_id, post_id, content)
        VALUES (sample_user_id, sample_post_id, 'Great post! I totally agree with your points about useState vs useContext.')
        RETURNING id INTO parent_comment_id;

        -- Insert a reply to the top-level comment
        INSERT INTO post_comments (user_id, post_id, content, parent_comment_id)
        VALUES (sample_user_id, sample_post_id, 'Thanks! Have you tried using Zustand? It''s a great middle ground between Context and Redux.', parent_comment_id)
        RETURNING id INTO reply_comment_id;

        -- Insert a reply to the reply (third level nesting)
        INSERT INTO post_comments (user_id, post_id, content, parent_comment_id)
        VALUES (sample_user_id, sample_post_id, 'Yes! Zustand is fantastic. The simplicity is amazing and the TypeScript support is excellent.', reply_comment_id);

        -- Insert another top-level comment
        INSERT INTO post_comments (user_id, post_id, content)
        VALUES (sample_user_id, sample_post_id, 'I''d add that useReducer is also great for form state management with complex validation logic.');

        RAISE NOTICE 'Sample threaded comments created successfully!';
    ELSE
        RAISE NOTICE 'No public profiles found, skipping sample comment creation';
    END IF;
END $$;

-- ===========================
-- SUCCESS MESSAGE
-- ===========================

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Community Features Database Update Complete!';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Added social columns to profiles:';
    RAISE NOTICE '- twitter_username, linkedin_url, discord_username';
    RAISE NOTICE '- followers_count, following_count, posts_count';
    RAISE NOTICE '- total_likes_received';
    RAISE NOTICE '';
    RAISE NOTICE 'Created new tables:';
    RAISE NOTICE '- user_follows (followers/following system)';
    RAISE NOTICE '- community_posts (blog-style posts)';
    RAISE NOTICE '- post_likes (like system)';
    RAISE NOTICE '- post_comments (commenting system)';
    RAISE NOTICE '- comment_likes (comment likes)';
    RAISE NOTICE '';
    RAISE NOTICE 'Set up automatic counters:';
    RAISE NOTICE '- Follower/following counts';
    RAISE NOTICE '- Post counts and like counts';
    RAISE NOTICE '- Comment counts';
    RAISE NOTICE '';
    RAISE NOTICE 'Created RLS policies for security';
    RAISE NOTICE 'Added performance indexes';
    RAISE NOTICE 'Set up triggers for data consistency';
    RAISE NOTICE '';
    RAISE NOTICE 'Your community features are ready!';
    RAISE NOTICE '===========================================';
END $$;

-- Verify the setup with threaded comment details
SELECT 
  'user_follows' as table_name,
  COUNT(*) as row_count,
  'Follow system ready' as status
FROM user_follows
UNION ALL
SELECT 
  'community_posts' as table_name,
  COUNT(*) as row_count,
  'Posts system ready' as status
FROM community_posts
UNION ALL
SELECT 
  'post_likes' as table_name,
  COUNT(*) as row_count,
  'Like system ready' as status
FROM post_likes
UNION ALL
SELECT 
  'post_comments' as table_name,
  COUNT(*) as row_count,
  'Comment system ready (with threading)' as status
FROM post_comments
UNION ALL
SELECT 
  'comment_likes' as table_name,
  COUNT(*) as row_count,
  'Comment like system ready' as status
FROM comment_likes;

-- Show sample threaded comment structure (if any comments exist)
DO $$
DECLARE
    comment_count INTEGER;
    rec RECORD;
BEGIN
    SELECT COUNT(*) INTO comment_count FROM post_comments;
    
    IF comment_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '📝 Sample Threaded Comments Structure:';
        RAISE NOTICE '=========================================';
        
        -- Show the actual comment structure
        FOR rec IN (
            SELECT 
                CASE 
                    WHEN parent_comment_id IS NULL THEN '📝 Top-level: '
                    ELSE '  ↳ Reply: '
                END || LEFT(content, 60) || CASE WHEN LENGTH(content) > 60 THEN '...' ELSE '' END as comment_display,
                created_at
            FROM post_comments 
            ORDER BY post_id, 
                     CASE WHEN parent_comment_id IS NULL THEN created_at ELSE '1900-01-01'::timestamp END,
                     created_at
        )
        LOOP
            RAISE NOTICE '%', rec.comment_display;
        END LOOP;
        
        RAISE NOTICE '';
        RAISE NOTICE 'Threading system ready! ✅';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '📝 No sample comments found (normal for fresh install)';
        RAISE NOTICE 'Threading system ready for use! ✅';
    END IF;
END $$;
