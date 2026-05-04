"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loading } from "@/components/common/Loading";
import axios from "@/lib/api/axios";
import { Plus, Calendar } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface LeaveRequest {
  id: string;
  doctor: {
    id: string;
    fullName: string;
    specialtyName: string;
  };
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  reviewedBy: any;
  reviewedAt: string | null;
  createdAt: string;
}

export default function DoctorLeaveRequestsPage() {
  const { toast } = useToast();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  const loadLeaveRequests = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/schedules/leave-requests/my`,
      );
      setLeaveRequests(response.data.data || []);
    } catch (error) {
      console.error("Failed to load leave requests:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách đơn xin nghỉ",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API_BASE}/schedules/leave-requests`, formData);
      toast({
        title: "Thành công",
        description: "Đã gửi đơn xin nghỉ",
      });
      setDialogOpen(false);
      setFormData({ startDate: "", endDate: "", reason: "" });
      loadLeaveRequests();
    } catch (error: any) {
      console.error("Failed to create leave request:", error);
      toast({
        title: "Lỗi",
        description:
          error.response?.data?.message || "Không thể gửi đơn xin nghỉ",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
    };
    const labels: Record<string, string> = {
      pending: "Chờ duyệt",
      approved: "Đã duyệt",
      rejected: "Từ chối",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Đơn xin nghỉ</h1>
          <p className="text-muted-foreground mt-2">
            Quản lý đơn xin nghỉ của bạn
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo đơn xin nghỉ
        </Button>
      </div>

      {/* Leave Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách đơn xin nghỉ</CardTitle>
          <CardDescription>
            Có {leaveRequests.length} đơn xin nghỉ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leaveRequests.length > 0 ? (
            <div className="space-y-3">
              {leaveRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {formatDate(request.startDate)} -{" "}
                        {formatDate(request.endDate)}
                      </span>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Lý do: {request.reason}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Gửi lúc: {formatDate(request.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Bạn chưa có đơn xin nghỉ nào
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Leave Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo đơn xin nghỉ</DialogTitle>
            <DialogDescription>
              Điền thông tin đơn xin nghỉ của bạn
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="startDate">Ngày bắt đầu *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                min={new Date().toISOString().split("T")[0]}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="endDate">Ngày kết thúc *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                min={
                  formData.startDate || new Date().toISOString().split("T")[0]
                }
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="reason">Lý do *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="Nhập lý do xin nghỉ..."
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Đang gửi..." : "Gửi đơn"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
