import React, { useState, useEffect } from 'react';
import Layout from "@/components/layout/Layout";
import MonthlyGoalCard from "@/components/leetcode/MonthlyGoalCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  Award, 
  BarChart3,
  CheckCircle,
  Clock,
  Trophy,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { MonthlyGoalsService, MonthlyGoal } from "@/services/monthlyGoalsService";

interface MonthlyGoalsPageProps {
  userId?: string;
}

const MonthlyGoalsPage: React.FC<MonthlyGoalsPageProps> = ({ userId }) => {
  const { toast } = useToast();
  const [currentGoal, setCurrentGoal] = useState<MonthlyGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    loadCurrentGoal();
  }, [userId]);

  const loadCurrentGoal = async () => {
    setLoading(true);
    try {
      if (!userId) {
        // Demo mode
        setCurrentGoal(MonthlyGoalsService.getDefaultMonthlyGoal());
      } else {
        const goal = await MonthlyGoalsService.getUserMonthlyGoal(userId);
        setCurrentGoal(goal);
      }
    } catch (error) {
      console.error('Error loading goal:', error);
      toast({
        title: "Error",
        description: "Failed to load monthly goal",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getMotivationalMessage = () => {
    if (!currentGoal) return "";

    const { progressPercentage, daysLeft } = currentGoal;

    if (progressPercentage >= 100) {
      return "🎉 Congratulations! You've achieved your monthly goal!";
    } else if (progressPercentage >= 75) {
      return "🔥 You're on fire! Keep up the great work!";
    } else if (progressPercentage >= 50) {
      return "💪 You're halfway there! Stay focused!";
    } else if (daysLeft <= 7) {
      return "⚡ Final week! Time to push harder!";
    } else if (progressPercentage >= 25) {
      return "📈 Good progress! Maintain the momentum!";
    } else {
      return "🚀 Let's get started! Every problem counts!";
    }
  };

  const getStreakInfo = () => {
    // This would be calculated from actual submission data
    // For now, return mock data
    return {
      current: Math.floor(Math.random() * 10) + 1,
      longest: Math.floor(Math.random() * 20) + 5,
      thisMonth: Math.floor(Math.random() * 15) + 3
    };
  };

  const getMonthlyStats = () => {
    if (!currentGoal) return null;

    const streak = getStreakInfo();
    const avgPerDay = currentGoal.daysPassed > 0 ? 
      (currentGoal.completed / currentGoal.daysPassed).toFixed(1) : '0.0';
    const projectedTotal = currentGoal.daysPassed > 0 ? 
      Math.round((currentGoal.completed / currentGoal.daysPassed) * currentGoal.daysInMonth) : 0;

    return {
      streak,
      avgPerDay,
      projectedTotal,
      efficiency: currentGoal.target > 0 ? Math.round((projectedTotal / currentGoal.target) * 100) : 0
    };
  };

  const getSuggestedTargets = () => {
    if (!currentGoal) return [];

    const current = currentGoal.target;
    return [
      { label: "Conservative", value: Math.max(10, current - 5), description: "Steady progress" },
      { label: "Current", value: current, description: "Keep your pace" },
      { label: "Ambitious", value: current + 10, description: "Push your limits" },
      { label: "Challenger", value: current + 20, description: "Elite level" }
    ];
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Target className="h-8 w-8 animate-pulse mx-auto" />
            <p className="text-muted-foreground">Loading your goals...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const stats = getMonthlyStats();
  const suggestions = getSuggestedTargets();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className="h-8 w-8 text-blue-600" />
            Monthly Goals
          </h1>
          <p className="text-muted-foreground">
            Track your progress and stay motivated with personalized monthly coding goals
          </p>
        </div>

        {/* Motivational Banner */}
        {currentGoal && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-lg font-medium text-blue-900">
                  {getMotivationalMessage()}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  {formatMonth(new Date())} • {currentGoal.daysLeft} days remaining
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Goal Card and Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MonthlyGoalCard 
              userId={userId}
              showDetailedStats={true}
              onGoalUpdate={setCurrentGoal}
              className="h-full"
            />
          </div>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Daily Average</span>
                    <Badge variant="secondary">{stats.avgPerDay} problems</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Projected Total</span>
                    <Badge variant={stats.projectedTotal >= currentGoal!.target ? "default" : "secondary"}>
                      {stats.projectedTotal} problems
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current Streak</span>
                    <Badge variant="secondary" className="gap-1">
                      🔥 {stats.streak.current} days
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Efficiency</span>
                    <Badge variant={stats.efficiency >= 100 ? "default" : stats.efficiency >= 80 ? "secondary" : "outline"}>
                      {stats.efficiency}%
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Progress Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Progress Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentGoal && stats && (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Completion Rate</span>
                          <span>{currentGoal.progressPercentage}%</span>
                        </div>
                        <Progress value={currentGoal.progressPercentage} className="h-2" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Time Progress</span>
                          <span>{Math.round((currentGoal.daysPassed / currentGoal.daysInMonth) * 100)}%</span>
                        </div>
                        <Progress 
                          value={(currentGoal.daysPassed / currentGoal.daysInMonth) * 100} 
                          className="h-2"
                        />
                      </div>

                      <div className="pt-2 border-t space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Problems completed</span>
                          <span className="font-medium">{currentGoal.completed}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Problems remaining</span>
                          <span className="font-medium">{Math.max(0, currentGoal.target - currentGoal.completed)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Days remaining</span>
                          <span className="font-medium">{currentGoal.daysLeft}</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Streak Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Streak Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats && (
                    <>
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">Current Streak</p>
                          <p className="text-xs text-muted-foreground">Days in a row</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-orange-600">🔥 {stats.streak.current}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">Longest Streak</p>
                          <p className="text-xs text-muted-foreground">Personal best</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">🏆 {stats.streak.longest}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">This Month</p>
                          <p className="text-xs text-muted-foreground">Active days</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">📅 {stats.streak.thisMonth}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Goal Suggestions</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Based on your current performance and coding patterns
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{suggestion.label}</h4>
                          <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                        </div>
                        <Badge variant={suggestion.label === "Current" ? "default" : "outline"}>
                          {suggestion.value} problems
                        </Badge>
                      </div>
                      {currentGoal && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          {suggestion.value > currentGoal.target ? (
                            <ArrowUp className="h-3 w-3 mr-1 text-green-600" />
                          ) : suggestion.value < currentGoal.target ? (
                            <ArrowDown className="h-3 w-3 mr-1 text-red-600" />
                          ) : (
                            <Minus className="h-3 w-3 mr-1" />
                          )}
                          {suggestion.value === currentGoal.target ? "Current goal" : 
                           `${Math.abs(suggestion.value - currentGoal.target)} ${
                             suggestion.value > currentGoal.target ? 'more' : 'fewer'
                           } than current`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Goal History</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track your monthly goal achievements over time
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4" />
                  <p className="font-medium">Goal History Coming Soon</p>
                  <p className="text-sm">
                    Historical data will be available once you've completed a few months of goal tracking
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default MonthlyGoalsPage;
