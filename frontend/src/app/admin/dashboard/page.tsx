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
import { adminApi } from "@/lib/api/admin";
import { Loading } from "@/components/common/Loading";
import { ROUTES } from "@/lib/constants/routes";
import type { DashboardStats } from "@/types/admin";
import {
  Calendar,
  Users,
  UserCog,
  Stethoscope,
  FileText,
  MessageSquare,
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await adminApi.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats:", error);
      // Set empty stats on error instead of mock data
      setStats({
        totalAppointments: 0,
        pendingAppointments: 0,
        confirmedAppointments: 0,
        totalPatients: 0,
        todayAppointments: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
=======
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
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
<<<<<<< HEAD
          Tổng quan hệ thống phòng khám nha khoa
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng lịch hẹn</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAppointments}</div>
=======
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
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
            <p className="text-xs text-muted-foreground mt-1">
              Tất cả lịch hẹn trong hệ thống
            </p>
          </CardContent>
        </Card>

        <Card>
<<<<<<< HEAD
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chờ xác nhận</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
=======
          <CardHeader>
            <CardTitle className="text-sm font-medium">Chờ xác nhận</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
              {stats?.pendingAppointments}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lịch hẹn cần xác nhận
            </p>
          </CardContent>
        </Card>

        <Card>
<<<<<<< HEAD
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã xác nhận</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
=======
          <CardHeader>
            <CardTitle className="text-sm font-medium">Đã xác nhận</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
              {stats?.confirmedAppointments}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lịch hẹn đã xác nhận
            </p>
          </CardContent>
        </Card>

        <Card>
<<<<<<< HEAD
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng bệnh nhân
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPatients}</div>
=======
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tổng bệnh nhân</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalPatients}</div>
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
            <p className="text-xs text-muted-foreground mt-1">
              Bệnh nhân đã đăng ký
            </p>
          </CardContent>
        </Card>
      </div>

<<<<<<< HEAD
      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Quản lý lịch hẹn
            </CardTitle>
            <CardDescription>Xem và xác nhận lịch hẹn</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={ROUTES.ADMIN_APPOINTMENTS}>
              <Button className="w-full">Xem lịch hẹn</Button>
            </Link>
=======
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
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
<<<<<<< HEAD
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Lịch làm việc
            </CardTitle>
            <CardDescription>Quản lý lịch làm việc bác sĩ</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={ROUTES.ADMIN_SCHEDULES}>
              <Button className="w-full" variant="outline">
                Xem lịch làm việc
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Quản lý bệnh nhân
            </CardTitle>
            <CardDescription>Xem thông tin bệnh nhân</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={ROUTES.ADMIN_PATIENTS}>
              <Button className="w-full" variant="outline">
                Xem bệnh nhân
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Quản lý bác sĩ
            </CardTitle>
            <CardDescription>Quản lý thông tin bác sĩ</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={ROUTES.ADMIN_DOCTORS}>
              <Button className="w-full" variant="outline">
                Xem bác sĩ
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Quản lý dịch vụ
            </CardTitle>
            <CardDescription>Quản lý dịch vụ nha khoa</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={ROUTES.ADMIN_SERVICES}>
              <Button className="w-full" variant="outline">
                Xem dịch vụ
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Knowledge Base
            </CardTitle>
            <CardDescription>Quản lý tài liệu AI</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={ROUTES.ADMIN_KNOWLEDGE_BASE}>
              <Button className="w-full" variant="outline">
                Xem tài liệu
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Lịch sử chat AI
            </CardTitle>
            <CardDescription>Xem lịch sử tư vấn AI</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={ROUTES.ADMIN_CHAT_HISTORY}>
              <Button className="w-full" variant="outline">
                Xem lịch sử
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Today's Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Tóm tắt hôm nay</CardTitle>
          <CardDescription>Các hoạt động trong ngày hôm nay</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Lịch hẹn hôm nay</p>
                <p className="text-sm text-muted-foreground">
                  Tổng số lịch hẹn trong ngày
                </p>
              </div>
              <div className="text-2xl font-bold">
                {stats?.todayAppointments}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
=======
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
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
}
