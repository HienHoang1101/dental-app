import { Appointment } from "@/types";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";

interface DoctorAppointmentCardProps {
  appointment: Appointment;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  onComplete: (id: string) => void;
  onFollowUp: (appointment: Appointment) => void;
  onPrescription: (appointment: Appointment) => void;
}

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

export default function DoctorAppointmentCard({
  appointment,
  onConfirm,
  onCancel,
  onComplete,
  onFollowUp,
  onPrescription,
}: DoctorAppointmentCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}
            >
              {getStatusText(appointment.status)}
            </span>
            <span className="text-sm text-gray-500">
              {new Date(appointment.appointmentDate).toLocaleDateString("vi-VN")}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="font-medium">{appointment.patient.fullName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {appointment.timeSlot.startTime} - {appointment.timeSlot.endTime}
              </span>
            </div>
            {appointment.service && (
              <div className="text-sm text-gray-600">
                Dịch vụ: {appointment.service.name}
              </div>
            )}
            {appointment.notes && (
              <div className="text-sm text-gray-600 mt-2">
                <span className="font-medium">Ghi chú:</span> {appointment.notes}
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

        <div className="flex flex-wrap gap-2 ml-4">
          {appointment.status === "pending" && (
            <>
              <button
                onClick={() => onConfirm(appointment.id)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Xác nhận"
              >
                <CheckCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => onCancel(appointment.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Hủy"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </>
          )}
          {appointment.status === "confirmed" && (
            <>
              <button
                onClick={() => onPrescription(appointment)}
                className="px-3 py-1.5 text-sm bg-orange-600 text-white hover:bg-orange-700 rounded-lg transition-colors flex items-center"
                title="Kê đơn thuốc"
              >
                <FileText className="w-4 h-4 mr-1" />
                Kê đơn
              </button>
              <button
                onClick={() => onFollowUp(appointment)}
                className="px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
                title="Tạo lịch tái khám"
              >
                Tái khám
              </button>
              <button
                onClick={() => onComplete(appointment.id)}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                title="Hoàn thành"
              >
                Hoàn thành
              </button>
            </>
          )}
          {appointment.status === "completed" && (
            <button
              onClick={() => onPrescription(appointment)}
              className="px-3 py-1.5 text-sm bg-orange-600 text-white hover:bg-orange-700 rounded-lg transition-colors flex items-center"
              title="Xem/Sửa đơn thuốc"
            >
              <FileText className="w-4 h-4 mr-1" />
              Đơn thuốc
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
