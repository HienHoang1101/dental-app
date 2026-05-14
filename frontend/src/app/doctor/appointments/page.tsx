"use client";

import { useEffect, useState, useCallback } from "react";
import DoctorLayout from "@/components/layout/DoctorLayout";
import { doctorApi } from "@/lib/doctorApi";
import { Appointment } from "@/types";
import { Calendar, Filter } from "lucide-react";
import PrescriptionModal from "@/components/prescription/PrescriptionModal";
import DoctorAppointmentCard from "@/components/appointments/DoctorAppointmentCard";
import {
  ConfirmModal,
  CancelModal,
  CompleteModal,
  FollowUpModal,
} from "@/components/appointments/DoctorAppointmentModals";

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: "",
    startDate: "",
    endDate: "",
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal states
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [followUpId, setFollowUpId] = useState<string | null>(null);
  const [prescriptionAppointment, setPrescriptionAppointment] = useState<Appointment | null>(null);
  
  const [followUpData, setFollowUpData] = useState({
    date: "",
    startTime: "09:00",
    endTime: "10:00",
    notes: "",
  });

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await doctorApi.getMyAppointments({
        ...filter,
        page,
        pageSize: 10,
      });
      setAppointments(response.items);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Failed to load appointments:", error);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleConfirm = async (id: string) => {
    try {
      await doctorApi.confirmAppointment(id);
      loadAppointments();
      setConfirmingId(null);
    } catch (error) {
      console.error("Confirm appointment error:", error);
      alert("Không thể xác nhận lịch hẹn");
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim() || !cancelingId) return;

    try {
      await doctorApi.cancelAppointment(cancelingId, cancelReason);
      loadAppointments();
      setCancelingId(null);
      setCancelReason("");
    } catch (error) {
      console.error("Cancel appointment error:", error);
      alert("Không thể hủy lịch hẹn");
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await doctorApi.completeAppointment(id);
      loadAppointments();
      setCompletingId(null);
    } catch (error) {
      console.error("Complete appointment error:", error);
      alert("Không thể hoàn thành lịch hẹn");
    }
  };

  const handleCreateFollowUp = async () => {
    if (
      !followUpId ||
      !followUpData.date ||
      !followUpData.startTime ||
      !followUpData.endTime
    ) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      const startDateTime = new Date(
        `${followUpData.date}T${followUpData.startTime}:00`,
      );
      const endDateTime = new Date(
        `${followUpData.date}T${followUpData.endTime}:00`,
      );

      if (endDateTime <= startDateTime) {
        alert("Giờ kết thúc phải sau giờ bắt đầu");
        return;
      }

      await doctorApi.createFollowUpAppointment({
        parentAppointmentId: followUpId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        notes: followUpData.notes || undefined,
      });

      alert("Tái khám thành công!");
      setFollowUpId(null);
      setFollowUpData({ date: "", startTime: "09:00", endTime: "10:00", notes: "" });
      loadAppointments();
    } catch (error: any) {
      console.error("Create follow-up error:", error);
      alert(error.response?.data?.message || "Không thể tạo lịch tái khám");
    }
  };

  return (
    <DoctorLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Quản lý lịch hẹn</h1>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold">Bộ lọc</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <select
                value={filter.status}
                onChange={(e) => {
                  setFilter({ ...filter, status: e.target.value });
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Tất cả</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="completed">Đã khám</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Từ ngày
              </label>
              <input
                type="date"
                value={filter.startDate}
                onChange={(e) => {
                  setFilter({ ...filter, startDate: e.target.value });
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                value={filter.endDate}
                onChange={(e) => {
                  setFilter({ ...filter, endDate: e.target.value });
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Đang tải...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Không có lịch hẹn nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <DoctorAppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onConfirm={(id) => setConfirmingId(id)}
                    onCancel={(id) => setCancelingId(id)}
                    onComplete={(id) => setCompletingId(id)}
                    onPrescription={(app) => setPrescriptionAppointment(app)}
                    onFollowUp={(app) => {
                      setFollowUpId(app.id);
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setFollowUpData({
                        date: tomorrow.toISOString().split("T")[0],
                        startTime: "09:00",
                        endTime: "10:00",
                        notes: "",
                      });
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t px-6 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trang trước
                </button>
                <span className="text-sm text-gray-600">
                  Trang {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {confirmingId && (
        <ConfirmModal
          onClose={() => setConfirmingId(null)}
          onConfirm={() => handleConfirm(confirmingId!)}
        />
      )}

      {cancelingId && (
        <CancelModal
          onClose={() => {
            setCancelingId(null);
            setCancelReason("");
          }}
          reason={cancelReason}
          setReason={setCancelReason}
          onConfirm={handleCancel}
        />
      )}

      {completingId && (
        <CompleteModal
          onClose={() => setCompletingId(null)}
          onConfirm={() => handleComplete(completingId!)}
        />
      )}

      {followUpId && (
        <FollowUpModal
          onClose={() => setFollowUpId(null)}
          data={followUpData}
          setData={setFollowUpData}
          onConfirm={handleCreateFollowUp}
        />
      )}

      {prescriptionAppointment && (
        <PrescriptionModal
          appointment={prescriptionAppointment}
          onClose={() => setPrescriptionAppointment(null)}
          onSuccess={() => {
            setPrescriptionAppointment(null);
            loadAppointments();
          }}
        />
      )}
    </DoctorLayout>
  );
}
