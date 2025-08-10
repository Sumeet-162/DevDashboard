# Monthly Goals Feature - User Guide

## Overview
The Monthly Goals feature allows users to set, track, and manage their LeetCode problem-solving targets on a month-by-month basis. Users can customize their goals and monitor their progress with detailed statistics and motivational feedback.

## Where Users Select Monthly Goals

### 1. Main LeetCode Dashboard
- **Location**: LeetCode page (`/leetcode`) - Left side of the "Monthly Goal & Quick Actions" section
- **Access**: Click the "Edit Goal" button in the Monthly Goal card

### 2. Goal Setting Dialog
When users click "Edit Goal", they see a dialog with:

#### Quick Select Options
- **Preset Goals**: 10, 20, 30, 50, 75, 100, 150 problems
- **One-click selection** for common goal amounts

#### Custom Goal Input
- **Range**: 1-200 problems per month
- **Input validation** to ensure reasonable limits
- **Real-time calculation** of daily targets

#### Goal Preview
- Shows daily problems needed for the entire month
- Shows daily problems needed for remaining days
- Helps users understand the commitment level

## Database Structure

### Updated Query
```sql
-- Add monthly goal columns to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS monthly_goal_target INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS monthly_goal_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_goal_month VARCHAR(7) DEFAULT NULL, -- Format: 'YYYY-MM'
ADD COLUMN IF NOT EXISTS monthly_goal_last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_goal_month 
ON user_preferences(monthly_goal_month);

CREATE INDEX IF NOT EXISTS idx_user_preferences_id 
ON user_preferences(id);
```

### Table Schema
- `monthly_goal_target` - Number of problems user wants to solve this month
- `monthly_goal_completed` - Number of problems user has solved this month  
- `monthly_goal_month` - Which month this goal is for (YYYY-MM format)
- `monthly_goal_last_updated` - Timestamp of last update

## Features

### 1. Goal Setting
- **Default Goal**: 30 problems per month for new users
- **Customizable Range**: 1-200 problems
- **Month-specific**: Each month can have a different goal
- **Auto-reset**: Goals automatically reset for new months

### 2. Progress Tracking
- **Visual Progress Bar**: Shows percentage completion
- **Real-time Stats**: 
  - Problems completed vs target
  - Days left in month
  - Daily target needed to complete goal
  - Days passed in current month

### 3. Smart Calculations
- **Daily Target**: Target problems ÷ Days in month
- **Remaining Daily Target**: Remaining problems ÷ Days left
- **Progress Percentage**: (Completed ÷ Target) × 100

### 4. User Experience Enhancements
- **Motivational Messages**: 
  - Success celebrations when goal is achieved
  - Encouragement during final week
- **Visual Feedback**:
  - Color-coded progress indicators
  - Trophy icons for achievements
  - Progress percentage badges

### 5. Automatic Features
- **Month Auto-detection**: Automatically detects current month
- **Auto-reset**: Starts fresh each month
- **Fallback Handling**: Works with demo data when user not authenticated

## API Service Methods

### MonthlyGoalsService Methods:

1. **getUserMonthlyGoal(userId)** - Get current month's goal
2. **updateMonthlyGoalTarget(userId, target)** - Set new goal target
3. **updateMonthlyGoalProgress(userId, completed)** - Update progress
4. **incrementMonthlyGoalProgress(userId)** - Add one to progress
5. **resetMonthlyGoal(userId)** - Reset for new month

## Integration Points

### 1. LeetCode Page Integration
- Component: `MonthlyGoalSelector`
- Location: Left panel of LeetCode dashboard
- Props: `userId` (optional, uses demo mode if not provided)

### 2. Progress Updates
Progress can be updated automatically when:
- User solves a new problem (via LeetCode API integration)
- Manual refresh of user data
- Real-time problem solving tracking

### 3. Database Integration
- Uses Supabase for data persistence
- Integrates with existing `user_preferences` table
- Maintains data consistency with user authentication

## User Workflow

1. **Initial Setup**: User sees default 30-problem goal for current month
2. **Goal Customization**: Click "Edit Goal" → Select preset or enter custom amount → Save
3. **Progress Tracking**: Dashboard automatically shows current progress
4. **Monthly Reset**: Goals automatically reset at the start of each month
5. **Historical Data**: Previous months' data is preserved for analytics

## Technical Implementation

### Components
- `MonthlyGoalSelector.tsx` - Main component with edit dialog
- `MonthlyGoalsService.ts` - API service for database operations

### Database Schema
- Extended `user_preferences` table with monthly goal columns
- Indexed for performance on user ID and month queries

### State Management
- React state for real-time UI updates
- Service layer for data persistence
- Error handling for API failures

This feature provides a comprehensive goal-setting and tracking system that motivates users to maintain consistent problem-solving habits while offering flexibility in target setting and clear progress visualization.
