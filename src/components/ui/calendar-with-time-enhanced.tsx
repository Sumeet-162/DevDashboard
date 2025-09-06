"use client";

import Calendar1Component from "@/components/ui/calendar-1";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CalendarWithTimeEnhancedProps {
  date?: Date;
  onDateSelect?: (date: Date | undefined) => void;
  startTime?: string;
  endTime?: string;
  onStartTimeChange?: (time: string) => void;
  onEndTimeChange?: (time: string) => void;
  showTimeInputs?: boolean;
  showEndTime?: boolean;
  className?: string;
}

export function CalendarWithTimeEnhanced({
  date,
  onDateSelect,
  startTime = "12:00",
  endTime = "13:00",
  onStartTimeChange,
  onEndTimeChange,
  showTimeInputs = false,
  showEndTime = false,
  className = ""
}: CalendarWithTimeEnhancedProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date);

  useEffect(() => {
    setSelectedDate(date);
  }, [date]);

  const handleDateSelect = (newDate: Date | undefined) => {
    setSelectedDate(newDate);
    onDateSelect?.(newDate);
  };

  // Quick date selection buttons
  const quickDates = [
    { label: "Today", date: new Date() },
    { label: "Tomorrow", date: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    { label: "Next Week", date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  ];

  return (
    <div className={cn("rounded-md border bg-card shadow-sm", className)}>
      {/* Quick Date Selection */}
      <div className="p-3 border-b">
        <div className="flex gap-2">
          {quickDates.map(({ label, date: quickDate }) => (
            <Button
              key={label}
              variant="outline"
              size="sm"
              onClick={() => handleDateSelect(quickDate)}
              className="h-8 px-3 text-xs"
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Enhanced Calendar */}
      <div className="p-3">
        <Calendar1Component
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          numberOfMonths={1}
          className="max-w-fit mx-auto"
        />
      </div>

      {/* Time Inputs (if enabled) */}
      {showTimeInputs && (
        <div className="p-3 border-t space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => onStartTimeChange?.(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          {showEndTime && (
            <div className="space-y-2">
              <label className="text-sm font-medium">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => onEndTimeChange?.(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
