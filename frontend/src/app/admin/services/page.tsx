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
import type { Service } from "@/types/booking";
import { Plus, Edit, ToggleLeft, ToggleRight } from "lucide-react";

export default function AdminServicesPage() {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    duration: 30,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const data = await adminApi.getAllServices();
      setServices(data);
    } catch (error) {
      console.error("Failed to load services:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingService(null);
    setFormData({
      name: "",
      description: "",
      price: 0,
      duration: 30,
    });
    setDialogOpen(true);
  };

  const handleEditClick = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || formData.price <= 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingService) {
        await adminApi.updateService(editingService.id, formData);
        toast({
          title: "Thành công",
          description: "Đã cập nhật dịch vụ",
        });
      } else {
        await adminApi.createService(formData);
        toast({
          title: "Thành công",
          description: "Đã thêm dịch vụ mới",
        });
      }
      setDialogOpen(false);
      loadServices();
    } catch (error) {
      console.error("Failed to save service:", error);
      toast({
        title: "Lỗi",
        description: "Không thể lưu dịch vụ",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý dịch vụ</h1>
          <p className="text-muted-foreground mt-2">
            Quản lý các dịch vụ nha khoa
          </p>
        </div>
        <Button onClick={handleAddClick}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm dịch vụ
        </Button>
      </div>

      {/* Services List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{service.name}</CardTitle>
                <Badge variant="outline">{service.duration} phút</Badge>
              </div>
              <CardDescription className="line-clamp-2">
                {service.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-2xl font-bold text-blue-600">
                  {formatPrice(service.price)}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditClick(service)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Sửa
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin dịch vụ vào form bên dưới
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Tên dịch vụ *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Khám tổng quát"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Mô tả chi tiết về dịch vụ..."
                rows={3}
                className="mt-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Giá (VNĐ) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="150000"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="duration">Thời gian (phút) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: parseInt(e.target.value) || 30,
                    })
                  }
                  placeholder="30"
                  className="mt-2"
                />
              </div>
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
