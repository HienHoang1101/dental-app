"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PatientLayout from "@/components/layout/PatientLayout";
import { patientApi } from "@/lib/patientApi";
import { Doctor, TimeSlot, DoctorSummary } from "@/types";
import { ArrowLeft, Clock, User } from "lucide-react";

export default function SelectDoctorBySpecialtyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const specialtyId = searchParams.get("specialtyId");
  const date = searchParams.get("date");

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!specialtyId || !date) {
      router.push("/patient/appointments/book/by-specialty");
      return;
    }
    loadDoctors();
  }, [specialtyId, date]);

  const loadDoctors = async () => {
    try {
      const data = await patientApi.getDoctors({ specialtyId });
      setDoctors(data.filter((d) => d.isActive));
    } catch (error) {
      console.error("Failed to load doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSelect = async (doctorId: string) => {
    setSelectedDoctor(doctorId);
    setSelectedSlot(null);
    setLoadingSlots(true);

    try {
      const slots = await patientApi.getAvailableTimeSlots({
        doctorId,
        date: date!,
      });
      setTimeSlots(slots);
    } catch (error) {
      console.error("Failed to load time slots:", error);
      setTimeSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleContinue = () => {
    if (selectedDoctor && selectedSlot) {
      router.push(
        `/patient/appointments/book/confirm?doctorId=${selectedDoctor}&timeSlotId=${selectedSlot}&date=${date}`,
      );
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

  return (
    <PatientLayout>
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Quay lại
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Chọn bác sĩ và khung giờ
        </h1>
        <p className="text-gray-600 mb-8">
          Ngày khám: {new Date(date!).toLocaleDateString("vi-VN")}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Doctors List */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Chọn bác sĩ</h2>
            <div className="space-y-3">
              {doctors.map((doctor) => (
                <button
                  key={doctor.id}
                  onClick={() => handleDoctorSelect(doctor.id)}
                  className={`w-full bg-white p-4 rounded-lg shadow-md text-left transition-all ${
                    selectedDoctor === doctor.id
                      ? "border-2 border-blue-600"
                      : "border-2 border-transparent hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {doctor.avatar ? (
                        <img
                          src={doctor.avatar}
                          alt={doctor.user.fullName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">
                        {doctor.user.fullName}
                      </h3>
                      {doctor.qualifications && (
                        <p className="text-sm text-gray-600 truncate">
                          {doctor.qualifications}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {doctors.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-500">
                  Không có bác sĩ nào khả dụng cho ngày này
                </p>
              </div>
            )}
          </div>

          {/* Time Slots */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Chọn khung giờ</h2>
            {!selectedDoctor ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-500">Vui lòng chọn bác sĩ trước</p>
              </div>
            ) : loadingSlots ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Đang tải khung giờ...</p>
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-500">
                  Không có khung giờ khả dụng cho bác sĩ này
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="grid grid-cols-2 gap-3">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot.id)}
                      disabled={!slot.isAvailable}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        selectedSlot === slot.id
                          ? "border-blue-600 bg-blue-50"
                          : slot.isAvailable
                            ? "border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                            : "border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">
                          {slot.startTime.substring(0, 5)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600">
                        {slot.isAvailable
                          ? `${slot.remainingCapacity} chỗ`
                          : "Đã đầy"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedDoctor && selectedSlot && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleContinue}
              className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Tiếp tục
            </button>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
