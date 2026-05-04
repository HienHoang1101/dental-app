"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { DoctorSidebar } from "@/components/layout/DoctorSidebar";
import { ROUTES } from "@/lib/constants/routes";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN);
      return;
    }

    if (user?.role !== "doctor") {
      // Redirect to appropriate dashboard based on role
      if (user?.role === "admin") {
        router.push(ROUTES.ADMIN_DASHBOARD);
      } else if (user?.role === "patient") {
        router.push(ROUTES.PATIENT_CHAT);
      } else {
        router.push(ROUTES.HOME);
      }
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== "doctor") {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <DoctorSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
