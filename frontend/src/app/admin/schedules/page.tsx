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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/common/Calendar";
import { adminApi } from "@/lib/api/admin";
import { Loading } from "@/components/common/Loading";
import type { DoctorProfile, DoctorSchedule } from "@/types/doctor";
import { Clock, Plus } from "lucide-react";

export default function AdminSchedulesPage() {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctorId) {
      loadSchedules();
    }
  }, [selectedDoctorId]);

  const loadDoctors = async () => {
    try {
      const data = await adminApi.getAllDoctors();
      setDoctors(data);
      if (data.length > 0) {
        setSelectedDoctorId(data[0].id);
      }
    } catch (error) {
      console.error("Failed to load doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSchedules = async () => {
    if (!selectedDoctorId) return;
    try {
      const data = await adminApi.getDoctorSchedules(selectedDoctorId);
      setSchedules(data);
    } catch (error) {
      console.error("Failed to load schedules:", error);
    }
  };

  const getHighlightedDates = () => {
    return schedules.map((schedule) => schedule.workDate);
  };

  const getSchedulesForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return schedules.filter((schedule) => schedule.workDate === dateStr);
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

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);
  const daySchedules = getSchedulesForDate(selectedDate);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý lịch làm việc</h1>
          <p className="text-muted-foreground mt-2">
            Xem và quản lý lịch làm việc của bác sĩ
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Tạo lịch làm việc
        </Button>
      </div>

      {/* Doctor Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Chọn bác sĩ</CardTitle>
          <CardDescription>Chọn bác sĩ để xem lịch làm việc</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn bác sĩ" />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  BS. {doctor.fullName} - {doctor.specialty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedDoctorId && (
        <>
          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle>
                Lịch làm việc - BS. {selectedDoctor?.fullName}
              </CardTitle>
              <CardDescription>
                Chọn ngày để xem chi tiết lịch làm việc
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                highlightedDates={getHighlightedDates()}
              />
            </CardContent>
          </Card>

          {/* Schedule Details */}
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết ngày {formatDate(selectedDate)}</CardTitle>
              <CardDescription>
                {daySchedules.length > 0
                  ? `Có ${daySchedules.length} ca làm việc`
                  : "Không có lịch làm việc"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {daySchedules.length > 0 ? (
                <div className="space-y-3">
                  {daySchedules
                    .sort((a, b) => a.slotStart.localeCompare(b.slotStart))
                    .map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 min-w-[140px]">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {schedule.slotStart} - {schedule.slotEnd}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              BS. {selectedDoctor?.fullName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {selectedDoctor?.specialty}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              schedule.isBooked ? "destructive" : "default"
                            }
                          >
                            {schedule.isBooked ? "Đã đặt" : "Còn trống"}
                          </Badge>
                          <Button variant="outline" size="sm">
                            Xóa
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Không có lịch làm việc trong ngày này
                  </p>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo lịch làm việc
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
