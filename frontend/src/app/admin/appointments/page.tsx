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
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý lịch hẹn</h1>
        <p className="text-muted-foreground mt-2">
          Xem và quản lý tất cả lịch hẹn trong hệ thống
        </p>
      </div>

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
}
