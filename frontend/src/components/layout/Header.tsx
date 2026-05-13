"use client";

import { useRouter } from "next/navigation";
import { Bell, User, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/lib/authApi";
import { useState, useEffect } from "react";
import { patientApi } from "@/lib/patientApi";

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
    }
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      const count = await patientApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to load unread count:", error);
    }
  };

  const handleLogout = () => {
    // JWT is stateless, just clear client-side data
    logout();
    router.push("/login");
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case "patient":
        return "Khách hàng";
      case "doctor":
        return "Bác sĩ";
      case "admin":
        return "Quản trị viên";
      default:
        return role;
    }
  };

  const getNotificationPath = () => {
    switch (user?.role) {
      case "patient":
        return "/patient/notifications";
      case "doctor":
        return "/doctor/notifications";
      case "admin":
        return "/admin/notifications";
      default:
        return "/notifications";
    }
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-blue-600">🦷 Nha Khoa</h1>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button
              onClick={() => router.push(getNotificationPath())}
              className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* User menu */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.fullName}
                </p>
                <p className="text-xs text-gray-500">
                  {user && getRoleName(user.role)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const profilePath =
                      user?.role === "patient"
                        ? "/patient/profile"
                        : user?.role === "doctor"
                          ? "/doctor/profile"
                          : "/admin/profile";
                    router.push(profilePath);
                  }}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <User className="w-5 h-5" />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-full transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
