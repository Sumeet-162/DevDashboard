-- Database Migration Fix for Productivity Features
-- Run this AFTER running the main productivity-database-setup.sql
-- This will fix column name mismatches and add missing columns

-- ===========================
-- FIX TODOS TABLE
-- ===========================

-- Add 'urgent' to priority enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name LIKE '%todos_priority_check%' 
    AND check_clause LIKE '%urgent%'
  ) THEN
    ALTER TABLE todos DROP CONSTRAINT IF EXISTS todos_priority_check;
    ALTER TABLE todos ADD CONSTRAINT todos_priority_check 
    CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
  END IF;
END $$;

-- Update default category
UPDATE todos SET category = 'personal' WHERE category = 'general';
ALTER TABLE todos ALTER COLUMN category SET DEFAULT 'personal';

-- ===========================
-- FIX NOTES TABLE
-- ===========================

-- Add is_favorite column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'is_favorite') THEN
    ALTER TABLE notes ADD COLUMN is_favorite BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add category column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'category') THEN
    ALTER TABLE notes ADD COLUMN category TEXT DEFAULT 'personal';
  END IF;
END $$;

-- Migrate from old column names if they exist
DO $$
BEGIN
  -- Migrate is_pinned to is_favorite
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'is_pinned') THEN
    UPDATE notes SET is_favorite = is_pinned WHERE is_pinned = true;
    ALTER TABLE notes DROP COLUMN is_pinned;
  END IF;
  
  -- Migrate folder to category
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'folder') THEN
    UPDATE notes SET category = folder;
    ALTER TABLE notes DROP COLUMN folder;
  END IF;
END $$;

-- ===========================
-- FIX CALENDAR_EVENTS TABLE
-- ===========================

-- Add new columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calendar_events' AND column_name = 'start_time') THEN
    ALTER TABLE calendar_events ADD COLUMN start_time TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calendar_events' AND column_name = 'end_time') THEN
    ALTER TABLE calendar_events ADD COLUMN end_time TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calendar_events' AND column_name = 'is_all_day') THEN
    ALTER TABLE calendar_events ADD COLUMN is_all_day BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Migrate from old column names if they exist
DO $$
BEGIN
  -- Migrate start_date to start_time
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calendar_events' AND column_name = 'start_date') THEN
    UPDATE calendar_events SET start_time = start_date;
    ALTER TABLE calendar_events DROP COLUMN start_date;
  END IF;
  
  -- Migrate end_date to end_time
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calendar_events' AND column_name = 'end_date') THEN
    UPDATE calendar_events SET end_time = end_date;
    ALTER TABLE calendar_events DROP COLUMN end_date;
  END IF;
  
  -- Migrate all_day to is_all_day
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calendar_events' AND column_name = 'all_day') THEN
    UPDATE calendar_events SET is_all_day = all_day;
    ALTER TABLE calendar_events DROP COLUMN all_day;
  END IF;
END $$;

-- Make start_time required
ALTER TABLE calendar_events ALTER COLUMN start_time SET NOT NULL;

-- Update event_type enum to match new types
DO $$
BEGIN
  -- Drop the old constraint if it exists
  ALTER TABLE calendar_events DROP CONSTRAINT IF EXISTS calendar_events_event_type_check;
  
  -- Add the new constraint with updated types
  ALTER TABLE calendar_events ADD CONSTRAINT calendar_events_event_type_check 
  CHECK (event_type IN ('meeting', 'call', 'coding', 'break', 'deadline', 'personal', 'work'));
END $$;

-- Remove columns that are no longer needed
ALTER TABLE calendar_events DROP COLUMN IF EXISTS github_repo;
ALTER TABLE calendar_events DROP COLUMN IF EXISTS github_issue_url;
ALTER TABLE calendar_events DROP COLUMN IF EXISTS priority;

-- ===========================
-- UPDATE INDEXES
-- ===========================

-- Drop old indexes
DROP INDEX IF EXISTS idx_calendar_start_date;
DROP INDEX IF EXISTS idx_calendar_priority;
DROP INDEX IF EXISTS idx_notes_pinned;
DROP INDEX IF EXISTS idx_notes_folder;

-- Create new indexes
CREATE INDEX IF NOT EXISTS idx_calendar_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_notes_favorite ON notes(is_favorite, created_at DESC) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_notes_category_new ON notes(category);

-- ===========================
-- SUCCESS MESSAGE
-- ===========================

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Database Migration Fix Complete!';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Fixed:';
    RAISE NOTICE '- Added "urgent" priority to todos';
    RAISE NOTICE '- Migrated notes: is_pinned -> is_favorite, folder -> category';
    RAISE NOTICE '- Migrated calendar: start_date -> start_time, end_date -> end_time, all_day -> is_all_day';
    RAISE NOTICE '- Updated event_type enum with new types';
    RAISE NOTICE '- Removed unused calendar columns';
    RAISE NOTICE '- Updated all indexes';
    RAISE NOTICE '';
    RAISE NOTICE 'Your productivity features are now ready!';
    RAISE NOTICE '===========================================';
END $$;
