"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PatientLayout from "@/components/layout/PatientLayout";
import { patientApi } from "@/lib/patientApi";
import { HealthRecord } from "@/types";
import { Edit2, Save, X } from "lucide-react";

export default function PatientProfilePage() {
  const router = useRouter();
  const [healthRecord, setHealthRecord] = useState<HealthRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    ethnicity: "",
    gender: "male" as "male" | "female" | "other",
    occupation: "",
    phone: "",
    email: "",
    nationalId: "",
    address: "",
    allergyNotes: "",
    medicalHistory: "",
    dentalStatus: "",
  });

  useEffect(() => {
    loadHealthRecord();
  }, []);

  const loadHealthRecord = async () => {
    try {
      const record = await patientApi.getHealthRecord();
      if (record) {
        setHealthRecord(record);
        setFormData({
          fullName: record.fullName,
          dateOfBirth: record.dateOfBirth,
          ethnicity: record.ethnicity || "",
          gender: record.gender,
          occupation: record.occupation || "",
          phone: record.phone,
          email: record.email,
          nationalId: record.nationalId || "",
          address: record.address,
          allergyNotes: record.allergyNotes || "",
          medicalHistory: record.medicalHistory || "",
          dentalStatus: record.dentalStatus || "",
        });
      } else {
        router.push("/patient/appointments/book/create-profile");
      }
    } catch (error) {
      console.error("Failed to load health record:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);

    try {
      await patientApi.updateHealthRecord(formData);
      await loadHealthRecord();
      setEditing(false);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Không thể cập nhật hồ sơ. Vui lòng thử lại.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (healthRecord) {
      setFormData({
        fullName: healthRecord.fullName,
        dateOfBirth: healthRecord.dateOfBirth,
        ethnicity: healthRecord.ethnicity || "",
        gender: healthRecord.gender,
        occupation: healthRecord.occupation || "",
        phone: healthRecord.phone,
        email: healthRecord.email,
        nationalId: healthRecord.nationalId || "",
        address: healthRecord.address,
        allergyNotes: healthRecord.allergyNotes || "",
        medicalHistory: healthRecord.medicalHistory || "",
        dentalStatus: healthRecord.dentalStatus || "",
      });
    }
    setEditing(false);
    setError("");
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

  if (!healthRecord) {
    return null;
  }

  return (
    <PatientLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Hồ sơ sức khỏe</h1>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Edit2 className="h-4 w-4" />
              Chỉnh sửa
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            {/* Thông tin cá nhân */}
            <div>
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b">
                Thông tin cá nhân
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{healthRecord.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày sinh
                  </label>
                  {editing ? (
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {new Date(healthRecord.dateOfBirth).toLocaleDateString(
                        "vi-VN",
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giới tính
                  </label>
                  {editing ? (
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">
                      {healthRecord.gender === "male"
                        ? "Nam"
                        : healthRecord.gender === "female"
                          ? "Nữ"
                          : "Khác"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dân tộc
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="ethnicity"
                      value={formData.ethnicity}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {healthRecord.ethnicity || "Chưa cập nhật"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nghề nghiệp
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {healthRecord.occupation || "Chưa cập nhật"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CMND/CCCD
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="nationalId"
                      value={formData.nationalId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {healthRecord.nationalId || "Chưa cập nhật"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Thông tin liên hệ */}
            <div>
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b">
                Thông tin liên hệ
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{healthRecord.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  {editing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{healthRecord.email}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{healthRecord.address}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Thông tin sức khỏe */}
            <div>
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b">
                Thông tin sức khỏe
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiền sử dị ứng
                  </label>
                  {editing ? (
                    <textarea
                      name="allergyNotes"
                      value={formData.allergyNotes}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {healthRecord.allergyNotes || "Không có"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiền sử bệnh
                  </label>
                  {editing ? (
                    <textarea
                      name="medicalHistory"
                      value={formData.medicalHistory}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {healthRecord.medicalHistory || "Không có"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tình trạng răng miệng
                  </label>
                  {editing ? (
                    <textarea
                      name="dentalStatus"
                      value={formData.dentalStatus}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {healthRecord.dentalStatus || "Chưa cập nhật"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {editing && (
            <div className="flex gap-4 mt-8 pt-6 border-t">
              <button
                onClick={handleCancel}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4" />
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                <Save className="h-4 w-4" />
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          )}
        </div>
      </div>
    </PatientLayout>
  );
}
