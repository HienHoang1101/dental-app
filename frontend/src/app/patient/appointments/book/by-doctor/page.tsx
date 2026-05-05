"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PatientLayout from "@/components/layout/PatientLayout";
import { patientApi } from "@/lib/patientApi";
import { Doctor, Specialty } from "@/types";
import { ArrowLeft, Search, User } from "lucide-react";

export default function BookByDoctorPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedWeekday, setSelectedWeekday] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedSession, setSelectedSession] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [doctorsData, specialtiesData] = await Promise.all([
        patientApi.getDoctors(),
        patientApi.getSpecialties(),
      ]);
      setDoctors(doctorsData.filter((d) => d.isActive));
      setSpecialties(specialtiesData.filter((s) => s.isActive));
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    if (
      searchTerm &&
      !doctor.user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    if (selectedSpecialty && doctor.specialty.id !== selectedSpecialty) {
      return false;
    }
    // Additional filters would need schedule data
    return true;
  });

  const handleSelectDoctor = (doctorId: string) => {
    router.push(
      `/patient/appointments/book/by-doctor/select-date?doctorId=${doctorId}`,
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
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Quay lại
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Chọn bác sĩ</h1>
        <p className="text-gray-600 mb-8">
          Tìm kiếm và chọn bác sĩ phù hợp với nhu cầu của bạn
        </p>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên bác sĩ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chuyên khoa
              </label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                {specialties.map((specialty) => (
                  <option key={specialty.id} value={specialty.id}>
                    {specialty.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thứ trong tuần
              </label>
              <select
                value={selectedWeekday}
                onChange={(e) => setSelectedWeekday(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                <option value="1">Thứ 2</option>
                <option value="2">Thứ 3</option>
                <option value="3">Thứ 4</option>
                <option value="4">Thứ 5</option>
                <option value="5">Thứ 6</option>
                <option value="6">Thứ 7</option>
                <option value="0">Chủ nhật</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buổi khám
              </label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                <option value="morning">Sáng</option>
                <option value="afternoon">Chiều</option>
              </select>
            </div>
          </div>
        </div>

        {/* Doctors List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDoctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
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

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {doctor.user.fullName}
                  </h3>
                  <p className="text-sm text-blue-600 mb-2">
                    {doctor.specialty.name}
                  </p>

                  {doctor.qualifications && (
                    <p className="text-sm text-gray-600 mb-3">
                      {doctor.qualifications}
                    </p>
                  )}

                  {doctor.bio && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {doctor.bio}
                    </p>
                  )}

                  <button
                    onClick={() => handleSelectDoctor(doctor.id)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Chọn bác sĩ này
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDoctors.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">
              Không tìm thấy bác sĩ phù hợp với tiêu chí tìm kiếm
            </p>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
