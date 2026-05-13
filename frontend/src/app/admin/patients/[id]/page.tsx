"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import { adminApi } from "@/lib/adminApi";

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatient();
  }, []);

  const loadPatient = async () => {
    try {
      const data = await adminApi.getPatient(params.id as string);
      setPatient(data);
    } catch (error) {
      console.error("Failed to load patient:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!patient) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Không tìm thấy bệnh nhân</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Chi tiết bệnh nhân
          </h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Quay lại
          </button>
        </div>

        {/* Patient Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Thông tin cá nhân</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Họ tên
              </label>
              <p className="mt-1 text-sm text-gray-900">{patient.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <p className="mt-1 text-sm text-gray-900">{patient.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Số điện thoại
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {patient.phone || "-"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ngày sinh
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {patient.dateOfBirth
                  ? new Date(patient.dateOfBirth).toLocaleDateString("vi-VN")
                  : "-"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Giới tính
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {patient.gender === "male"
                  ? "Nam"
                  : patient.gender === "female"
                    ? "Nữ"
                    : patient.gender || "-"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Trạng thái
              </label>
              <span
                className={`inline-flex mt-1 px-2 py-1 text-xs font-semibold rounded-full ${
                  patient.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {patient.isActive ? "Hoạt động" : "Không hoạt động"}
              </span>
            </div>
          </div>
        </div>

        {/* Medical Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Thông tin y tế</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Dị ứng
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {patient.allergies || "Không có"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tiền sử bệnh
              </label>
              <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                {patient.medicalHistory || "Không có"}
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Thông tin khác</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ngày tạo
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(patient.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
