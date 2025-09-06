import { useState, useEffect, useRef } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw,
  Settings,
  TrendingUp,
  Target,
  Timer,
  Coffee,
  Award,
  Calendar
} from "lucide-react";
import { PomodoroService, PomodoroSession } from "@/lib/productivityService";

type SessionType = 'work' | 'short_break' | 'long_break';

const defaultSettings = {
  work: 25,
  short_break: 5,
  long_break: 15,
  sessions_until_long_break: 4,
  auto_start_breaks: false,
  auto_start_work: false,
  sound_enabled: true
};

const PomodoroPage = () => {
  const [currentSession, setCurrentSession] = useState<PomodoroSession | null>(null);
  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [timeLeft, setTimeLeft] = useState(defaultSettings.work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('pomodoro-settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });
  const [sessionCount, setSessionCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalWorkMinutes: 0,
    totalBreakMinutes: 0,
    completedSessions: 0,
    todaysSessions: 0,
    weeklyStats: [] as { date: string; sessions: number }[]
  });
  const [todaysSessions, setTodaysSessions] = useState<PomodoroSession[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    loadStats();
    loadTodaysSessions();
    
    // Initialize time based on session type
    setTimeLeft(settings[sessionType] * 60);
  }, []);

  useEffect(() => {
    setTimeLeft(settings[sessionType] * 60);
  }, [sessionType, settings]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const loadStats = async () => {
    try {
      const data = await PomodoroService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadTodaysSessions = async () => {
    try {
      const sessions = await PomodoroService.getTodaysSessions();
      setTodaysSessions(sessions);
    } catch (error) {
      console.error('Error loading today\'s sessions:', error);
    }
  };

  const handleStart = async () => {
    if (!currentSession) {
      // Create new session
      try {
        const session = await PomodoroService.createSession({
          session_type: sessionType,
          duration_minutes: settings[sessionType],
          completed: false
        });
        setCurrentSession(session);
        startTimeRef.current = new Date();
      } catch (error) {
        console.error('Error creating session:', error);
        return;
      }
    }
    
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = async () => {
    setIsRunning(false);
    setTimeLeft(settings[sessionType] * 60);
    
    if (currentSession) {
      // Delete the current session if it wasn't completed
      try {
        await PomodoroService.updateSession(currentSession.id, {
          completed: false
        });
      } catch (error) {
        console.error('Error resetting session:', error);
      }
      setCurrentSession(null);
    }
    
    setSessionNotes('');
    startTimeRef.current = null;
  };

  const handleSessionComplete = async () => {
    setIsRunning(false);
    
    if (currentSession && startTimeRef.current) {
      const actualDuration = Math.ceil((Date.now() - startTimeRef.current.getTime()) / 1000 / 60);
      
      try {
        await PomodoroService.completeSession(currentSession.id, actualDuration, sessionNotes);
        
        // Update stats and today's sessions
        loadStats();
        loadTodaysSessions();
        
        // Play completion sound (if enabled)
        if (settings.sound_enabled) {
          playNotificationSound();
        }
        
        // Auto-advance to next session
        if (sessionType === 'work') {
          const newCount = sessionCount + 1;
          setSessionCount(newCount);
          
          if (newCount % settings.sessions_until_long_break === 0) {
            setSessionType('long_break');
          } else {
            setSessionType('short_break');
          }
        } else {
          setSessionType('work');
        }
        
        setCurrentSession(null);
        setSessionNotes('');
        startTimeRef.current = null;
        
        // Show completion notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`${sessionType.replace('_', ' ')} session completed!`, {
            body: `Great job! Time for a ${sessionType === 'work' ? 'break' : 'work session'}.`,
            icon: '/favicon.ico'
          });
        }
        
      } catch (error) {
        console.error('Error completing session:', error);
      }
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuL1O/GdiMFl3/K8dyJOQcWZLPr57tREAtMquL2sWIdCHfH8N+QQAoUXrTp66hVFg==');
    audio.play().catch(() => {
      // Ignore errors if audio can't play
    });
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const saveSettings = () => {
    localStorage.setItem('pomodoro-settings', JSON.stringify(settings));
    // Reset timer if not running
    if (!isRunning) {
      setTimeLeft(settings[sessionType] * 60);
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionIcon = (type: SessionType) => {
    switch (type) {
      case 'work': return <Timer className="h-4 w-4" />;
      case 'short_break': return <Coffee className="h-4 w-4" />;
      case 'long_break': return <Award className="h-4 w-4" />;
    }
  };

  const getSessionColor = (type: SessionType) => {
    switch (type) {
      case 'work': return 'bg-blue-500';
      case 'short_break': return 'bg-green-500';
      case 'long_break': return 'bg-purple-500';
    }
  };

  const progress = ((settings[sessionType] * 60 - timeLeft) / (settings[sessionType] * 60)) * 100;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pomodoro Timer</h1>
            <p className="text-muted-foreground">Focus better with the Pomodoro Technique</p>
          </div>
          <Button variant="outline" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timer Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Timer */}
            <Card>
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    {getSessionIcon(sessionType)}
                    <Badge className={`${getSessionColor(sessionType)} text-white`}>
                      {sessionType.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="relative">
                    <svg className="w-64 h-64 mx-auto" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        className="text-muted-foreground/20"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 45}`}
                        strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                        className={`${getSessionColor(sessionType)} transition-all duration-1000`}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-5xl font-mono font-bold">
                          {formatTime(timeLeft)}
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">
                          Session {sessionCount + 1}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center gap-4">
                    {!isRunning ? (
                      <Button onClick={handleStart} size="lg" className="px-8">
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </Button>
                    ) : (
                      <Button onClick={handlePause} size="lg" variant="outline" className="px-8">
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    )}
                    <Button onClick={handleReset} size="lg" variant="outline">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                  
                  {currentSession && (
                    <div className="mt-6">
                      <label className="text-sm font-medium">Session Notes</label>
                      <Textarea
                        placeholder="What are you working on?"
                        value={sessionNotes}
                        onChange={(e) => setSessionNotes(e.target.value)}
                        className="mt-2"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Session Type Selector */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={sessionType === 'work' ? 'default' : 'outline'}
                    onClick={() => !isRunning && setSessionType('work')}
                    disabled={isRunning}
                    className="flex items-center gap-2"
                  >
                    <Timer className="h-4 w-4" />
                    Work ({settings.work}m)
                  </Button>
                  <Button
                    variant={sessionType === 'short_break' ? 'default' : 'outline'}
                    onClick={() => !isRunning && setSessionType('short_break')}
                    disabled={isRunning}
                    className="flex items-center gap-2"
                  >
                    <Coffee className="h-4 w-4" />
                    Short Break ({settings.short_break}m)
                  </Button>
                  <Button
                    variant={sessionType === 'long_break' ? 'default' : 'outline'}
                    onClick={() => !isRunning && setSessionType('long_break')}
                    disabled={isRunning}
                    className="flex items-center gap-2"
                  >
                    <Award className="h-4 w-4" />
                    Long Break ({settings.long_break}m)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats and Today's Sessions */}
          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.todaysSessions}</div>
                    <div className="text-xs text-muted-foreground">Today</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.totalSessions}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.totalWorkMinutes}</div>
                    <div className="text-xs text-muted-foreground">Work Minutes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.completedSessions}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-medium mb-3">This Week</h4>
                  <div className="space-y-2">
                    {stats.weeklyStats.map((day, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {new Date(day.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className={`w-16 h-2 bg-muted rounded-full overflow-hidden`}>
                            <div 
                              className="h-full bg-blue-500"
                              style={{ width: `${Math.min((day.sessions / 8) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="w-6 text-right">{day.sessions}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Today's Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today's Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todaysSessions.length === 0 ? (
                  <div className="text-center py-4">
                    <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No sessions today</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todaysSessions.slice(0, 10).map((session, index) => (
                      <div key={session.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {getSessionIcon(session.session_type)}
                          <span className="capitalize">
                            {session.session_type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={session.completed ? 'default' : 'outline'} className="text-xs">
                            {session.completed ? 'Completed' : 'Incomplete'}
                          </Badge>
                          <span className="text-muted-foreground">
                            {session.duration_minutes}m
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Settings Panel */}
            {showSettings && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Timer Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Work Duration (minutes)</label>
                    <Select 
                      value={settings.work.toString()} 
                      onValueChange={(value) => setSettings(prev => ({ ...prev, work: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[15, 20, 25, 30, 35, 40, 45, 50].map(minutes => (
                          <SelectItem key={minutes} value={minutes.toString()}>
                            {minutes} minutes
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Short Break Duration (minutes)</label>
                    <Select 
                      value={settings.short_break.toString()} 
                      onValueChange={(value) => setSettings(prev => ({ ...prev, short_break: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[3, 5, 7, 10, 15].map(minutes => (
                          <SelectItem key={minutes} value={minutes.toString()}>
                            {minutes} minutes
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Long Break Duration (minutes)</label>
                    <Select 
                      value={settings.long_break.toString()} 
                      onValueChange={(value) => setSettings(prev => ({ ...prev, long_break: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 15, 20, 25, 30].map(minutes => (
                          <SelectItem key={minutes} value={minutes.toString()}>
                            {minutes} minutes
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Sessions until Long Break</label>
                    <Select 
                      value={settings.sessions_until_long_break.toString()} 
                      onValueChange={(value) => setSettings(prev => ({ ...prev, sessions_until_long_break: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5, 6].map(count => (
                          <SelectItem key={count} value={count.toString()}>
                            {count} sessions
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={saveSettings} className="w-full">
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PomodoroPage;
