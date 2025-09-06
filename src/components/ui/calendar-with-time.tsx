"use client";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CalendarWithTimeProps {
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

function CalendarWithTime({
  date,
  onDateSelect,
  startTime = "12:00",
  endTime = "13:00",
  onStartTimeChange,
  onEndTimeChange,
  showTimeInputs = false, // Default to false since user doesn't want time selection
  showEndTime = false,
  className = ""
}: CalendarWithTimeProps) {
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
      {/* Quick Date Selection - Very Compact */}
      <div className="px-3 py-2 border-b bg-muted/20">
        <div className="flex gap-1">
          {quickDates.map((item) => (
            <Button
              key={item.label}
              variant={
                selectedDate?.toDateString() === item.date.toDateString() 
                  ? "default" 
                  : "outline"
              }
              size="sm"
              onClick={() => handleDateSelect(item.date)}
              className="h-6 text-xs px-2 flex-1"
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {/* VERY COMPACT Calendar */}
      <div className="p-2">
        <Calendar 
          mode="single" 
          selected={selectedDate} 
          onSelect={handleDateSelect}
          className="rounded-md"
          classNames={{
            months: "flex flex-col",
            month: "space-y-1",
            caption: "flex justify-center pt-1 relative items-center mb-1",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              "h-5 w-5 bg-transparent p-0 opacity-60 hover:opacity-100",
              "hover:bg-accent hover:text-accent-foreground rounded text-xs"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse",
            head_row: "flex mb-1",
            head_cell: "text-muted-foreground w-7 font-normal text-xs text-center p-0",
            row: "flex w-full",
            cell: "relative p-0 text-center",
            day: cn(
              "h-7 w-7 p-0 font-normal text-xs m-0.5",
              "hover:bg-accent hover:text-accent-foreground",
              "transition-colors duration-150 rounded-sm",
              "flex items-center justify-center"
            ),
            day_selected: cn(
              // EXTREMELY PROMINENT selected date
              "bg-primary text-primary-foreground font-bold",
              "hover:bg-primary hover:text-primary-foreground",
              "ring-2 ring-primary ring-offset-1",
              "shadow-sm scale-105 relative z-10"
            ),
            day_today: cn(
              "bg-accent text-accent-foreground font-medium",
              "ring-1 ring-accent-foreground/30"
            ),
            day_outside: "text-muted-foreground/30 opacity-40",
            day_disabled: "text-muted-foreground opacity-25",
            day_hidden: "invisible",
          }}
        />
      </div>
      
      {/* Selected Date Display - Very Compact */}
      {selectedDate && (
        <div className="px-3 pb-2">
          <div className="bg-primary/5 border border-primary/20 rounded-sm p-2 text-center">
            <div className="text-xs text-muted-foreground">Selected Date</div>
            <div className="text-sm font-medium text-primary">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { CalendarWithTime };
