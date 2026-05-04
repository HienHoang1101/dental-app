"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalendarProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  highlightedDates?: string[]; // ISO date strings
  className?: string;
}

export function Calendar({
  selectedDate = new Date(),
  onDateSelect,
  highlightedDates = [],
  className,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );

  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date | null) => {
    if (!date) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isHighlighted = (date: Date | null) => {
    if (!date) return false;
    const dateStr = date.toISOString().split("T")[0];
    return highlightedDates.includes(dateStr);
  };

  const handleDateClick = (date: Date | null) => {
    if (date && onDateSelect) {
      onDateSelect(date);
    }
  };

  const monthYear = currentMonth.toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPreviousMonth}
          className="h-10 w-10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-semibold capitalize">{monthYear}</h2>
        <Button
          variant="outline"
          size="icon"
          onClick={goToNextMonth}
          className="h-10 w-10"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="h-12 flex items-center justify-center font-semibold text-sm bg-primary text-primary-foreground rounded-md"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((date, index) => (
          <button
            key={index}
            onClick={() => handleDateClick(date)}
            disabled={!date}
            className={cn(
              "h-16 flex items-center justify-center rounded-full text-lg font-medium transition-all",
              "hover:bg-accent hover:text-accent-foreground",
              "disabled:opacity-0 disabled:cursor-default",
              date && !isSelected(date) && "border-2 border-muted",
              isToday(date) && "border-primary border-2",
              isSelected(date) &&
                "bg-primary text-primary-foreground border-primary border-2",
              isHighlighted(date) &&
                !isSelected(date) &&
                "bg-blue-100 border-blue-300",
            )}
          >
            {date?.getDate()}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full border-2 border-primary" />
          <span>Hôm nay</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary" />
          <span>Ngày được chọn</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-100 border-2 border-blue-300" />
          <span>Có lịch làm việc</span>
        </div>
      </div>
    </div>
  );
}
