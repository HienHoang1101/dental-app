"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import { adminApi } from "@/lib/adminApi";
import { Doctor } from "@/types";

export default function DoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const response = await adminApi.getDoctors();
      setDoctors(response || []);
    } catch (error) {
      console.error("Failed to load doctors:", error);
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Quản lý bác sĩ</h1>
          <button
            onClick={() => router.push("/admin/doctors/create")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Thêm bác sĩ mới
          </button>
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {doctor.avatarUrl ? (
                    <img
                      src={doctor.avatarUrl}
                      alt={doctor.fullName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-2xl font-semibold text-blue-600">
                        {doctor.fullName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {doctor.fullName}
                  </h3>
                  <p className="text-sm text-gray-500">{doctor.specialty}</p>
                  {doctor.user && (
                    <>
                      <p className="text-sm text-gray-500 mt-1">
                        {doctor.user.email}
                      </p>
                      <p className="text-sm text-gray-500">
                        {doctor.user.phone}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {doctor.degree && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">{doctor.degree}</p>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    doctor.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {doctor.isActive ? "Hoạt động" : "Không hoạt động"}
                </span>
                <button
                  onClick={() => router.push(`/admin/doctors/${doctor.id}`)}
                  className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                >
                  Chi tiết →
                </button>
              </div>
            </div>
          ))}
        </div>

        {doctors.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Chưa có bác sĩ nào
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
