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
import { useAuthStore } from "@/store/authStore";
import { doctorApi } from "@/lib/api/doctor";
import { ROUTES } from "@/lib/constants/routes";
import { Loading } from "@/components/common/Loading";
import type { DoctorDashboardStats, DoctorAppointment } from "@/types/doctor";
import { Calendar, Clock, Users, CheckCircle } from "lucide-react";

export default function DoctorDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DoctorDashboardStats | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<
    DoctorAppointment[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, appointmentsData] = await Promise.all([
        doctorApi.getDashboardStats(),
        doctorApi.getTodaySchedule(),
      ]);
      setStats(statsData);
      setTodayAppointments(appointmentsData);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Xin chào, BS. {user?.fullName}!</h1>
        <p className="text-muted-foreground mt-2">
          Chào mừng bạn đến với hệ thống quản lý phòng khám
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Lịch hẹn hôm nay
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.todayAppointments || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tổng số lịch hẹn trong ngày
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sắp tới</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.upcomingAppointments || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lịch hẹn trong tuần
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoàn thành</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.completedToday || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Đã khám hôm nay
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng bệnh nhân
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalPatients || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Bệnh nhân đã khám
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>📅 Lịch hẹn</CardTitle>
            <CardDescription>Xem và quản lý lịch hẹn của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={ROUTES.DOCTOR_APPOINTMENTS}>
              <Button className="w-full">Xem lịch hẹn</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🗓️ Lịch làm việc</CardTitle>
            <CardDescription>Xem lịch làm việc của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={ROUTES.DOCTOR_SCHEDULE}>
              <Button className="w-full" variant="outline">
                Xem lịch
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🏖️ Đơn xin nghỉ</CardTitle>
            <CardDescription>Quản lý đơn xin nghỉ</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={ROUTES.DOCTOR_LEAVE_REQUESTS}>
              <Button className="w-full" variant="outline">
                Xem đơn
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Today's Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch hẹn hôm nay</CardTitle>
          <CardDescription>
            {todayAppointments.length > 0
              ? `Bạn có ${todayAppointments.length} lịch hẹn trong ngày`
              : "Không có lịch hẹn nào hôm nay"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayAppointments.length > 0 ? (
            <div className="space-y-4">
              {todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-lg">
                        {appointment.patient.fullName}
                      </p>
                      {getStatusBadge(appointment.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <p>
                        ⏰ {appointment.timeSlot.startTime} -{" "}
                        {appointment.timeSlot.endTime}
                      </p>
                      <p>
                        🦷 {appointment.service?.name || "Không có dịch vụ"}
                      </p>
                      {appointment.notes && (
                        <p className="col-span-2">
                          📝 Ghi chú: {appointment.notes}
                        </p>
                      )}
                      {appointment.healthRecord.allergyNotes && (
                        <p className="col-span-2 text-red-600">
                          ⚠️ Dị ứng: {appointment.healthRecord.allergyNotes}
                        </p>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`${ROUTES.DOCTOR_APPOINTMENTS}/${appointment.id}`}
                  >
                    <Button variant="outline" size="sm">
                      Chi tiết
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Bạn không có lịch hẹn nào hôm nay
              </p>
              <Link href={ROUTES.DOCTOR_SCHEDULE}>
                <Button variant="outline">Xem lịch làm việc</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
