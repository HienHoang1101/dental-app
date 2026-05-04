<<<<<<< HEAD
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/lib/constants/routes";
import { Loading } from "@/components/common/Loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<"patient" | "admin" | "doctor">;
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN);
      return;
=======
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/lib/constants/routes'
import { Loading } from '@/components/common/Loading'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: Array<'patient' | 'admin' | 'doctor'>
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN)
      return
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on role
<<<<<<< HEAD
      if (user.role === "admin") {
        router.push(ROUTES.ADMIN_DASHBOARD);
      } else if (user.role === "doctor") {
        router.push(ROUTES.DOCTOR_DASHBOARD);
      } else {
        router.push(ROUTES.PATIENT_CHAT);
      }
    }
  }, [isAuthenticated, user, allowedRoles, router]);

  if (!isAuthenticated) {
    return <Loading />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Loading />;
  }

  return <>{children}</>;
=======
      if (user.role === 'admin') {
        router.push(ROUTES.ADMIN_DASHBOARD)
      } else {
        router.push(ROUTES.PATIENT_DASHBOARD)
      }
    }
  }, [isAuthenticated, user, allowedRoles, router])

  if (!isAuthenticated) {
    return <Loading />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Loading />
  }

  return <>{children}</>
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
}
