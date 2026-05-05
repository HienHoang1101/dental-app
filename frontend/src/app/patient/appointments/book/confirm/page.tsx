"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PatientLayout from "@/components/layout/PatientLayout";
import { patientApi } from "@/lib/patientApi";
import { Doctor, TimeSlot, HealthRecord } from "@/types";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle,
} from "lucide-react";

export default function ConfirmAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const doctorId = searchParams.get("doctorId");
  const timeSlotId = searchParams.get("timeSlotId");
  const date = searchParams.get("date");

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [timeSlot, setTimeSlot] = useState<TimeSlot | null>(null);
  const [healthRecord, setHealthRecord] = useState<HealthRecord | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!doctorId || !timeSlotId || !date) {
      router.push("/patient/appointments/book");
      return;
    }
    loadData();
  }, [doctorId, timeSlotId, date]);

  const loadData = async () => {
    try {
      const [doctorData, slotsData, healthRecordData] = await Promise.all([
        patientApi.getDoctorById(doctorId!),
        patientApi.getAvailableTimeSlots({ doctorId: doctorId!, date: date! }),
        patientApi.getHealthRecord(),
      ]);

      setDoctor(doctorData);
      const slot = slotsData.find((s) => s.id === timeSlotId);
      setTimeSlot(slot || null);
      setHealthRecord(healthRecordData);

      if (!healthRecordData) {
        router.push("/patient/appointments/book/create-profile");
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      setError("Không thể tải thông tin. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!doctor || !timeSlot || !healthRecord) return;

    setError("");
    setSubmitting(true);

    try {
      await patientApi.createAppointment({
        doctorId: doctor.id,
        timeSlotId: timeSlot.id,
        appointmentDate: date!,
        notes: notes.trim() || undefined,
        serviceId: undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/patient/appointments/history");
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Không thể đặt lịch hẹn. Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
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

  if (success) {
    return (
      <PatientLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Đặt lịch thành công!
            </h2>
            <p className="text-gray-600 mb-6">
              Lịch hẹn của bạn đã được ghi nhận. Chúng tôi sẽ xác nhận trong
              thời gian sớm nhất.
            </p>
            <p className="text-sm text-gray-500">
              Đang chuyển hướng đến lịch sử đặt khám...
            </p>
          </div>
        </div>
      </PatientLayout>
    );
  }

  if (!doctor || !timeSlot || !healthRecord) {
    return (
      <PatientLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 mb-4">
              Không thể tải thông tin đặt lịch
            </p>
            <button
              onClick={() => router.push("/patient/appointments/book")}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Quay lại
            </button>
          </div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Quay lại
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Xác nhận thông tin đặt khám
        </h1>
        <p className="text-gray-600 mb-8">
          Vui lòng kiểm tra kỹ thông tin trước khi xác nhận
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b">
            Thông tin lịch hẹn
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Bác sĩ</p>
                <p className="font-semibold text-gray-900">
                  {doctor.user.fullName}
                </p>
                <p className="text-sm text-gray-600">{doctor.specialty.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Ngày khám</p>
                <p className="font-semibold text-gray-900">
                  {new Date(date!).toLocaleDateString("vi-VN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Giờ khám</p>
                <p className="font-semibold text-gray-900">
                  {timeSlot.startTime.substring(0, 5)} -{" "}
                  {timeSlot.endTime.substring(0, 5)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b">
            Thông tin bệnh nhân
          </h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Họ và tên</p>
              <p className="font-medium text-gray-900">
                {healthRecord.fullName}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Ngày sinh</p>
              <p className="font-medium text-gray-900">
                {new Date(healthRecord.dateOfBirth).toLocaleDateString("vi-VN")}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Số điện thoại</p>
              <p className="font-medium text-gray-900">{healthRecord.phone}</p>
            </div>
            <div>
              <p className="text-gray-600">Email</p>
              <p className="font-medium text-gray-900">{healthRecord.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b">
            Ghi chú (không bắt buộc)
          </h2>
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-gray-400 mt-2" />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Mô tả triệu chứng hoặc lý do khám..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Lưu ý:</strong> Vui lòng đến trước giờ hẹn 15 phút và mang
            theo CMND/CCCD. Nếu cần hủy lịch, vui lòng thông báo trước 24 giờ.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Quay lại
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {submitting ? "Đang xử lý..." : "Xác nhận đặt lịch"}
          </button>
        </div>
      </div>
    </PatientLayout>
  );
}
