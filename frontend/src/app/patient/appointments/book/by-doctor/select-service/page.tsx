"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PatientLayout from "@/components/layout/PatientLayout";
import { patientApi } from "@/lib/patientApi";
import { Doctor, Service } from "@/types";
import { ArrowLeft, DollarSign, Clock, CheckCircle } from "lucide-react";

export default function SelectServicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const doctorId = searchParams.get("doctorId");

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!doctorId) {
      router.push("/patient/appointments/book/by-doctor");
      return;
    }
    loadData();
  }, [doctorId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const doctorData = await patientApi.getDoctorById(doctorId!);
      setDoctor(doctorData);

      // Load services based on doctor's specialty
      const servicesData = await patientApi.getServicesByCategory(
        doctorData.specialty,
      );
      setServices(servicesData);
    } catch (error) {
      console.error("Failed to load data:", error);
      setError("Không thể tải danh sách dịch vụ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!selectedService) return;

    router.push(
      `/patient/appointments/book/by-doctor/select-date?doctorId=${doctorId}&serviceId=${selectedService}`,
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

  if (error || !doctor) {
    return (
      <PatientLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error || "Không thể tải thông tin bác sĩ"}
          </div>
          <button
            onClick={() => router.push("/patient/appointments/book/by-doctor")}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Quay lại chọn bác sĩ
          </button>
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
          Chọn dịch vụ khám
        </h1>
        <p className="text-gray-600 mb-6">
          Bác sĩ: <span className="font-semibold">{doctor.fullName}</span> -{" "}
          {doctor.specialty}
        </p>

        {services.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
            Chuyên khoa này chưa có dịch vụ nào. Vui lòng liên hệ phòng khám để
            được hỗ trợ.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => setSelectedService(service.id)}
                  className={`
                    relative border-2 rounded-lg p-6 cursor-pointer transition-all
                    ${
                      selectedService === service.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 bg-white"
                    }
                  `}
                >
                  {selectedService === service.id && (
                    <div className="absolute top-4 right-4">
                      <CheckCircle className="h-6 w-6 text-blue-600" />
                    </div>
                  )}

                  <h3 className="text-lg font-semibold text-gray-900 mb-2 pr-8">
                    {service.name}
                  </h3>

                  {service.description && (
                    <p className="text-sm text-gray-600 mb-4">
                      {service.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-700">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{service.duration} phút</span>
                    </div>
                    <div className="flex items-center text-blue-600 font-semibold">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span>{formatPrice(service.price)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Quay lại
              </button>
              <button
                onClick={handleContinue}
                disabled={!selectedService}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Tiếp tục
              </button>
            </div>
          </>
        )}
      </div>
    </PatientLayout>
  );
}
