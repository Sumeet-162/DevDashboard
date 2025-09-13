import { useState, useEffect } from "react";
import React from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Video,
  Code,
  Coffee,
  Briefcase,
  Star,
  Edit3,
  Trash2,
  Filter,
  List,
  Grid3X3,
  CalendarDays,
  StickyNote,
  Gift,
  Home,
  AlertCircle,
  Bookmark,
  Heart
} from "lucide-react";
import { CalendarService, CalendarEvent, CalendarNotesService, CalendarNote } from "@/lib/productivityService";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CalendarWithTime } from "@/components/ui/calendar-with-time";
import { CalendarWithTimeEnhanced } from "@/components/ui/calendar-with-time-enhanced";

type EventType = 'meeting' | 'call' | 'coding' | 'break' | 'deadline' | 'personal' | 'work';
type NoteType = 'birthday' | 'reminder' | 'work_from_home' | 'holiday' | 'appointment' | 'deadline' | 'personal' | 'other';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  events: CalendarEvent[];
  notes: CalendarNote[];
}

const DevCalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editingNote, setEditingNote] = useState<CalendarNote | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; eventId?: string; noteId?: string }>({ show: false });
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDateEvents, setShowDateEvents] = useState(false);
  
  const [newEvent, setNewEvent] = useState<{
    title: string;
    description: string;
    event_type: EventType;
    date: Date;
    start_time: string;
    end_time: string;
    location: string;
    attendees: string[];
    is_all_day: boolean;
    color: string;
  }>({
    title: '',
    description: '',
    event_type: 'meeting',
    date: new Date(),
    start_time: '12:00',
    end_time: '13:00',
    location: '',
    attendees: [],
    is_all_day: false,
    color: '#3b82f6'
  });

  const [newNote, setNewNote] = useState<{
    title: string;
    content: string;
    note_type: NoteType;
    note_date: Date;
    color: string;
    is_yearly_recurring: boolean;
    reminder_time: string;
  }>({
    title: '',
    content: '',
    note_type: 'personal',
    note_date: new Date(),
    color: '#10b981',
    is_yearly_recurring: false,
    reminder_time: ''
  });

  const [stats, setStats] = useState({
    totalEvents: 0,
    thisWeekEvents: 0,
    todaysEvents: 0,
    upcomingEvents: 0,
    totalNotes: 0
  });

  const eventTypes: Array<{ 
    value: EventType; 
    label: string; 
    icon: React.ComponentType<{ className?: string }>; 
    color: string; 
  }> = [
    { value: 'meeting', label: 'Meeting', icon: Users, color: '#3b82f6' },
    { value: 'call', label: 'Call', icon: Video, color: '#10b981' },
    { value: 'coding', label: 'Coding Session', icon: Code, color: '#8b5cf6' },
    { value: 'break', label: 'Break', icon: Coffee, color: '#f59e0b' },
    { value: 'deadline', label: 'Deadline', icon: Star, color: '#ef4444' },
    { value: 'personal', label: 'Personal', icon: CalendarIcon, color: '#6b7280' },
    { value: 'work', label: 'Work', icon: Briefcase, color: '#0ea5e9' }
  ];

  const noteTypes: Array<{ 
    value: NoteType; 
    label: string; 
    icon: React.ComponentType<{ className?: string }>; 
    color: string; 
  }> = [
    { value: 'birthday', label: 'Birthday', icon: Gift, color: '#f59e0b' },
    { value: 'work_from_home', label: 'Work From Home', icon: Home, color: '#3b82f6' },
    { value: 'reminder', label: 'Reminder', icon: AlertCircle, color: '#ef4444' },
    { value: 'holiday', label: 'Holiday', icon: Star, color: '#10b981' },
    { value: 'appointment', label: 'Appointment', icon: Clock, color: '#8b5cf6' },
    { value: 'deadline', label: 'Deadline', icon: Bookmark, color: '#dc2626' },
    { value: 'personal', label: 'Personal', icon: Heart, color: '#ec4899' },
    { value: 'other', label: 'Other', icon: StickyNote, color: '#6b7280' }
  ];

  const colors = [
    '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280', '#0ea5e9',
    '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#a855f7', '#06b6d4'
  ];

  useEffect(() => {
    loadEvents();
    loadNotes();
  }, [currentDate]);

  useEffect(() => {
    if (events.length >= 0 || notes.length >= 0) { // Generate calendar days when events or notes change
      generateCalendarDays();
    }
  }, [events, notes, currentDate]);

  useEffect(() => {
    filterEvents();
  }, [events, selectedEventType]);

  const loadEvents = async () => {
    try {
      const data = await CalendarService.getEvents();
      setEvents(data);
      
      // Calculate stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const stats = {
        totalEvents: data.length,
        thisWeekEvents: data.filter(e => {
          const eventDate = new Date(e.start_time);
          return eventDate >= weekStart && eventDate <= weekEnd;
        }).length,
        todaysEvents: data.filter(e => {
          const eventDate = new Date(e.start_time);
          return eventDate.toDateString() === today.toDateString();
        }).length,
        upcomingEvents: data.filter(e => {
          const eventDate = new Date(e.start_time);
          return eventDate > now;
        }).length,
        totalNotes: 0 // Will be updated by loadNotes
      };
      setStats(prevStats => ({ ...prevStats, ...stats }));
      
      // Regenerate calendar days with new events
      generateCalendarDays();
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadNotes = async () => {
    try {
      const data = await CalendarNotesService.getNotes();
      setNotes(data);
      
      // Update stats with notes count
      setStats(prevStats => ({
        ...prevStats,
        totalNotes: data.length
      }));
      
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const filterEvents = () => {
    const filtered = selectedEventType === 'all' 
      ? events 
      : events.filter(event => event.event_type === selectedEventType);
    setFilteredEvents(filtered);
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.start_time);
        return eventDate.toDateString() === date.toDateString();
      });

      const dayNotes = notes.filter(note => {
        const targetDateStr = formatDateForDatabase(date);
        return note.note_date === targetDateStr;
      });
      
      days.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6, // Sunday = 0, Saturday = 6
        events: dayEvents,
        notes: dayNotes
      });
    }
    
    setCalendarDays(days);
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !editingEvent.title.trim()) return;
    
    try {
      await CalendarService.updateEvent(editingEvent.id, {
        title: editingEvent.title,
        description: editingEvent.description,
        event_type: editingEvent.event_type,
        start_time: editingEvent.start_time,
        end_time: editingEvent.end_time,
        location: editingEvent.location,
        attendees: editingEvent.attendees,
        is_all_day: editingEvent.is_all_day,
        color: editingEvent.color
      });
      
      setEditingEvent(null);
      loadEvents();
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  // Helper function to extract date and time from datetime string
  const extractDateAndTime = (datetimeString: string) => {
    const date = new Date(datetimeString);
    return {
      date: date,
      time: date.toTimeString().slice(0, 5) // HH:MM format
    };
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await CalendarService.deleteEvent(eventId);
      setDeleteConfirm({ show: false });
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await CalendarNotesService.deleteNote(noteId);
      setDeleteConfirm({ show: false });
      loadNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  // Helper function to format date without timezone conversion
  const formatDateForDatabase = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleCreateNote = async () => {
    if (!newNote.title.trim() || !selectedDate) return;

    try {
      await CalendarNotesService.createNote({
        title: newNote.title,
        content: newNote.content,
        note_type: newNote.note_type,
        note_date: formatDateForDatabase(selectedDate),
        color: newNote.color,
        is_yearly_recurring: newNote.is_yearly_recurring,
        reminder_time: newNote.reminder_time || undefined
      });

      // Reset form
      setNewNote({
        title: '',
        content: '',
        note_type: 'personal',
        note_date: selectedDate,
        color: '#10b981',
        is_yearly_recurring: false,
        reminder_time: ''
      });
      
      setShowNoteForm(false);
      loadNotes();
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote || !editingNote.title.trim()) return;
    
    try {
      await CalendarNotesService.updateNote(editingNote.id, {
        title: editingNote.title,
        content: editingNote.content,
        note_type: editingNote.note_type,
        color: editingNote.color,
        is_yearly_recurring: editingNote.is_yearly_recurring,
        reminder_time: editingNote.reminder_time
      });
      
      setEditingNote(null);
      loadNotes();
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getEventTypeIcon = (type: string) => {
    const eventType = eventTypes.find(t => t.value === type);
    return eventType ? eventType.icon : CalendarIcon;
  };

  const getEventTypeColor = (type: string) => {
    const eventType = eventTypes.find(t => t.value === type);
    return eventType ? eventType.color : '#3b82f6';
  };

  const getNoteTypeIcon = (type: string) => {
    const noteType = noteTypes.find(t => t.value === type);
    return noteType ? noteType.icon : StickyNote;
  };

  const getNoteTypeColor = (type: string) => {
    const noteType = noteTypes.find(t => t.value === type);
    return noteType ? noteType.color : '#10b981';
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return events
      .filter(event => new Date(event.start_time) > now)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 5);
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate.toDateString() === date.toDateString();
    }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  };

  const getNotesForDate = (date: Date) => {
    const targetDateStr = formatDateForDatabase(date);
    return notes.filter(note => {
      return note.note_date === targetDateStr;
    }).sort((a, b) => a.title.localeCompare(b.title));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowDateEvents(true);
    setNewEvent(prev => ({ 
      ...prev, 
      date: date,
      start_time: '09:00',
      end_time: '10:00'
    }));
    
    setNewNote(prev => ({
      ...prev,
      note_date: date
    }));
    
    // Auto-scroll to selected date events section
    setTimeout(() => {
      const eventsSection = document.getElementById('selected-date-events');
      if (eventsSection) {
        eventsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleQuickEventCreate = async () => {
    if (!newEvent.title.trim() || !selectedDate) return;
    
    try {
      // Combine selected date and time into ISO string
      const startDateTime = new Date(selectedDate);
      const [startHours, startMinutes] = newEvent.start_time.split(':').map(Number);
      startDateTime.setHours(startHours, startMinutes, 0, 0);
      
      const endDateTime = new Date(selectedDate);
      const [endHours, endMinutes] = newEvent.end_time.split(':').map(Number);
      endDateTime.setHours(endHours, endMinutes, 0, 0);
      
      // If end time is before start time, assume it's the next day
      if (endDateTime <= startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }
      
      await CalendarService.createEvent({
        title: newEvent.title,
        description: newEvent.description,
        event_type: newEvent.event_type,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        location: newEvent.location,
        attendees: newEvent.attendees,
        is_all_day: newEvent.is_all_day,
        color: newEvent.color
      });
      
      // Reset form but keep selected date
      setNewEvent(prev => ({
        title: '',
        description: '',
        event_type: 'meeting',
        date: selectedDate,
        start_time: '09:00',
        end_time: '10:00',
        location: '',
        attendees: [],
        is_all_day: false,
        color: '#3b82f6'
      }));
      
      loadEvents();
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <Layout>
      <div className="p-0 md:p-6 space-y-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between px-3 sm:px-0">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold text-card-foreground">Dev Calendar</h1>
            <p className="text-muted-foreground mt-1 text-base">Click any date to view events or add new ones</p>
          </div>
          <div className="flex items-center justify-center gap-2 sm:justify-end">
            <Select value={viewMode} onValueChange={(value: 'month' | 'week' | 'agenda') => setViewMode(value)}>
              <SelectTrigger className="w-32 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">
                  <div className="flex items-center gap-2">
                    <Grid3X3 className="h-4 w-4" />
                    Month
                  </div>
                </SelectItem>
                <SelectItem value="agenda">
                  <div className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    Agenda
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Event Types Filter */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Filter className="h-4 w-4" />
                  Event Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant={selectedEventType === 'all' ? 'default' : 'ghost'}
                    onClick={() => setSelectedEventType('all')}
                    className="w-full justify-start"
                  >
                    All Events
                  </Button>
                  {eventTypes.map(type => {
                    const Icon = type.icon;
                    const count = events.filter(e => e.event_type === type.value).length;
                    return (
                      <Button
                        key={type.value}
                        variant={selectedEventType === type.value ? 'default' : 'ghost'}
                        onClick={() => setSelectedEventType(type.value)}
                        className="w-full justify-between p-2 h-auto"
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: type.color }}
                          />
                          <Icon className="h-4 w-4" />
                          <span className="text-sm">{type.label}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {count}
                        </Badge>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                {getUpcomingEvents().length === 0 ? (
                  <div className="text-center py-4">
                    <CalendarIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No upcoming events</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getUpcomingEvents().map(event => {
                      const Icon = getEventTypeIcon(event.event_type);
                      return (
                        <div key={event.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50">
                          <div 
                            className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                            style={{ backgroundColor: event.color || getEventTypeColor(event.event_type) }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate">{event.title}</h4>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Icon className="h-3 w-3" />
                              <span>{formatTime(event.start_time)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(event.start_time).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {viewMode === 'month' && (
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex flex-col space-y-3 lg:flex-row lg:space-y-0 lg:items-center lg:justify-between">
                    <CardTitle className="flex items-center justify-center lg:justify-start gap-2 text-xl font-semibold">
                      <CalendarIcon className="h-5 w-5" />
                      {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </CardTitle>
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')} className="h-9 w-9 p-0">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="h-9 px-4">
                        Today
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigateMonth('next')} className="h-9 w-9 p-0">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Weekend Legend */}
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-red-100 dark:bg-red-950/20 border border-red-200 dark:border-red-800"></div>
                      <span>Weekend/Public Holiday</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-3 sm:mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                      <div 
                        key={day} 
                        className={`p-1 sm:p-2 text-center text-xs sm:text-sm font-medium ${
                          index === 0 || index === 6 
                            ? 'text-red-600 dark:text-red-400 font-semibold' // Weekend styling
                            : 'text-muted-foreground'
                        }`}
                      >
                        <span className="hidden sm:inline">{day}</span>
                        <span className="sm:hidden">{day.charAt(0)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                    {calendarDays.map((day, index) => (
                      <div
                        key={index}
                        className={`
                          min-h-[60px] sm:min-h-[100px] p-1 sm:p-2 border rounded cursor-pointer transition-colors
                          ${day.isCurrentMonth 
                            ? (day.isWeekend 
                                ? 'bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30' 
                                : 'bg-background hover:bg-muted/50'
                              )
                            : (day.isWeekend 
                                ? 'bg-red-100/50 dark:bg-red-950/10 text-muted-foreground hover:bg-red-200/50 dark:hover:bg-red-900/20' 
                                : 'bg-muted/20 text-muted-foreground hover:bg-muted/30'
                              )
                          }
                          ${day.isToday ? 'ring-1 sm:ring-2 ring-primary' : ''}
                        `}
                        onClick={() => handleDateClick(day.date)}
                      >
                        <div className={`text-xs sm:text-sm mb-1 ${
                          day.isToday 
                            ? 'font-bold text-primary' 
                            : day.isWeekend 
                              ? 'font-semibold text-red-700 dark:text-red-300'
                              : ''
                        }`}>
                          {day.date.getDate()}
                        </div>
                        <div className="space-y-1 sm:space-y-1.5">
                          {/* Show events */}
                          {day.events.slice(0, 1).map(event => (
                            <div
                              key={event.id}
                              className="group text-xs p-1 sm:p-1.5 rounded-md cursor-pointer transition-all duration-200 hover:shadow-sm hover:scale-105 font-medium"
                              style={{ 
                                backgroundColor: event.color || getEventTypeColor(event.event_type),
                                color: 'white'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingEvent(event);
                              }}
                            >
                              <div className="flex items-center gap-1 truncate">
                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                <span className="truncate">{event.title}</span>
                              </div>
                            </div>
                          ))}
                          
                          {/* Show notes */}
                          {day.notes.slice(0, day.events.length > 0 ? 1 : 2).map(note => (
                            <div
                              key={note.id}
                              className="group text-xs p-1 sm:p-1.5 rounded-md cursor-pointer transition-all duration-200 hover:shadow-sm hover:scale-105 font-medium border-2"
                              style={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                color: note.color || getNoteTypeColor(note.note_type),
                                borderColor: note.color || getNoteTypeColor(note.note_type)
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingNote(note);
                              }}
                            >
                              <div className="flex items-center gap-1 truncate">
                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                <span className="truncate">{note.title}</span>
                                {note.is_yearly_recurring && (
                                  <svg className="w-2.5 h-2.5 flex-shrink-0 opacity-70" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          {(day.events.length + day.notes.length) > 2 && (
                            <div className="text-xs text-muted-foreground font-medium bg-muted/50 px-2 py-1 rounded-md text-center">
                              +{(day.events.length + day.notes.length) - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selected Date Events - MS Teams Style */}
            {selectedDate && showDateEvents && (
              <Card id="selected-date-events">
                <CardHeader>
                  <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <CalendarDays className="h-5 w-5" />
                      Events for {selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowDateEvents(false);
                        setSelectedDate(null);
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Existing Events for Selected Date */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                            <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          Scheduled Events
                        </h3>
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                          {getEventsForDate(selectedDate).length} events
                        </Badge>
                      </div>
                      
                      {getEventsForDate(selectedDate).length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-muted-foreground/30 rounded-xl bg-muted/20">
                          <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                          <p className="text-sm font-medium text-muted-foreground mb-1">No events scheduled</p>
                          <p className="text-xs text-muted-foreground">Create your first event below</p>
                        </div>
                      ) : (
                        getEventsForDate(selectedDate).map(event => {
                          const Icon = getEventTypeIcon(event.event_type);
                          const isPast = new Date(event.start_time) < new Date();
                          
                          return (
                            <Card key={event.id} className={`group hover:shadow-lg transition-all duration-200 border-l-4 ${isPast ? 'opacity-70' : ''}`} 
                                  style={{ borderLeftColor: event.color || getEventTypeColor(event.event_type) }}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-muted" style={{ color: event.color || getEventTypeColor(event.event_type) }}>
                                      <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-base text-foreground leading-tight">{event.title}</h4>
                                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                        <div className="flex items-center gap-1.5">
                                          <Clock className="h-4 w-4" />
                                          <span className="font-medium">
                                            {formatTime(event.start_time)} - {formatTime(event.end_time)}
                                          </span>
                                        </div>
                                        <Badge variant="secondary" className="text-xs font-medium">
                                          {event.event_type.replace('_', ' ')}
                                        </Badge>
                                      </div>
                                      
                                      {event.description && (
                                        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                                          {event.description}
                                        </p>
                                      )}
                                      
                                      {event.location && (
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                                          <MapPin className="h-4 w-4" />
                                          <span>{event.location}</span>
                                        </div>
                                      )}
                                      
                                      {event.attendees.length > 0 && (
                                        <div className="flex items-center gap-2 mt-3">
                                          <Users className="h-4 w-4 text-muted-foreground" />
                                          <div className="flex flex-wrap gap-1">
                                            {event.attendees.slice(0, 3).map((attendee, index) => (
                                              <Badge key={index} variant="outline" className="text-xs">
                                                {attendee}
                                              </Badge>
                                            ))}
                                            {event.attendees.length > 3 && (
                                              <Badge variant="outline" className="text-xs">
                                                +{event.attendees.length - 3} more
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditingEvent(event)}
                                      className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/50"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDeleteConfirm({ show: true, eventId: event.id })}
                                      className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 text-red-600 dark:hover:bg-red-900/50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </div>

                    {/* Existing Notes for Selected Date */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                            <StickyNote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          Notes & Reminders
                        </h3>
                        <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                          {getNotesForDate(selectedDate).length} notes
                        </Badge>
                      </div>
                      
                      {getNotesForDate(selectedDate).length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-muted-foreground/30 rounded-xl bg-muted/20">
                          <StickyNote className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                          <p className="text-sm font-medium text-muted-foreground mb-1">No notes for this day</p>
                          <p className="text-xs text-muted-foreground">Add personal reminders below</p>
                        </div>
                      ) : (
                        getNotesForDate(selectedDate).map(note => {
                          const Icon = getNoteTypeIcon(note.note_type);
                          
                          return (
                            <Card key={note.id} className="group hover:shadow-lg transition-all duration-200 border-l-4" 
                                  style={{ borderLeftColor: note.color || getNoteTypeColor(note.note_type) }}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-muted" style={{ color: note.color || getNoteTypeColor(note.note_type) }}>
                                      <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-base text-foreground leading-tight">{note.title}</h4>
                                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2 flex-wrap">
                                        <Badge variant="secondary" className="text-xs font-medium">
                                          {note.note_type.replace('_', ' ')}
                                        </Badge>
                                        {note.is_yearly_recurring && (
                                          <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                            </svg>
                                            Yearly
                                          </Badge>
                                        )}
                                        {note.reminder_time && (
                                          <span className="text-xs flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                                            <Clock className="h-3 w-3" />
                                            {note.reminder_time}
                                          </span>
                                        )}
                                      </div>
                                      
                                      {note.content && (
                                        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                                          {note.content}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditingNote(note)}
                                      className="h-8 w-8 p-0 hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-900/50"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDeleteConfirm({ show: true, noteId: note.id })}
                                      className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 text-red-600 dark:hover:bg-red-900/50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </div>

                    {/* Quick Add Note Form */}
                    <Card className="overflow-hidden border-2 border-dashed border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50">
                      <CardHeader className="pb-4 bg-gradient-to-r from-emerald-100/50 to-green-100/50 dark:from-emerald-900/20 dark:to-green-900/20">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-xl font-semibold flex items-center gap-2">
                              <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <StickyNote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              Add Personal Note
                            </CardTitle>
                            <p className="text-sm text-muted-foreground font-medium">
                              Create a reminder, birthday note, or personal memo for {selectedDate.toLocaleDateString('en-US', { 
                                weekday: 'long',
                                month: 'long', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowNoteForm(!showNoteForm)}
                            className="h-8 w-8 p-0 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                          >
                            {showNoteForm ? (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      
                      {showNoteForm && (
                        <CardContent className="space-y-6 pt-0">
                          {/* Primary Note Details */}
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div className="space-y-2 lg:col-span-1">
                                <label className="text-sm font-semibold text-foreground">Note Title</label>
                                <Input
                                  placeholder="e.g., Mom's Birthday, WFH Day, Doctor Appointment"
                                  value={newNote.title}
                                  onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                                  className="h-11 border-emerald-200 dark:border-emerald-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground">Note Type</label>
                                <Select 
                                  value={newNote.note_type} 
                                  onValueChange={(value: NoteType) => setNewNote(prev => ({ ...prev, note_type: value }))}
                                >
                                  <SelectTrigger className="h-11 border-emerald-200 dark:border-emerald-800 focus:border-emerald-500">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {noteTypes.map(type => {
                                      const Icon = type.icon;
                                      return (
                                        <SelectItem key={type.value} value={type.value}>
                                          <div className="flex items-center gap-3">
                                            <div className="p-1 rounded" style={{ backgroundColor: `${type.color}20`, color: type.color }}>
                                              <Icon className="h-4 w-4" />
                                            </div>
                                            <span className="font-medium">{type.label}</span>
                                          </div>
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Note Content */}
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-foreground">Additional Details</label>
                              <Textarea
                                placeholder="Add any additional details or context for this note..."
                                value={newNote.content}
                                onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                                rows={3}
                                className="resize-none border-emerald-200 dark:border-emerald-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                              />
                            </div>
                          </div>

                          {/* Note Options */}
                          <div className="space-y-4 pt-2 border-t border-emerald-200 dark:border-emerald-800/50">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <label className="text-sm font-semibold text-foreground">Options</label>
                                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                  <input
                                    type="checkbox"
                                    id="yearly-recurring"
                                    checked={newNote.is_yearly_recurring}
                                    onChange={(e) => setNewNote(prev => ({ ...prev, is_yearly_recurring: e.target.checked }))}
                                    className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                                  />
                                  <label htmlFor="yearly-recurring" className="text-sm font-medium text-foreground">
                                    📅 Repeat yearly (perfect for birthdays & anniversaries)
                                  </label>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground">Reminder Time</label>
                                <Input
                                  type="time"
                                  placeholder="Optional reminder time"
                                  value={newNote.reminder_time}
                                  onChange={(e) => setNewNote(prev => ({ ...prev, reminder_time: e.target.value }))}
                                  className="h-11 border-emerald-200 dark:border-emerald-800 focus:border-emerald-500"
                                />
                              </div>
                            </div>

                            {/* Color Selection */}
                            <div className="space-y-3">
                              <label className="text-sm font-semibold text-foreground">Color Theme</label>
                              <div className="flex flex-wrap gap-3">
                                {colors.slice(0, 10).map(color => (
                                  <button
                                    key={color}
                                    className={`group relative w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 hover:shadow-lg ${
                                      newNote.color === color 
                                        ? 'border-foreground shadow-md ring-2 ring-offset-2 ring-current' 
                                        : 'border-muted-foreground/30 hover:border-foreground/50'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setNewNote(prev => ({ ...prev, color }))}
                                  >
                                    {newNote.color === color && (
                                      <svg className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-emerald-200 dark:border-emerald-800/50">
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setNewNote({
                                  title: '',
                                  content: '',
                                  note_type: 'personal',
                                  note_date: selectedDate,
                                  color: '#10b981',
                                  is_yearly_recurring: false,
                                  reminder_time: ''
                                });
                                setShowNoteForm(false);
                              }}
                              className="flex-1 sm:flex-initial border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-950/50"
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleCreateNote} 
                              disabled={!newNote.title.trim()}
                              className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              <StickyNote className="h-4 w-4 mr-2" />
                              Create Note
                            </Button>
                          </div>
                        </CardContent>
                      )}
                    </Card>

                    {/* Quick Add Event Form */}
                    <Card className="overflow-hidden border-2 border-dashed border-primary/30 dark:border-primary/20 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                      <CardHeader className="pb-4 bg-gradient-to-r from-blue-100/50 to-indigo-100/50 dark:from-blue-900/20 dark:to-indigo-900/20">
                        <div className="space-y-1">
                          <CardTitle className="text-xl font-semibold flex items-center gap-2">
                            <div className="p-2 bg-primary/20 rounded-lg">
                              <CalendarIcon className="h-5 w-5 text-primary" />
                            </div>
                            Schedule New Event
                          </CardTitle>
                          <p className="text-sm text-muted-foreground font-medium">
                            Create a new event for {selectedDate.toLocaleDateString('en-US', { 
                              weekday: 'long',
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-6 pt-0">
                        {/* Primary Event Details */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-2 lg:col-span-1">
                              <label className="text-sm font-semibold text-foreground">Event Title</label>
                              <Input
                                placeholder="e.g., Team Standup, Client Call, Code Review"
                                value={newEvent.title}
                                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                                className="h-11 border-primary/20 focus:border-primary focus:ring-primary/20"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-foreground">Event Type</label>
                              <Select 
                                value={newEvent.event_type} 
                                onValueChange={(value: EventType) => setNewEvent(prev => ({ ...prev, event_type: value }))}
                              >
                                <SelectTrigger className="h-11 border-primary/20 focus:border-primary">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {eventTypes.map(type => {
                                    const Icon = type.icon;
                                    return (
                                      <SelectItem key={type.value} value={type.value}>
                                        <div className="flex items-center gap-3">
                                          <div className="p-1 rounded" style={{ backgroundColor: `${type.color}20`, color: type.color }}>
                                            <Icon className="h-4 w-4" />
                                          </div>
                                          <span className="font-medium">{type.label}</span>
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Time Selection */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                Start Time
                              </label>
                              <Input
                                type="time"
                                value={newEvent.start_time}
                                onChange={(e) => setNewEvent(prev => ({ ...prev, start_time: e.target.value }))}
                                className="h-11 border-primary/20 focus:border-primary"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                End Time
                              </label>
                              <Input
                                type="time"
                                value={newEvent.end_time}
                                onChange={(e) => setNewEvent(prev => ({ ...prev, end_time: e.target.value }))}
                                className="h-11 border-primary/20 focus:border-primary"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Optional Event Details */}
                        <div className="space-y-4 pt-2 border-t border-primary/20">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-foreground">Description</label>
                              <Textarea
                                placeholder="Add agenda items, meeting notes, or event details..."
                                value={newEvent.description}
                                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                                className="resize-none border-primary/20 focus:border-primary focus:ring-primary/20"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                Location
                              </label>
                              <Input
                                placeholder="e.g., Conference Room A, Zoom, Office 3rd Floor"
                                value={newEvent.location}
                                onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                                className="h-11 border-primary/20 focus:border-primary"
                              />
                            </div>

                            {/* Color Selection */}
                            <div className="space-y-3">
                              <label className="text-sm font-semibold text-foreground">Color Theme</label>
                              <div className="flex flex-wrap gap-3">
                                {colors.slice(0, 10).map(color => (
                                  <button
                                    key={color}
                                    className={`group relative w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 hover:shadow-lg ${
                                      newEvent.color === color 
                                        ? 'border-foreground shadow-md ring-2 ring-offset-2 ring-current' 
                                        : 'border-muted-foreground/30 hover:border-foreground/50'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setNewEvent(prev => ({ ...prev, color }))}
                                  >
                                    {newEvent.color === color && (
                                      <svg className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-primary/20">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setNewEvent(prev => ({
                                title: '',
                                description: '',
                                event_type: 'meeting',
                                date: selectedDate,
                                start_time: '09:00',
                                end_time: '10:00',
                                location: '',
                                attendees: [],
                                is_all_day: false,
                                color: '#3b82f6'
                              }));
                            }}
                            className="flex-1 sm:flex-initial border-primary/20 hover:bg-blue-50 hover:border-primary/30 dark:hover:bg-blue-950/50"
                          >
                            Reset Form
                          </Button>
                          <Button 
                            onClick={handleQuickEventCreate} 
                            disabled={!newEvent.title.trim()}
                            className="flex-1 sm:flex-initial bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            Create Event
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            )}

            {viewMode === 'agenda' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <List className="h-5 w-5" />
                    Event Agenda
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredEvents.length === 0 ? (
                    <div className="text-center py-12">
                      <CalendarDays className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No events found</h3>
                      <p className="text-muted-foreground mb-4">
                        {selectedEventType === 'all' 
                          ? "You don't have any events scheduled. Click on any date above to add your first event!"
                          : `No ${eventTypes.find(t => t.value === selectedEventType)?.label.toLowerCase()} events found. Try selecting a different filter or click on a date to add events.`
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredEvents
                        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                        .map(event => {
                          const Icon = getEventTypeIcon(event.event_type);
                          const isPast = new Date(event.start_time) < new Date();
                          
                          return (
                            <Card key={event.id} className={`${isPast ? 'opacity-60' : ''}`}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-start gap-3">
                                    <div 
                                      className="w-4 h-4 rounded-full mt-1"
                                      style={{ backgroundColor: event.color || getEventTypeColor(event.event_type) }}
                                    />
                                    <div>
                                      <h4 className="font-semibold">{event.title}</h4>
                                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                        <div className="flex items-center gap-1">
                                          <Icon className="h-4 w-4" />
                                          <span className="capitalize">{event.event_type.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-4 w-4" />
                                          <span>
                                            {formatTime(event.start_time)} - {formatTime(event.end_time)}
                                          </span>
                                        </div>
                                        {event.location && (
                                          <div className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            <span>{event.location}</span>
                                          </div>
                                        )}
                                      </div>
                                      <p className="text-sm font-medium text-muted-foreground mt-1">
                                        {formatDate(event.start_time)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditingEvent(event)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDeleteConfirm({ show: true, eventId: event.id })}
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                
                                {event.description && (
                                  <p className="text-sm text-muted-foreground mb-3">
                                    {event.description}
                                  </p>
                                )}
                                
                                {event.attendees.length > 0 && (
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex flex-wrap gap-1">
                                      {event.attendees.map((attendee, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                          {attendee}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Edit Event Modal */}
        {editingEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Edit Event</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Event Details */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        placeholder="Event title..."
                        value={editingEvent.title}
                        onChange={(e) => setEditingEvent(prev => prev ? { ...prev, title: e.target.value } : null)}
                      />
                      <Select 
                        value={editingEvent.event_type} 
                        onValueChange={(value: EventType) => setEditingEvent(prev => prev ? { ...prev, event_type: value } : null)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {eventTypes.map(type => {
                            const Icon = type.icon;
                            return (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  {type.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Textarea
                      placeholder="Event description..."
                      value={editingEvent.description}
                      onChange={(e) => setEditingEvent(prev => prev ? { ...prev, description: e.target.value } : null)}
                      rows={3}
                    />
                    
                    <Input
                      placeholder="Location (optional)..."
                      value={editingEvent.location || ''}
                      onChange={(e) => setEditingEvent(prev => prev ? { ...prev, location: e.target.value } : null)}
                    />
                    
                    <div>
                      <label className="text-sm font-medium">Color</label>
                      <div className="flex gap-2 mt-2">
                        {colors.map(color => (
                          <button
                            key={color}
                            className={`w-6 h-6 rounded-full border-2 ${editingEvent.color === color ? 'border-foreground' : 'border-muted'}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setEditingEvent(prev => prev ? { ...prev, color } : null)}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setEditingEvent(null)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateEvent}>
                        Update Event
                      </Button>
                    </div>
                  </div>
                  
                  {/* Date and Time Picker */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Edit Date & Time</label>
                    <CalendarWithTimeEnhanced
                      date={new Date(editingEvent.start_time)}
                      onDateSelect={(date) => {
                        if (!date || !editingEvent) return;
                        
                        // Update both start and end times with new date
                        const startTime = extractDateAndTime(editingEvent.start_time);
                        const endTime = extractDateAndTime(editingEvent.end_time);
                        
                        const newStartDateTime = new Date(date);
                        const [startHours, startMinutes] = startTime.time.split(':').map(Number);
                        newStartDateTime.setHours(startHours, startMinutes, 0, 0);
                        
                        const newEndDateTime = new Date(date);
                        const [endHours, endMinutes] = endTime.time.split(':').map(Number);
                        newEndDateTime.setHours(endHours, endMinutes, 0, 0);
                        
                        setEditingEvent(prev => prev ? {
                          ...prev,
                          start_time: newStartDateTime.toISOString(),
                          end_time: newEndDateTime.toISOString()
                        } : null);
                      }}
                      startTime={extractDateAndTime(editingEvent.start_time).time}
                      endTime={extractDateAndTime(editingEvent.end_time).time}
                      onStartTimeChange={(time) => {
                        if (!editingEvent) return;
                        const date = new Date(editingEvent.start_time);
                        const [hours, minutes] = time.split(':').map(Number);
                        date.setHours(hours, minutes, 0, 0);
                        setEditingEvent(prev => prev ? {
                          ...prev,
                          start_time: date.toISOString()
                        } : null);
                      }}
                      onEndTimeChange={(time) => {
                        if (!editingEvent) return;
                        const date = new Date(editingEvent.end_time);
                        const [hours, minutes] = time.split(':').map(Number);
                        date.setHours(hours, minutes, 0, 0);
                        setEditingEvent(prev => prev ? {
                          ...prev,
                          end_time: date.toISOString()
                        } : null);
                      }}
                      showTimeInputs={true}
                      showEndTime={true}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Note Modal */}
        {editingNote && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Edit Note</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Note Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Note title..."
                      value={editingNote.title}
                      onChange={(e) => setEditingNote(prev => prev ? { ...prev, title: e.target.value } : null)}
                    />
                    <Select 
                      value={editingNote.note_type} 
                      onValueChange={(value: NoteType) => setEditingNote(prev => prev ? { ...prev, note_type: value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {noteTypes.map(type => {
                          const Icon = type.icon;
                          return (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Optional Details */}
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Note details..."
                      value={editingNote.content || ''}
                      onChange={(e) => setEditingNote(prev => prev ? { ...prev, content: e.target.value } : null)}
                      rows={3}
                    />
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="edit-yearly-recurring"
                          checked={editingNote.is_yearly_recurring}
                          onChange={(e) => setEditingNote(prev => prev ? { ...prev, is_yearly_recurring: e.target.checked } : null)}
                          className="rounded"
                        />
                        <label htmlFor="edit-yearly-recurring" className="text-sm">
                          Repeat yearly
                        </label>
                      </div>
                      
                      <Input
                        type="time"
                        placeholder="Reminder time"
                        value={editingNote.reminder_time || ''}
                        onChange={(e) => setEditingNote(prev => prev ? { ...prev, reminder_time: e.target.value } : null)}
                        className="w-32"
                      />
                    </div>

                    {/* Color Picker */}
                    <div>
                      <label className="text-sm font-medium">Color</label>
                      <div className="flex gap-2 mt-2">
                        {colors.slice(0, 8).map(color => (
                          <button
                            key={color}
                            className={`w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform ${editingNote.color === color ? 'border-foreground shadow-md' : 'border-muted-foreground/20'}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setEditingNote(prev => prev ? { ...prev, color } : null)}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setEditingNote(null)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateNote}>
                        Update Note
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={deleteConfirm.show}
          onClose={() => setDeleteConfirm({ show: false })}
          onConfirm={() => {
            if (deleteConfirm.eventId) {
              handleDeleteEvent(deleteConfirm.eventId);
            } else if (deleteConfirm.noteId) {
              handleDeleteNote(deleteConfirm.noteId);
            }
          }}
          title={deleteConfirm.eventId ? "Delete Event" : "Delete Note"}
          description={`Are you sure you want to delete this ${deleteConfirm.eventId ? 'event' : 'note'}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />
      </div>
    </Layout>
  );
};

export default DevCalendarPage;
