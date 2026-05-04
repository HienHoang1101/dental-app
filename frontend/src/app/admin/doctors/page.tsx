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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "@/lib/api/admin";
import { Loading } from "@/components/common/Loading";
import { useToast } from "@/components/ui/use-toast";
import type { DoctorProfile } from "@/types/doctor";
import { UserPlus, Edit, ToggleLeft, ToggleRight } from "lucide-react";

export default function AdminDoctorsPage() {
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorProfile | null>(
    null,
  );
  const [formData, setFormData] = useState({
    fullName: "",
    specialty: "",
    degree: "",
    bio: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const data = await adminApi.getAllDoctors();
      console.log("Doctors data:", data); // Debug
      setDoctors(data);
    } catch (error) {
      console.error("Failed to load doctors:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách bác sĩ",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingDoctor(null);
    setFormData({
      fullName: "",
      specialty: "",
      degree: "",
      bio: "",
    });
    setDialogOpen(true);
  };

  const handleEditClick = (doctor: DoctorProfile) => {
    setEditingDoctor(doctor);
    setFormData({
      fullName: doctor.fullName,
      specialty: doctor.specialty,
      degree: doctor.degree || "",
      bio: doctor.bio || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.fullName || !formData.specialty) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingDoctor) {
        await adminApi.updateDoctor(editingDoctor.id, formData);
        toast({
          title: "Thành công",
          description: "Đã cập nhật thông tin bác sĩ",
        });
      } else {
        await adminApi.createDoctor(formData);
        toast({
          title: "Thành công",
          description: "Đã thêm bác sĩ mới",
        });
      }
      setDialogOpen(false);
      loadDoctors();
    } catch (error) {
      console.error("Failed to save doctor:", error);
      toast({
        title: "Lỗi",
        description: "Không thể lưu thông tin bác sĩ",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (doctor: DoctorProfile) => {
    try {
      await adminApi.toggleDoctorStatus(doctor.id);
      toast({
        title: "Thành công",
        description: `Đã ${doctor.isActive ? "vô hiệu hóa" : "kích hoạt"} bác sĩ`,
      });
      loadDoctors();
    } catch (error) {
      console.error("Failed to toggle doctor status:", error);
      toast({
        title: "Lỗi",
        description: "Không thể thay đổi trạng thái",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý bác sĩ</h1>
          <p className="text-muted-foreground mt-2">
            Quản lý thông tin bác sĩ trong hệ thống
          </p>
        </div>
        <Button onClick={handleAddClick}>
          <UserPlus className="h-4 w-4 mr-2" />
          Thêm bác sĩ
        </Button>
      </div>

      {/* Doctors List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách bác sĩ</CardTitle>
          <CardDescription>
            Có {doctors.length} bác sĩ trong hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-semibold text-lg">
                      BS. {doctor.fullName}
                    </p>
                    <Badge variant={doctor.isActive ? "default" : "secondary"}>
                      {doctor.isActive ? "Đang hoạt động" : "Vô hiệu hóa"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>🏥 Chuyên khoa: {doctor.specialty}</p>
                    {doctor.degree && <p>🎓 {doctor.degree}</p>}
                    {doctor.bio && <p>📝 {doctor.bio}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditClick(doctor)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Sửa
                  </Button>
                  <Button
                    size="sm"
                    variant={doctor.isActive ? "destructive" : "default"}
                    onClick={() => handleToggleStatus(doctor)}
                  >
                    {doctor.isActive ? (
                      <>
                        <ToggleLeft className="h-4 w-4 mr-1" />
                        Vô hiệu hóa
                      </>
                    ) : (
                      <>
                        <ToggleRight className="h-4 w-4 mr-1" />
                        Kích hoạt
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingDoctor ? "Chỉnh sửa bác sĩ" : "Thêm bác sĩ mới"}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin bác sĩ vào form bên dưới
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Họ và tên *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  placeholder="Nguyễn Văn A"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="specialty">Chuyên khoa *</Label>
                <Input
                  id="specialty"
                  value={formData.specialty}
                  onChange={(e) =>
                    setFormData({ ...formData, specialty: e.target.value })
                  }
                  placeholder="Nha tổng quát"
                  className="mt-2"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="degree">Bằng cấp</Label>
              <Input
                id="degree"
                value={formData.degree}
                onChange={(e) =>
                  setFormData({ ...formData, degree: e.target.value })
                }
                placeholder="Thạc sĩ Nha khoa"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="bio">Giới thiệu</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                placeholder="Giới thiệu ngắn về bác sĩ..."
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
