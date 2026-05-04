<<<<<<< HEAD
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
=======
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  updateUser: (user: Partial<User>) => void
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
<<<<<<< HEAD

      setAuth: (user, token) => {
        localStorage.setItem("token", token);
        set({ user, token, isAuthenticated: true });
      },

      clearAuth: () => {
        localStorage.removeItem("token");
        set({ user: null, token: null, isAuthenticated: false });
      },

      logout: () => {
        localStorage.removeItem("token");
        set({ user: null, token: null, isAuthenticated: false });
      },

=======
      
      setAuth: (user, token) => {
        localStorage.setItem('token', token)
        set({ user, token, isAuthenticated: true })
      },
      
      clearAuth: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null, isAuthenticated: false })
      },
      
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
<<<<<<< HEAD
      name: "auth-storage",
=======
      name: 'auth-storage',
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
<<<<<<< HEAD
    },
  ),
);
=======
    }
  )
)
>>>>>>> ee5d247497f575ed566136dac5a54f200228398f
