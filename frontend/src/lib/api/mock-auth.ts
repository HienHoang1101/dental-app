/**
 * Mock Authentication for Testing
 * Sử dụng khi chưa có Backend
 */

import type {
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from "@/types";

// Mock users database
const MOCK_USERS = [
  {
    id: "1",
    email: "patient@test.com",
    password: "123456",
<<<<<<< HEAD
    fullName: "Nguyễn Văn A",
    role: "patient" as const,
    phone: "0901234567",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
=======
    name: "Nguyễn Văn A",
    role: "patient" as const,
    createdAt: new Date().toISOString(),
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
  },
  {
    id: "2",
    email: "admin@test.com",
    password: "admin123",
<<<<<<< HEAD
    fullName: "Admin User",
    role: "admin" as const,
    phone: "0901234568",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
=======
    name: "Admin User",
    role: "admin" as const,
    createdAt: new Date().toISOString(),
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
  },
  {
    id: "3",
    email: "doctor@test.com",
    password: "doctor123",
<<<<<<< HEAD
    fullName: "Bác sĩ Trần Thị B",
    role: "doctor" as const,
    phone: "0901234569",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
=======
    name: "Bác sĩ Trần Thị B",
    role: "doctor" as const,
    createdAt: new Date().toISOString(),
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
  },
];

// Generate mock JWT token
const generateMockToken = (userId: string): string => {
  return `mock_token_${userId}_${Date.now()}`;
};

export const mockAuthApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const user = MOCK_USERS.find(
      (u) => u.email === data.email && u.password === data.password,
    );

    if (!user) {
      throw new Error("Email hoặc mật khẩu không đúng");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    const token = generateMockToken(user.id);

    return {
      user: userWithoutPassword,
      token,
    };
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check if email already exists
    const existingUser = MOCK_USERS.find((u) => u.email === data.email);
    if (existingUser) {
      throw new Error("Email đã được sử dụng");
    }

    // Create new user
    const newUser: User = {
      id: String(MOCK_USERS.length + 1),
      email: data.email,
<<<<<<< HEAD
      fullName: data.fullName,
      role: "patient",
      phone: data.phone,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
=======
      name: data.name,
      role: "patient",
      createdAt: new Date().toISOString(),
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
    };

    const token = generateMockToken(newUser.id);

    return {
      user: newUser,
      token,
    };
  },

  getCurrentUser: async (): Promise<User> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Get user from token (mock)
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Không tìm thấy token");
    }

    // Extract user ID from mock token
    const userId = token.split("_")[2];
    const user = MOCK_USERS.find((u) => u.id === userId);

    if (!user) {
      throw new Error("User không tồn tại");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  logout: async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    localStorage.removeItem("token");
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  googleLogin: async (credential: string): Promise<AuthResponse> => {
    throw new Error("Google OAuth chưa được implement");
  },

  refreshToken: async (): Promise<{ token: string }> => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Không tìm thấy token");
    }
    return { token };
  },
};

// Export mock users for reference
export const MOCK_ACCOUNTS = [
  {
    email: "patient@test.com",
    password: "123456",
    role: "patient",
<<<<<<< HEAD
    fullName: "Nguyễn Văn A",
=======
    name: "Nguyễn Văn A",
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
  },
  {
    email: "admin@test.com",
    password: "admin123",
    role: "admin",
<<<<<<< HEAD
    fullName: "Admin User",
=======
    name: "Admin User",
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
  },
  {
    email: "doctor@test.com",
    password: "doctor123",
    role: "doctor",
<<<<<<< HEAD
    fullName: "Bác sĩ Trần Thị B",
=======
    name: "Bác sĩ Trần Thị B",
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
  },
];
