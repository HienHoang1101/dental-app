"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/lib/constants/routes";
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCog,
  Stethoscope,
  FileText,
  MessageSquare,
  User,
  LogOut,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: ROUTES.ADMIN_DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    name: "Lịch hẹn",
    href: ROUTES.ADMIN_APPOINTMENTS,
    icon: Calendar,
  },
  {
    name: "Bệnh nhân",
    href: ROUTES.ADMIN_PATIENTS,
    icon: Users,
  },
  {
    name: "Bác sĩ",
    href: ROUTES.ADMIN_DOCTORS,
    icon: UserCog,
  },
  {
    name: "Dịch vụ",
    href: ROUTES.ADMIN_SERVICES,
    icon: Stethoscope,
  },
  {
    name: "Knowledge Base",
    href: ROUTES.ADMIN_KNOWLEDGE_BASE,
    icon: FileText,
  },
  {
    name: "Lịch sử chat AI",
    href: ROUTES.ADMIN_CHAT_HISTORY,
    icon: MessageSquare,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push(ROUTES.LOGIN);
  };

  return (
    <div className="flex flex-col w-64 bg-white border-r">
      {/* Logo/Header */}
      <div className="flex items-center h-16 px-6 border-b">
        <h1 className="text-xl font-bold text-blue-600">🦷 Nha Khoa AI</h1>
      </div>

      {/* User Info */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <User className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground">Quản trị viên</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive &&
                    "bg-purple-50 text-purple-600 hover:bg-purple-100",
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );
}
