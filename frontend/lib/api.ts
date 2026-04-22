// frontend/lib/api.ts
// API client gọi backend Ktor (http://localhost:8080)

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ── Types ──────────────────────────────────────────────

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponse;
}

export interface ErrorResponse {
  error: string;
}

export interface ProfileResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  dateOfBirth: string | null;
  gender: string | null;
  allergyNotes: string | null;
  medicalHistory: string | null;
}

export interface ServiceResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
  isActive: boolean;
}

export interface CreateServiceRequest {
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  price?: number;
  durationMinutes?: number;
  isActive?: boolean;
}

// ── Helper ─────────────────────────────────────────────

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error: ErrorResponse = await res.json().catch(() => ({
      error: `Lỗi ${res.status}`,
    }));
    throw new Error(error.error);
  }

  return res.json();
}

// ── Auth APIs ──────────────────────────────────────────

export async function register(data: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}): Promise<AuthResponse> {
  const response = await apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
  localStorage.setItem("token", response.accessToken);
  return response;
}

export async function login(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
  localStorage.setItem("token", response.accessToken);
  return response;
}

export async function getMe(): Promise<UserResponse> {
  return apiFetch<UserResponse>("/auth/me");
}

export async function getProfile(): Promise<ProfileResponse> {
  return apiFetch<ProfileResponse>("/profile");
}

export async function updateProfile(data: {
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  allergyNotes?: string;
  medicalHistory?: string;
}): Promise<ProfileResponse> {
  return apiFetch<ProfileResponse>("/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}

export function getToken(): string | null {
  return typeof window !== "undefined"
    ? localStorage.getItem("token")
    : null;
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

// ── Service APIs ───────────────────────────────────────

export async function getServices(): Promise<ServiceResponse[]> {
  return apiFetch<ServiceResponse[]>("/services");
}

export async function getServiceById(id: string): Promise<ServiceResponse> {
  return apiFetch<ServiceResponse>(`/services/${id}`);
}

// ── Admin Service APIs ─────────────────────────────────

export async function adminGetAllServices(): Promise<ServiceResponse[]> {
  return apiFetch<ServiceResponse[]>("/admin/services");
}

export async function adminCreateService(
  data: CreateServiceRequest
): Promise<ServiceResponse> {
  return apiFetch<ServiceResponse>("/admin/services", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function adminUpdateService(
  id: string,
  data: UpdateServiceRequest
): Promise<ServiceResponse> {
  return apiFetch<ServiceResponse>(`/admin/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
