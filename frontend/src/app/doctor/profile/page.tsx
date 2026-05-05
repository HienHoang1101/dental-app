"use client";

import { useEffect, useState } from "react";
import DoctorLayout from "@/components/layout/DoctorLayout";
import { doctorApi } from "@/lib/doctorApi";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  FileText,
  Edit2,
  Save,
  X,
} from "lucide-react";

interface DoctorProfile {
  id: string;
  userId?: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  fullName: string;
  specialty: string;
  degree?: string;
  bio?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    specialty: "",
    degree: "",
    bio: "",
    avatarUrl: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await doctorApi.getMyProfile();
      setProfile(data);
      setFormData({
        fullName: data.fullName,
        specialty: data.specialty,
        degree: data.degree || "",
        bio: data.bio || "",
        avatarUrl: data.avatarUrl || "",
      });
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await doctorApi.updateMyProfile(formData);
      setEditing(false);
      loadProfile();
    } catch (error) {
      alert("Không thể cập nhật thông tin");
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        fullName: profile.fullName,
        specialty: profile.specialty,
        degree: profile.degree || "",
        bio: profile.bio || "",
        avatarUrl: profile.avatarUrl || "",
      });
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <DoctorLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
        </div>
      </DoctorLayout>
    );
  }

  if (!profile) {
    return (
      <DoctorLayout>
        <div className="text-center py-12">
          <p className="text-red-600">Không thể tải thông tin cá nhân</p>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Thông tin cá nhân
          </h1>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Chỉnh sửa
            </button>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {editing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                    {formData.avatarUrl ? (
                      <img
                        src={formData.avatarUrl}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl text-blue-600 font-medium">
                        {formData.fullName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL ảnh đại diện
                    </label>
                    <input
                      type="url"
                      value={formData.avatarUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, avatarUrl: e.target.value })
                      }
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Specialty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chuyên khoa
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.specialty}
                    onChange={(e) =>
                      setFormData({ ...formData, specialty: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Degree */}
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
                    placeholder="VD: Thạc sĩ Nha khoa"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Bio */}
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
                    placeholder="Giới thiệu ngắn về bản thân..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 inline-flex items-center"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Avatar and Name */}
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl text-blue-600 font-medium">
                        {profile.fullName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {profile.fullName}
                    </h2>
                    <p className="text-gray-600">{profile.specialty}</p>
                    {profile.degree && (
                      <p className="text-sm text-gray-500">{profile.degree}</p>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                {profile.user && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Thông tin liên hệ
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-600">
                        <Mail className="w-5 h-5 mr-3" />
                        <span>{profile.user.email}</span>
                      </div>
                      {profile.user.phone && (
                        <div className="flex items-center text-gray-600">
                          <Phone className="w-5 h-5 mr-3" />
                          <span>{profile.user.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bio */}
                {profile.bio && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Giới thiệu
                    </h3>
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {profile.bio}
                    </p>
                  </div>
                )}

                {/* Status */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Trạng thái
                  </h3>
                  <span
                    className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                      profile.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {profile.isActive ? "Đang hoạt động" : "Không hoạt động"}
                  </span>
                </div>

                {/* Account Info */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Thông tin tài khoản
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      Ngày tạo:{" "}
                      {new Date(profile.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
}
