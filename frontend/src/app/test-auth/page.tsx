"use client";

import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";

export default function TestAuthPage() {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const router = useRouter();

  const handleClearAndLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    clearAuth();
    router.push(ROUTES.LOGIN);
  };

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>🔍 Auth Debug Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Authentication Status:</h3>
            <p className={isAuthenticated ? "text-green-600" : "text-red-600"}>
              {isAuthenticated ? "✅ Authenticated" : "❌ Not Authenticated"}
            </p>
          </div>

          {user && (
            <>
              <div>
                <h3 className="font-semibold mb-2">User Info:</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Expected Dashboard:</h3>
                <p className="text-lg">
                  {user.role === "patient" && "👤 Patient → /patient/chat"}
                  {user.role === "doctor" && "👨‍⚕️ Doctor → /doctor/dashboard"}
                  {user.role === "admin" && "👑 Admin → /admin/dashboard"}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Current URL:</h3>
                <p className="text-sm text-gray-600">{window.location.href}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (user.role === "patient")
                      router.push(ROUTES.PATIENT_CHAT);
                    if (user.role === "doctor")
                      router.push(ROUTES.DOCTOR_DASHBOARD);
                    if (user.role === "admin")
                      router.push(ROUTES.ADMIN_DASHBOARD);
                  }}
                >
                  Go to My Dashboard
                </Button>
                <Button variant="destructive" onClick={handleClearAndLogout}>
                  Clear All & Logout
                </Button>
              </div>
            </>
          )}

          {!isAuthenticated && (
            <div>
              <p className="text-gray-600 mb-4">You are not logged in.</p>
              <Button onClick={() => router.push(ROUTES.LOGIN)}>
                Go to Login
              </Button>
            </div>
          )}

          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-2">LocalStorage Content:</h3>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(
                {
                  "auth-storage": localStorage.getItem("auth-storage"),
                  token: localStorage.getItem("token"),
                },
                null,
                2,
              )}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
