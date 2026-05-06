"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PatientLayout from "@/components/layout/PatientLayout";
import { patientApi } from "@/lib/patientApi";
import { Service, Specialty } from "@/types";
import { ArrowLeft, Clock, DollarSign } from "lucide-react";
import { formatDateShort } from "@/lib/dateUtils";

export default function SelectServiceByDatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const specialtyId = searchParams.get("specialtyId");
  const date = searchParams.get("date");

  const [services, setServices] = useState<Service[]>([]);
  const [specialtyName, setSpecialtyName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!specialtyId || !date) {
      router.push("/patient/appointments/book/by-date");
      return;
    }
    loadData();
  }, [specialtyId, date]);

  const loadData = async () => {
    try {
      const [servicesData, specialtiesData] = await Promise.all([
        patientApi.getServices(undefined, specialtyId!), // Filter by specialtyId
        patientApi.getSpecialties(),
      ]);

      setServices(servicesData.filter((s) => s.isActive));

      // Get specialty name
      const specialty = specialtiesData.find((s) => s.id === specialtyId);
      setSpecialtyName(specialty?.name || "");
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectService = (serviceId: string) => {
    router.push(
      `/patient/appointments/book/by-specialty/select-doctor?specialtyId=${specialtyId}&serviceId=${serviceId}&date=${date}`,
    );
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(parseInt(price));
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

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Chọn dịch vụ</h1>
        <div className="mb-6">
          <p className="text-gray-600 mb-1">
            Ngày khám:{" "}
            <span className="font-semibold">{formatDateShort(date!)}</span>
          </p>
          {specialtyName && (
            <p className="text-gray-600 mb-1">
              Chuyên khoa:{" "}
              <span className="font-semibold text-blue-600">
                {specialtyName}
              </span>
            </p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Vui lòng chọn dịch vụ bạn muốn sử dụng. Tất cả dịch vụ đều có sẵn
            cho chuyên khoa này.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => handleSelectService(service.id)}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all text-left border-2 border-transparent hover:border-blue-500"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {service.name}
              </h3>
              {service.description && (
                <p className="text-gray-600 text-sm mb-4">
                  {service.description}
                </p>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-blue-600">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-semibold">
                      {formatPrice(service.price)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{service.duration} phút</span>
                  </div>
                </div>
                <span className="text-blue-600 font-medium">Chọn →</span>
              </div>
            </button>
          ))}
        </div>

        {services.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Không có dịch vụ nào</p>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
