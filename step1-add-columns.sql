-- STEP 1: Add missing columns to profiles table
-- Run this FIRST before running the full database-setup.sql

-- Add the missing columns one by one
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_years INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_profile_public BOOLEAN DEFAULT true;

-- Success message
SELECT 'Profiles table updated successfully! You can now run the full database-setup.sql' as status;
