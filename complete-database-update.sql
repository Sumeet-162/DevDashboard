-- DevDash Complete Database Update Script
-- This includes profile picture storage setup and all project/achievement tables
-- Run this in your Supabase SQL Editor

-- ===========================
-- STEP 1: Add missing columns to profiles table
-- ===========================

-- Add missing columns to existing profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_years INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_profile_public BOOLEAN DEFAULT true;

-- ===========================
-- STEP 2: Create Storage Buckets for Profile Pictures and Project Images
-- ===========================

-- Create avatars bucket for profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create project-images bucket for project screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- ===========================
-- STEP 3: Create user_projects table with proper relationships
-- ===========================

CREATE TABLE IF NOT EXISTS user_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tech_stack TEXT[] DEFAULT '{}',
  source_code_url TEXT,
  live_url TEXT,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_title_length CHECK (length(title) >= 1 AND length(title) <= 100),
  CONSTRAINT valid_urls CHECK (
    (source_code_url IS NULL OR source_code_url ~ '^https?://') AND
    (live_url IS NULL OR live_url ~ '^https?://') AND
    (image_url IS NULL OR image_url ~ '^https?://')
  )
);

-- ===========================
-- STEP 4: Create user_achievements table with proper relationships
-- ===========================

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'certification', 'award', 'course', 'hackathon', etc.
  issuer TEXT,
  date_achieved DATE,
  credential_url TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_achievement_title CHECK (length(title) >= 1 AND length(title) <= 100),
  CONSTRAINT valid_achievement_urls CHECK (
    (credential_url IS NULL OR credential_url ~ '^https?://') AND
    (image_url IS NULL OR image_url ~ '^https?://')
  ),
  CONSTRAINT valid_date_achieved CHECK (date_achieved <= CURRENT_DATE)
);

-- ===========================
-- STEP 5: Create indexes for better performance
-- ===========================

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_github_username ON profiles(github_username);
CREATE INDEX IF NOT EXISTS idx_profiles_public ON profiles(is_profile_public) WHERE is_profile_public = true;
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location) WHERE location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_job_title ON profiles(job_title) WHERE job_title IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_company ON profiles(company) WHERE company IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_skills ON profiles USING GIN(skills) WHERE skills IS NOT NULL;

-- User projects indexes
CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_featured ON user_projects(user_id, is_featured, display_order) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_user_projects_created_at ON user_projects(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_projects_display_order ON user_projects(user_id, display_order);

-- User achievements indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_category ON user_achievements(user_id, category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_achievements_date ON user_achievements(user_id, date_achieved DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_user_achievements_created_at ON user_achievements(user_id, created_at DESC);

-- ===========================
-- STEP 6: Row Level Security Policies
-- ===========================

-- Enable RLS on new tables
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Profiles policies - Allow basic info (username, location) for private profiles
DROP POLICY IF EXISTS "Public profiles are fully viewable" ON profiles;
CREATE POLICY "Public profiles are fully viewable" ON profiles
  FOR SELECT USING (is_profile_public = true);

DROP POLICY IF EXISTS "Private profiles show limited info" ON profiles;
CREATE POLICY "Private profiles show limited info" ON profiles
  FOR SELECT USING (
    -- Always allow viewing username, location, and privacy status
    -- Other fields will be filtered at application level
    true
  );

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- User projects policies
DROP POLICY IF EXISTS "Public projects are viewable by everyone" ON user_projects;
CREATE POLICY "Public projects are viewable by everyone" ON user_projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = user_projects.user_id 
      AND profiles.is_profile_public = true
    )
  );

DROP POLICY IF EXISTS "Users can view their own projects" ON user_projects;
CREATE POLICY "Users can view their own projects" ON user_projects
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own projects" ON user_projects;
CREATE POLICY "Users can insert their own projects" ON user_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON user_projects;
CREATE POLICY "Users can update their own projects" ON user_projects
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON user_projects;
CREATE POLICY "Users can delete their own projects" ON user_projects
  FOR DELETE USING (auth.uid() = user_id);

-- User achievements policies
DROP POLICY IF EXISTS "Public achievements are viewable by everyone" ON user_achievements;
CREATE POLICY "Public achievements are viewable by everyone" ON user_achievements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = user_achievements.user_id 
      AND profiles.is_profile_public = true
    )
  );

DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
CREATE POLICY "Users can view their own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own achievements" ON user_achievements;
CREATE POLICY "Users can insert their own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own achievements" ON user_achievements;
CREATE POLICY "Users can update their own achievements" ON user_achievements
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own achievements" ON user_achievements;
CREATE POLICY "Users can delete their own achievements" ON user_achievements
  FOR DELETE USING (auth.uid() = user_id);

-- ===========================
-- STEP 7: Storage Policies for Profile Pictures and Project Images
-- ===========================

-- Avatar storage policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Project images storage policies
DROP POLICY IF EXISTS "Project images are publicly accessible" ON storage.objects;
CREATE POLICY "Project images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-images');

DROP POLICY IF EXISTS "Users can upload their own project images" ON storage.objects;
CREATE POLICY "Users can upload their own project images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update their own project images" ON storage.objects;
CREATE POLICY "Users can update their own project images" ON storage.objects
  FOR UPDATE WITH CHECK (
    bucket_id = 'project-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own project images" ON storage.objects;
CREATE POLICY "Users can delete their own project images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'project-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ===========================
-- STEP 8: Create/Update Functions and Triggers
-- ===========================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_user_projects_updated_at ON user_projects;
CREATE TRIGGER trigger_update_user_projects_updated_at
  BEFORE UPDATE ON user_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically set display_order for new projects
CREATE OR REPLACE FUNCTION set_project_display_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.display_order IS NULL OR NEW.display_order = 0 THEN
    SELECT COALESCE(MAX(display_order), 0) + 1 
    INTO NEW.display_order 
    FROM user_projects 
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_project_display_order ON user_projects;
CREATE TRIGGER trigger_set_project_display_order
  BEFORE INSERT ON user_projects
  FOR EACH ROW EXECUTE FUNCTION set_project_display_order();

-- ===========================
-- STEP 9: Update existing user profile trigger for new columns
-- ===========================

-- Function to automatically create user profile and preferences
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    avatar_url,
    is_profile_public
  )
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name', 
    NEW.raw_user_meta_data->>'avatar_url',
    true
  );
  
  -- Create user preferences if table exists
  INSERT INTO public.user_preferences (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger is properly set
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================
-- STEP 10: Data validation and cleanup
-- ===========================

-- Update existing profiles to have default values for new columns
UPDATE profiles 
SET 
  skills = COALESCE(skills, '{}'),
  is_profile_public = COALESCE(is_profile_public, true)
WHERE skills IS NULL OR is_profile_public IS NULL;

-- ===========================
-- SUCCESS MESSAGE
-- ===========================

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'DevDash Database Update Completed Successfully!';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Added columns to profiles table:';
    RAISE NOTICE '- location, website, skills, resume_url';
    RAISE NOTICE '- job_title, company, experience_years';
    RAISE NOTICE '- is_profile_public';
    RAISE NOTICE '';
    RAISE NOTICE 'Created new tables:';
    RAISE NOTICE '- user_projects (with proper constraints)';
    RAISE NOTICE '- user_achievements (with validation)';
    RAISE NOTICE '';
    RAISE NOTICE 'Set up storage:';
    RAISE NOTICE '- avatars bucket for profile pictures';
    RAISE NOTICE '- project-images bucket for project screenshots';
    RAISE NOTICE '- RLS policies for secure access';
    RAISE NOTICE '';
    RAISE NOTICE 'Created indexes for performance';
    RAISE NOTICE 'Set up RLS policies for security';
    RAISE NOTICE 'Added triggers and functions';
    RAISE NOTICE '';
    RAISE NOTICE 'Your DevDash database is ready!';
    RAISE NOTICE '===========================================';
END $$;

-- Verify the setup
SELECT 
  'profiles' as table_name,
  COUNT(*) as row_count,
  'Extended with new columns' as status
FROM profiles
UNION ALL
SELECT 
  'user_projects' as table_name,
  COUNT(*) as row_count,
  'Ready for project management' as status
FROM user_projects
UNION ALL
SELECT 
  'user_achievements' as table_name,
  COUNT(*) as row_count,
  'Ready for achievement tracking' as status
FROM user_achievements
UNION ALL
SELECT 
  'storage.buckets' as table_name,
  COUNT(*) as row_count,
  'Avatar storage ready' as status
FROM storage.buckets
WHERE name = 'avatars';
