-- Productivity Features Database Schema
-- Run this in your Supabase SQL Editor to add all productivity features

-- ===========================
-- STEP 1: Create todos table
-- ===========================

CREATE TABLE IF NOT EXISTS todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
  description TEXT,
  completed BOOLEAN DEFAULT false,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  category TEXT DEFAULT 'personal',
  due_date TIMESTAMP WITH TIME ZONE,
  reminder_date TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ===========================
-- STEP 2: Create notes table
-- ===========================

CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'personal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================
-- STEP 3: Create pomodoro_sessions table
-- ===========================

CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_type TEXT CHECK (session_type IN ('work', 'short_break', 'long_break')) DEFAULT 'work',
  duration_minutes INTEGER NOT NULL DEFAULT 25,
  actual_duration_minutes INTEGER,
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ===========================
-- STEP 4: Create calendar_events table
-- ===========================

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
  description TEXT,
  event_type TEXT CHECK (event_type IN ('meeting', 'call', 'coding', 'break', 'deadline', 'personal', 'work')) DEFAULT 'meeting',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  is_all_day BOOLEAN DEFAULT false,
  location TEXT,
  attendees TEXT[] DEFAULT '{}',
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================
-- STEP 5: Create indexes for performance
-- ===========================

-- Todos indexes
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category);
CREATE INDEX IF NOT EXISTS idx_todos_tags ON todos USING GIN(tags);

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_favorite ON notes(is_favorite, created_at DESC) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_notes_content_search ON notes USING GIN(to_tsvector('english', title || ' ' || content));

-- Pomodoro sessions indexes
CREATE INDEX IF NOT EXISTS idx_pomodoro_user_id ON pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_created_at ON pomodoro_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pomodoro_session_type ON pomodoro_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_pomodoro_completed ON pomodoro_sessions(completed, created_at DESC);

-- Calendar events indexes
CREATE INDEX IF NOT EXISTS idx_calendar_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_event_type ON calendar_events(event_type);

-- ===========================
-- STEP 6: Row Level Security Policies
-- ===========================

-- Enable RLS on all tables
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Todos policies
CREATE POLICY "Users can view their own todos" ON todos
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own todos" ON todos
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own todos" ON todos
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own todos" ON todos
  FOR DELETE USING (user_id = auth.uid());

-- Notes policies
CREATE POLICY "Users can view their own notes" ON notes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own notes" ON notes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notes" ON notes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notes" ON notes
  FOR DELETE USING (user_id = auth.uid());

-- Pomodoro sessions policies
CREATE POLICY "Users can view their own pomodoro sessions" ON pomodoro_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own pomodoro sessions" ON pomodoro_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own pomodoro sessions" ON pomodoro_sessions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own pomodoro sessions" ON pomodoro_sessions
  FOR DELETE USING (user_id = auth.uid());

-- Calendar events policies
CREATE POLICY "Users can view their own calendar events" ON calendar_events
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own calendar events" ON calendar_events
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own calendar events" ON calendar_events
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own calendar events" ON calendar_events
  FOR DELETE USING (user_id = auth.uid());

-- ===========================
-- STEP 7: Functions for updated_at triggers
-- ===========================

-- Create or update the updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- STEP 8: Create triggers for updated_at
-- ===========================

-- Todos updated_at trigger
DROP TRIGGER IF EXISTS trigger_todos_updated_at ON todos;
CREATE TRIGGER trigger_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Notes updated_at trigger
DROP TRIGGER IF EXISTS trigger_notes_updated_at ON notes;
CREATE TRIGGER trigger_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calendar events updated_at trigger
DROP TRIGGER IF EXISTS trigger_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER trigger_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================
-- STEP 9: Create completion tracking trigger for todos
-- ===========================

CREATE OR REPLACE FUNCTION update_todo_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed = true AND OLD.completed = false THEN
        NEW.completed_at = NOW();
    ELSIF NEW.completed = false AND OLD.completed = true THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_todo_completed_at ON todos;
CREATE TRIGGER trigger_todo_completed_at
  BEFORE UPDATE ON todos
  FOR EACH ROW EXECUTE FUNCTION update_todo_completed_at();

-- ===========================
-- STEP 10: Create completion tracking trigger for pomodoro
-- ===========================

CREATE OR REPLACE FUNCTION update_pomodoro_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed = true AND OLD.completed = false THEN
        NEW.completed_at = NOW();
    ELSIF NEW.completed = false AND OLD.completed = true THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pomodoro_completed_at ON pomodoro_sessions;
CREATE TRIGGER trigger_pomodoro_completed_at
  BEFORE UPDATE ON pomodoro_sessions
  FOR EACH ROW EXECUTE FUNCTION update_pomodoro_completed_at();

-- ===========================
-- SUCCESS MESSAGE
-- ===========================

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Productivity Features Database Setup Complete!';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Created tables:';
    RAISE NOTICE '- todos (task management)';
    RAISE NOTICE '- notes (quick notes)';
    RAISE NOTICE '- pomodoro_sessions (time tracking)';
    RAISE NOTICE '- calendar_events (developer calendar)';
    RAISE NOTICE '';
    RAISE NOTICE 'Features enabled:';
    RAISE NOTICE '- Row Level Security (RLS)';
    RAISE NOTICE '- Performance indexes';
    RAISE NOTICE '- Auto-updating timestamps';
    RAISE NOTICE '- Completion tracking';
    RAISE NOTICE '- Full-text search for notes';
    RAISE NOTICE '';
    RAISE NOTICE 'All productivity features are ready!';
    RAISE NOTICE '===========================================';
END $$;

-- Verify the setup
SELECT 
  'todos' as table_name,
  COUNT(*) as row_count,
  'Task management ready' as status
FROM todos
UNION ALL
SELECT 
  'notes' as table_name,
  COUNT(*) as row_count,
  'Notes system ready' as status
FROM notes
UNION ALL
SELECT 
  'pomodoro_sessions' as table_name,
  COUNT(*) as row_count,
  'Pomodoro timer ready' as status
FROM pomodoro_sessions
UNION ALL
SELECT 
  'calendar_events' as table_name,
  COUNT(*) as row_count,
  'Calendar system ready' as status
FROM calendar_events;
