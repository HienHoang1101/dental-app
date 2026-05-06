"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { adminApi } from "@/lib/adminApi";

interface DoctorSchedule {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  workDate: string;
  slotStart: string;
  slotEnd: string;
  isBooked: boolean;
}

export default function SchedulesPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [doctorSchedules, setDoctorSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [scheduleDates, setScheduleDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadMonthSchedules();
  }, [currentDate]);

  useEffect(() => {
    if (selectedDate) {
      loadDaySchedules(selectedDate);
    }
  }, [selectedDate]);

  const loadMonthSchedules = async () => {
    try {
      // TEMPORARY: Disable month loading to reduce API calls
      // This was causing too many requests and potential 500 errors
      // TODO: Create a dedicated endpoint GET /api/admin/doctor-schedules/month?year=2026&month=5

      console.log("Month schedule loading is temporarily disabled");
      setScheduleDates(new Set());

      /* Original code - commented out temporarily
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const dates = new Set<string>();
      const promises = [];

      for (
        let d = new Date(firstDay);
        d <= lastDay;
        d.setDate(d.getDate() + 1)
      ) {
        const dateStr = formatDate(d);
        promises.push(
          adminApi
            .getDoctorSchedules(dateStr)
            .then((schedules) => {
              if (schedules.length > 0) {
                dates.add(dateStr);
              }
            })
            .catch(() => {}),
        );
      }

      await Promise.all(promises);
      setScheduleDates(dates);
      */
    } catch (error) {
      console.error("Failed to load month schedules:", error);
    }
  };

  const loadDaySchedules = async (date: Date) => {
    setLoading(true);
    try {
      const dateStr = formatDate(date);
      console.log("Loading schedules for date:", dateStr);
      const schedules = await adminApi.getDoctorSchedules(dateStr);
      console.log("Received schedules:", schedules);
      setDoctorSchedules(schedules);
    } catch (error: any) {
      console.error("Failed to load day schedules:", error);
      console.error("Error details:", error.response?.data);
      setDoctorSchedules([]);

      // Show user-friendly error message
      if (error.response?.status === 500) {
        alert(
          "Lỗi khi tải lịch làm việc. Vui lòng:\n" +
            "1. Kiểm tra backend đang chạy\n" +
            "2. Xem console log của backend\n" +
            "3. Kiểm tra có data trong database",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
    setSelectedDate(null);
  };

  const handleDateClick = (day: number) => {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
    );
    setSelectedDate(date);
  };

  const isDateSelected = (day: number): boolean => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentDate.getMonth() &&
      selectedDate.getFullYear() === currentDate.getFullYear()
    );
  };

  const hasSchedule = (day: number): boolean => {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
    );
    return scheduleDates.has(formatDate(date));
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });

  // Group schedules by doctor
  const groupedSchedules = doctorSchedules.reduce(
    (acc, schedule) => {
      if (!acc[schedule.doctorId]) {
        acc[schedule.doctorId] = {
          doctorName: schedule.doctorName,
          specialty: schedule.specialty,
          slots: [],
        };
      }
      acc[schedule.doctorId].slots.push({
        id: schedule.id,
        slotStart: schedule.slotStart,
        slotEnd: schedule.slotEnd,
        isBooked: schedule.isBooked,
      });
      return acc;
    },
    {} as Record<
      string,
      {
        doctorName: string;
        specialty: string;
        slots: Array<{
          id: string;
          slotStart: string;
          slotEnd: string;
          isBooked: boolean;
        }>;
      }
    >,
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Quản lý lịch làm việc
        </h1>

        {/* Calendar */}
        <div className="bg-white rounded-lg shadow p-6 max-w-3xl mx-auto">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h2 className="text-lg font-semibold capitalize">{monthName}</h2>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-500 py-1.5"
              >
                {day}
              </div>
            ))}

            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {/* Calendar days */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const selected = isDateSelected(day);
              const scheduled = hasSchedule(day);

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`aspect-square p-1.5 rounded-md text-center text-sm transition-colors ${
                    selected
                      ? "bg-blue-500 text-white font-semibold"
                      : scheduled
                        ? "bg-blue-50 text-blue-600 font-medium hover:bg-blue-100"
                        : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-gray-600">Đã chọn</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></div>
              <span className="text-gray-600">Có lịch</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-gray-100 rounded"></div>
              <span className="text-gray-600">Không khả dụng</span>
            </div>
          </div>
        </div>

        {/* Doctor Schedules for Selected Date */}
        {selectedDate && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">
              Lịch làm việc ngày{" "}
              {selectedDate.toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </h3>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : Object.keys(groupedSchedules).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(groupedSchedules).map(
                  ([doctorId, doctorData]) => (
                    <div
                      key={doctorId}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {doctorData.doctorName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {doctorData.specialty}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                          {doctorData.slots.length} ca làm việc
                        </span>
                      </div>

                      {/* Time slots */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {doctorData.slots.map((slot) => (
                          <div
                            key={slot.id}
                            className={`px-3 py-2 rounded-lg text-sm text-center ${
                              slot.isBooked
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            <div className="font-medium">
                              {slot.slotStart} - {slot.slotEnd}
                            </div>
                            <div className="text-xs mt-1">
                              {slot.isBooked ? "Đã đặt" : "Còn trống"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Không có bác sĩ nào đăng ký làm việc trong ngày này
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
