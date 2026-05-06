"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import { adminApi } from "@/lib/adminApi";
import { Appointment } from "@/types";

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadAppointment();
  }, []);

  const loadAppointment = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/admin/appointments/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      const data = await response.json();
      setAppointment(data.data);
    } catch (error) {
      console.error("Failed to load appointment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!appointment) return;

    const confirmMessage =
      newStatus === "confirmed"
        ? "Xác nhận lịch hẹn này?"
        : newStatus === "cancelled"
          ? "Hủy lịch hẹn này?"
          : newStatus === "completed"
            ? "Đánh dấu lịch hẹn đã hoàn thành?"
            : "Cập nhật trạng thái?";

    if (!confirm(confirmMessage)) return;

    setUpdating(true);
    try {
      await adminApi.updateAppointment(appointment.id, { status: newStatus });
      await loadAppointment();
      alert("Cập nhật thành công!");
    } catch (error) {
      console.error("Failed to update appointment:", error);
      alert("Cập nhật thất bại!");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    const labels = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
    };
    return (
      <span
        className={`px-3 py-1 text-sm font-semibold rounded-full ${styles[status as keyof typeof styles]}`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!appointment) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Không tìm thấy lịch hẹn</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Chi tiết lịch hẹn
          </h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Quay lại
          </button>
        </div>

        {/* Status and Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold mb-2">Trạng thái</h2>
              {getStatusBadge(appointment.status)}
            </div>
            <div className="flex gap-2">
              {appointment.status === "pending" && (
                <>
                  <button
                    onClick={() => handleStatusUpdate("confirmed")}
                    disabled={updating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Xác nhận
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("cancelled")}
                    disabled={updating}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Hủy
                  </button>
                </>
              )}
              {appointment.status === "confirmed" && (
                <button
                  onClick={() => handleStatusUpdate("completed")}
                  disabled={updating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Hoàn thành
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Appointment Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Thông tin lịch hẹn</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ngày khám
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(appointment.appointmentDate).toLocaleDateString(
                  "vi-VN",
                )}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Giờ khám
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {appointment.timeSlot.startTime} -{" "}
                {appointment.timeSlot.endTime}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Dịch vụ
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {appointment.service?.name || "-"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Giá dịch vụ
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {appointment.service?.price
                  ? `${appointment.service.price} VNĐ`
                  : "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Patient Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Thông tin bệnh nhân</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Họ tên
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {appointment.patient.fullName}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {appointment.patient.email}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Số điện thoại
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {appointment.patient.phone || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Doctor Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Thông tin bác sĩ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Họ tên
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {appointment.doctor.fullName}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Chuyên khoa
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {appointment.doctor.specialtyName}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {appointment.notes && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Ghi chú</h2>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {appointment.notes}
            </p>
          </div>
        )}

        {/* Cancellation Reason */}
        {appointment.cancellationReason && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Lý do hủy</h2>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {appointment.cancellationReason}
            </p>
          </div>
        )}

        {/* Timestamps */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Thông tin khác</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ngày tạo
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(appointment.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cập nhật lần cuối
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(appointment.updatedAt).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
