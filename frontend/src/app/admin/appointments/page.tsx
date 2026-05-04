<<<<<<< HEAD
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { adminApi } from "@/lib/api/admin";
import { Loading } from "@/components/common/Loading";
import { useToast } from "@/components/ui/use-toast";
import type { DoctorAppointment } from "@/types/doctor";
import { Calendar, Search, Filter, CheckCircle, XCircle } from "lucide-react";

export default function AdminAppointmentsPage() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<
    DoctorAppointment[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<DoctorAppointment | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchTerm, statusFilter, dateFilter]);

  const loadAppointments = async () => {
    try {
      const data = await adminApi.getAllAppointments();
      setAppointments(data);
    } catch (error) {
      console.error("Failed to load appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    if (searchTerm) {
      filtered = filtered.filter(
        (apt) =>
          apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.patientEmail.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }

    if (dateFilter) {
      filtered = filtered.filter((apt) => apt.date === dateFilter);
    }

    filtered.sort((a, b) => {
      const dateCompare =
        new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });

    setFilteredAppointments(filtered);
  };

  const handleConfirm = async (appointmentId: string) => {
    setProcessing(true);
    try {
      await adminApi.confirmAppointment(appointmentId);
      toast({
        title: "Thành công",
        description: "Đã xác nhận lịch hẹn",
      });
      loadAppointments();
    } catch (error) {
      console.error("Failed to confirm appointment:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xác nhận lịch hẹn",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelClick = (appointment: DoctorAppointment) => {
    setSelectedAppointment(appointment);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedAppointment || !cancelReason.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập lý do hủy",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      await adminApi.cancelAppointment(selectedAppointment.id, cancelReason);
      toast({
        title: "Thành công",
        description: "Đã hủy lịch hẹn",
      });
      setCancelDialogOpen(false);
      setCancelReason("");
      setSelectedAppointment(null);
      loadAppointments();
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
      toast({
        title: "Lỗi",
        description: "Không thể hủy lịch hẹn",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
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
=======
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/common/Loading'
import { CancelAppointmentDialog } from '@/components/booking/CancelAppointmentDialog'
import type { Appointment } from '@/types/booking'

// Mock appointments for admin
const MOCK_ADMIN_APPOINTMENTS: Appointment[] = [
  {
    id: '1',
    patientId: '1',
    doctorId: '1',
    serviceId: '1',
    timeSlotId: '1',
    date: '2026-05-10',
    startTime: '08:00',
    endTime: '09:00',
    status: 'pending',
    notes: 'Đau răng hàm dưới',
    createdAt: '2026-05-02T10:00:00Z',
    updatedAt: '2026-05-02T10:00:00Z',
  },
  {
    id: '2',
    patientId: '2',
    doctorId: '2',
    serviceId: '2',
    timeSlotId: '2',
    date: '2026-05-11',
    startTime: '09:00',
    endTime: '10:00',
    status: 'confirmed',
    notes: 'Lấy cao răng',
    createdAt: '2026-05-02T11:00:00Z',
    updatedAt: '2026-05-02T11:30:00Z',
  },
  {
    id: '3',
    patientId: '3',
    doctorId: '1',
    serviceId: '3',
    timeSlotId: '3',
    date: '2026-05-12',
    startTime: '14:00',
    endTime: '15:00',
    status: 'pending',
    notes: 'Trám răng sâu',
    createdAt: '2026-05-02T12:00:00Z',
    updatedAt: '2026-05-02T12:00:00Z',
  },
  {
    id: '4',
    patientId: '1',
    doctorId: '3',
    serviceId: '4',
    timeSlotId: '4',
    date: '2026-05-13',
    startTime: '10:00',
    endTime: '11:00',
    status: 'confirmed',
    notes: 'Nhổ răng khôn',
    createdAt: '2026-05-02T13:00:00Z',
    updatedAt: '2026-05-02T13:30:00Z',
  },
  {
    id: '5',
    patientId: '4',
    doctorId: '2',
    serviceId: '5',
    timeSlotId: '5',
    date: '2026-05-14',
    startTime: '15:00',
    endTime: '16:30',
    status: 'cancelled',
    notes: 'Tẩy trắng răng',
    createdAt: '2026-05-02T14:00:00Z',
    updatedAt: '2026-05-02T15:00:00Z',
  },
]

const PATIENT_NAMES: Record<string, string> = {
  '1': 'Nguyễn Văn A',
  '2': 'Trần Thị B',
  '3': 'Lê Văn C',
  '4': 'Phạm Thị D',
}

const DOCTOR_NAMES: Record<string, string> = {
  '1': 'BS. Nguyễn Văn Hùng',
  '2': 'BS. Trần Thị Mai',
  '3': 'BS. Lê Văn Tùng',
}

const SERVICE_NAMES: Record<string, string> = {
  '1': 'Khám tổng quát',
  '2': 'Lấy cao răng',
  '3': 'Trám răng',
  '4': 'Nhổ răng',
  '5': 'Tẩy trắng răng',
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all')
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      setAppointments(MOCK_ADMIN_APPOINTMENTS)
    } catch (error) {
      console.error('Failed to load appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (id: string) => {
    const appointment = appointments.find((apt) => apt.id === id)
    if (appointment) {
      appointment.status = 'confirmed'
      appointment.updatedAt = new Date().toISOString()
      setAppointments([...appointments])
      alert('Đã xác nhận lịch hẹn!')
    }
  }

  const handleCancel = async (id: string) => {
    const appointment = appointments.find((apt) => apt.id === id)
    if (appointment) {
      setSelectedAppointment(appointment)
      setCancelDialogOpen(true)
    }
  }

  const handleCancelConfirm = async (reason: string) => {
    if (!selectedAppointment) return

    try {
      const appointment = appointments.find((apt) => apt.id === selectedAppointment.id)
      if (appointment) {
        appointment.status = 'cancelled'
        appointment.notes = appointment.notes
          ? `${appointment.notes}\n\nLý do hủy (Admin): ${reason}`
          : `Lý do hủy (Admin): ${reason}`
        appointment.updatedAt = new Date().toISOString()
        setAppointments([...appointments])
        alert('Đã hủy lịch hẹn! Email thông báo đã được gửi cho bệnh nhân.')
      }
    } catch (error) {
      throw error
    }
  }

  const filteredAppointments = appointments.filter((apt) => {
    if (filter === 'all') return true
    return apt.status === filter
  })

  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    cancelled: appointments.filter((a) => a.status === 'cancelled').length,
  }

  if (loading) {
    return <Loading />
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý lịch hẹn</h1>
        <p className="text-muted-foreground mt-2">
          Xem và quản lý tất cả lịch hẹn trong hệ thống
        </p>
      </div>

<<<<<<< HEAD
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Chờ xác nhận</SelectItem>
                <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Chọn ngày"
            />
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách lịch hẹn</CardTitle>
          <CardDescription>
            Tìm thấy {filteredAppointments.length} lịch hẹn
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAppointments.length > 0 ? (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-lg">
                        {appointment.patientName}
                      </p>
                      {getStatusBadge(appointment.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <p className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(appointment.date)}
                      </p>
                      <p>
                        ⏰ {appointment.startTime} - {appointment.endTime}
                      </p>
                      <p>👨‍⚕️ BS. {appointment.doctorId.slice(0, 8)}</p>
                      <p>🦷 {appointment.serviceName}</p>
                    </div>

                    {appointment.patientNote && (
                      <p className="text-sm text-muted-foreground">
                        📝 {appointment.patientNote}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {appointment.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleConfirm(appointment.id)}
                          disabled={processing}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Xác nhận
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancelClick(appointment)}
                          disabled={processing}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Hủy
                        </Button>
                      </>
                    )}
                    <Link href={`/admin/appointments/${appointment.id}`}>
                      <Button size="sm" variant="outline">
                        Chi tiết
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Không tìm thấy lịch hẹn nào
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy lịch hẹn</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do hủy lịch hẹn của bệnh nhân{" "}
              {selectedAppointment?.patientName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancelReason">Lý do hủy</Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy lịch hẹn..."
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false);
                setCancelReason("");
              }}
            >
              Đóng
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={processing || !cancelReason.trim()}
            >
              {processing ? "Đang xử lý..." : "Xác nhận hủy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
=======
      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tổng lịch hẹn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Chờ xác nhận</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Đã xác nhận</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Đã hủy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          Tất cả ({stats.total})
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
        >
          Chờ xác nhận ({stats.pending})
        </Button>
        <Button
          variant={filter === 'confirmed' ? 'default' : 'outline'}
          onClick={() => setFilter('confirmed')}
        >
          Đã xác nhận ({stats.confirmed})
        </Button>
        <Button
          variant={filter === 'cancelled' ? 'default' : 'outline'}
          onClick={() => setFilter('cancelled')}
        >
          Đã hủy ({stats.cancelled})
        </Button>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">Không có lịch hẹn nào</p>
            </CardContent>
          </Card>
        ) : (
          filteredAppointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {PATIENT_NAMES[appointment.patientId] || 'Bệnh nhân'}
                    </CardTitle>
                    <CardDescription>
                      Mã lịch hẹn: #{appointment.id}
                    </CardDescription>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      appointment.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : appointment.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {appointment.status === 'confirmed'
                      ? 'Đã xác nhận'
                      : appointment.status === 'pending'
                      ? 'Chờ xác nhận'
                      : 'Đã hủy'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Bác sĩ</p>
                      <p className="font-medium">
                        {DOCTOR_NAMES[appointment.doctorId]}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dịch vụ</p>
                      <p className="font-medium">
                        {SERVICE_NAMES[appointment.serviceId]}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ngày khám</p>
                      <p className="font-medium">{appointment.date}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Giờ khám</p>
                      <p className="font-medium">
                        {appointment.startTime} - {appointment.endTime}
                      </p>
                    </div>
                    {appointment.notes && (
                      <div>
                        <p className="text-sm text-muted-foreground">Ghi chú</p>
                        <p className="font-medium">{appointment.notes}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Đặt lúc</p>
                      <p className="text-sm">
                        {new Date(appointment.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                </div>

                {appointment.status === 'pending' && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={() => handleConfirm(appointment.id)}
                      className="flex-1"
                    >
                      ✓ Xác nhận
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleCancel(appointment.id)}
                      className="flex-1"
                    >
                      ✕ Hủy lịch
                    </Button>
                  </div>
                )}

                {appointment.status === 'confirmed' && (
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" className="flex-1">
                      📋 Xem chi tiết
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleCancel(appointment.id)}
                      className="flex-1"
                    >
                      ✕ Hủy lịch
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CancelAppointmentDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleCancelConfirm}
        appointmentInfo={
          selectedAppointment
            ? {
                date: selectedAppointment.date,
                time: `${selectedAppointment.startTime} - ${selectedAppointment.endTime}`,
                doctor: DOCTOR_NAMES[selectedAppointment.doctorId],
                service: SERVICE_NAMES[selectedAppointment.serviceId],
              }
            : undefined
        }
      />
    </div>
  )
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
}
