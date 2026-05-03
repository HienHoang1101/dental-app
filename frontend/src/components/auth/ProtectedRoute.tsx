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
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on role
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
}
