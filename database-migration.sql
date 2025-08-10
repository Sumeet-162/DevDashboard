-- DevDash Database Migration Script
-- This safely adds new columns to existing tables
-- Run this in your Supabase SQL Editor

-- First, let's check what we're working with
DO $$
BEGIN
    RAISE NOTICE 'Starting DevDash database migration...';
END $$;

-- Add missing columns to profiles table if they don't exist
DO $$ 
BEGIN
    -- Add location column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location' AND table_schema = 'public') THEN
        ALTER TABLE profiles ADD COLUMN location TEXT;
        RAISE NOTICE 'Added location column to profiles table';
    ELSE
        RAISE NOTICE 'location column already exists in profiles table';
    END IF;
    
    -- Add website column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'website' AND table_schema = 'public') THEN
        ALTER TABLE profiles ADD COLUMN website TEXT;
        RAISE NOTICE 'Added website column to profiles table';
    ELSE
        RAISE NOTICE 'website column already exists in profiles table';
    END IF;
    
    -- Add skills column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'skills' AND table_schema = 'public') THEN
        ALTER TABLE profiles ADD COLUMN skills TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added skills column to profiles table';
    ELSE
        RAISE NOTICE 'skills column already exists in profiles table';
    END IF;
    
    -- Add resume_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'resume_url' AND table_schema = 'public') THEN
        ALTER TABLE profiles ADD COLUMN resume_url TEXT;
        RAISE NOTICE 'Added resume_url column to profiles table';
    ELSE
        RAISE NOTICE 'resume_url column already exists in profiles table';
    END IF;
    
    -- Add job_title column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'job_title' AND table_schema = 'public') THEN
        ALTER TABLE profiles ADD COLUMN job_title TEXT;
        RAISE NOTICE 'Added job_title column to profiles table';
    ELSE
        RAISE NOTICE 'job_title column already exists in profiles table';
    END IF;
    
    -- Add company column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company' AND table_schema = 'public') THEN
        ALTER TABLE profiles ADD COLUMN company TEXT;
        RAISE NOTICE 'Added company column to profiles table';
    ELSE
        RAISE NOTICE 'company column already exists in profiles table';
    END IF;
    
    -- Add experience_years column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'experience_years' AND table_schema = 'public') THEN
        ALTER TABLE profiles ADD COLUMN experience_years INTEGER;
        RAISE NOTICE 'Added experience_years column to profiles table';
    ELSE
        RAISE NOTICE 'experience_years column already exists in profiles table';
    END IF;
    
    -- Add is_profile_public column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_profile_public' AND table_schema = 'public') THEN
        ALTER TABLE profiles ADD COLUMN is_profile_public BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_profile_public column to profiles table';
    ELSE
        RAISE NOTICE 'is_profile_public column already exists in profiles table';
    END IF;
END $$;

-- Create new tables if they don't exist
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location);
CREATE INDEX IF NOT EXISTS idx_profiles_job_title ON profiles(job_title);
CREATE INDEX IF NOT EXISTS idx_profiles_company ON profiles(company);
CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_featured ON user_projects(is_featured, display_order);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_category ON user_achievements(category);

-- Add RLS policies for new tables
DROP POLICY IF EXISTS "Public projects are viewable by everyone" ON user_projects;
CREATE POLICY "Public projects are viewable by everyone" ON user_projects
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own projects" ON user_projects;
CREATE POLICY "Users can insert their own projects" ON user_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON user_projects;
CREATE POLICY "Users can update their own projects" ON user_projects
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON user_projects;
CREATE POLICY "Users can delete their own projects" ON user_projects
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public achievements are viewable by everyone" ON user_achievements;
CREATE POLICY "Public achievements are viewable by everyone" ON user_achievements
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own achievements" ON user_achievements;
CREATE POLICY "Users can insert their own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own achievements" ON user_achievements;
CREATE POLICY "Users can update their own achievements" ON user_achievements
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own achievements" ON user_achievements;
CREATE POLICY "Users can delete their own achievements" ON user_achievements
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on new tables
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS trigger_update_user_projects_updated_at ON user_projects;
CREATE TRIGGER trigger_update_user_projects_updated_at
  BEFORE UPDATE ON user_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database migration completed successfully!';
    RAISE NOTICE 'New columns added to profiles table';
    RAISE NOTICE 'user_projects and user_achievements tables created';
    RAISE NOTICE 'Indexes and policies updated';
END $$;
