"use client";

import { useEffect, useState } from "react";
import DoctorLayout from "@/components/layout/DoctorLayout";
import { doctorApi } from "@/lib/doctorApi";
import { Appointment } from "@/types";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Filter,
} from "lucide-react";

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: "",
    startDate: "",
    endDate: "",
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [followUpId, setFollowUpId] = useState<string | null>(null);
  const [followUpData, setFollowUpData] = useState({
    date: "",
    startTime: "09:00",
    endTime: "10:00",
    notes: "",
  });

  useEffect(() => {
    loadAppointments();
  }, [filter, page]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await doctorApi.getMyAppointments({
        ...filter,
        page,
        pageSize: 10,
      });
      setAppointments(response.items);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Failed to load appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await doctorApi.confirmAppointment(id);
      loadAppointments();
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
      loadAppointments();
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
      loadAppointments();
      setCompletingId(null);
    } catch (error) {
      console.error("Complete appointment error:", error);
      alert("Không thể hoàn thành lịch hẹn");
    }
  };

  const handleCreateFollowUp = async () => {
    if (
      !followUpId ||
      !followUpData.date ||
      !followUpData.startTime ||
      !followUpData.endTime
    ) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      // Combine date and time to create ISO timestamps
      const startDateTime = new Date(
        `${followUpData.date}T${followUpData.startTime}:00`,
      );
      const endDateTime = new Date(
        `${followUpData.date}T${followUpData.endTime}:00`,
      );

      if (endDateTime <= startDateTime) {
        alert("Giờ kết thúc phải sau giờ bắt đầu");
        return;
      }

      await doctorApi.createFollowUpAppointment({
        parentAppointmentId: followUpId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        notes: followUpData.notes || undefined,
      });

      alert("Tái khám thành công!");
      setFollowUpId(null);
      setFollowUpData({ date: "", startTime: "09:00", endTime: "10:00", notes: "" });
      loadAppointments();
    } catch (error: any) {
      console.error("Create follow-up error:", error);
      alert(error.response?.data?.message || "Không thể tạo lịch tái khám");
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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Quản lý lịch hẹn</h1>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold">Bộ lọc</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <select
                value={filter.status}
                onChange={(e) => {
                  setFilter({ ...filter, status: e.target.value });
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Tất cả</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="completed">Đã khám</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Từ ngày
              </label>
              <input
                type="date"
                value={filter.startDate}
                onChange={(e) => {
                  setFilter({ ...filter, startDate: e.target.value });
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                value={filter.endDate}
                onChange={(e) => {
                  setFilter({ ...filter, endDate: e.target.value });
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Đang tải...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Không có lịch hẹn nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
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
                          <span className="text-sm text-gray-500">
                            {new Date(
                              appointment.appointmentDate,
                            ).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">
                              {appointment.patient.fullName}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {appointment.timeSlot.startTime} -{" "}
                              {appointment.timeSlot.endTime}
                            </span>
                          </div>
                          {appointment.service && (
                            <div className="text-sm text-gray-600">
                              Dịch vụ: {appointment.service.name}
                            </div>
                          )}
                          {appointment.notes && (
                            <div className="text-sm text-gray-600 mt-2">
                              <span className="font-medium">Ghi chú:</span>{" "}
                              {appointment.notes}
                            </div>
                          )}
                          {appointment.cancellationReason && (
                            <div className="text-sm text-red-600 mt-2">
                              <span className="font-medium">Lý do hủy:</span>{" "}
                              {appointment.cancellationReason}
                            </div>
                          )}
                        </div>
                      </div>

                      {appointment.status === "pending" && (
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => setConfirmingId(appointment.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Xác nhận"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setCancelingId(appointment.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hủy"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                      {appointment.status === "confirmed" && (
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => {
                              setFollowUpId(appointment.id);
                              const tomorrow = new Date();
                              tomorrow.setDate(tomorrow.getDate() + 1);
                              setFollowUpData({
                                date: tomorrow.toISOString().split("T")[0],
                                startTime: "09:00",
                                endTime: "10:00",
                                notes: "",
                              });
                            }}
                            className="px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
                            title="Tạo lịch tái khám"
                          >
                            Tái khám
                          </button>
                          <button
                            onClick={() => setCompletingId(appointment.id)}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                            title="Hoàn thành"
                          >
                            Hoàn thành
                          </button>
                        </div>
                      )}
                      {appointment.status === "completed" && (
                        <div className="flex space-x-2 ml-4">
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t px-6 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trang trước
                </button>
                <span className="text-sm text-gray-600">
                  Trang {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}
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
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={() => handleConfirm(confirmingId)}
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
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
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={() => handleCancel(cancelingId)}
                disabled={!cancelReason.trim()}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors"
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
            <p className="mb-6">
              Bạn có chắc chắn muốn đánh dấu lịch hẹn này đã hoàn thành?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setCompletingId(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={() => handleComplete(completingId)}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              >
                Hoàn thành
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Modal */}
      {followUpId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Tạo lịch tái khám</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày tái khám
                </label>
                <input
                  type="date"
                  value={followUpData.date}
                  onChange={(e) =>
                    setFollowUpData({ ...followUpData, date: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giờ bắt đầu
                  </label>
                  <input
                    type="time"
                    value={followUpData.startTime}
                    onChange={(e) =>
                      setFollowUpData({
                        ...followUpData,
                        startTime: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giờ kết thúc
                  </label>
                  <input
                    type="time"
                    value={followUpData.endTime}
                    onChange={(e) =>
                      setFollowUpData({
                        ...followUpData,
                        endTime: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={followUpData.notes}
                  onChange={(e) =>
                    setFollowUpData({ ...followUpData, notes: e.target.value })
                  }
                  rows={3}
                  placeholder="Lý do tái khám, hướng điều trị..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-sm text-gray-600">
                <strong>Lưu ý:</strong> Lịch tái khám có thể dài hơn 1 giờ nếu
                cần thiết.
              </p>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setFollowUpId(null);
                  setFollowUpData({
                    date: "",
                    startTime: "",
                    endTime: "",
                    notes: "",
                  });
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateFollowUp}
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
              >
                Tạo lịch tái khám
              </button>
            </div>
          </div>
        </div>
      )}
    </DoctorLayout>
  );
}
