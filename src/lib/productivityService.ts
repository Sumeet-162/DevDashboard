import { supabase } from "@/lib/supabase";

// ===========================
// TYPES
// ===========================

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  due_date?: string;
  reminder_date?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  is_favorite: boolean;
  is_archived: boolean;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface PomodoroSession {
  id: string;
  user_id: string;
  session_type: 'work' | 'short_break' | 'long_break';
  duration_minutes: number;
  actual_duration_minutes?: number;
  completed: boolean;
  notes?: string;
  created_at: string;
  completed_at?: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  event_type: 'meeting' | 'call' | 'coding' | 'break' | 'deadline' | 'personal' | 'work';
  start_time: string;
  end_time?: string;
  is_all_day: boolean;
  location?: string;
  attendees: string[];
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarNote {
  id: string;
  user_id: string;
  title: string;
  content?: string;
  note_type: 'birthday' | 'reminder' | 'work_from_home' | 'holiday' | 'appointment' | 'deadline' | 'personal' | 'other';
  note_date: string; // Date in YYYY-MM-DD format
  color?: string;
  is_yearly_recurring: boolean;
  reminder_time?: string; // Time in HH:MM format
  created_at: string;
  updated_at: string;
}

export interface PomodoroStats {
  totalSessions: number;
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  completedSessions: number;
  todaysSessions: number;
  weeklyStats: {
    date: string;
    sessions: number;
  }[];
}

// ===========================
// TODO SERVICE
// ===========================

export class TodoService {
  static async getTodos(filters?: {
    completed?: boolean;
    priority?: string;
    category?: string;
    search?: string;
  }): Promise<Todo[]> {
    let query = supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.completed !== undefined) {
      query = query.eq('completed', filters.completed);
    }

    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static async createTodo(todo: Omit<Todo, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'completed_at'>): Promise<Todo> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('todos')
      .insert({
        ...todo,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTodo(id: string, updates: Partial<Todo>): Promise<Todo> {
    const { data, error } = await supabase
      .from('todos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteTodo(id: string): Promise<void> {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('todos')
      .select('category')
      .not('category', 'is', null);

    if (error) throw error;

    const categories = [...new Set(data?.map(item => item.category) || [])];
    return categories.length > 0 ? categories : ['general', 'work', 'personal'];
  }

  static async getTodoStats(): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  }> {
    const { data: todos, error } = await supabase
      .from('todos')
      .select('completed, due_date');

    if (error) throw error;

    const now = new Date();
    const total = todos?.length || 0;
    const completed = todos?.filter(t => t.completed).length || 0;
    const pending = total - completed;
    const overdue = todos?.filter(t => 
      !t.completed && t.due_date && new Date(t.due_date) < now
    ).length || 0;

    return { total, completed, pending, overdue };
  }
}

// ===========================
// NOTES SERVICE
// ===========================

export class NotesService {
  static async getNotes(filters?: {
    category?: string;
    favorite?: boolean;
    archived?: boolean;
    search?: string;
  }): Promise<Note[]> {
    let query = supabase
      .from('notes')
      .select('*')
      .eq('is_archived', filters?.archived || false)
      .order('is_favorite', { ascending: false })
      .order('updated_at', { ascending: false });

    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    if (filters?.favorite !== undefined) {
      query = query.eq('is_favorite', filters.favorite);
    }

    if (filters?.search) {
      query = query.textSearch('title,content', filters.search);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static async createNote(note: Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Note> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('notes')
      .insert({
        ...note,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateNote(id: string, updates: Partial<Note>): Promise<Note> {
    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteNote(id: string): Promise<void> {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('notes')
      .select('category')
      .not('category', 'is', null);

    if (error) throw error;

    const categories = [...new Set(data?.map(item => item.category) || [])];
    return categories.length > 0 ? categories : ['personal', 'work', 'ideas', 'learning'];
  }
}

// ===========================
// POMODORO SERVICE
// ===========================

export class PomodoroService {
  static async createSession(session: Omit<PomodoroSession, 'id' | 'user_id' | 'created_at' | 'completed_at'>): Promise<PomodoroSession> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .insert({
        ...session,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateSession(id: string, updates: Partial<PomodoroSession>): Promise<PomodoroSession> {
    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async completeSession(id: string, actualDuration: number, notes?: string): Promise<PomodoroSession> {
    return this.updateSession(id, {
      completed: true,
      actual_duration_minutes: actualDuration,
      notes
    });
  }

  static async getStats(days: number = 30): Promise<PomodoroStats> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: sessions, error } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    const totalSessions = sessions?.length || 0;
    const completedSessions = sessions?.filter(s => s.completed).length || 0;
    const totalWorkMinutes = sessions?.filter(s => s.session_type === 'work' && s.completed)
      .reduce((acc, s) => acc + (s.actual_duration_minutes || s.duration_minutes), 0) || 0;
    const totalBreakMinutes = sessions?.filter(s => s.session_type !== 'work' && s.completed)
      .reduce((acc, s) => acc + (s.actual_duration_minutes || s.duration_minutes), 0) || 0;

    const today = new Date().toDateString();
    const todaysSessions = sessions?.filter(s => new Date(s.created_at).toDateString() === today).length || 0;

    // Weekly stats
    const weeklyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      const sessionsCount = sessions?.filter(s => 
        new Date(s.created_at).toDateString() === dateStr
      ).length || 0;

      weeklyStats.push({
        date: date.toISOString().split('T')[0],
        sessions: sessionsCount
      });
    }

    return {
      totalSessions,
      totalWorkMinutes,
      totalBreakMinutes,
      completedSessions,
      todaysSessions,
      weeklyStats
    };
  }

  static async getTodaysSessions(): Promise<PomodoroSession[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

// ===========================
// CALENDAR SERVICE
// ===========================

export class CalendarService {
  static async getEvents(startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    let query = supabase
      .from('calendar_events')
      .select('*');

    if (startDate) {
      query = query.gte('start_time', startDate.toISOString());
    }
    
    if (endDate) {
      query = query.lte('start_time', endDate.toISOString());
    }

    const { data, error } = await query.order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async createEvent(event: Omit<CalendarEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<CalendarEvent> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        ...event,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const { data, error } = await supabase
      .from('calendar_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getUpcomingEvents(days: number = 7): Promise<CalendarEvent[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .order('start_time', { ascending: true })
      .limit(10);

    if (error) throw error;
    return data || [];
  }
}

// ===========================
// CALENDAR NOTES SERVICE
// ===========================

export class CalendarNotesService {
  static async getNotes(startDate?: Date, endDate?: Date): Promise<CalendarNote[]> {
    let query = supabase
      .from('calendar_notes')
      .select('*');

    if (startDate) {
      query = query.gte('note_date', startDate.toISOString().split('T')[0]);
    }
    
    if (endDate) {
      query = query.lte('note_date', endDate.toISOString().split('T')[0]);
    }

    const { data, error } = await query.order('note_date', { ascending: true });

    if (error) throw error;
    
    // Handle yearly recurring notes (like birthdays)
    if (data) {
      const currentYear = new Date().getFullYear();
      const expandedNotes: CalendarNote[] = [];
      
      data.forEach(note => {
        expandedNotes.push(note);
        
        // If it's a yearly recurring note, add entries for previous and next year within the date range
        if (note.is_yearly_recurring) {
          const noteDate = new Date(note.note_date);
          
          // Add previous year occurrence
          const prevYear = new Date(noteDate);
          prevYear.setFullYear(currentYear - 1);
          if (!startDate || prevYear >= startDate) {
            if (!endDate || prevYear <= endDate) {
              expandedNotes.push({
                ...note,
                id: `${note.id}_${currentYear - 1}`,
                note_date: prevYear.toISOString().split('T')[0]
              });
            }
          }
          
          // Add next year occurrence
          const nextYear = new Date(noteDate);
          nextYear.setFullYear(currentYear + 1);
          if (!endDate || nextYear <= endDate) {
            if (!startDate || nextYear >= startDate) {
              expandedNotes.push({
                ...note,
                id: `${note.id}_${currentYear + 1}`,
                note_date: nextYear.toISOString().split('T')[0]
              });
            }
          }
        }
      });
      
      return expandedNotes.sort((a, b) => a.note_date.localeCompare(b.note_date));
    }
    
    return [];
  }

  static async createNote(note: Omit<CalendarNote, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<CalendarNote> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('calendar_notes')
      .insert({
        ...note,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateNote(id: string, updates: Partial<CalendarNote>): Promise<CalendarNote> {
    // Handle yearly recurring note IDs
    const actualId = id.includes('_') ? id.split('_')[0] : id;
    
    const { data, error } = await supabase
      .from('calendar_notes')
      .update(updates)
      .eq('id', actualId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteNote(id: string): Promise<void> {
    // Handle yearly recurring note IDs
    const actualId = id.includes('_') ? id.split('_')[0] : id;
    
    const { error } = await supabase
      .from('calendar_notes')
      .delete()
      .eq('id', actualId);

    if (error) throw error;
  }

  static async getNotesForDate(date: Date): Promise<CalendarNote[]> {
    const dateStr = date.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('calendar_notes')
      .select('*')
      .eq('note_date', dateStr);

    if (error) throw error;
    
    let notes = data || [];
    
    // Add yearly recurring notes for this date
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    const { data: recurringData, error: recurringError } = await supabase
      .from('calendar_notes')
      .select('*')
      .eq('is_yearly_recurring', true)
      .like('note_date', `%-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`);
    
    if (!recurringError && recurringData) {
      recurringData.forEach(note => {
        // Only add if it's not already in the results (different year)
        if (!notes.find(n => n.id === note.id)) {
          notes.push({
            ...note,
            id: `${note.id}_${date.getFullYear()}`,
            note_date: dateStr
          });
        }
      });
    }
    
    return notes;
  }
}

export default {
  TodoService,
  NotesService,
  PomodoroService,
  CalendarService,
  CalendarNotesService
};
