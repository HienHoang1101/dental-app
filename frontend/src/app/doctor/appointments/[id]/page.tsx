"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { doctorApi } from "@/lib/api/doctor";
import { Loading } from "@/components/common/Loading";
import { useToast } from "@/components/ui/use-toast";
import type { DoctorAppointment, PatientChatHistory } from "@/types/doctor";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  AlertCircle,
  MessageSquare,
  CheckCircle,
} from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [appointment, setAppointment] = useState<DoctorAppointment | null>(
    null,
  );
  const [chatHistory, setChatHistory] = useState<PatientChatHistory[]>([]);
  const [doctorNote, setDoctorNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadAppointmentDetail(params.id as string);
    }
  }, [params.id]);

  const loadAppointmentDetail = async (id: string) => {
    try {
      const data = await doctorApi.getAppointmentDetail(id);
      setAppointment(data);
      setDoctorNote(data.doctorNote || "");

      // Load patient chat history
      if (data.patientId) {
        const chatData = await doctorApi.getPatientChatHistory(data.patientId);
        setChatHistory(chatData);
      }
    } catch (error) {
      console.error("Failed to load appointment:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin lịch hẹn",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!appointment) return;

    setSaving(true);
    try {
      await doctorApi.updateAppointmentNote(appointment.id, { doctorNote });
      toast({
        title: "Thành công",
        description: "Đã lưu ghi chú",
      });
    } catch (error) {
      console.error("Failed to save note:", error);
      toast({
        title: "Lỗi",
        description: "Không thể lưu ghi chú",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteAppointment = async () => {
    if (!appointment) return;

    setCompleting(true);
    try {
      await doctorApi.completeAppointment(appointment.id, {
        doctorNote,
      });
      toast({
        title: "Thành công",
        description: "Đã hoàn thành lịch hẹn",
      });
      router.push(ROUTES.DOCTOR_APPOINTMENTS);
    } catch (error) {
      console.error("Failed to complete appointment:", error);
      toast({
        title: "Lỗi",
        description: "Không thể hoàn thành lịch hẹn",
        variant: "destructive",
      });
    } finally {
      setCompleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      pending: "secondary",
      confirmed: "default",
      completed: "outline",
      cancelled: "destructive",
    };
    const labels: Record<string, string> = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return <Loading />;
  }

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không tìm thấy lịch hẹn</p>
        <Button onClick={() => router.back()} className="mt-4">
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Chi tiết lịch hẹn</h1>
            <p className="text-muted-foreground mt-1">
              Mã lịch hẹn: {appointment.id.slice(0, 8)}
            </p>
          </div>
        </div>
        {getStatusBadge(appointment.status)}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Appointment Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin lịch hẹn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ngày khám</p>
                    <p className="font-medium">
                      {formatDate(appointment.date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Giờ khám</p>
                    <p className="font-medium">
                      {appointment.startTime} - {appointment.endTime}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-1">Dịch vụ</p>
                <p className="font-medium">🦷 {appointment.serviceName}</p>
              </div>

              {appointment.patientNote && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Ghi chú từ bệnh nhân
                    </p>
                    <p className="text-sm">{appointment.patientNote}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin bệnh nhân</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Họ tên</p>
                  <p className="font-medium">{appointment.patientName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{appointment.patientEmail}</p>
                </div>
              </div>

              {appointment.patientPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Số điện thoại
                    </p>
                    <p className="font-medium">{appointment.patientPhone}</p>
                  </div>
                </div>
              )}

              {appointment.patientAllergies && (
                <>
                  <Separator />
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-600">Dị ứng</p>
                      <p className="text-sm">{appointment.patientAllergies}</p>
                    </div>
                  </div>
                </>
              )}

              {appointment.patientMedicalHistory && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Tiền sử bệnh
                    </p>
                    <p className="text-sm">
                      {appointment.patientMedicalHistory}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Chat History */}
          {chatHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Lịch sử tư vấn AI
                </CardTitle>
                <CardDescription>
                  Các cuộc hội thoại của bệnh nhân với chatbot AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chatHistory.map((session) => (
                    <div
                      key={session.sessionId}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium">
                          Phiên chat:{" "}
                          {new Date(session.startedAt).toLocaleString("vi-VN")}
                        </p>
                        <Badge variant="outline">
                          {session.messages.length} tin nhắn
                        </Badge>
                      </div>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {session.messages.map((message) => (
                          <div
                            key={message.id}
                            className={`p-3 rounded-lg ${
                              message.role === "user"
                                ? "bg-blue-50 ml-4"
                                : "bg-gray-50 mr-4"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-xs font-medium">
                                {message.role === "user"
                                  ? "👤 Bệnh nhân"
                                  : "🤖 AI"}
                              </p>
                              {message.mlLabel && (
                                <Badge variant="secondary" className="text-xs">
                                  {message.mlLabel} (
                                  {Math.round(
                                    (message.mlConfidence || 0) * 100,
                                  )}
                                  %)
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm">{message.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Doctor Notes & Actions */}
        <div className="space-y-6">
          {/* Doctor Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Ghi chú của bác sĩ</CardTitle>
              <CardDescription>Ghi chú chẩn đoán và điều trị</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="doctorNote">Ghi chú</Label>
                <Textarea
                  id="doctorNote"
                  value={doctorNote}
                  onChange={(e) => setDoctorNote(e.target.value)}
                  placeholder="Nhập ghi chú chẩn đoán, điều trị..."
                  rows={8}
                  className="mt-2"
                />
              </div>

              <Button
                onClick={handleSaveNote}
                disabled={saving}
                className="w-full"
                variant="outline"
              >
                {saving ? "Đang lưu..." : "Lưu ghi chú"}
              </Button>
            </CardContent>
          </Card>

          {/* Actions */}
          {appointment.status === "confirmed" && (
            <Card>
              <CardHeader>
                <CardTitle>Hành động</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleCompleteAppointment}
                  disabled={completing}
                  className="w-full"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {completing ? "Đang xử lý..." : "Hoàn thành khám"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
