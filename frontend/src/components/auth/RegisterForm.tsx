"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/lib/constants/routes";
import { LoadingSpinner } from "@/components/common/Loading";

export function RegisterForm() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
<<<<<<< HEAD
    fullName: "",
=======
    name: "",
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...registerData } = formData;
      const response = await authApi.register(registerData);
      setAuth(response.user, response.token);
<<<<<<< HEAD
      router.push(ROUTES.PATIENT_CHAT);
=======
      router.push(ROUTES.PATIENT_DASHBOARD);
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Đăng ký</CardTitle>
        <CardDescription>Tạo tài khoản mới để sử dụng dịch vụ</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
<<<<<<< HEAD
            <Label htmlFor="fullName">Họ và tên</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Nguyễn Văn A"
              value={formData.fullName}
=======
            <Label htmlFor="name">Họ và tên</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Nguyễn Văn A"
              value={formData.name}
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="0123456789"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Đang đăng ký...</span>
              </>
            ) : (
              "Đăng ký"
            )}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Đã có tài khoản? </span>
            <a href={ROUTES.LOGIN} className="text-primary hover:underline">
              Đăng nhập
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
