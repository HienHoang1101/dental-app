"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PatientLayout from "@/components/layout/PatientLayout";
import { patientApi } from "@/lib/patientApi";
import { Appointment } from "@/types";
import { Calendar, Clock, User, Plus, FileText, Bell } from "lucide-react";
import { parseLocalDate } from "@/lib/dateUtils";

export default function PatientDashboard() {
  const router = useRouter();
  const [upcomingAppointments, setUpcomingAppointments] = useState<
    Appointment[]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [appointmentsResponse, unreadCountData] = await Promise.all([
        patientApi.getMyAppointments({
          status: "confirmed",
          page: 1,
          pageSize: 5,
        }),
        patientApi.getUnreadCount(),
      ]);
      setUpcomingAppointments(appointmentsResponse.items);
      setUnreadCount(unreadCountData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = parseLocalDate(dateStr);
    return date.toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
  };

  if (loading) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Chào mừng bạn đến với Phòng khám Nha khoa
          </h1>
          <p className="text-gray-600">
            Quản lý lịch hẹn và theo dõi sức khỏe răng miệng của bạn
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => router.push("/patient/appointments/book")}
            className="bg-blue-600 text-white p-6 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-8 w-8 mb-2" />
            <h3 className="font-semibold text-lg">Đặt lịch khám</h3>
            <p className="text-sm text-blue-100 mt-1">Đặt lịch hẹn mới</p>
          </button>

          <button
            onClick={() => router.push("/patient/appointments/history")}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left border-2 border-transparent hover:border-blue-500"
          >
            <Calendar className="h-8 w-8 text-blue-600 mb-2" />
            <h3 className="font-semibold text-lg text-gray-900">Lịch sử</h3>
            <p className="text-sm text-gray-600 mt-1">Xem lịch hẹn đã đặt</p>
          </button>

          <button
            onClick={() => router.push("/patient/profile")}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left border-2 border-transparent hover:border-blue-500"
          >
            <FileText className="h-8 w-8 text-blue-600 mb-2" />
            <h3 className="font-semibold text-lg text-gray-900">Hồ sơ</h3>
            <p className="text-sm text-gray-600 mt-1">Quản lý hồ sơ sức khỏe</p>
          </button>

          <button
            onClick={() => router.push("/patient/notifications")}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left border-2 border-transparent hover:border-blue-500 relative"
          >
            <Bell className="h-8 w-8 text-blue-600 mb-2" />
            {unreadCount > 0 && (
              <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
            <h3 className="font-semibold text-lg text-gray-900">Thông báo</h3>
            <p className="text-sm text-gray-600 mt-1">
              {unreadCount > 0
                ? `${unreadCount} thông báo mới`
                : "Không có thông báo mới"}
            </p>
          </button>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Lịch hẹn sắp tới
            </h2>
            <button
              onClick={() => router.push("/patient/appointments/history")}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Xem tất cả →
            </button>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Bạn chưa có lịch hẹn nào</p>
              <button
                onClick={() => router.push("/patient/appointments/book")}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Đặt lịch khám ngay
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() =>
                    router.push(`/patient/appointments/${appointment.id}`)
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {appointment.doctor.specialtyName}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}
                        >
                          {appointment.status === "confirmed"
                            ? "Đã xác nhận"
                            : appointment.status === "pending"
                              ? "Chờ xác nhận"
                              : appointment.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{appointment.doctor.fullName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(appointment.appointmentDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {appointment.timeSlot.startTime.substring(0, 5)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/patient/appointments/${appointment.id}`);
                      }}
                      className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PatientLayout>
  );
}
