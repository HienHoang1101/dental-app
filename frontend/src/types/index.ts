export interface User {
<<<<<<< HEAD
  id: string;
  email: string;
  fullName: string;
  role: "patient" | "admin" | "doctor";
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

// Re-export all types
export * from "./admin";
export * from "./booking";
export * from "./chat";
export * from "./patient";
export * from "./doctor";
=======
  id: string
  email: string
  name: string
  role: 'patient' | 'admin' | 'doctor'
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  phone?: string
}
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
