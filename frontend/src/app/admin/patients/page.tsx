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
import { Input } from "@/components/ui/input";
import { adminApi } from "@/lib/api/admin";
import { Loading } from "@/components/common/Loading";
import type { Patient } from "@/types/patient";
import { Users, Search, Eye } from "lucide-react";

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchTerm]);

  const loadPatients = async () => {
    try {
      const data = await adminApi.getAllPatients();
      setPatients(data.patients);
    } catch (error) {
      console.error("Failed to load patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    if (searchTerm) {
      const filtered = patients.filter(
        (patient) =>
          patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.email.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  if (loading) {
    return <Loading />;
  }
=======
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const MOCK_PATIENTS = [
  {
    id: '1',
    name: 'Nguyễn Văn A',
    email: 'patient@test.com',
    phone: '0123456789',
    dateOfBirth: '1990-01-15',
    gender: 'male',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    totalAppointments: 5,
    lastVisit: '2026-05-02',
    status: 'active',
  },
  {
    id: '2',
    name: 'Trần Thị B',
    email: 'tran.b@email.com',
    phone: '0987654321',
    dateOfBirth: '1985-06-20',
    gender: 'female',
    address: '456 Đường XYZ, Quận 3, TP.HCM',
    totalAppointments: 3,
    lastVisit: '2026-04-28',
    status: 'active',
  },
  {
    id: '3',
    name: 'Lê Văn C',
    email: 'le.c@email.com',
    phone: '0369852147',
    dateOfBirth: '1995-03-10',
    gender: 'male',
    address: '789 Đường DEF, Quận 5, TP.HCM',
    totalAppointments: 8,
    lastVisit: '2026-05-01',
    status: 'active',
  },
  {
    id: '4',
    name: 'Phạm Thị D',
    email: 'pham.d@email.com',
    phone: '0258963147',
    dateOfBirth: '1988-12-05',
    gender: 'female',
    address: '321 Đường GHI, Quận 7, TP.HCM',
    totalAppointments: 2,
    lastVisit: '2026-04-15',
    status: 'inactive',
  },
]

export default function AdminPatientsPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPatients = MOCK_PATIENTS.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm)
  )
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý bệnh nhân</h1>
        <p className="text-muted-foreground mt-2">
          Xem và quản lý thông tin bệnh nhân
        </p>
      </div>

      {/* Search */}
<<<<<<< HEAD
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Tìm kiếm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách bệnh nhân</CardTitle>
          <CardDescription>
            Tìm thấy {filteredPatients.length} bệnh nhân
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPatients.length > 0 ? (
            <div className="space-y-3">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{patient.name}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-muted-foreground">
                      <p>📧 {patient.email}</p>
                      {patient.phone && <p>📞 {patient.phone}</p>}
                      {patient.dateOfBirth && (
                        <p>🎂 {formatDate(patient.dateOfBirth)}</p>
                      )}
                      <p>📅 Đăng ký: {formatDate(patient.createdAt)}</p>
                    </div>
                    {patient.allergies && (
                      <p className="text-sm text-red-600 mt-2">
                        ⚠️ Dị ứng: {patient.allergies}
                      </p>
                    )}
                  </div>
                  <Link href={`/admin/patients/${patient.id}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Chi tiết
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Không tìm thấy bệnh nhân nào
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
=======
      <div className="flex gap-4">
        <Input
          placeholder="Tìm kiếm theo tên, email, số điện thoại..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Button>🔍 Tìm kiếm</Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tổng bệnh nhân</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{MOCK_PATIENTS.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {MOCK_PATIENTS.filter((p) => p.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Bệnh nhân mới</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">2</div>
            <p className="text-xs text-muted-foreground">Tháng này</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tổng lượt khám</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {MOCK_PATIENTS.reduce((sum, p) => sum + p.totalAppointments, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patients List */}
      <div className="space-y-4">
        {filteredPatients.map((patient) => (
          <Card key={patient.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{patient.name}</CardTitle>
                  <CardDescription>Mã BN: #{patient.id}</CardDescription>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    patient.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {patient.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{patient.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Số điện thoại</p>
                    <p className="font-medium">{patient.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ngày sinh</p>
                    <p className="font-medium">{patient.dateOfBirth}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Địa chỉ</p>
                    <p className="font-medium">{patient.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tổng lượt khám</p>
                    <p className="font-medium">{patient.totalAppointments} lần</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Khám gần nhất</p>
                    <p className="font-medium">{patient.lastVisit}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1">
                  📋 Xem hồ sơ
                </Button>
                <Button variant="outline" className="flex-1">
                  📅 Lịch sử khám
                </Button>
                <Button variant="outline" className="flex-1">
                  ✏️ Chỉnh sửa
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
}
