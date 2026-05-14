"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Users,
  UserCog,
  Calendar,
  Stethoscope,
  Briefcase,
  Grid,
  Settings,
  Bell,
  ClipboardList,
  Clock,
  Pill,
  FileText,
} from "lucide-react";
import Header from "./Header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: Home },
    { name: "Bệnh nhân", href: "/admin/patients", icon: Users },
    { name: "Bác sĩ", href: "/admin/doctors", icon: UserCog },
    { name: "Lịch hẹn", href: "/admin/appointments", icon: ClipboardList },
    { name: "Đơn thuốc", href: "/admin/prescriptions", icon: FileText },
    { name: "Thuốc", href: "/admin/medications", icon: Pill },
    { name: "Dịch vụ", href: "/admin/services", icon: Briefcase },
    { name: "Chuyên khoa", href: "/admin/specialties", icon: Stethoscope },
    { name: "Lịch làm việc", href: "/admin/schedules", icon: Calendar },
    { name: "Duyệt lịch", href: "/admin/schedule-changes", icon: Clock },
    { name: "Người dùng", href: "/admin/users", icon: Settings },
  ];

  const isActive = (href: string) => pathname === href;

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
