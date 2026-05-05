"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PatientLayout from "@/components/layout/PatientLayout";
import DatePicker from "@/components/appointments/DatePicker";
import { patientApi } from "@/lib/patientApi";
import { Doctor, Holiday, WorkSchedule } from "@/types";
import { ArrowLeft, User } from "lucide-react";

export default function SelectDateByDoctorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const doctorId = searchParams.get("doctorId");

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!doctorId) {
      router.push("/patient/appointments/book/by-doctor");
      return;
    }
    loadData();
  }, [doctorId]);

  const loadData = async () => {
    try {
      const today = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);

      const [doctorData, holidaysData, schedulesData] = await Promise.all([
        patientApi.getDoctorById(doctorId!),
        patientApi.getHolidays(),
        patientApi.getWorkSchedules({
          doctorId: doctorId!,
          startDate: today.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        }),
      ]);

      setDoctor(doctorData);
      setHolidays(holidaysData);
      setWorkSchedules(schedulesData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleContinue = () => {
    if (selectedDate && doctorId) {
      router.push(
        `/patient/appointments/book/by-doctor/select-time?doctorId=${doctorId}&date=${selectedDate}`,
      );
    }
  };

  // Get dates when doctor is not available
  const disabledDates = [
    ...holidays.map((h) => h.date),
    // Add dates without work schedules
  ];

  const today = new Date().toISOString().split("T")[0];

  if (loading) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PatientLayout>
    );
  }

  if (!doctor) {
    return (
      <PatientLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 mb-4">
              Không tìm thấy thông tin bác sĩ
            </p>
            <button
              onClick={() =>
                router.push("/patient/appointments/book/by-doctor")
              }
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
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Quay lại
        </button>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              {doctor.avatar ? (
                <img
                  src={doctor.avatar}
                  alt={doctor.user.fullName}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {doctor.user.fullName}
              </h2>
              <p className="text-blue-600">{doctor.specialty.name}</p>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Chọn ngày khám
        </h1>
        <p className="text-gray-600 mb-8">
          Chọn ngày phù hợp với lịch làm việc của bác sĩ
        </p>

        <DatePicker
          selectedDate={selectedDate}
          onSelectDate={handleDateSelect}
          disabledDates={disabledDates}
          minDate={today}
        />

        {selectedDate && (
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
