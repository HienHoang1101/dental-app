'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { bookingApi } from '@/lib/api/booking'
import { Loading } from '@/components/common/Loading'
import { CancelAppointmentDialog } from '@/components/booking/CancelAppointmentDialog'
import type { Appointment } from '@/types/booking'

export default function HistoryPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      const data = await bookingApi.getAppointments()
      setAppointments(data)
    } catch (error) {
      console.error('Failed to load appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setCancelDialogOpen(true)
  }

  const handleCancelConfirm = async (reason: string) => {
    if (!selectedAppointment) return

    try {
      await bookingApi.cancelAppointment(selectedAppointment.id, reason)
      loadAppointments()
      alert('Đã hủy lịch hẹn thành công. Email xác nhận đã được gửi.')
    } catch (error) {
      throw error
    }
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Lịch sử khám bệnh</h1>
        <p className="text-muted-foreground mt-2">
          Xem lại tất cả lịch hẹn của bạn
        </p>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Bạn chưa có lịch hẹn nào
            </p>
            <Button onClick={() => window.location.href = '/patient/booking'}>
              Đặt lịch ngay
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{appointment.date}</CardTitle>
                    <CardDescription>
                      {appointment.startTime} - {appointment.endTime}
                    </CardDescription>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      appointment.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : appointment.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : appointment.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {appointment.status === 'confirmed'
                      ? 'Đã xác nhận'
                      : appointment.status === 'pending'
                      ? 'Chờ xác nhận'
                      : appointment.status === 'cancelled'
                      ? 'Đã hủy'
                      : 'Hoàn thành'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {appointment.notes && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Ghi chú: {appointment.notes}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Xem chi tiết
                  </Button>
                  {appointment.status === 'pending' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelClick(appointment)}
                    >
                      Hủy lịch
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CancelAppointmentDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleCancelConfirm}
        appointmentInfo={
          selectedAppointment
            ? {
                date: selectedAppointment.date,
                time: `${selectedAppointment.startTime} - ${selectedAppointment.endTime}`,
              }
            : undefined
        }
      />
    </div>
  )
}
