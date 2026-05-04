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

export function LoginForm() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authApi.login(formData);
      setAuth(response.user, response.token);

      // Redirect based on role
      if (response.user.role === "admin") {
        router.push(ROUTES.ADMIN_DASHBOARD);
<<<<<<< HEAD
      } else if (response.user.role === "doctor") {
        router.push(ROUTES.DOCTOR_DASHBOARD);
      } else {
        // Patient goes directly to chat
        router.push(ROUTES.PATIENT_CHAT);
=======
      } else {
        router.push(ROUTES.PATIENT_DASHBOARD);
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Đăng nhập thất bại");
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
        <CardTitle>Đăng nhập</CardTitle>
        <CardDescription>
          Đăng nhập vào tài khoản của bạn để tiếp tục
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}

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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Đang đăng nhập...</span>
              </>
            ) : (
              "Đăng nhập"
            )}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Chưa có tài khoản? </span>
            <a href={ROUTES.REGISTER} className="text-primary hover:underline">
              Đăng ký ngay
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
