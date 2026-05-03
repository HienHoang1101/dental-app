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

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href={ROUTES.HOME} className="flex items-center space-x-2">
          <span className="text-2xl">🦷</span>
          <span className="text-xl font-bold">Dental Clinic AI</span>
        </Link>

        <nav className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground">
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
                      Chat AI
                    </Button>
                  </Link>
                  <Link href={ROUTES.PATIENT_BOOKING}>
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
                      Dashboard
                    </Button>
                  </Link>
                  <Link href={ROUTES.ADMIN_APPOINTMENTS}>
                    <Button variant={pathname === ROUTES.ADMIN_APPOINTMENTS ? 'default' : 'ghost'}>
                      Lịch hẹn
                    </Button>
                  </Link>
                  <Link href={ROUTES.ADMIN_KNOWLEDGE_BASE}>
                    <Button variant={pathname === ROUTES.ADMIN_KNOWLEDGE_BASE ? 'default' : 'ghost'}>
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
  )
}
