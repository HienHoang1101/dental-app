"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { adminApi } from "@/lib/adminApi";
import { Specialty, Service } from "@/types";

export default function SpecialtiesPage() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(
    null,
  );
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [specialtiesData, servicesData] = await Promise.all([
        adminApi.getSpecialties(),
        adminApi.getServices(),
      ]);
      setSpecialties(specialtiesData);
      setServices(servicesData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getServicesBySpecialty = (specialtyId: string) => {
    return services.filter((service) => service.specialtyId === specialtyId);
  };

  const handleViewServices = (specialty: Specialty) => {
    setSelectedSpecialty(specialty);
    setShowServicesModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSpecialty) {
        await adminApi.updateSpecialty(editingSpecialty.id, formData);
      } else {
        await adminApi.createSpecialty(formData);
      }
      setShowModal(false);
      setEditingSpecialty(null);
      setFormData({ name: "", description: "" });
      loadData();
    } catch (error) {
      console.error("Failed to save specialty:", error);
    }
  };

  const handleEdit = (specialty: Specialty) => {
    setEditingSpecialty(specialty);
    setFormData({
      name: specialty.name,
      description: specialty.description || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc muốn xóa chuyên khoa này?")) {
      try {
        await adminApi.deleteSpecialty(id);
        loadData();
      } catch (error) {
        console.error("Failed to delete specialty:", error);
      }
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
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý chuyên khoa
          </h1>
          <button
            onClick={() => {
              setEditingSpecialty(null);
              setFormData({ name: "", description: "" });
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Thêm chuyên khoa mới
          </button>
        </div>

        {/* Specialties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialties.map((specialty) => (
            <div
              key={specialty.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {specialty.name}
                </h3>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    specialty.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {specialty.isActive ? "Hoạt động" : "Không hoạt động"}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {specialty.description}
              </p>
              <div className="text-sm text-gray-500 mb-4">
                <div>Số bác sĩ: {specialty.doctorCount || 0}</div>
                <div>
                  Số dịch vụ: {getServicesBySpecialty(specialty.id).length}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewServices(specialty)}
                  className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                >
                  Xem dịch vụ
                </button>
                <button
                  onClick={() => handleEdit(specialty)}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(specialty.id)}
                  className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {editingSpecialty ? "Sửa chuyên khoa" : "Thêm chuyên khoa mới"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên chuyên khoa
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingSpecialty ? "Cập nhật" : "Tạo mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Services Modal */}
        {showServicesModal && selectedSpecialty && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  Dịch vụ - {selectedSpecialty.name}
                </h2>
                <button
                  onClick={() => setShowServicesModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3">
                {getServicesBySpecialty(selectedSpecialty.id).length > 0 ? (
                  getServicesBySpecialty(selectedSpecialty.id).map(
                    (service) => (
                      <div
                        key={service.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {service.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {service.description}
                            </p>
                            <div className="flex gap-4 mt-2 text-sm text-gray-500">
                              <span>Giá: {service.price} VNĐ</span>
                              <span>Thời gian: {service.duration} phút</span>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              service.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {service.isActive ? "Hoạt động" : "Không hoạt động"}
                          </span>
                        </div>
                      </div>
                    ),
                  )
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Chưa có dịch vụ nào cho chuyên khoa này
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowServicesModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
