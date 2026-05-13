"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PatientLayout from "@/components/layout/PatientLayout";
import { patientApi } from "@/lib/patientApi";
import { HealthRecord } from "@/types";
import { AlertCircle } from "lucide-react";

export default function BookAppointmentPage() {
  const router = useRouter();
  const [healthRecord, setHealthRecord] = useState<HealthRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    checkHealthRecord();
  }, []);

  const checkHealthRecord = async () => {
    try {
      setCheckingProfile(true);
      const record = await patientApi.getHealthRecord();
      setHealthRecord(record);

      if (!record) {
        // Redirect to create health record
        router.push("/patient/appointments/book/create-profile");
      }
    } catch (error) {
      console.error("Failed to check health record:", error);
    } finally {
      setCheckingProfile(false);
      setLoading(false);
    }
  };

  if (loading || checkingProfile) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang kiểm tra hồ sơ...</p>
          </div>
        </div>
      </PatientLayout>
    );
  }

  if (!healthRecord) {
    return null; // Will redirect
  }

  return (
    <PatientLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Đặt lịch khám</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Chọn hình thức đặt khám
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() =>
                router.push("/patient/appointments/book/by-specialty")
              }
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <div className="text-center">
                <div className="text-4xl mb-3">🏥</div>
                <h3 className="font-semibold text-lg mb-2">
                  Khám theo chuyên khoa
                </h3>
                <p className="text-sm text-gray-600">
                  Chọn chuyên khoa phù hợp với tình trạng của bạn
                </p>
              </div>
            </button>

            <button
              onClick={() => router.push("/patient/appointments/book/by-date")}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <div className="text-center">
                <div className="text-4xl mb-3">📅</div>
                <h3 className="font-semibold text-lg mb-2">Khám theo ngày</h3>
                <p className="text-sm text-gray-600">
                  Chọn ngày khám phù hợp với lịch trình của bạn
                </p>
              </div>
            </button>

            <button
              onClick={() =>
                router.push("/patient/appointments/book/by-doctor")
              }
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <div className="text-center">
                <div className="text-4xl mb-3">👨‍⚕️</div>
                <h3 className="font-semibold text-lg mb-2">Khám theo bác sĩ</h3>
                <p className="text-sm text-gray-600">
                  Chọn bác sĩ mà bạn tin tưởng
                </p>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Lưu ý khi đặt lịch:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Vui lòng đến trước giờ hẹn 15 phút</li>
                <li>Mang theo CMND/CCCD khi đến khám</li>
                <li>Nếu cần hủy lịch, vui lòng thông báo trước 24 giờ</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PatientLayout>
  );
}
