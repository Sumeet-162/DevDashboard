# Productivity Features Deployment Guide

This guide will walk you through setting up all the productivity features in your Code Hub Dashboard application.

## 🗄️ Database Setup

### 1. Run the Database Script

1. **Open Supabase Dashboard**
   - Go to [https://supabase.com](https://supabase.com)
   - Navigate to your project
   - Click on **"SQL Editor"** in the left sidebar

2. **Execute the Database Setup Script**
   - Copy the contents of `productivity-database-setup.sql`
   - Paste it into the SQL Editor
   - Click **"Run"** to execute the script

   This will create the following tables:
   - `todos` - Task management system
   - `notes` - Quick notes system
   - `pomodoro_sessions` - Pomodoro timer sessions
   - `calendar_events` - Development calendar events

### 2. Verify Database Setup

After running the script, verify that all tables were created:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('todos', 'notes', 'pomodoro_sessions', 'calendar_events');
```

## 🚀 Features Overview

### 1. To-Do List ✅
**Location:** `/productivity/todo`

**Features:**
- ✅ Complete task management system
- ✅ Priority levels (Low, Medium, High, Urgent)
- ✅ Categories (Work, Personal, Learning, Projects, etc.)
- ✅ Tags system with autocomplete
- ✅ Due dates and overdue detection
- ✅ Search and filtering
- ✅ Drag-and-drop interface
- ✅ Statistics dashboard
- ✅ CRUD operations with confirmation dialogs

**Database Table:** `todos`

### 2. Pomodoro Timer 🍅
**Location:** `/productivity/pomodoro`

**Features:**
- ✅ Full Pomodoro timer implementation
- ✅ Customizable work/break durations
- ✅ Session tracking and statistics
- ✅ Visual circular progress indicator
- ✅ Session notes and completion tracking
- ✅ Auto-advance to next session type
- ✅ Browser notifications (when permitted)
- ✅ Sound notifications
- ✅ Today's sessions history

**Database Table:** `pomodoro_sessions`

### 3. Quick Notes 📝
**Location:** `/productivity/notes`

**Features:**
- ✅ Complete note management system
- ✅ Categories with icons (Personal, Work, Ideas, etc.)
- ✅ Tag system with filtering
- ✅ Full-text search
- ✅ Favorites system
- ✅ Archive functionality
- ✅ Rich sidebar with stats and filters
- ✅ Modal editing interface
- ✅ CRUD operations with confirmation dialogs

**Database Table:** `notes`

### 4. Dev Calendar 📅
**Location:** `/productivity/calendar`

**Features:**
- ✅ Full calendar implementation
- ✅ Month and Agenda views
- ✅ Event types (Meeting, Call, Coding, Break, etc.)
- ✅ Color-coded events
- ✅ Event CRUD operations
- ✅ Location and attendee management
- ✅ Time-based filtering
- ✅ Upcoming events sidebar
- ✅ Statistics dashboard
- ✅ Responsive design

**Database Table:** `calendar_events`

## 🔧 Configuration

### 1. Environment Variables

Ensure your `.env.local` file has the correct Supabase configuration:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Authentication

Make sure users are authenticated before accessing productivity features. The service layer (`productivityService.ts`) uses Supabase auth to associate data with users.

## 📊 Service Layer

All productivity features use a comprehensive service layer (`src/lib/productivityService.ts`) that provides:

### TodoService
- `getTodos()` - Fetch all user todos
- `createTodo(data)` - Create new todo
- `updateTodo(id, data)` - Update existing todo
- `deleteTodo(id)` - Delete todo
- `getStats()` - Get todo statistics

### NotesService
- `getNotes()` - Fetch all user notes
- `createNote(data)` - Create new note
- `updateNote(id, data)` - Update existing note
- `deleteNote(id)` - Delete note

### PomodoroService
- `getSessions()` - Fetch all sessions
- `createSession(data)` - Create new session
- `completeSession(id, actualDuration, notes)` - Complete session
- `updateSession(id, data)` - Update session
- `getStats()` - Get session statistics
- `getTodaysSessions()` - Get today's sessions

### CalendarService
- `getEvents()` - Fetch all events
- `createEvent(data)` - Create new event
- `updateEvent(id, data)` - Update existing event
- `deleteEvent(id)` - Delete event

## 🎨 UI Components

All features use consistent UI patterns:

- **Custom Confirmation Dialogs** - Uses `ConfirmDialog` component for destructive actions
- **Responsive Design** - Works on desktop and mobile
- **Consistent Color Scheme** - Matches your application theme
- **Loading States** - Proper loading indicators
- **Error Handling** - Comprehensive error management

## 🔐 Security Features

### Row Level Security (RLS)

All tables have RLS policies that:
- Only allow users to access their own data
- Prevent unauthorized modifications
- Ensure data privacy and security

### Policy Examples:

```sql
-- Todos table policies
CREATE POLICY "Users can view their own todos" ON todos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own todos" ON todos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own todos" ON todos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own todos" ON todos FOR DELETE USING (auth.uid() = user_id);
```

## 🚀 Deployment Steps

### 1. Database Migration
```bash
# Run the SQL script in Supabase SQL Editor
# Copy-paste the entire productivity-database-setup.sql content
```

### 2. Frontend Deployment
```bash
# Build the application
npm run build

# Deploy to your hosting service (Vercel, Netlify, etc.)
npm run deploy
```

### 3. Testing

After deployment, test each feature:

#### Todo List
1. Create a new todo
2. Edit existing todo
3. Mark as complete
4. Delete todo
5. Test filtering and search

#### Pomodoro Timer
1. Start a work session
2. Pause/resume timer
3. Complete a session
4. Check statistics

#### Quick Notes
1. Create a note
2. Edit existing note
3. Add tags and categories
4. Test search functionality

#### Dev Calendar
1. Create an event
2. Edit existing event
3. Switch between month and agenda views
4. Test event filtering

## 📱 Mobile Responsiveness

All productivity features are fully responsive:
- **Mobile-first design**
- **Touch-friendly interface**
- **Responsive layouts**
- **Optimized for small screens**

## 🔄 Real-time Updates

The application supports real-time updates through Supabase:
- Changes reflect immediately across sessions
- No manual refresh required
- Consistent data across devices

## 🎯 Performance Optimization

### Database Indexes
The setup script includes optimized indexes for:
- User-based queries
- Date-based filtering
- Search operations
- Statistics calculations

### Frontend Optimization
- **Lazy loading** of components
- **Efficient state management**
- **Optimized API calls**
- **Caching strategies**

## 🐛 Troubleshooting

### Common Issues

1. **Tables not created**
   - Verify SQL script execution
   - Check Supabase logs
   - Ensure proper permissions

2. **RLS policies not working**
   - Verify user authentication
   - Check policy definitions
   - Test with different users

3. **Frontend errors**
   - Check browser console
   - Verify environment variables
   - Test API endpoints

### Debug Queries

```sql
-- Check table structure
\d+ todos
\d+ notes
\d+ pomodoro_sessions
\d+ calendar_events

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename IN ('todos', 'notes', 'pomodoro_sessions', 'calendar_events');

-- Test data access
SELECT count(*) FROM todos WHERE user_id = auth.uid();
```

## 🎉 Success! 

Once deployed, your users will have access to a complete productivity suite with:

- **Task Management** - Comprehensive todo system
- **Time Tracking** - Pomodoro timer with statistics
- **Note Taking** - Rich note management system
- **Calendar** - Event scheduling and management

All features work seamlessly together and provide a unified productivity experience within your Code Hub Dashboard!

## 📞 Support

If you encounter any issues during deployment:

1. Check the browser console for errors
2. Verify database table creation
3. Test RLS policies
4. Check authentication flow
5. Verify API endpoints

The productivity suite is now ready for production use! 🚀
