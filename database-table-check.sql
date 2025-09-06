-- Quick Database Check - Run this in Supabase SQL Editor to verify current state
-- This will help diagnose the notes display issue

SELECT 'Checking notes table structure...' as status;

-- Check if notes table exists and what columns it has
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notes' 
ORDER BY ordinal_position;

SELECT 'Checking for sample data...' as status;

-- Check if there are any notes in the table
SELECT COUNT(*) as total_notes FROM notes;

SELECT 'Checking recent notes...' as status;

-- Show recent notes (if any)
SELECT id, title, category, is_favorite, is_archived, created_at 
FROM notes 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 'Column check complete!' as status;
