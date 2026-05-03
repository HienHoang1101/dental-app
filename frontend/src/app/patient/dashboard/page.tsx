'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { bookingApi } from '@/lib/api/booking'
import { ROUTES } from '@/lib/constants/routes'
import { Loading } from '@/components/common/Loading'
import type { Appointment } from '@/types/booking'

export default function PatientDashboard() {
  const { user } = useAuthStore()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      const data = await bookingApi.getAppointments()
      setAppointments(data.slice(0, 3)) // Show only 3 recent appointments
    } catch (error) {
      console.error('Failed to load appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Xin chào, {user?.name}!</h1>
        <p className="text-muted-foreground mt-2">
          Chào mừng bạn đến với hệ thống phòng khám nha khoa
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>💬 Chat với AI</CardTitle>
            <CardDescription>
              Tư vấn nha khoa 24/7 với chatbot AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={ROUTES.PATIENT_CHAT}>
              <Button className="w-full">Bắt đầu chat</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📅 Đặt lịch khám</CardTitle>
            <CardDescription>
              Đặt lịch hẹn với bác sĩ nhanh chóng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={ROUTES.PATIENT_BOOKING}>
              <Button className="w-full">Đặt lịch ngay</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📋 Lịch sử khám</CardTitle>
            <CardDescription>
              Xem lại lịch sử khám bệnh của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={ROUTES.PATIENT_HISTORY}>
              <Button className="w-full" variant="outline">
                Xem lịch sử
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lịch hẹn sắp tới</CardTitle>
          <CardDescription>
            {appointments.length > 0
              ? 'Các lịch hẹn gần đây của bạn'
              : 'Bạn chưa có lịch hẹn nào'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {appointments.length > 0 ? (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{appointment.date}</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.startTime} - {appointment.endTime}
                    </p>
                    <p className="text-sm">
                      Trạng thái:{' '}
                      <span
                        className={
                          appointment.status === 'confirmed'
                            ? 'text-green-600'
                            : appointment.status === 'pending'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }
                      >
                        {appointment.status === 'confirmed'
                          ? 'Đã xác nhận'
                          : appointment.status === 'pending'
                          ? 'Chờ xác nhận'
                          : 'Đã hủy'}
                      </span>
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Chi tiết
                  </Button>
                </div>
              ))}
              <Link href={ROUTES.PATIENT_HISTORY}>
                <Button variant="link" className="w-full">
                  Xem tất cả lịch hẹn →
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Bạn chưa có lịch hẹn nào
              </p>
              <Link href={ROUTES.PATIENT_BOOKING}>
                <Button>Đặt lịch ngay</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
