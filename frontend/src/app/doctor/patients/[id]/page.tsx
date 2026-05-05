"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DoctorLayout from "@/components/layout/DoctorLayout";
import { doctorApi } from "@/lib/doctorApi";
import {
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  FileText,
  Clock,
  ArrowLeft,
} from "lucide-react";

interface PatientHealthRecord {
  patient: User;
  profile: {
    id: string;
    userId: string;
    dateOfBirth?: string;
    gender?: string;
    allergyNotes?: string;
    medicalHistory?: string;
    updatedAt: string;
  } | null;
  appointments: Array<{
    id: string;
    patientName: string;
    doctorName: string;
    specialtyName: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    status: string;
    serviceName?: string;
  }>;
}

export default function PatientHealthRecordPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;
  const [healthRecord, setHealthRecord] = useState<PatientHealthRecord | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHealthRecord();
  }, [patientId]);

  const loadHealthRecord = async () => {
    try {
      const data = await doctorApi.getPatientHealthRecord(patientId);
      setHealthRecord(data);
    } catch (error: any) {
      console.error("Failed to load health record:", error);
      setError(
        error.response?.data?.message || "Không thể tải hồ sơ bệnh nhân",
      );
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

  if (loading) {
    return (
      <DoctorLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải hồ sơ...</p>
        </div>
      </DoctorLayout>
    );
  }

  if (error || !healthRecord) {
    return (
      <DoctorLayout>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">
            {error || "Không tìm thấy hồ sơ bệnh nhân"}
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại
          </button>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Hồ sơ bệnh nhân</h1>
        </div>

        {/* Patient Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl text-blue-600 font-medium">
                {healthRecord.patient.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {healthRecord.patient.fullName}
              </h2>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {healthRecord.patient.email}
                </div>
                {healthRecord.patient.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {healthRecord.patient.phone}
                  </div>
                )}
                {healthRecord.profile?.dateOfBirth && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    Ngày sinh:{" "}
                    {new Date(
                      healthRecord.profile.dateOfBirth,
                    ).toLocaleDateString("vi-VN")}
                  </div>
                )}
                {healthRecord.profile?.gender && (
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="w-4 h-4 mr-2" />
                    Giới tính:{" "}
                    {healthRecord.profile.gender === "male"
                      ? "Nam"
                      : healthRecord.profile.gender === "female"
                        ? "Nữ"
                        : "Khác"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Medical Information */}
        {healthRecord.profile && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Thông tin y tế
            </h3>
            <div className="space-y-4">
              {healthRecord.profile.allergyNotes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dị ứng
                  </label>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      {healthRecord.profile.allergyNotes}
                    </p>
                  </div>
                </div>
              )}
              {healthRecord.profile.medicalHistory && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiền sử bệnh
                  </label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-800">
                      {healthRecord.profile.medicalHistory}
                    </p>
                  </div>
                </div>
              )}
              {!healthRecord.profile.allergyNotes &&
                !healthRecord.profile.medicalHistory && (
                  <p className="text-sm text-gray-500 italic">
                    Chưa có thông tin y tế
                  </p>
                )}
            </div>
          </div>
        )}

        {/* Appointment History */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Lịch sử khám bệnh
          </h3>
          {healthRecord.appointments.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              Chưa có lịch sử khám bệnh
            </p>
          ) : (
            <div className="space-y-3">
              {healthRecord.appointments.map((appointment) => (
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
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>
                            {appointment.startTime} - {appointment.endTime}
                          </span>
                        </div>
                        {appointment.serviceName && (
                          <div className="text-gray-600">
                            Dịch vụ: {appointment.serviceName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DoctorLayout>
  );
}
