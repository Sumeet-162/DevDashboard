import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Target, Edit2, Save, X, TrendingUp, Trophy } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MonthlyGoalsService, MonthlyGoal } from '@/services/monthlyGoalsService';

interface MonthlyGoalSelectorProps {
  userId?: string; // undefined for demo mode, string for authenticated users
}

const MonthlyGoalSelector: React.FC<MonthlyGoalSelectorProps> = ({ userId }) => {
  const [currentGoal, setCurrentGoal] = useState<MonthlyGoal | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTarget, setNewTarget] = useState(30);
  const [isLoading, setIsLoading] = useState(false);

  // Preset goal options
  const presetGoals = [10, 20, 30, 50, 75, 100, 150];

  // Load current month's goal
  useEffect(() => {
    loadCurrentGoal();
  }, [userId]);

  const loadCurrentGoal = async () => {
    setIsLoading(true);
    try {
      const goal = await MonthlyGoalsService.getUserMonthlyGoal(userId || 'demo-user');
      if (goal) {
        setCurrentGoal(goal);
        setNewTarget(goal.target);
      }
    } catch (error) {
      console.error('Error loading monthly goal:', error);
    }
    setIsLoading(false);
  };

  const handleSaveGoal = async () => {
    setIsLoading(true);
    try {
      const success = await MonthlyGoalsService.updateMonthlyGoalTarget(userId || 'demo-user', newTarget);
      if (success) {
        await loadCurrentGoal(); // Reload to get updated data
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error('Error saving goal:', error);
    }
    setIsLoading(false);
  };

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (isLoading && !currentGoal) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Monthly Goal
          {currentGoal && (
            <Badge variant="outline" className="ml-2">
              {formatMonth(currentGoal.month)}
            </Badge>
          )}
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={isLoading}>
              <Edit2 className="h-4 w-4 mr-1" />
              Edit Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Set Monthly Goal</DialogTitle>
              <DialogDescription>
                Choose how many LeetCode problems you want to solve this month. You can adjust this anytime.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              {/* Current Month Display */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm font-medium">
                  Setting goal for {currentGoal ? formatMonth(currentGoal.month) : 'Current Month'}
                </p>
              </div>

              {/* Preset Goals */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Quick Select Goals</Label>
                <div className="flex flex-wrap gap-2">
                  {presetGoals.map((goal) => (
                    <Button
                      key={goal}
                      variant={newTarget === goal ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNewTarget(goal)}
                      className="min-w-[60px]"
                    >
                      {goal}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Goal Input */}
              <div className="space-y-3">
                <Label htmlFor="customGoal" className="text-sm font-medium">Custom Goal (1-200 problems)</Label>
                <Input
                  id="customGoal"
                  type="number"
                  value={newTarget}
                  onChange={(e) => setNewTarget(Math.max(1, Math.min(parseInt(e.target.value) || 1, 200)))}
                  min="1"
                  max="200"
                />
              </div>

              {/* Goal Preview */}
              {currentGoal && (
                <div className="bg-gray-50 border rounded-lg p-4 space-y-2">
                  <p className="text-sm text-gray-600 font-medium">Preview</p>
                  <p className="text-sm text-gray-600">
                    Daily target: {Math.ceil(newTarget / currentGoal.daysInMonth)} problems per day
                  </p>
                  <p className="text-sm text-gray-600">
                    Remaining: {Math.ceil((newTarget - currentGoal.completed) / Math.max(currentGoal.daysLeft, 1))} problems per day
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button onClick={handleSaveGoal} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-1" />
                  {isLoading ? 'Saving...' : 'Save Goal'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="space-y-6">
        {currentGoal && (
          <>
            {/* Goal Overview */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold">{currentGoal.completed} / {currentGoal.target}</p>
                <p className="text-sm text-muted-foreground mt-1">Problems solved this month</p>
              </div>
              <Badge variant={currentGoal.progressPercentage >= 100 ? "default" : "secondary"} className="text-sm px-3 py-1">
                {currentGoal.progressPercentage}%
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3">
              <Progress value={currentGoal.progressPercentage} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress</span>
                <span>{Math.max(0, currentGoal.target - currentGoal.completed)} problems remaining</span>
              </div>
            </div>

            {/* Time Information */}
            <div className="grid grid-cols-3 gap-6 text-sm pt-2">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <p className="font-medium text-lg">{currentGoal.daysLeft}</p>
                <p className="text-muted-foreground text-xs">days left</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <p className="font-medium text-lg">
                  {Math.ceil(Math.max(0, currentGoal.target - currentGoal.completed) / Math.max(currentGoal.daysLeft, 1))}
                </p>
                <p className="text-muted-foreground text-xs">per day needed</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Trophy className="h-4 w-4 text-yellow-600" />
                </div>
                <p className="font-medium text-lg">{currentGoal.daysPassed}</p>
                <p className="text-muted-foreground text-xs">days passed</p>
              </div>
            </div>

            {/* Success Message */}
            {currentGoal.progressPercentage >= 100 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <p className="text-green-800 text-sm font-medium flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  🎉 Congratulations! You've achieved your monthly goal!
                </p>
              </div>
            )}

            {/* Motivation Message */}
            {currentGoal.progressPercentage < 100 && currentGoal.daysLeft <= 7 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-4">
                <p className="text-orange-800 text-sm font-medium">
                  🔥 Final week! You can do this - just {Math.max(0, currentGoal.target - currentGoal.completed)} problems to go!
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MonthlyGoalSelector;
