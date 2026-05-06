"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerProps {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  disabledDates?: string[];
  minDate?: string;
}

export default function DatePicker({
  selectedDate,
  onSelectDate,
  disabledDates = [],
  minDate,
}: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } =
    getDaysInMonth(currentMonth);

  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  const previousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const formatDate = (day: number) => {
    // Format date as YYYY-MM-DD without timezone conversion
    const yearStr = year.toString();
    const monthStr = (month + 1).toString().padStart(2, "0");
    const dayStr = day.toString().padStart(2, "0");
    return `${yearStr}-${monthStr}-${dayStr}`;
  };

  const isDateDisabled = (day: number) => {
    const dateStr = formatDate(day);
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (minDate) {
      // Parse minDate properly to avoid timezone issues
      const [minYear, minMonth, minDay] = minDate.split("-").map(Number);
      const min = new Date(minYear, minMonth - 1, minDay);
      min.setHours(0, 0, 0, 0);
      if (date < min) return true;
    }

    if (date < today) return true;
    if (disabledDates.includes(dateStr)) return true;
    if (date.getDay() === 0) return true; // Disable Sundays

    return false;
  };

  const isDateSelected = (day: number) => {
    return selectedDate === formatDate(day);
  };

  const handleDateClick = (day: number) => {
    if (!isDateDisabled(day)) {
      onSelectDate(formatDate(day));
    }
  };

  const renderCalendarDays = () => {
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const disabled = isDateDisabled(day);
      const selected = isDateSelected(day);

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          disabled={disabled}
          className={`
            p-2 text-center rounded-lg transition-colors
            ${
              selected
                ? "bg-blue-600 text-white font-semibold"
                : disabled
                  ? "text-gray-300 cursor-not-allowed"
                  : "hover:bg-blue-50 text-gray-900"
            }
          `}
        >
          {day}
        </button>,
      );
    }

    return days;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold">
          {monthNames[month]} {year}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-600 p-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>

      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded"></div>
            <span className="text-gray-600">Đã chọn</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <span className="text-gray-600">Không khả dụng</span>
          </div>
        </div>
      </div>
    </div>
  );
}
