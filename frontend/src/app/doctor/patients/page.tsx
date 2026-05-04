"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { doctorApi } from "@/lib/api/doctor";
import { Loading } from "@/components/common/Loading";
import type { DoctorAppointment } from "@/types/doctor";
import { Users, Search } from "lucide-react";

export default function DoctorPatientsPage() {
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [patients, setPatients] = useState<Map<string, DoctorAppointment>>(
    new Map(),
  );
  const [filteredPatients, setFilteredPatients] = useState<DoctorAppointment[]>(
    [],
  );
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
      const data = await doctorApi.getAppointments();
      setAppointments(data);

      // Extract unique patients
      const uniquePatients = new Map<string, DoctorAppointment>();
      data.forEach((apt) => {
        if (!uniquePatients.has(apt.patientId)) {
          uniquePatients.set(apt.patientId, apt);
        }
      });
      setPatients(uniquePatients);
    } catch (error) {
      console.error("Failed to load patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    const patientList = Array.from(patients.values());
    if (searchTerm) {
      const filtered = patientList.filter(
        (patient) =>
          patient.patientName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          patient.patientEmail.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patientList);
    }
  };

  const getPatientAppointmentCount = (patientId: string) => {
    return appointments.filter((apt) => apt.patientId === patientId).length;
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Danh sách bệnh nhân</h1>
        <p className="text-muted-foreground mt-2">
          Xem danh sách bệnh nhân đã khám
        </p>
      </div>

      {/* Search */}
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
                  key={patient.patientId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-lg">
                      {patient.patientName}
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-muted-foreground">
                      <p>📧 {patient.patientEmail}</p>
                      {patient.patientPhone && <p>📞 {patient.patientPhone}</p>}
                      <p>
                        📅 Đã khám:{" "}
                        {getPatientAppointmentCount(patient.patientId)} lần
                      </p>
                    </div>
                    {patient.patientAllergies && (
                      <p className="text-sm text-red-600 mt-2">
                        ⚠️ Dị ứng: {patient.patientAllergies}
                      </p>
                    )}
                  </div>
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
}
