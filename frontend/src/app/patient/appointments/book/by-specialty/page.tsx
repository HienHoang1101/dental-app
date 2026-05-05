"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PatientLayout from "@/components/layout/PatientLayout";
import { patientApi } from "@/lib/patientApi";
import { Specialty } from "@/types";
import { ArrowLeft } from "lucide-react";

export default function BookBySpecialtyPage() {
  const router = useRouter();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSpecialties();
  }, []);

  const loadSpecialties = async () => {
    try {
      const data = await patientApi.getSpecialties();
      setSpecialties(data.filter((s) => s.isActive));
    } catch (error) {
      console.error("Failed to load specialties:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSpecialty = (specialtyId: string) => {
    router.push(
      `/patient/appointments/book/by-specialty/select-date?specialtyId=${specialtyId}`,
    );
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
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Quay lại
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Chọn chuyên khoa
        </h1>
        <p className="text-gray-600 mb-8">
          Vui lòng chọn chuyên khoa phù hợp với tình trạng của bạn
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {specialties.map((specialty) => (
            <button
              key={specialty.id}
              onClick={() => handleSelectSpecialty(specialty.id)}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left border-2 border-transparent hover:border-blue-500"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {specialty.name}
              </h3>
              {specialty.description && (
                <p className="text-gray-600 text-sm mb-3">
                  {specialty.description}
                </p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {specialty.doctorCount || 0} bác sĩ
                </span>
                <span className="text-blue-600 font-medium">Chọn →</span>
              </div>
            </button>
          ))}
        </div>

        {specialties.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Không có chuyên khoa nào</p>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
