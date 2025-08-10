-- DevDash Database Schema Check
-- Run this first to see what tables and columns you currently have
-- This will help you understand what needs to be migrated

-- Check existing tables
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('profiles', 'user_preferences', 'user_projects', 'user_achievements', 'bookmarks', 'posts', 'post_likes', 'comments')
ORDER BY table_name;

-- Check profiles table columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if new tables exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_projects' AND table_schema = 'public') 
        THEN 'user_projects table EXISTS' 
        ELSE 'user_projects table MISSING' 
    END as user_projects_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_achievements' AND table_schema = 'public') 
        THEN 'user_achievements table EXISTS' 
        ELSE 'user_achievements table MISSING' 
    END as user_achievements_status;

-- Check missing columns in profiles table
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location') 
         THEN 'location column EXISTS' ELSE 'location column MISSING' END as location_status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'website') 
         THEN 'website column EXISTS' ELSE 'website column MISSING' END as website_status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'skills') 
         THEN 'skills column EXISTS' ELSE 'skills column MISSING' END as skills_status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'resume_url') 
         THEN 'resume_url column EXISTS' ELSE 'resume_url column MISSING' END as resume_url_status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'job_title') 
         THEN 'job_title column EXISTS' ELSE 'job_title column MISSING' END as job_title_status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company') 
         THEN 'company column EXISTS' ELSE 'company column MISSING' END as company_status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'experience_years') 
         THEN 'experience_years column EXISTS' ELSE 'experience_years column MISSING' END as experience_years_status;

-- Count existing data
SELECT 
    (SELECT COUNT(*) FROM profiles) as profiles_count,
    (SELECT COUNT(*) FROM user_preferences) as preferences_count;
