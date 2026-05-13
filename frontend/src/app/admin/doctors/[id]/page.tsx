"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import { adminApi } from "@/lib/adminApi";
import { Doctor, Specialty } from "@/types";

export default function DoctorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const doctorId = params.id as string;

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSpecialties, setLoadingSpecialties] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    specialty: "",
    degree: "",
    bio: "",
    avatarUrl: "",
    isActive: true,
  });

  useEffect(() => {
    loadDoctor();
    loadSpecialties();
  }, [doctorId]);

  const loadSpecialties = async () => {
    try {
      const data = await adminApi.getSpecialties();
      const activeSpecialties = data.filter((s) => s.isActive);
      setSpecialties(activeSpecialties);
    } catch (error) {
      console.error("Failed to load specialties:", error);
    } finally {
      setLoadingSpecialties(false);
    }
  };

  const loadDoctor = async () => {
    try {
      const data = await adminApi.getDoctor(doctorId);
      setDoctor(data);
      setFormData({
        fullName: data.fullName,
        specialty: data.specialty,
        degree: data.degree || "",
        bio: data.bio || "",
        avatarUrl: data.avatarUrl || "",
        isActive: data.isActive,
      });
    } catch (error) {
      console.error("Failed to load doctor:", error);
      alert("Không thể tải thông tin bác sĩ");
      router.push("/admin/doctors");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateDoctor(doctorId, formData);
      alert("Cập nhật thông tin bác sĩ thành công!");
      setEditing(false);
      loadDoctor();
    } catch (error: any) {
      console.error("Failed to update doctor:", error);
      const errorMessage = error.response?.data?.message || error.message;
      alert(`Cập nhật thất bại: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Bạn có chắc chắn muốn xóa bác sĩ này? Hành động này không thể hoàn tác.",
      )
    ) {
      return;
    }

    try {
      await adminApi.deleteDoctor(doctorId);
      alert("Xóa bác sĩ thành công!");
      router.push("/admin/doctors");
    } catch (error: any) {
      console.error("Failed to delete doctor:", error);
      const errorMessage = error.response?.data?.message || error.message;
      alert(`Xóa bác sĩ thất bại: ${errorMessage}`);
    }
  };

  const handleCancel = () => {
    if (doctor) {
      setFormData({
        fullName: doctor.fullName,
        specialty: doctor.specialty,
        degree: doctor.degree || "",
        bio: doctor.bio || "",
        avatarUrl: doctor.avatarUrl || "",
        isActive: doctor.isActive,
      });
    }
    setEditing(false);
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

  if (!doctor) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Không tìm thấy bác sĩ</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <button
              onClick={() => router.push("/admin/doctors")}
              className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
            >
              ← Quay lại danh sách
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              Chi tiết bác sĩ
            </h1>
          </div>
          <div className="flex gap-2">
            {!editing ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Chỉnh sửa
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Xóa
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          {/* Avatar and Basic Info */}
          <div className="p-6 border-b">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                {formData.avatarUrl ? (
                  <img
                    src={formData.avatarUrl}
                    alt={formData.fullName}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-4xl font-semibold text-blue-600">
                      {formData.fullName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {doctor.fullName}
                  </h2>
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full ${
                      doctor.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {doctor.isActive ? "Hoạt động" : "Không hoạt động"}
                  </span>
                </div>
                <p className="text-lg text-gray-600 mb-1">{doctor.specialty}</p>
                {doctor.degree && (
                  <p className="text-gray-500">{doctor.degree}</p>
                )}
                <p className="text-sm text-gray-400 mt-2">ID: {doctor.id}</p>
              </div>
            </div>
          </div>

          {/* Account Information */}
          {doctor.user && (
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Thông tin tài khoản
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900">{doctor.user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Số điện thoại
                  </label>
                  <p className="text-gray-900">
                    {doctor.user.phone || "Chưa cập nhật"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Vai trò
                  </label>
                  <p className="text-gray-900">{doctor.user.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Trạng thái tài khoản
                  </label>
                  <p className="text-gray-900">
                    {doctor.user.isActive ? "Đang hoạt động" : "Bị khóa"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Professional Information */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Thông tin chuyên môn
            </h3>

            {editing ? (
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
                  />
                </div>

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

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Bác sĩ đang hoạt động
                    </span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Chuyên khoa
                  </label>
                  <p className="text-gray-900">{doctor.specialty}</p>
                </div>

                {doctor.degree && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Bằng cấp
                    </label>
                    <p className="text-gray-900">{doctor.degree}</p>
                  </div>
                )}

                {doctor.bio && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Giới thiệu
                    </label>
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {doctor.bio}
                    </p>
                  </div>
                )}

                {doctor.avatarUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Avatar URL
                    </label>
                    <a
                      href={doctor.avatarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {doctor.avatarUrl}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="p-6 bg-gray-50 border-t">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Thông tin hệ thống
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-gray-500 mb-1">Ngày tạo</label>
                <p className="text-gray-900">
                  {new Date(doctor.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
              {doctor.userId && (
                <div>
                  <label className="block text-gray-500 mb-1">User ID</label>
                  <p className="text-gray-900 font-mono text-xs">
                    {doctor.userId}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
