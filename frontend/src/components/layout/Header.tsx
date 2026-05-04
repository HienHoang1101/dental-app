<<<<<<< HEAD
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/lib/constants/routes";

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    window.location.href = ROUTES.LOGIN;
  };

  const getHomeRoute = () => {
    if (!isAuthenticated) return ROUTES.HOME;

    switch (user?.role) {
      case "patient":
        return ROUTES.PATIENT_CHAT;
      case "doctor":
        return ROUTES.DOCTOR_DASHBOARD;
      case "admin":
        return ROUTES.ADMIN_DASHBOARD;
      default:
        return ROUTES.HOME;
    }
  };
=======
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/lib/constants/routes'

export function Header() {
  const pathname = usePathname()
  const { user, isAuthenticated, clearAuth } = useAuthStore()

  const handleLogout = () => {
    clearAuth()
    window.location.href = ROUTES.LOGIN
  }
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
<<<<<<< HEAD
        <Link href={getHomeRoute()} className="flex items-center space-x-2">
=======
        <Link href={ROUTES.HOME} className="flex items-center space-x-2">
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
          <span className="text-2xl">🦷</span>
          <span className="text-xl font-bold">Dental Clinic AI</span>
        </Link>

        <nav className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground">
<<<<<<< HEAD
                Xin chào, {user?.fullName}
              </span>
              {user?.role === "patient" && (
                <>
                  <Link href={ROUTES.PATIENT_CHAT}>
                    <Button
                      variant={
                        pathname === ROUTES.PATIENT_CHAT ? "default" : "ghost"
                      }
                    >
=======
                Xin chào, {user?.name}
              </span>
              {user?.role === 'patient' && (
                <>
                  <Link href={ROUTES.PATIENT_DASHBOARD}>
                    <Button variant={pathname === ROUTES.PATIENT_DASHBOARD ? 'default' : 'ghost'}>
                      Dashboard
                    </Button>
                  </Link>
                  <Link href={ROUTES.PATIENT_CHAT}>
                    <Button variant={pathname === ROUTES.PATIENT_CHAT ? 'default' : 'ghost'}>
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
                      Chat AI
                    </Button>
                  </Link>
                  <Link href={ROUTES.PATIENT_BOOKING}>
<<<<<<< HEAD
                    <Button
                      variant={
                        pathname === ROUTES.PATIENT_BOOKING
                          ? "default"
                          : "ghost"
                      }
                    >
                      Đặt lịch
                    </Button>
                  </Link>
                  <Link href={ROUTES.PATIENT_HISTORY}>
                    <Button
                      variant={
                        pathname === ROUTES.PATIENT_HISTORY
                          ? "default"
                          : "ghost"
                      }
                    >
                      Lịch sử
                    </Button>
                  </Link>
                </>
              )}
              {user?.role === "admin" && (
                <>
                  <Link href={ROUTES.ADMIN_DASHBOARD}>
                    <Button
                      variant={
                        pathname === ROUTES.ADMIN_DASHBOARD
                          ? "default"
                          : "ghost"
                      }
                    >
=======
                    <Button variant={pathname === ROUTES.PATIENT_BOOKING ? 'default' : 'ghost'}>
                      Đặt lịch
                    </Button>
                  </Link>
                </>
              )}
              {user?.role === 'admin' && (
                <>
                  <Link href={ROUTES.ADMIN_DASHBOARD}>
                    <Button variant={pathname === ROUTES.ADMIN_DASHBOARD ? 'default' : 'ghost'}>
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
                      Dashboard
                    </Button>
                  </Link>
                  <Link href={ROUTES.ADMIN_APPOINTMENTS}>
<<<<<<< HEAD
                    <Button
                      variant={
                        pathname === ROUTES.ADMIN_APPOINTMENTS
                          ? "default"
                          : "ghost"
                      }
                    >
=======
                    <Button variant={pathname === ROUTES.ADMIN_APPOINTMENTS ? 'default' : 'ghost'}>
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
                      Lịch hẹn
                    </Button>
                  </Link>
                  <Link href={ROUTES.ADMIN_KNOWLEDGE_BASE}>
<<<<<<< HEAD
                    <Button
                      variant={
                        pathname === ROUTES.ADMIN_KNOWLEDGE_BASE
                          ? "default"
                          : "ghost"
                      }
                    >
=======
                    <Button variant={pathname === ROUTES.ADMIN_KNOWLEDGE_BASE ? 'default' : 'ghost'}>
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
                      Knowledge Base
                    </Button>
                  </Link>
                </>
              )}
              <Button variant="outline" onClick={handleLogout}>
                Đăng xuất
              </Button>
            </>
          ) : (
            <>
              <Link href={ROUTES.LOGIN}>
                <Button variant="ghost">Đăng nhập</Button>
              </Link>
              <Link href={ROUTES.REGISTER}>
                <Button>Đăng ký</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
<<<<<<< HEAD
  );
=======
  )
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
}
