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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/common/Calendar";
import { doctorApi } from "@/lib/api/doctor";
import { Loading } from "@/components/common/Loading";
import { ROUTES } from "@/lib/constants/routes";
import type { DoctorAppointment } from "@/types/doctor";
import { Clock } from "lucide-react";

export default function DoctorSchedulePage() {
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [allAppointments, setAllAppointments] = useState<DoctorAppointment[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadAllAppointments();
  }, []);

  useEffect(() => {
    filterAppointmentsByDate(selectedDate);
  }, [selectedDate, allAppointments]);

  const loadAllAppointments = async () => {
    try {
      // Load appointments for the current month
      const data = await doctorApi.getAppointments({});
      setAllAppointments(data);
    } catch (error) {
      console.error("Failed to load appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointmentsByDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    const filtered = allAppointments.filter(
      (apt) => apt.appointmentDate === dateStr,
    );
    setAppointments(filtered);
  };

  const getHighlightedDates = () => {
    return Array.from(
      new Set(allAppointments.map((apt) => apt.appointmentDate)),
    );
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
        <h1 className="text-3xl font-bold">Lịch làm việc</h1>
        <p className="text-muted-foreground mt-2">
          Xem lịch làm việc và lịch hẹn của bạn
        </p>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch tháng</CardTitle>
          <CardDescription>Chọn ngày để xem chi tiết lịch hẹn</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            highlightedDates={getHighlightedDates()}
          />
        </CardContent>
      </Card>

      {/* Appointments for selected date */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch hẹn ngày {formatDate(selectedDate)}</CardTitle>
          <CardDescription>
            {appointments.length > 0
              ? `Bạn có ${appointments.length} lịch hẹn trong ngày này`
              : "Không có lịch hẹn nào"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {appointments.length > 0 ? (
            <div className="space-y-3">
              {appointments
                .sort((a, b) =>
                  a.timeSlot.startTime.localeCompare(b.timeSlot.startTime),
                )
                .map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {appointment.timeSlot.startTime} -{" "}
                          {appointment.timeSlot.endTime}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">
                          {appointment.patient.fullName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          🦷 {appointment.service?.name || "Không có dịch vụ"}
                        </p>
                        {appointment.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            📝 {appointment.notes}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(appointment.status)}
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
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Không có lịch hẹn nào trong ngày này
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
