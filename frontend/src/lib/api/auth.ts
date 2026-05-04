<<<<<<< HEAD
import apiClient from "./axios";
import { API_ENDPOINTS } from "@/lib/constants/api-endpoints";
import type {
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from "@/types";
import { mockAuthApi } from "./mock-auth";

// Toggle between mock and real API
const USE_MOCK_API = false; // Set to false when backend is ready

export const authApi = USE_MOCK_API
  ? mockAuthApi
  : {
      login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, data);
        return response.data.data; // Unwrap nested data
      },

      register: async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await apiClient.post(
          API_ENDPOINTS.AUTH.REGISTER,
          data,
        );
        return response.data.data; // Unwrap nested data
      },

      googleLogin: async (credential: string): Promise<AuthResponse> => {
        const response = await apiClient.post(API_ENDPOINTS.AUTH.GOOGLE_LOGIN, {
          credential,
        });
        return response.data.data; // Unwrap nested data
      },

      logout: async (): Promise<void> => {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
      },

      getCurrentUser: async (): Promise<User> => {
        const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);
        return response.data.data; // Unwrap nested data
      },

      refreshToken: async (): Promise<{ token: string }> => {
        const response = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH);
        return response.data.data; // Unwrap nested data
      },
    };
=======
import apiClient from './axios'
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints'
import type { User, AuthResponse, LoginRequest, RegisterRequest } from '@/types'
import { mockAuthApi } from './mock-auth'

// Toggle between mock and real API
const USE_MOCK_API = true // Set to false when backend is ready

export const authApi = USE_MOCK_API ? mockAuthApi : {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, data)
    return response.data
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, data)
    return response.data
  },

  googleLogin: async (credential: string): Promise<AuthResponse> => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.GOOGLE_LOGIN, {
      credential,
    })
    return response.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get(API_ENDPOINTS.AUTH.ME)
    return response.data
  },

  refreshToken: async (): Promise<{ token: string }> => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH)
    return response.data
  },
}
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
