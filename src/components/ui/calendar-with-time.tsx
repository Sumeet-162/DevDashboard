"use client";

import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";
import { useId, useState, useEffect } from "react";

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
  showTimeInputs = true,
  showEndTime = true,
  className = ""
}: CalendarWithTimeProps) {
  const startId = useId();
  const endId = useId();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date);

  useEffect(() => {
    setSelectedDate(date);
  }, [date]);

  const handleDateSelect = (newDate: Date | undefined) => {
    setSelectedDate(newDate);
    onDateSelect?.(newDate);
  };

  return (
    <div className={`rounded-lg border border-border ${className}`}>
      <Calendar 
        mode="single" 
        className="p-2 bg-background" 
        selected={selectedDate} 
        onSelect={handleDateSelect}
      />
      
      {showTimeInputs && (
        <div className="border-t border-border p-3 space-y-3">
          <div className="flex items-center gap-3">
            <Label htmlFor={startId} className="text-xs font-medium min-w-[70px]">
              Start time
            </Label>
            <div className="relative flex-1">
              <Input
                id={startId}
                type="time"
                step="1"
                value={startTime}
                onChange={(e) => onStartTimeChange?.(e.target.value)}
                className="peer ps-9 [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
              <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                <Clock size={16} strokeWidth={2} aria-hidden="true" />
              </div>
            </div>
          </div>
          
          {showEndTime && (
            <div className="flex items-center gap-3">
              <Label htmlFor={endId} className="text-xs font-medium min-w-[70px]">
                End time
              </Label>
              <div className="relative flex-1">
                <Input
                  id={endId}
                  type="time"
                  step="1"
                  value={endTime}
                  onChange={(e) => onEndTimeChange?.(e.target.value)}
                  className="peer ps-9 [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                  <Clock size={16} strokeWidth={2} aria-hidden="true" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { CalendarWithTime };
