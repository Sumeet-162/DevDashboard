import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckSquare, 
  StickyNote, 
  Timer, 
  Calendar,
  Clock,
  Target,
  Play,
  Pause,
  Plus,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TodoService, Note, NotesService, CalendarService, PomodoroService } from "@/lib/productivityService";

interface ProductivityStats {
  todos: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  };
  notes: {
    total: number;
    recent: Note[];
  };
  calendar: {
    todayEvents: number;
    upcomingEvents: number;
  };
  pomodoro: {
    todaysSessions: number;
    isRunning: boolean;
    currentSessionType: string;
  };
}

const ProductivityCard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ProductivityStats>({
    todos: { total: 0, completed: 0, pending: 0, overdue: 0 },
    notes: { total: 0, recent: [] },
    calendar: { todayEvents: 0, upcomingEvents: 0 },
    pomodoro: { todaysSessions: 0, isRunning: false, currentSessionType: 'work' }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductivityStats();
  }, []);

  const fetchProductivityStats = async () => {
    try {
      // Fetch todos stats
      const todos = await TodoService.getTodos();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const todoStats = {
        total: todos.length,
        completed: todos.filter(todo => todo.completed).length,
        pending: todos.filter(todo => !todo.completed && (!todo.due_date || new Date(todo.due_date) >= todayStart)).length,
        overdue: todos.filter(todo => !todo.completed && todo.due_date && new Date(todo.due_date) < todayStart).length
      };

      // Fetch notes stats
      const notes = await NotesService.getNotes();
      const noteStats = {
        total: notes.filter(note => !note.is_archived).length,
        recent: notes.slice(0, 3)
      };

      // Fetch calendar stats
      const events = await CalendarService.getEvents();
      const today = new Date().toDateString();
      const calendarStats = {
        todayEvents: events.filter(event => new Date(event.start_time).toDateString() === today).length,
        upcomingEvents: events.filter(event => new Date(event.start_time) > new Date()).length
      };

      // Fetch pomodoro stats
      const sessions = await PomodoroService.getTodaysSessions();
      const pomodoroStats = {
        todaysSessions: sessions.length,
        isRunning: false, // We'll implement this later
        currentSessionType: 'work'
      };

      setStats({
        todos: todoStats,
        notes: noteStats,
        calendar: calendarStats,
        pomodoro: pomodoroStats
      });
    } catch (error) {
      console.error('Error fetching productivity stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompletionPercentage = () => {
    if (stats.todos.total === 0) return 0;
    return Math.round((stats.todos.completed / stats.todos.total) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/productivity/todos')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center">
                <lord-icon
                  src="https://cdn.lordicon.com/eavqayps.json"
                  trigger="hover"
                  style={{ width: '32px', height: '32px' }}
                />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.todos.pending}</p>
                <p className="text-sm text-muted-foreground">Tasks Left</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/productivity/notes')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center">
                <lord-icon
                  src="https://cdn.lordicon.com/tbabdzcy.json"
                  trigger="hover"
                  style={{ width: '32px', height: '32px' }}
                />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.notes.total}</p>
                <p className="text-sm text-muted-foreground">Active Notes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/productivity/calendar')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center">
                <lord-icon
                  src="https://cdn.lordicon.com/laobovmg.json"
                  trigger="hover"
                  style={{ width: '32px', height: '32px' }}
                />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.calendar.todayEvents}</p>
                <p className="text-sm text-muted-foreground">Today's Events</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/productivity/pomodoro')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center">
                <lord-icon
                  src="https://cdn.lordicon.com/gdowkrjt.json"
                  trigger="hover"
                  style={{ width: '32px', height: '32px' }}
                />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pomodoro.todaysSessions}</p>
                <p className="text-sm text-muted-foreground">Sessions Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Productivity Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks Progress */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <lord-icon
                  src="https://cdn.lordicon.com/rnbuzxxk.json"
                  trigger="hover"
                  style={{ width: '20px', height: '20px' }}
                />
                Task Progress
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/productivity/todos')}>
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Completion Rate</span>
                <span className="font-medium">{getCompletionPercentage()}%</span>
              </div>
              <Progress value={getCompletionPercentage()} className="h-2" />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-green-600">{stats.todos.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-600">{stats.todos.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div>
                <p className="text-lg font-bold text-red-600">{stats.todos.overdue}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full justify-between" 
              onClick={() => navigate('/productivity/todos')}
            >
              View All Tasks
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Recent Notes */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <lord-icon
                  src="https://cdn.lordicon.com/tbabdzcy.json"
                  trigger="hover"
                  style={{ width: '20px', height: '20px' }}
                />
                Recent Notes
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/productivity/notes')}>
                <Plus className="h-4 w-4 mr-1" />
                New Note
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.notes.recent.length > 0 ? (
              <div className="space-y-3">
                {stats.notes.recent.map((note) => (
                  <div 
                    key={note.id} 
                    className="p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border"
                    onClick={() => navigate('/productivity/notes')}
                  >
                    <h4 className="font-medium text-sm line-clamp-1">{note.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {note.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {note.category || 'General'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <StickyNote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No notes yet</p>
                <Button onClick={() => navigate('/productivity/notes')}>
                  Create First Note
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductivityCard;
