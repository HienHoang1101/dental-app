"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PatientLayout from "@/components/layout/PatientLayout";
import DatePicker from "@/components/appointments/DatePicker";
import { patientApi } from "@/lib/patientApi";
import { Holiday } from "@/types";
import { ArrowLeft } from "lucide-react";

export default function BookByDatePage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    try {
      const data = await patientApi.getHolidays();
      setHolidays(data);
    } catch (error) {
      console.error("Failed to load holidays:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleContinue = () => {
    if (selectedDate) {
      router.push(
        `/patient/appointments/book/by-date/select-specialty?date=${selectedDate}`,
      );
    }
  };

  const disabledDates = holidays.map((h) => h.date);
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

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Chọn ngày khám
        </h1>
        <p className="text-gray-600 mb-8">
          Chọn ngày phù hợp với lịch trình của bạn
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
