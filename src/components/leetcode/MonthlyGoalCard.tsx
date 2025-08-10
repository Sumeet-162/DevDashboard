import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Target, 
  Edit3, 
  Calendar, 
  TrendingUp, 
  CheckCircle,
  AlertCircle,
  Trophy,
  Clock,
  BarChart3
} from "lucide-react";
import { MonthlyGoalsService, MonthlyGoal } from "@/services/monthlyGoalsService";

interface MonthlyGoalCardProps {
  userId?: string;
  className?: string;
  showDetailedStats?: boolean;
  onGoalUpdate?: (goal: MonthlyGoal) => void;
}

const MonthlyGoalCard: React.FC<MonthlyGoalCardProps> = ({ 
  userId, 
  className = "",
  showDetailedStats = false,
  onGoalUpdate 
}) => {
  const { toast } = useToast();
  const [goal, setGoal] = useState<MonthlyGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<number>(30);
  const [editCompleted, setEditCompleted] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadGoal();
  }, [userId]);

  const loadGoal = async () => {
    if (!userId) {
      // For demo users, show a mock goal
      const mockGoal = MonthlyGoalsService.getDefaultMonthlyGoal();
      setGoal(mockGoal);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const monthlyGoal = await MonthlyGoalsService.getUserMonthlyGoal(userId);
      setGoal(monthlyGoal);
      
      if (monthlyGoal) {
        setEditTarget(monthlyGoal.target);
        setEditCompleted(monthlyGoal.completed);
      }
    } catch (error) {
      console.error('Error loading monthly goal:', error);
      toast({
        title: "Error",
        description: "Failed to load monthly goal",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoal = async () => {
    if (!userId || !goal) {
      toast({
        title: "Error", 
        description: "Cannot update goal without user authentication",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Validate inputs
      if (editTarget < 1 || editTarget > 200) {
        toast({
          title: "Invalid Target",
          description: "Target must be between 1 and 200 problems",
          variant: "destructive"
        });
        return;
      }

      if (editCompleted < 0) {
        toast({
          title: "Invalid Progress",
          description: "Progress cannot be negative",
          variant: "destructive"
        });
        return;
      }

      // Update target if changed
      if (editTarget !== goal.target) {
        const targetUpdated = await MonthlyGoalsService.updateMonthlyGoalTarget(userId, editTarget);
        if (!targetUpdated) {
          throw new Error('Failed to update target');
        }
      }

      // Update progress if changed
      if (editCompleted !== goal.completed) {
        const progressUpdated = await MonthlyGoalsService.updateMonthlyGoalProgress(userId, editCompleted);
        if (!progressUpdated) {
          throw new Error('Failed to update progress');
        }
      }

      // Reload goal data
      await loadGoal();
      setEditModalOpen(false);

      toast({
        title: "Success",
        description: "Monthly goal updated successfully",
      });

      // Notify parent component
      if (onGoalUpdate && goal) {
        onGoalUpdate(goal);
      }

    } catch (error) {
      console.error('Error saving goal:', error);
      toast({
        title: "Error",
        description: "Failed to update monthly goal",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleQuickIncrement = async () => {
    if (!userId || !goal) return;

    try {
      const success = await MonthlyGoalsService.incrementMonthlyGoalProgress(userId);
      if (success) {
        await loadGoal();
        toast({
          title: "Progress Updated",
          description: "Added 1 problem to your monthly progress!",
        });
      }
    } catch (error) {
      console.error('Error incrementing progress:', error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = () => {
    if (!goal) return "text-muted-foreground";
    
    const percentage = goal.progressPercentage;
    if (percentage >= 100) return "text-green-600";
    if (percentage >= 75) return "text-blue-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-orange-600";
  };

  const getStatusIcon = () => {
    if (!goal) return <Target className="h-5 w-5" />;
    
    const percentage = goal.progressPercentage;
    if (percentage >= 100) return <Trophy className="h-5 w-5 text-green-600" />;
    if (percentage >= 75) return <TrendingUp className="h-5 w-5 text-blue-600" />;
    if (percentage >= 50) return <CheckCircle className="h-5 w-5 text-yellow-600" />;
    return <AlertCircle className="h-5 w-5 text-orange-600" />;
  };

  const getCurrentMonthName = () => {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading || !goal) {
    return (
      <Card className={`card-hover ${className}`}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Monthly Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`card-hover ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            Monthly Goal
          </div>
          {userId && (
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Edit3 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Monthly Goal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="target">Monthly Target</Label>
                    <Input
                      id="target"
                      type="number"
                      min="1"
                      max="200"
                      value={editTarget}
                      onChange={(e) => setEditTarget(parseInt(e.target.value) || 1)}
                      placeholder="Number of problems to solve this month"
                    />
                    <p className="text-xs text-muted-foreground">
                      Set your goal between 1-200 problems for {getCurrentMonthName()}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="completed">Current Progress</Label>
                    <Input
                      id="completed"
                      type="number"
                      min="0"
                      max={editTarget}
                      value={editCompleted}
                      onChange={(e) => setEditCompleted(parseInt(e.target.value) || 0)}
                      placeholder="Problems solved this month"
                    />
                    <p className="text-xs text-muted-foreground">
                      Update your current progress if needed
                    </p>
                  </div>

                  <div className="rounded-lg bg-muted p-3">
                    <div className="text-sm font-medium mb-2">Preview</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{editCompleted}/{editTarget} problems</span>
                      </div>
                      <Progress 
                        value={(editCompleted / editTarget) * 100} 
                        className="h-2"
                      />
                      <div className="text-xs text-muted-foreground">
                        {Math.round((editCompleted / editTarget) * 100)}% complete
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={handleSaveGoal} 
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Month indicator */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{getCurrentMonthName()}</span>
          </div>

          {/* Progress section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span>Progress</span>
              <span className={`font-medium ${getStatusColor()}`}>
                {goal.completed}/{goal.target} problems
              </span>
            </div>
            
            <Progress 
              value={goal.progressPercentage} 
              className="h-3"
            />
            
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{goal.progressPercentage}% complete</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{goal.daysLeft} days left</span>
              </div>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex gap-2 flex-wrap">
            {goal.progressPercentage >= 100 && (
              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                <Trophy className="h-3 w-3 mr-1" />
                Goal Achieved!
              </Badge>
            )}
            {goal.progressPercentage < 100 && goal.daysLeft <= 7 && (
              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                <AlertCircle className="h-3 w-3 mr-1" />
                Final Week
              </Badge>
            )}
            {goal.progressPercentage >= 50 && goal.progressPercentage < 100 && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                <TrendingUp className="h-3 w-3 mr-1" />
                On Track
              </Badge>
            )}
          </div>

          {/* Quick actions */}
          {userId && goal.progressPercentage < 100 && (
            <div className="pt-2 border-t">
              <Button 
                onClick={handleQuickIncrement}
                variant="outline" 
                size="sm" 
                className="w-full text-xs"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Mark One Problem Solved
              </Button>
            </div>
          )}

          {/* Detailed stats */}
          {showDetailedStats && (
            <div className="pt-2 border-t space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Statistics</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Daily Average:</span>
                  <span className="ml-1 font-medium">
                    {(goal.completed / goal.daysPassed || 0).toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Needed/Day:</span>
                  <span className="ml-1 font-medium">
                    {goal.daysLeft > 0 ? ((goal.target - goal.completed) / goal.daysLeft).toFixed(1) : '0'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyGoalCard;
