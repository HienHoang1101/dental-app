"use client";

import { useRouter, usePathname } from "next/navigation";
import { Home, Calendar, User, Bell, FileText } from "lucide-react";
import Header from "./Header";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const navigation = [
    { name: "Trang chủ", href: "/patient/dashboard", icon: Home },
    { name: "Đặt khám", href: "/patient/appointments/book", icon: Calendar },
    { name: "Lịch hẹn", href: "/patient/appointments/history", icon: FileText },
    { name: "Hồ sơ", href: "/patient/profile", icon: User },
    { name: "Thông báo", href: "/patient/notifications", icon: Bell },
  ];

  const isActive = (href: string) => {
    if (href === "/patient/appointments/book") {
      return pathname?.startsWith("/patient/appointments/book");
    }
    if (href === "/patient/appointments/history") {
      return (
        pathname?.startsWith("/patient/appointments/history") ||
        pathname === "/patient/appointments"
      );
    }
    return pathname === href;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] sticky top-16">
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    active
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
