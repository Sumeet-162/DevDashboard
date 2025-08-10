# Monthly Goals Feature - Complete Implementation Guide

## 🎯 Feature Overview

The Monthly Goals feature allows users to:
- Set personalized monthly problem-solving targets (1-200 problems)
- Track progress with visual indicators and statistics
- Edit goals anytime during the month
- View detailed analytics and streak information
- Get motivational messages and goal suggestions
- Auto-reset goals for new months

## 📁 Files Created/Modified

### 1. Database Setup
- `monthly-goals-database-update.sql` - Database schema updates

### 2. Services
- `src/services/monthlyGoalsService.ts` - Main service for CRUD operations
- `src/lib/supabase.ts` - Updated with monthly goal types

### 3. Components
- `src/components/leetcode/MonthlyGoalCard.tsx` - Reusable goal card component
- `src/pages/MonthlyGoalsPage.tsx` - Dedicated goals management page

### 4. Updated Files
- `src/pages/LeetCodePage.tsx` - Integrated MonthlyGoalCard

## 🚀 Setup Instructions

### Step 1: Database Setup
Run this SQL in your Supabase SQL Editor:

```sql
-- Monthly Goals Database Update
-- Add monthly goal support to user_preferences table

-- Add monthly goal columns to user_preferences table
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS monthly_goal_target INTEGER DEFAULT 30;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS monthly_goal_month TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM');
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS monthly_goal_completed INTEGER DEFAULT 0;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS monthly_goal_last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_preferences_monthly_goal 
ON user_preferences(id, monthly_goal_month);

-- Create trigger to auto-reset monthly goals when month changes
CREATE OR REPLACE FUNCTION reset_monthly_goal_if_new_month()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if current month is different from stored month
  IF NEW.monthly_goal_month != TO_CHAR(NOW(), 'YYYY-MM') THEN
    NEW.monthly_goal_month = TO_CHAR(NOW(), 'YYYY-MM');
    NEW.monthly_goal_completed = 0;
    NEW.monthly_goal_last_updated = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for monthly goal reset
DROP TRIGGER IF EXISTS trigger_reset_monthly_goal ON user_preferences;
CREATE TRIGGER trigger_reset_monthly_goal
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION reset_monthly_goal_if_new_month();
```

### Step 2: Add Route (Optional)
Add to your router configuration:

```tsx
// In your router file (e.g., App.tsx or router.tsx)
import MonthlyGoalsPage from '@/pages/MonthlyGoalsPage';

// Add route
<Route path="/goals" element={<MonthlyGoalsPage userId={user?.id} />} />
```

### Step 3: Add Navigation Link (Optional)
Add to your navigation:

```tsx
<NavLink to="/goals" className="nav-link">
  <Target className="h-4 w-4" />
  Monthly Goals
</NavLink>
```

## 🎨 Usage Examples

### Basic Monthly Goal Card
```tsx
import MonthlyGoalCard from '@/components/leetcode/MonthlyGoalCard';

// In your component
<MonthlyGoalCard 
  userId={user?.id} // Pass actual user ID when authenticated
  showDetailedStats={true}
  onGoalUpdate={(goal) => {
    console.log('Goal updated:', goal);
    // Handle goal updates
  }}
/>
```

### Full Monthly Goals Page
```tsx
import MonthlyGoalsPage from '@/pages/MonthlyGoalsPage';

// In your component
<MonthlyGoalsPage userId={user?.id} />
```

### Service Usage
```tsx
import { MonthlyGoalsService } from '@/services/monthlyGoalsService';

// Get user's current monthly goal
const goal = await MonthlyGoalsService.getUserMonthlyGoal(userId);

// Update goal target
await MonthlyGoalsService.updateMonthlyGoalTarget(userId, 50);

// Increment progress
await MonthlyGoalsService.incrementMonthlyGoalProgress(userId);

// Update progress manually
await MonthlyGoalsService.updateMonthlyGoalProgress(userId, 25);
```

## 🔧 Integration with LeetCode Submissions

To automatically update monthly goals when users solve problems:

```tsx
// In your LeetCode service or submission handler
import { MonthlyGoalsService } from '@/services/monthlyGoalsService';

const handleProblemSolved = async (userId: string) => {
  // Update LeetCode stats
  // ... existing logic

  // Update monthly goal progress
  await MonthlyGoalsService.incrementMonthlyGoalProgress(userId);
};
```

## 🎯 Features Included

### 1. Goal Management
- ✅ Set monthly targets (1-200 problems)
- ✅ Edit targets anytime
- ✅ Manual progress updates
- ✅ Auto-reset for new months

### 2. Progress Tracking
- ✅ Visual progress bars
- ✅ Percentage completion
- ✅ Days remaining counter
- ✅ Daily average calculation

### 3. Analytics & Insights
- ✅ Progress vs time analysis
- ✅ Streak tracking (mock data)
- ✅ Performance efficiency
- ✅ Goal suggestions

### 4. User Experience
- ✅ Motivational messages
- ✅ Status badges and colors
- ✅ Quick increment buttons
- ✅ Responsive design
- ✅ Toast notifications

### 5. Data Management
- ✅ Supabase integration
- ✅ TypeScript support
- ✅ Error handling
- ✅ Loading states
- ✅ Demo mode for non-authenticated users

## 🔮 Future Enhancements

### Near-term (Easy to implement)
- [ ] Goal history tracking with charts
- [ ] Weekly sub-goals
- [ ] Achievement badges for streaks
- [ ] Email reminders for inactive days

### Medium-term (Requires more work)
- [ ] Smart goal suggestions based on past performance
- [ ] Social features (compare with friends)
- [ ] Integration with calendar apps
- [ ] Export progress reports

### Long-term (Advanced features)
- [ ] Machine learning for personalized targets
- [ ] Advanced analytics dashboard
- [ ] Integration with other coding platforms
- [ ] Gamification with points and leaderboards

## 🐛 Troubleshooting

### Common Issues

1. **Database errors**: Ensure you've run the database update script
2. **Type errors**: Check that supabase.ts includes monthly goal fields
3. **Missing dependencies**: Install required UI components
4. **Authentication errors**: Handle cases where userId is undefined

### Debug Mode
Enable debug logging:
```tsx
// In MonthlyGoalsService
console.log('Monthly goal operation:', { userId, operation, data });
```

## 📊 Performance Considerations

- Database queries are optimized with indexes
- Component re-renders minimized with proper state management
- Lazy loading for historical data
- Efficient caching for frequently accessed data

## 🔒 Security Notes

- All database operations use RLS (Row Level Security)
- User can only access their own goals
- Input validation prevents invalid data
- Proper error handling prevents data leaks

---

## 🎉 You're All Set!

The monthly goals feature is now fully implemented and ready to use. Users can:

1. **Set Goals**: Click the edit button on any monthly goal card
2. **Track Progress**: View real-time progress with visual indicators
3. **Stay Motivated**: Get personalized messages and insights
4. **Analyze Performance**: Use the dedicated goals page for detailed analytics

The feature works in both authenticated and demo modes, making it perfect for showcasing to potential users!
