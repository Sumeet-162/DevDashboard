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
  CalendarDays
} from "lucide-react";
import { CalendarService, CalendarEvent } from "@/lib/productivityService";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CalendarWithTime } from "@/components/ui/calendar-with-time";

type EventType = 'meeting' | 'call' | 'coding' | 'break' | 'deadline' | 'personal' | 'work';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

const DevCalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; eventId?: string }>({ show: false });
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
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

  const [stats, setStats] = useState({
    totalEvents: 0,
    thisWeekEvents: 0,
    todaysEvents: 0,
    upcomingEvents: 0
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

  const colors = [
    '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280', '#0ea5e9',
    '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#a855f7', '#06b6d4'
  ];

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  useEffect(() => {
    if (events.length >= 0) { // Generate calendar days when events change
      generateCalendarDays();
    }
  }, [events, currentDate]);

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
        }).length
      };
      setStats(stats);
      
      // Regenerate calendar days with new events
      generateCalendarDays();
    } catch (error) {
      console.error('Error loading events:', error);
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
      
      days.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        events: dayEvents
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

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowDateEvents(true);
    setNewEvent(prev => ({ 
      ...prev, 
      date: date,
      start_time: '09:00',
      end_time: '10:00'
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
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between px-3 sm:px-0">
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-3xl font-bold text-card-foreground">Dev Calendar</h1>
            <p className="text-muted-foreground mt-1 text-xs sm:text-base">Click any date to view events or add new ones</p>
          </div>
          <div className="flex items-center justify-center gap-2 sm:justify-end">
            <Select value={viewMode} onValueChange={(value: 'month' | 'week' | 'agenda') => setViewMode(value)}>
              <SelectTrigger className="w-28 sm:w-32 h-8 sm:h-10 text-xs sm:text-sm">
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
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Today</span>
                  <Badge variant="outline">{stats.todaysEvents}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">This Week</span>
                  <Badge variant="outline">{stats.thisWeekEvents}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Upcoming</span>
                  <Badge variant="outline">{stats.upcomingEvents}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <Badge variant="outline">{stats.totalEvents}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
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
              <CardHeader>
                <CardTitle className="text-base">Upcoming Events</CardTitle>
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
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-3 sm:mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-muted-foreground">
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
                          ${day.isCurrentMonth ? 'bg-background hover:bg-muted/50' : 'bg-muted/20 text-muted-foreground hover:bg-muted/30'}
                          ${day.isToday ? 'ring-1 sm:ring-2 ring-primary' : ''}
                        `}
                        onClick={() => handleDateClick(day.date)}
                      >
                        <div className={`text-xs sm:text-sm mb-1 ${day.isToday ? 'font-bold text-primary' : ''}`}>
                          {day.date.getDate()}
                        </div>
                        <div className="space-y-0.5 sm:space-y-1">
                          {day.events.slice(0, 2).map(event => (
                            <div
                              key={event.id}
                              className="text-xs p-0.5 sm:p-1 rounded truncate cursor-pointer hover:opacity-80"
                              style={{ 
                                backgroundColor: event.color || getEventTypeColor(event.event_type),
                                color: 'white'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingEvent(event);
                              }}
                            >
                              {event.title}
                            </div>
                          ))}
                          {day.events.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{day.events.length - 2} more
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
                    <div className="space-y-3">
                      {getEventsForDate(selectedDate).length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-muted rounded-lg">
                          <CalendarIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">No events scheduled for this day</p>
                        </div>
                      ) : (
                        getEventsForDate(selectedDate).map(event => {
                          const Icon = getEventTypeIcon(event.event_type);
                          const isPast = new Date(event.start_time) < new Date();
                          
                          return (
                            <Card key={event.id} className={`border-l-4 ${isPast ? 'opacity-60' : ''}`} 
                                  style={{ borderLeftColor: event.color || getEventTypeColor(event.event_type) }}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3 flex-1">
                                    <Icon className="h-5 w-5 mt-1 text-muted-foreground" />
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-base">{event.title}</h4>
                                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-4 w-4" />
                                          <span className="font-medium">
                                            {formatTime(event.start_time)} - {formatTime(event.end_time)}
                                          </span>
                                        </div>
                                        <span className="capitalize px-2 py-1 bg-muted rounded-full text-xs">
                                          {event.event_type.replace('_', ' ')}
                                        </span>
                                      </div>
                                      
                                      {event.description && (
                                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                          {event.description}
                                        </p>
                                      )}
                                      
                                      {event.location && (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                                          <MapPin className="h-4 w-4" />
                                          <span>{event.location}</span>
                                        </div>
                                      )}
                                      
                                      {event.attendees.length > 0 && (
                                        <div className="flex items-center gap-2 mt-2">
                                          <Users className="h-4 w-4 text-muted-foreground" />
                                          <div className="flex flex-wrap gap-1">
                                            {event.attendees.slice(0, 3).map((attendee, index) => (
                                              <Badge key={index} variant="secondary" className="text-xs">
                                                {attendee}
                                              </Badge>
                                            ))}
                                            {event.attendees.length > 3 && (
                                              <Badge variant="secondary" className="text-xs">
                                                +{event.attendees.length - 3} more
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-1 ml-4">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditingEvent(event)}
                                      className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDeleteConfirm({ show: true, eventId: event.id })}
                                      className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 text-red-600"
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

                    {/* Quick Add Event Form - Time Only */}
                    <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Plus className="h-5 w-5 text-primary" />
                          Add Event
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Create a new event for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Event Details Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            placeholder="What's the event about?"
                            value={newEvent.title}
                            onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                            className="col-span-full md:col-span-1"
                          />
                          <Select value={newEvent.event_type} onValueChange={(value: EventType) => setNewEvent(prev => ({ ...prev, event_type: value }))}>
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

                        {/* Time Selection Row */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Start Time</label>
                            <Input
                              type="time"
                              value={newEvent.start_time}
                              onChange={(e) => setNewEvent(prev => ({ ...prev, start_time: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">End Time</label>
                            <Input
                              type="time"
                              value={newEvent.end_time}
                              onChange={(e) => setNewEvent(prev => ({ ...prev, end_time: e.target.value }))}
                            />
                          </div>
                        </div>

                        {/* Optional Details */}
                        <div className="space-y-3">
                          <Textarea
                            placeholder="Description (optional)..."
                            value={newEvent.description}
                            onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                            rows={2}
                          />
                          
                          <Input
                            placeholder="Location (optional)..."
                            value={newEvent.location}
                            onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                          />

                          {/* Color Picker */}
                          <div>
                            <label className="text-sm font-medium">Color</label>
                            <div className="flex gap-2 mt-2">
                              {colors.slice(0, 8).map(color => (
                                <button
                                  key={color}
                                  className={`w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform ${newEvent.color === color ? 'border-foreground shadow-md' : 'border-muted-foreground/20'}`}
                                  style={{ backgroundColor: color }}
                                  onClick={() => setNewEvent(prev => ({ ...prev, color }))}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end pt-2">
                          <div className="flex gap-2">
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
                            >
                              Clear
                            </Button>
                            <Button 
                              onClick={handleQuickEventCreate} 
                              disabled={!newEvent.title.trim()}
                              className="flex items-center gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Add Event
                            </Button>
                          </div>
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
                    <CalendarWithTime
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

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={deleteConfirm.show}
          onClose={() => setDeleteConfirm({ show: false })}
          onConfirm={() => deleteConfirm.eventId && handleDeleteEvent(deleteConfirm.eventId)}
          title="Delete Event"
          description="Are you sure you want to delete this event? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />
      </div>
    </Layout>
  );
};

export default DevCalendarPage;
