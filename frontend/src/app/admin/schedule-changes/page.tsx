"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { adminApi } from "@/lib/adminApi";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

interface ScheduleChangeRequest {
  id: string;
  doctorId: string;
  doctorName?: string;
  requestType: "add" | "remove" | "modify";
  oldScheduleData?: {
    id?: string;
    dayOfWeek: number;
    session: "morning" | "afternoon";
    startTime?: string;
    endTime?: string;
  };
  newScheduleData?: {
    dayOfWeek: number;
    session: "morning" | "afternoon";
    startTime?: string;
    endTime?: string;
  };
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export default function ScheduleChangesPage() {
  const [requests, setRequests] = useState<ScheduleChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "pending" | "approved" | "rejected" | ""
  >("pending");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const days = [
    "",
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
    "Chủ nhật",
  ];

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getScheduleChangeRequests({
        status: filter || undefined,
      });
      setRequests(data);
    } catch (error) {
      console.error("Failed to load requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await adminApi.approveScheduleChange(id);
      alert("Đã duyệt yêu cầu thành công!");
      setApprovingId(null);
      loadRequests();
    } catch (error: any) {
      console.error("Failed to approve:", error);
      alert(error.response?.data?.message || "Không thể duyệt yêu cầu");
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      alert("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      await adminApi.rejectScheduleChange(id, rejectionReason);
      alert("Đã từ chối yêu cầu!");
      setRejectingId(null);
      setRejectionReason("");
      loadRequests();
    } catch (error: any) {
      console.error("Failed to reject:", error);
      alert(error.response?.data?.message || "Không thể từ chối yêu cầu");
    }
  };

  const getRequestTypeText = (type: string) => {
    switch (type) {
      case "add":
        return "Thêm lịch";
      case "remove":
        return "Xóa lịch";
      case "modify":
        return "Sửa lịch";
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full font-medium">
            Chờ duyệt
          </span>
        );
      case "approved":
        return (
          <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full font-medium">
            Đã duyệt
          </span>
        );
      case "rejected":
        return (
          <span className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-full font-medium">
            Từ chối
          </span>
        );
      default:
        return null;
    }
  };

  const formatScheduleData = (data: any) => {
    if (!data) return "N/A";
    const day = days[data.dayOfWeek] || `Day ${data.dayOfWeek}`;
    const session = data.session === "morning" ? "Sáng" : "Chiều";
    const time =
      data.startTime && data.endTime
        ? ` (${data.startTime} - ${data.endTime})`
        : "";
    return `${day} - ${session}${time}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Duyệt yêu cầu thay đổi lịch
          </h1>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              Lọc theo trạng thái:
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
            </select>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Đang tải...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Không có yêu cầu nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusBadge(request.status)}
                          <span className="text-sm font-medium text-gray-700">
                            {getRequestTypeText(request.requestType)}
                          </span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          Bác sĩ: {request.doctorName || request.doctorId}
                        </p>
                        <p className="text-sm text-gray-500">
                          Ngày tạo:{" "}
                          {new Date(request.createdAt).toLocaleString("vi-VN")}
                        </p>
                      </div>
                    </div>

                    {/* Schedule Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {request.requestType !== "add" &&
                        request.oldScheduleData && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-red-800 mb-2">
                              Lịch cũ:
                            </h4>
                            <p className="text-sm text-red-700">
                              {formatScheduleData(request.oldScheduleData)}
                            </p>
                          </div>
                        )}
                      {request.requestType !== "remove" &&
                        request.newScheduleData && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-green-800 mb-2">
                              Lịch mới:
                            </h4>
                            <p className="text-sm text-green-700">
                              {formatScheduleData(request.newScheduleData)}
                            </p>
                          </div>
                        )}
                    </div>

                    {/* Rejection Reason */}
                    {request.status === "rejected" &&
                      request.rejectionReason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-red-800">
                                Lý do từ chối:
                              </p>
                              <p className="text-sm text-red-700">
                                {request.rejectionReason}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Review Info */}
                    {request.status !== "pending" && request.reviewedAt && (
                      <p className="text-xs text-gray-500">
                        Đã xử lý:{" "}
                        {new Date(request.reviewedAt).toLocaleString("vi-VN")}
                      </p>
                    )}

                    {/* Actions */}
                    {request.status === "pending" && (
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => setApprovingId(request.id)}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-5 h-5" />
                          Duyệt
                        </button>
                        <button
                          onClick={() => setRejectingId(request.id)}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-5 h-5" />
                          Từ chối
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {approvingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Xác nhận duyệt</h3>
            <p className="mb-6">
              Bạn có chắc chắn muốn duyệt yêu cầu thay đổi lịch này?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setApprovingId(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => handleApprove(approvingId)}
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
              >
                Xác nhận duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Từ chối yêu cầu</h3>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do từ chối <span className="text-red-600">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                placeholder="Nhập lý do từ chối..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setRejectingId(null);
                  setRejectionReason("");
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => handleReject(rejectingId)}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
