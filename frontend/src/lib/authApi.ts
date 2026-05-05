import api, { ApiResponse } from "./api";
import { LoginRequest, LoginResponse, RegisterRequest, User } from "@/types";

export const authApi = {
  // Login
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<ApiResponse<LoginResponse>>(
      "/auth/login",
      data,
    );
    return response.data.data!;
  },

  // Register
  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post<ApiResponse<User>>("/auth/register", data);
    return response.data.data!;
  },

  // Get current user
  me: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>("/auth/me");
    return response.data.data!;
  },

  // Logout
  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },
};
