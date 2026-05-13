"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DoctorLayout from "@/components/layout/DoctorLayout";
import { doctorApi } from "@/lib/doctorApi";
import { Appointment } from "@/types";
import { Calendar, Clock, User, CheckCircle, XCircle } from "lucide-react";

export default function DoctorDashboard() {
  const router = useRouter();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({
    today: 0,
    pending: 0,
    confirmed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [completingId, setCompletingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await doctorApi.getMyAppointments({
        startDate: today,
        endDate: today,
        page: 1,
        pageSize: 20,
      });

      setTodayAppointments(response.items);

      // Calculate stats
      const pending = response.items.filter(
        (apt) => apt.status === "pending",
      ).length;
      const confirmed = response.items.filter(
        (apt) => apt.status === "confirmed",
      ).length;

      setStats({
        today: response.items.length,
        pending,
        confirmed,
      });
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await doctorApi.confirmAppointment(id);
      loadData();
      setConfirmingId(null);
    } catch (error) {
      console.error("Confirm appointment error:", error);
      alert("Không thể xác nhận lịch hẹn");
    }
  };

  const handleCancel = async (id: string) => {
    if (!cancelReason.trim()) return;

    try {
      await doctorApi.cancelAppointment(id, cancelReason);
      loadData();
      setCancelingId(null);
      setCancelReason("");
    } catch (error) {
      console.error("Cancel appointment error:", error);
      alert("Không thể hủy lịch hẹn");
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await doctorApi.completeAppointment(id);
      loadData();
      setCompletingId(null);
    } catch (error) {
      console.error("Complete appointment error:", error);
      alert("Không thể hoàn thành lịch hẹn");
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

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Đã xác nhận";
      case "pending":
        return "Chờ xác nhận";
      case "completed":
        return "Đã khám";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  return (
    <DoctorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Chào mừng bạn quay trở lại, Bác sĩ!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Lịch hẹn hôm nay</p>
                <p className="text-3xl font-bold mt-1">{stats.today}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chờ xác nhận</p>
                <p className="text-3xl font-bold mt-1">{stats.pending}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã xác nhận</p>
                <p className="text-3xl font-bold mt-1">{stats.confirmed}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Lịch hẹn hôm nay</h2>
              <button
                onClick={() => router.push("/doctor/appointments")}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Xem tất cả →
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Đang tải...</p>
              </div>
            ) : todayAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Không có lịch hẹn nào hôm nay</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}
                          >
                            {getStatusText(appointment.status)}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">
                              {appointment.patient.fullName}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>
                              {appointment.timeSlot.startTime} -{" "}
                              {appointment.timeSlot.endTime}
                            </span>
                          </div>
                          {appointment.notes && (
                            <p className="text-gray-600 mt-2">
                              Ghi chú: {appointment.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {appointment.status === "pending" && (
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => setConfirmingId(appointment.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Xác nhận"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setCancelingId(appointment.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Hủy"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                      {appointment.status === "confirmed" && (
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => setCompletingId(appointment.id)}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                            title="Hoàn thành"
                          >
                            Hoàn thành
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {confirmingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">Xác nhận lịch hẹn</h3>
            <p className="mb-6">Bạn có chắc chắn muốn xác nhận lịch hẹn này?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmingId(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Đóng
              </button>
              <button
                onClick={() => handleConfirm(confirmingId)}
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">Hủy lịch hẹn</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do hủy
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-red-500 focus:border-red-500"
                rows={3}
                placeholder="Nhập lý do hủy..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setCancelingId(null);
                  setCancelReason("");
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Đóng
              </button>
              <button
                onClick={() => handleCancel(cancelingId)}
                disabled={!cancelReason.trim()}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg disabled:opacity-50"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {completingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">Hoàn thành lịch hẹn</h3>
            <p className="mb-6">Bạn có chắc chắn muốn đánh dấu lịch hẹn này đã hoàn thành?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setCompletingId(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Đóng
              </button>
              <button
                onClick={() => handleComplete(completingId)}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
              >
                Hoàn thành
              </button>
            </div>
          </div>
        </div>
      )}
    </DoctorLayout>
  );
}
