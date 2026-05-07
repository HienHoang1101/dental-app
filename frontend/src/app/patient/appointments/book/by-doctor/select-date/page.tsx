"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PatientLayout from "@/components/layout/PatientLayout";
import DatePicker from "@/components/appointments/DatePicker";
import { patientApi } from "@/lib/patientApi";
import { Doctor, Holiday } from "@/types";
import { ArrowLeft, User, Clock, Calendar as CalendarIcon } from "lucide-react";
import { getTodayString, formatDateToString } from "@/lib/dateUtils";

export default function SelectDateByDoctorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const doctorId = searchParams.get("doctorId");
  const serviceId = searchParams.get("serviceId");

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [weeklySchedules, setWeeklySchedules] = useState<Array<{ dayOfWeek: number; isActive: boolean }>>([]);
  const [availableSlots, setAvailableSlots] = useState<
    Array<{ start: string; end: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!doctorId || !serviceId) {
      router.push("/patient/appointments/book/by-doctor");
      return;
    }
    loadData();
  }, [doctorId, serviceId]);

  useEffect(() => {
    if (selectedDate && doctorId) {
      loadAvailableSlots();
    }
  }, [selectedDate, doctorId]);

  const loadData = async () => {
    try {
      const [doctorData, holidaysData, schedulesData] = await Promise.all([
        patientApi.getDoctorById(doctorId!),
        patientApi.getHolidays(),
        patientApi.getWeeklySchedulesV2(doctorId!),
      ]);

      setDoctor(doctorData);
      setHolidays(holidaysData);
      setWeeklySchedules(schedulesData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const slots = await patientApi.getAvailableSlotsV2({
        doctorId: doctorId!,
        date: selectedDate!,
      });
      setAvailableSlots(slots);
    } catch (error) {
      console.error("Failed to load available slots:", error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleContinue = () => {
    if (selectedSlot && doctorId && serviceId && selectedDate) {
      // Pass startTime and endTime to confirm page
      const params = new URLSearchParams({
        doctorId: doctorId,
        serviceId: serviceId,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        date: selectedDate,
      });
      router.push(`/patient/appointments/book/confirm?${params.toString()}`);
    }
  };

  const formatTimeSlot = (slot: { start: string; end: string }): string => {
    const start = new Date(slot.start);
    const end = new Date(slot.end);
    return `${start.getHours().toString().padStart(2, "0")}:${start.getMinutes().toString().padStart(2, "0")} - ${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`;
  };

  const groupSlotsBySession = (
    slots: Array<{ start: string; end: string }>,
  ) => {
    const morning: Array<{ start: string; end: string }> = [];
    const afternoon: Array<{ start: string; end: string }> = [];

    slots.forEach((slot) => {
      const hour = new Date(slot.start).getHours();
      if (hour < 12) {
        morning.push(slot);
      } else {
        afternoon.push(slot);
      }
    });

    return { morning, afternoon };
  };

  // Get dates when doctor is not available
  const disabledDates = holidays.map((h) => h.date);

  // Calculate available days of week (0=Sunday, 1=Monday... from JS Date)
  // Backend returns dayOfWeek: 1=Monday..7=Sunday
  const activeSchedules = weeklySchedules.filter(s => s.isActive);
  const availableDaysOfWeek = Array.from(
    new Set(activeSchedules.map(s => s.dayOfWeek === 7 ? 0 : s.dayOfWeek))
  );

  const today = getTodayString();

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

  const { morning, afternoon } = groupSlotsBySession(availableSlots);

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
              {doctor.avatarUrl ? (
                <img
                  src={doctor.avatarUrl}
                  alt={doctor.fullName}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {doctor.fullName}
              </h2>
              <p className="text-blue-600">{doctor.specialty}</p>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Chọn ngày và giờ khám
        </h1>
        <p className="text-gray-600 mb-8">
          Chọn ngày phù hợp, sau đó chọn khung giờ khả dụng
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Date Picker */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Chọn ngày</h3>
            </div>
            <DatePicker
              selectedDate={selectedDate}
              onSelectDate={handleDateSelect}
              disabledDates={disabledDates}
              minDate={today}
              availableDaysOfWeek={availableDaysOfWeek}
            />
          </div>

          {/* Time Slots */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Chọn giờ</h3>
            </div>

            {!selectedDate ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Vui lòng chọn ngày trước</p>
              </div>
            ) : loadingSlots ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Đang tải khung giờ...</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Không có khung giờ khả dụng</p>
                <p className="text-sm mt-1">Vui lòng chọn ngày khác</p>
              </div>
            ) : (
              <div className="space-y-6 max-h-[500px] overflow-y-auto">
                {/* Morning Slots */}
                {morning.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Buổi sáng
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {morning.map((slot, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-3 rounded-lg border-2 transition-all text-center ${
                            selectedSlot?.start === slot.start
                              ? "border-blue-600 bg-blue-50"
                              : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium text-sm">
                              {formatTimeSlot(slot)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Afternoon Slots */}
                {afternoon.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Buổi chiều
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {afternoon.map((slot, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-3 rounded-lg border-2 transition-all text-center ${
                            selectedSlot?.start === slot.start
                              ? "border-blue-600 bg-blue-50"
                              : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium text-sm">
                              {formatTimeSlot(slot)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {selectedDate && selectedSlot && (
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
