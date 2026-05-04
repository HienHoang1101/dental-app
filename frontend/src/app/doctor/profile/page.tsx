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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/authStore";
import { doctorApi } from "@/lib/api/doctor";
import { Loading } from "@/components/common/Loading";
import { useToast } from "@/components/ui/use-toast";
import type { DoctorProfile } from "@/types/doctor";
import { User } from "lucide-react";

export default function DoctorProfilePage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await doctorApi.getProfile();
      setProfile(data);
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      // TODO: Implement update profile API
      toast({
        title: "Thành công",
        description: "Đã cập nhật hồ sơ",
      });
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật hồ sơ",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Hồ sơ cá nhân</h1>
        <p className="text-muted-foreground mt-2">
          Quản lý thông tin cá nhân của bạn
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Thông tin cá nhân
          </CardTitle>
          <CardDescription>Cập nhật thông tin hồ sơ của bạn</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input
                id="fullName"
                value={profile?.fullName || ""}
                onChange={(e) =>
                  setProfile(
                    profile ? { ...profile, fullName: e.target.value } : null,
                  )
                }
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="specialty">Chuyên khoa</Label>
              <Input
                id="specialty"
                value={profile?.specialty || ""}
                onChange={(e) =>
                  setProfile(
                    profile ? { ...profile, specialty: e.target.value } : null,
                  )
                }
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="degree">Bằng cấp</Label>
            <Input
              id="degree"
              value={profile?.degree || ""}
              onChange={(e) =>
                setProfile(
                  profile ? { ...profile, degree: e.target.value } : null,
                )
              }
              className="mt-2"
              placeholder="VD: Thạc sĩ Nha khoa"
            />
          </div>

          <div>
            <Label htmlFor="bio">Giới thiệu</Label>
            <Textarea
              id="bio"
              value={profile?.bio || ""}
              onChange={(e) =>
                setProfile(profile ? { ...profile, bio: e.target.value } : null)
              }
              className="mt-2"
              rows={4}
              placeholder="Giới thiệu ngắn về bản thân..."
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user?.email || ""}
              disabled
              className="mt-2 bg-gray-50"
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
