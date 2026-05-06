"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import PatientLayout from "@/components/layout/PatientLayout";
import { patientApi } from "@/lib/patientApi";
import { Appointment } from "@/types";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { formatDateLong, parseLocalDate } from "@/lib/dateUtils";

export default function AppointmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    loadAppointment();
  }, [appointmentId]);

  const loadAppointment = async () => {
    try {
      const data = await patientApi.getAppointmentById(appointmentId);
      setAppointment(data);
    } catch (error) {
      console.error("Failed to load appointment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!cancelReason.trim()) {
      alert("Vui lòng nhập lý do hủy lịch");
      return;
    }

    setCancelling(true);
    try {
      await patientApi.cancelAppointment(appointmentId, cancelReason);
      alert("Hủy lịch hẹn thành công");
      setShowCancelModal(false);
      loadAppointment();
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
      alert("Không thể hủy lịch hẹn. Vui lòng thử lại.");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "confirmed":
        return "Đã xác nhận";
      case "completed":
        return "Đã hoàn thành";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(parseInt(price));
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

  if (!appointment) {
    return (
      <PatientLayout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Không tìm thấy lịch hẹn
            </h2>
            <p className="text-gray-600 mb-6">
              Lịch hẹn này không tồn tại hoặc đã bị xóa
            </p>
            <button
              onClick={() => router.push("/patient/appointments/history")}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Quay lại lịch sử
            </button>
          </div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Quay lại
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              Chi tiết lịch hẹn
            </h1>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(appointment.status)}`}
            >
              {getStatusText(appointment.status)}
            </span>
          </div>
        </div>

        {/* Appointment Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
            Thông tin lịch hẹn
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600">Ngày khám</p>
                <p className="font-semibold text-gray-900">
                  {formatDateLong(appointment.appointmentDate)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600">Giờ khám</p>
                <p className="font-semibold text-gray-900">
                  {appointment.timeSlot.startTime.substring(0, 5)} -{" "}
                  {appointment.timeSlot.endTime.substring(0, 5)}
                </p>
              </div>
            </div>

            {appointment.service && (
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Dịch vụ</p>
                  <p className="font-semibold text-gray-900">
                    {appointment.service.name}
                  </p>
                  <p className="text-sm text-blue-600">
                    {formatPrice(appointment.service.price)} -{" "}
                    {appointment.service.duration} phút
                  </p>
                </div>
              </div>
            )}

            {appointment.notes && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Ghi chú của bạn</p>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {appointment.notes}
                  </p>
                </div>
              </div>
            )}

            {appointment.cancellationReason && (
              <div className="flex items-start gap-3 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-600 font-medium">Lý do hủy</p>
                  <p className="text-red-900">
                    {appointment.cancellationReason}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Doctor Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
            Thông tin bác sĩ
          </h2>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {appointment.doctor.avatarUrl ? (
                <img
                  src={appointment.doctor.avatarUrl}
                  alt={appointment.doctor.fullName}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-10 w-10 text-blue-600" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {appointment.doctor.fullName}
              </h3>
              <p className="text-gray-600">
                {appointment.doctor.specialtyName}
              </p>
              {appointment.doctor.qualifications && (
                <p className="text-sm text-gray-500 mt-1">
                  {appointment.doctor.qualifications}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Patient Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b">
            Thông tin bệnh nhân
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600">Họ và tên</p>
                <p className="font-medium text-gray-900">
                  {appointment.healthRecord.fullName}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600">Ngày sinh</p>
                <p className="font-medium text-gray-900">
                  {parseLocalDate(
                    appointment.healthRecord.dateOfBirth,
                  ).toLocaleDateString("vi-VN")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600">Số điện thoại</p>
                <p className="font-medium text-gray-900">
                  {appointment.healthRecord.phone}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">
                  {appointment.healthRecord.email}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 md:col-span-2">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600">Địa chỉ</p>
                <p className="font-medium text-gray-900">
                  {appointment.healthRecord.address}
                </p>
              </div>
            </div>

            {appointment.healthRecord.allergyNotes && (
              <div className="flex items-start gap-3 md:col-span-2 bg-yellow-50 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-yellow-600 font-medium">
                    Tiền sử dị ứng
                  </p>
                  <p className="text-yellow-900">
                    {appointment.healthRecord.allergyNotes}
                  </p>
                </div>
              </div>
            )}

            {appointment.healthRecord.medicalHistory && (
              <div className="flex items-start gap-3 md:col-span-2">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Tiền sử bệnh</p>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {appointment.healthRecord.medicalHistory}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {(appointment.status === "pending" ||
          appointment.status === "confirmed") && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Hành động
            </h2>
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Hủy lịch hẹn
            </button>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Xác nhận hủy lịch hẹn
              </h3>
              <p className="text-gray-600 mb-4">
                Vui lòng cho chúng tôi biết lý do bạn muốn hủy lịch hẹn này:
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                placeholder="Nhập lý do hủy lịch..."
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  disabled={cancelling}
                >
                  Đóng
                </button>
                <button
                  onClick={handleCancelAppointment}
                  disabled={cancelling || !cancelReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {cancelling ? "Đang xử lý..." : "Xác nhận hủy"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
