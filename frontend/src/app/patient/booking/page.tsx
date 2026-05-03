"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { bookingApi } from "@/lib/api/booking";
import { Loading } from "@/components/common/Loading";
import type { Doctor, Service, TimeSlot } from "@/types/booking";

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [doctorsData, servicesData] = await Promise.all([
        bookingApi.getDoctors(),
        bookingApi.getServices(),
      ]);
      setDoctors(doctorsData);
      setServices(servicesData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeSlots = async (doctorId: string, date: string) => {
    try {
      const slots = await bookingApi.getTimeSlots(doctorId, date);
      setTimeSlots(slots);
    } catch (error) {
      console.error("Failed to load time slots:", error);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (selectedDoctor && date) {
      loadTimeSlots(selectedDoctor, date);
    }
  };

  const handleSubmit = async () => {
    try {
      await bookingApi.createBooking({
        doctorId: selectedDoctor,
        serviceId: selectedService,
        timeSlotId: selectedTimeSlot,
        date: selectedDate,
        notes,
      });
      alert("Đặt lịch thành công! Vui lòng kiểm tra email để xác nhận.");
      // Reset form
      setStep(1);
      setSelectedDoctor("");
      setSelectedService("");
      setSelectedDate("");
      setSelectedTimeSlot("");
      setNotes("");
    } catch (error) {
      alert("Đặt lịch thất bại. Vui lòng thử lại.");
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Đặt lịch khám</h1>
        <p className="text-muted-foreground mt-2">
          Chọn bác sĩ, dịch vụ và thời gian phù hợp
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              {s}
            </div>
            {s < 4 && (
              <div
                className={`w-20 h-1 ${step > s ? "bg-primary" : "bg-muted"}`}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && "Chọn bác sĩ"}
            {step === 2 && "Chọn dịch vụ"}
            {step === 3 && "Chọn thời gian"}
            {step === 4 && "Xác nhận thông tin"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              {doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className={`p-4 border rounded-lg cursor-pointer hover:border-primary ${
                    selectedDoctor === doctor.id
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                  onClick={() => setSelectedDoctor(doctor.id)}
                >
                  <h3 className="font-semibold">{doctor.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {doctor.specialization}
                  </p>
                  <p className="text-sm mt-2">
                    {doctor.experience} năm kinh nghiệm
                  </p>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`p-4 border rounded-lg cursor-pointer hover:border-primary ${
                    selectedService === service.id
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                  onClick={() => setSelectedService(service.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{service.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {service.description}
                      </p>
                      <p className="text-sm mt-2">
                        Thời gian: {service.duration} phút
                      </p>
                    </div>
                    <p className="font-semibold text-primary">
                      {service.price.toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label>Chọn ngày</Label>
                <input
                  type="date"
                  className="w-full mt-2 p-2 border rounded-md"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              {timeSlots.length > 0 && (
                <div>
                  <Label>Chọn giờ</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot.id}
                        variant={
                          selectedTimeSlot === slot.id ? "default" : "outline"
                        }
                        disabled={!slot.available}
                        onClick={() => setSelectedTimeSlot(slot.id)}
                      >
                        {slot.startTime}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label>Ghi chú (tùy chọn)</Label>
                <textarea
                  className="w-full mt-2 p-2 border rounded-md"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Nhập ghi chú nếu có..."
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Thông tin đặt lịch</h3>
                <p>
                  Bác sĩ: {doctors.find((d) => d.id === selectedDoctor)?.name}
                </p>
                <p>
                  Dịch vụ:{" "}
                  {services.find((s) => s.id === selectedService)?.name}
                </p>
                <p>Ngày: {selectedDate}</p>
                <p>
                  Giờ:{" "}
                  {timeSlots.find((t) => t.id === selectedTimeSlot)?.startTime}
                </p>
                {notes && <p>Ghi chú: {notes}</p>}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
            >
              Quay lại
            </Button>
            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !selectedDoctor) ||
                  (step === 2 && !selectedService) ||
                  (step === 3 && (!selectedDate || !selectedTimeSlot))
                }
              >
                Tiếp tục
              </Button>
            ) : (
              <Button onClick={handleSubmit}>Xác nhận đặt lịch</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
