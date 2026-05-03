'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading } from '@/components/common/Loading'
import type { DashboardStats } from '@/types/admin'

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // TODO: Implement API call
      // const data = await adminApi.getDashboardStats()
      // setStats(data)
      
      // Mock data for now
      setStats({
        totalAppointments: 150,
        pendingAppointments: 12,
        confirmedAppointments: 45,
        totalPatients: 320,
        todayAppointments: 8,
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
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
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Tổng quan hệ thống phòng khám
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tổng lịch hẹn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tất cả lịch hẹn trong hệ thống
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Chờ xác nhận</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {stats?.pendingAppointments}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lịch hẹn cần xác nhận
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Đã xác nhận</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats?.confirmedAppointments}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lịch hẹn đã xác nhận
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tổng bệnh nhân</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalPatients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Bệnh nhân đã đăng ký
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lịch hẹn hôm nay</CardTitle>
            <CardDescription>
              {stats?.todayAppointments} lịch hẹn trong ngày
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Xem chi tiết tại trang Quản lý lịch hẹn
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription>
              Các hoạt động mới nhất trong hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Chức năng đang được phát triển
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
