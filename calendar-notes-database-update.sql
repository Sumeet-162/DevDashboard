-- Calendar Notes Feature Database Update
-- Adds personal notes functionality to the dev calendar
-- Run this in your Supabase SQL Editor

-- ===========================
-- STEP 1: Create calendar_notes table
-- ===========================

CREATE TABLE IF NOT EXISTS calendar_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 100),
  content TEXT,
  note_type TEXT CHECK (note_type IN ('birthday', 'reminder', 'work_from_home', 'holiday', 'appointment', 'deadline', 'personal', 'other')) DEFAULT 'personal',
  note_date DATE NOT NULL,
  color TEXT DEFAULT '#10b981',
  is_yearly_recurring BOOLEAN DEFAULT false, -- For birthdays, anniversaries
  reminder_time TIME, -- Optional time for reminders
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================
-- STEP 2: Create indexes for performance
-- ===========================

CREATE INDEX IF NOT EXISTS idx_calendar_notes_user_id ON calendar_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_notes_date ON calendar_notes(note_date);
CREATE INDEX IF NOT EXISTS idx_calendar_notes_user_date ON calendar_notes(user_id, note_date);
CREATE INDEX IF NOT EXISTS idx_calendar_notes_recurring ON calendar_notes(is_yearly_recurring);

-- ===========================
-- STEP 3: Create RLS policies
-- ===========================

-- Enable RLS on calendar_notes table
ALTER TABLE calendar_notes ENABLE ROW LEVEL SECURITY;

-- Users can view their own notes
CREATE POLICY "Users can view their own calendar notes" ON calendar_notes
  FOR SELECT USING (user_id = auth.uid());

-- Users can create their own notes
CREATE POLICY "Users can create their own calendar notes" ON calendar_notes
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own notes
CREATE POLICY "Users can update their own calendar notes" ON calendar_notes
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own notes
CREATE POLICY "Users can delete their own calendar notes" ON calendar_notes
  FOR DELETE USING (user_id = auth.uid());

-- ===========================
-- STEP 4: Create trigger for updated_at
-- ===========================

-- Calendar notes updated_at trigger
DROP TRIGGER IF EXISTS trigger_calendar_notes_updated_at ON calendar_notes;
CREATE TRIGGER trigger_calendar_notes_updated_at
  BEFORE UPDATE ON calendar_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================
-- STEP 5: Add sample data (optional)
-- ===========================

-- Function to add sample notes for existing users
CREATE OR REPLACE FUNCTION add_sample_calendar_notes()
RETURNS void AS $$
DECLARE
  sample_user_id UUID;
BEGIN
  -- Get a sample user ID (first user in the system)
  SELECT id INTO sample_user_id 
  FROM profiles 
  WHERE id IS NOT NULL 
  LIMIT 1;
  
  IF sample_user_id IS NOT NULL THEN
    -- Add some sample notes
    INSERT INTO calendar_notes (user_id, title, content, note_type, note_date, color, is_yearly_recurring) VALUES
    (sample_user_id, 'Mom''s Birthday', 'Remember to call mom and wish her happy birthday!', 'birthday', CURRENT_DATE + INTERVAL '7 days', '#f59e0b', true),
    (sample_user_id, 'Work From Home', 'Working from home today - team standup at 9 AM', 'work_from_home', CURRENT_DATE + INTERVAL '3 days', '#3b82f6', false),
    (sample_user_id, 'Project Deadline', 'React dashboard project deadline - final review', 'deadline', CURRENT_DATE + INTERVAL '10 days', '#ef4444', false),
    (sample_user_id, 'Doctor Appointment', 'Annual health checkup at 2:00 PM', 'appointment', CURRENT_DATE + INTERVAL '14 days', '#8b5cf6', false),
    (sample_user_id, 'Team Holiday', 'Company holiday - office closed', 'holiday', CURRENT_DATE + INTERVAL '21 days', '#10b981', false);
    
    RAISE NOTICE 'Sample calendar notes created for user: %', sample_user_id;
  ELSE
    RAISE NOTICE 'No users found, skipping sample note creation';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Sample notes creation skipped (normal for fresh install)';
END;
$$ LANGUAGE plpgsql;

-- Uncomment the line below to add sample data
-- SELECT add_sample_calendar_notes();

-- ===========================
-- STEP 6: Success message
-- ===========================

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Calendar Notes Feature Setup Complete!';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Created calendar_notes table with:';
    RAISE NOTICE '- Personal notes and reminders';
    RAISE NOTICE '- Birthday tracking with yearly recurrence';
    RAISE NOTICE '- Work from home scheduling';
    RAISE NOTICE '- Appointment and deadline tracking';
    RAISE NOTICE '- Color-coded note types';
    RAISE NOTICE '';
    RAISE NOTICE 'Features available:';
    RAISE NOTICE '- Click any date to add notes';
    RAISE NOTICE '- Notes appear alongside events';
    RAISE NOTICE '- Yearly recurring notes for birthdays';
    RAISE NOTICE '- Different colors for different note types';
    RAISE NOTICE '- Optional reminder times';
    RAISE NOTICE '';
    RAISE NOTICE 'Calendar notes are ready to use! 🗓️✨';
    RAISE NOTICE '===========================================';
END $$;
