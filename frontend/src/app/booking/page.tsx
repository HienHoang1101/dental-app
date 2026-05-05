"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { patientApi } from "@/lib/patientApi";
import { Calendar, User, Clock } from "lucide-react";

export default function BookingPage() {
  const router = useRouter();
  const [hasHealthRecord, setHasHealthRecord] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkHealthRecord();
  }, []);

  const checkHealthRecord = async () => {
    try {
      await patientApi.getHealthRecord();
      setHasHealthRecord(true);
    } catch (error) {
      setHasHealthRecord(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasHealthRecord) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="bg-yellow-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <User className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Chưa có hồ sơ sức khỏe</h2>
          <p className="text-gray-600 mb-6">
            Bạn cần tạo hồ sơ sức khỏe trước khi đặt lịch khám. Vui lòng cung
            cấp thông tin cá nhân và tình trạng sức khỏe của bạn.
          </p>
          <button
            onClick={() => router.push("/booking/create-profile")}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Tạo hồ sơ ngay
          </button>
          <button
            onClick={() => router.push("/patient/dashboard")}
            className="w-full mt-3 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Đặt lịch khám</h1>
          <p className="text-gray-600">
            Chọn hình thức đặt khám phù hợp với bạn
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* By Specialty */}
          <button
            onClick={() => router.push("/booking/by-specialty")}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow text-left group"
          >
            <div className="bg-blue-100 p-4 rounded-lg w-fit mb-4 group-hover:bg-blue-200 transition-colors">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Khám theo chuyên khoa
            </h3>
            <p className="text-gray-600 text-sm">
              Chọn chuyên khoa phù hợp với vấn đề răng miệng của bạn
            </p>
            <div className="mt-4 text-blue-600 font-medium group-hover:translate-x-2 transition-transform inline-block">
              Chọn →
            </div>
          </button>

          {/* By Doctor */}
          <button
            onClick={() => router.push("/booking/by-doctor")}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow text-left group"
          >
            <div className="bg-green-100 p-4 rounded-lg w-fit mb-4 group-hover:bg-green-200 transition-colors">
              <User className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Khám theo bác sĩ</h3>
            <p className="text-gray-600 text-sm">
              Tìm kiếm và chọn bác sĩ mà bạn tin tưởng
            </p>
            <div className="mt-4 text-green-600 font-medium group-hover:translate-x-2 transition-transform inline-block">
              Chọn →
            </div>
          </button>

          {/* By Date */}
          <button
            onClick={() => router.push("/booking/by-date")}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow text-left group"
          >
            <div className="bg-purple-100 p-4 rounded-lg w-fit mb-4 group-hover:bg-purple-200 transition-colors">
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Khám theo ngày</h3>
            <p className="text-gray-600 text-sm">
              Chọn ngày và giờ phù hợp với lịch trình của bạn
            </p>
            <div className="mt-4 text-purple-600 font-medium group-hover:translate-x-2 transition-transform inline-block">
              Chọn →
            </div>
          </button>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/patient/dashboard")}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Quay lại Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
