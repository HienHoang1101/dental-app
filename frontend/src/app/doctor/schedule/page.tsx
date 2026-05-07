"use client";

import { useEffect, useState } from "react";
import DoctorLayout from "@/components/layout/DoctorLayout";
import { doctorApi } from "@/lib/doctorApi";
import {
  Calendar,
  Clock,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
} from "lucide-react";

interface WeeklySchedule {
  id: string;
  doctorId: string;
  dayOfWeek: number; // 1=Mon, 7=Sun
  session: "morning" | "afternoon";
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface ScheduleChangeRequest {
  id: string;
  requestType: "add" | "remove" | "modify";
  status: "pending" | "approved" | "rejected";
  oldScheduleData?: any;
  newScheduleData?: any;
  rejectionReason?: string;
  createdAt: string;
}

interface SelectedSlot {
  dayOfWeek: number;
  session: "morning" | "afternoon";
}

export default function DoctorSchedulePage() {
  const [weeklySchedules, setWeeklySchedules] = useState<WeeklySchedule[]>([]);
  const [changeRequests, setChangeRequests] = useState<ScheduleChangeRequest[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const days = [
    { value: 1, label: "Thứ 2" },
    { value: 2, label: "Thứ 3" },
    { value: 3, label: "Thứ 4" },
    { value: 4, label: "Thứ 5" },
    { value: 5, label: "Thứ 6" },
    { value: 6, label: "Thứ 7" },
    { value: 7, label: "Chủ nhật" },
  ];

  const sessions = [
    { value: "morning" as const, label: "Sáng", time: "08:00 - 12:00" },
    { value: "afternoon" as const, label: "Chiều", time: "13:30 - 17:30" },
  ];

  useEffect(() => {
    loadSchedules();
    loadChangeRequests();
  }, []);

  const loadSchedules = async () => {
    try {
      const data = await doctorApi.getMyWeeklySchedules();
      setWeeklySchedules(data as any);
    } catch (error) {
      console.error("Failed to load schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadChangeRequests = async () => {
    try {
      const data = await doctorApi.getMyScheduleChangeRequests();
      setChangeRequests(data);
    } catch (error) {
      console.error("Failed to load change requests:", error);
    }
  };

  const hasSchedule = (
    dayOfWeek: number,
    session: "morning" | "afternoon",
  ): boolean => {
    return weeklySchedules.some(
      (s) => s.dayOfWeek === dayOfWeek && s.session === session && s.isActive,
    );
  };

  const hasPendingRequest = (
    dayOfWeek: number,
    session: "morning" | "afternoon",
  ): boolean => {
    return changeRequests.some(
      (r) =>
        r.status === "pending" &&
        ((r.newScheduleData?.dayOfWeek === dayOfWeek &&
          r.newScheduleData?.session === session) ||
          (r.oldScheduleData?.dayOfWeek === dayOfWeek &&
            r.oldScheduleData?.session === session)),
    );
  };

  const isSelected = (
    dayOfWeek: number,
    session: "morning" | "afternoon",
  ): boolean => {
    return selectedSlots.some(
      (s) => s.dayOfWeek === dayOfWeek && s.session === session,
    );
  };

  const handleToggleSlot = (
    dayOfWeek: number,
    session: "morning" | "afternoon",
  ) => {
    // Don't allow selecting if already has schedule or pending request
    if (
      hasSchedule(dayOfWeek, session) ||
      hasPendingRequest(dayOfWeek, session)
    ) {
      return;
    }

    setSelectedSlots((prev) => {
      const exists = prev.some(
        (s) => s.dayOfWeek === dayOfWeek && s.session === session,
      );
      if (exists) {
        return prev.filter(
          (s) => !(s.dayOfWeek === dayOfWeek && s.session === session),
        );
      } else {
        return [...prev, { dayOfWeek, session }];
      }
    });
  };

  const handleSubmitRequests = async () => {
    if (selectedSlots.length === 0) {
      alert("Vui lòng chọn ít nhất 1 buổi làm việc");
      return;
    }

    setSubmitting(true);
    try {
      // Create multiple requests
      const promises = selectedSlots.map((slot) =>
        doctorApi.requestScheduleChange({
          requestType: "add",
          newScheduleData: {
            dayOfWeek: slot.dayOfWeek,
            session: slot.session,
            startTime: slot.session === "morning" ? "08:00" : "13:30",
            endTime: slot.session === "morning" ? "12:00" : "17:30",
          },
        }),
      );

      await Promise.all(promises);

      alert(
        `Đã gửi ${selectedSlots.length} yêu cầu đăng ký lịch thành công! Chờ admin duyệt.`,
      );
      setSelectedSlots([]);
      loadChangeRequests();
    } catch (error) {
      console.error("Failed to submit requests:", error);
      alert("Không thể gửi yêu cầu. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedSlots([]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
            Chờ duyệt
          </span>
        );
      case "approved":
        return (
          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
            Đã duyệt
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
            Từ chối
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <DoctorLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Đăng ký lịch làm việc cố định
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Lịch đăng ký tại đây sẽ được áp dụng cho <strong>tất cả các tuần</strong> sau khi được Admin duyệt.
            </p>
          </div>
          {selectedSlots.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleClearSelection}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy chọn
              </button>
              <button
                onClick={handleSubmitRequests}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {submitting
                  ? "Đang gửi..."
                  : `Gửi ${selectedSlots.length} yêu cầu`}
              </button>
            </div>
          )}
        </div>

        {/* Selection Info */}
        {selectedSlots.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">
                  Đã chọn {selectedSlots.length} buổi làm việc:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedSlots.map((slot, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                    >
                      {days.find((d) => d.value === slot.dayOfWeek)?.label} -{" "}
                      {slot.session === "morning" ? "Sáng" : "Chiều"}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Schedule Grid */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Đang tải...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold text-gray-700">
                        Buổi
                      </th>
                      {days.map((day) => (
                        <th
                          key={day.value}
                          className="text-center p-3 font-semibold text-gray-700"
                        >
                          {day.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr key={session.value} className="border-b">
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-gray-900">
                              {session.label}
                            </div>
                            <div className="text-xs text-gray-500">
                              {session.time}
                            </div>
                          </div>
                        </td>
                        {days.map((day) => {
                          const scheduled = hasSchedule(
                            day.value,
                            session.value,
                          );
                          const pending = hasPendingRequest(
                            day.value,
                            session.value,
                          );
                          const selected = isSelected(day.value, session.value);

                          return (
                            <td key={day.value} className="p-3 text-center">
                              <div
                                onClick={() =>
                                  !scheduled && !pending && handleToggleSlot(day.value, session.value)
                                }
                                className={`w-full h-20 rounded-xl border-2 transition-all flex flex-col items-center justify-center relative overflow-hidden ${
                                  scheduled
                                    ? "bg-green-600 border-green-600 text-white shadow-sm cursor-default"
                                    : pending
                                      ? "bg-amber-50 border-amber-200 text-amber-700 cursor-not-allowed"
                                      : selected
                                        ? "bg-blue-600 border-blue-600 text-white shadow-md scale-105 z-10"
                                        : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-white hover:border-blue-400 hover:text-blue-500 cursor-pointer group"
                                }`}
                              >
                                {scheduled ? (
                                  <>
                                    <CheckCircle className="w-6 h-6 mb-1" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Đã duyệt</span>
                                  </>
                                ) : pending ? (
                                  <>
                                    <Clock className="w-5 h-5 mb-1 animate-pulse" />
                                    <span className="text-[10px] font-medium">Chờ duyệt</span>
                                  </>
                                ) : selected ? (
                                  <>
                                    <Plus className="w-6 h-6 mb-1" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Đã chọn</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">Đăng ký</span>
                                  </>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Chú thích & Hướng dẫn
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center">Đã đăng ký & duyệt</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center">Đang chọn (chưa gửi)</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="w-8 h-8 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-center text-amber-600">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center">Đang chờ Admin duyệt</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="w-8 h-8 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center">Trống (Click để chọn)</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100 col-span-2 md:col-span-1">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs">
                Tip
              </div>
              <span className="text-xs font-medium text-blue-800 text-center">Chọn nhiều ô rồi nhấn "Gửi yêu cầu"</span>
            </div>
          </div>
        </div>

        {/* Change Requests History */}
        {changeRequests.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                Lịch sử yêu cầu thay đổi
              </h2>
              <div className="space-y-3">
                {changeRequests.slice(0, 10).map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(request.status)}
                          <span className="text-sm text-gray-600">
                            {request.requestType === "add" && "Thêm lịch"}
                            {request.requestType === "remove" && "Xóa lịch"}
                            {request.requestType === "modify" && "Sửa lịch"}
                          </span>
                        </div>
                        {request.newScheduleData && (
                          <p className="text-sm text-gray-700">
                            {
                              days.find(
                                (d) =>
                                  d.value === request.newScheduleData.dayOfWeek,
                              )?.label
                            }{" "}
                            -{" "}
                            {request.newScheduleData.session === "morning"
                              ? "Sáng"
                              : "Chiều"}
                          </p>
                        )}
                        {request.rejectionReason && (
                          <p className="text-sm text-red-600 mt-1">
                            Lý do từ chối: {request.rejectionReason}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString(
                          "vi-VN",
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}
