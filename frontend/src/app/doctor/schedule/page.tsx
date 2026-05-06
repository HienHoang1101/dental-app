"use client";

import { useEffect, useState } from "react";
import DoctorLayout from "@/components/layout/DoctorLayout";
import { doctorApi } from "@/lib/doctorApi";
import { Calendar, Clock, Plus, CheckCircle, XCircle } from "lucide-react";

interface WorkSchedule {
  id: string;
  doctorId: string;
  workDate: string;
  slotStart: string;
  slotEnd: string;
  isBooked: boolean;
  createdAt: string;
}

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export default function DoctorSchedulePage() {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  });
  const [newSchedule, setNewSchedule] = useState({
    date: "",
    shiftId: "",
  });

  useEffect(() => {
    loadSchedules();
    loadShifts();
  }, [dateRange]);

  const loadShifts = async () => {
    try {
      const response = await fetch(
        "http://localhost:8080/api/schedules/shifts",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      const data = await response.json();
      if (data.success && data.data) {
        setShifts(data.data);
        // Set first shift as default
        if (data.data.length > 0) {
          setNewSchedule((prev) => ({ ...prev, shiftId: data.data[0].id }));
        }
      }
    } catch (error) {
      console.error("Failed to load shifts:", error);
    }
  };

  const loadSchedules = async () => {
    try {
      const data = await doctorApi.getMyWorkSchedules(
        dateRange.startDate,
        dateRange.endDate,
      );
      setSchedules(data);
    } catch (error) {
      console.error("Failed to load schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await doctorApi.registerWorkSchedule({
        shiftId: newSchedule.shiftId,
        date: newSchedule.date,
      });
      setShowModal(false);
      setNewSchedule({
        date: "",
        shiftId: shifts.length > 0 ? shifts[0].id : "",
      });
      loadSchedules();
    } catch (error) {
      alert("Không thể đăng ký lịch làm việc");
    }
  };

  // Group schedules by date
  const schedulesByDate = schedules.reduce(
    (acc, schedule) => {
      const date = schedule.workDate;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(schedule);
      return acc;
    },
    {} as Record<string, WorkSchedule[]>,
  );

  const sortedDates = Object.keys(schedulesByDate).sort();

  return (
    <DoctorLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Lịch làm việc</h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Đăng ký ca làm
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Từ ngày
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Schedule List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Đang tải...</p>
              </div>
            ) : sortedDates.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Chưa có lịch làm việc nào</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedDates.map((date) => (
                  <div
                    key={date}
                    className="border-b last:border-b-0 pb-6 last:pb-0"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {new Date(date).toLocaleDateString("vi-VN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {schedulesByDate[date].map((schedule) => (
                        <div
                          key={schedule.id}
                          className={`border rounded-lg p-4 ${
                            schedule.isBooked
                              ? "bg-red-50 border-red-200"
                              : "bg-green-50 border-green-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-600" />
                              <span className="font-medium">
                                {schedule.slotStart} - {schedule.slotEnd}
                              </span>
                            </div>
                            {schedule.isBooked ? (
                              <XCircle className="w-5 h-5 text-red-600" />
                            ) : (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                          <div className="text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                schedule.isBooked
                                  ? "bg-red-100 text-red-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {schedule.isBooked ? "Đã đặt" : "Còn trống"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm text-green-800">
                Slot trống:{" "}
                <span className="font-semibold">
                  {schedules.filter((s) => !s.isBooked).length}
                </span>
              </span>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-sm text-red-800">
                Đã đặt:{" "}
                <span className="font-semibold">
                  {schedules.filter((s) => s.isBooked).length}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Register Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Đăng ký ca làm việc</h2>
            <form onSubmit={handleRegisterSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày làm việc
                </label>
                <input
                  type="date"
                  required
                  value={newSchedule.date}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, date: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ca làm việc
                </label>
                <select
                  required
                  value={newSchedule.shiftId}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, shiftId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">-- Chọn ca làm việc --</option>
                  {shifts.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.name} ({shift.startTime.substring(0, 5)} -{" "}
                      {shift.endTime.substring(0, 5)})
                    </option>
                  ))}
                </select>
                {shifts.length === 0 && (
                  <p className="mt-1 text-xs text-red-500">
                    Không có ca làm việc nào. Vui lòng liên hệ admin.
                  </p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Đăng ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DoctorLayout>
  );
}
