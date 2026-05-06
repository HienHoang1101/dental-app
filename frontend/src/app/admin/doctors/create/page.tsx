"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import { adminApi } from "@/lib/adminApi";
import { Specialty } from "@/types";

export default function CreateDoctorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loadingSpecialties, setLoadingSpecialties] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    specialty: "",
    degree: "DDS",
    bio: "",
    avatarUrl: "",
  });

  useEffect(() => {
    loadSpecialties();
  }, []);

  const loadSpecialties = async () => {
    try {
      const data = await adminApi.getSpecialties();
      const activeSpecialties = data.filter((s) => s.isActive);
      setSpecialties(activeSpecialties);
      // Set default specialty to first active specialty
      if (activeSpecialties.length > 0) {
        setFormData((prev) => ({
          ...prev,
          specialty: activeSpecialties[0].name,
        }));
      }
    } catch (error) {
      console.error("Failed to load specialties:", error);
      alert("Không thể tải danh sách chuyên khoa");
    } finally {
      setLoadingSpecialties(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password.length < 6) {
      alert("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);

    try {
      await adminApi.createDoctor(formData);
      alert("Tạo bác sĩ thành công!");
      router.push("/admin/doctors");
    } catch (error: any) {
      console.error("Failed to create doctor:", error);
      const errorMessage = error.response?.data?.message || error.message;
      alert(`Tạo bác sĩ thất bại: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Thêm bác sĩ mới</h1>
          <p className="text-gray-600 mt-2">
            Tạo tài khoản và hồ sơ bác sĩ mới trong hệ thống
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="space-y-4">
            {/* Thông tin đăng nhập */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Thông tin đăng nhập
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="doctor@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tối thiểu 6 ký tự"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Bác sĩ sẽ sử dụng email và mật khẩu này để đăng nhập
                  </p>
                </div>
              </div>
            </div>

            {/* Thông tin cá nhân */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Thông tin cá nhân
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ví dụ: Dr. Nguyễn Văn A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0912345678"
                  />
                </div>
              </div>
            </div>

            {/* Thông tin chuyên môn */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Thông tin chuyên môn
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chuyên khoa <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.specialty}
                    onChange={(e) =>
                      setFormData({ ...formData, specialty: e.target.value })
                    }
                    disabled={loadingSpecialties}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {loadingSpecialties ? (
                      <option>Đang tải...</option>
                    ) : specialties.length === 0 ? (
                      <option>Chưa có chuyên khoa nào</option>
                    ) : (
                      specialties.map((specialty) => (
                        <option key={specialty.id} value={specialty.name}>
                          {specialty.name}
                        </option>
                      ))
                    )}
                  </select>
                  {!loadingSpecialties && specialties.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      Vui lòng thêm chuyên khoa trong phần quản lý chuyên khoa
                      trước
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bằng cấp
                  </label>
                  <input
                    type="text"
                    value={formData.degree}
                    onChange={(e) =>
                      setFormData({ ...formData, degree: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ví dụ: DDS, DMD, BS"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giới thiệu
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mô tả ngắn về kinh nghiệm, chuyên môn của bác sĩ..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Avatar URL
                  </label>
                  <input
                    type="url"
                    value={formData.avatarUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, avatarUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Đang tạo..." : "Tạo bác sĩ"}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
