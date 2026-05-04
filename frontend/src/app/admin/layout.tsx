<<<<<<< HEAD
"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
=======
'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f

export default function AdminLayout({
  children,
}: {
<<<<<<< HEAD
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 max-w-7xl">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
=======
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          {children}
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
}
