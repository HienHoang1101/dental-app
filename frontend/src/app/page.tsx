"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    // Redirect based on role
    switch (user.role.toLowerCase()) {
      case "patient":
        router.replace("/patient/dashboard");
        break;
      case "doctor":
        router.replace("/doctor/dashboard");
        break;
      case "admin":
        router.replace("/admin/dashboard");
        break;
      default:
        router.replace("/login");
    }
  }, [user, isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}
