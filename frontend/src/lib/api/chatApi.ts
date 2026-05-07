/**
 * Chat API
 */

import axios from "axios";
import type {
  ChatSession,
  ChatHistory,
  SendMessageResponse,
} from "@/types/chat";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// Create axios instance with auth interceptor
const chatApi = axios.create({
  baseURL: `${API_BASE_URL}/chat`,
});

// Add auth token to requests
chatApi.interceptors.request.use((config) => {
  let token = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("token");
    if (!token) {
      try {
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
          token = JSON.parse(authStorage).state?.token;
        }
      } catch (e) {
        // Ignore parse error
      }
    }
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
chatApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

/**
 * Create a new chat session
 */
export async function createChatSession(): Promise<ChatSession> {
  const response = await chatApi.post<ChatSession>("/sessions");
  return response.data;
}

/**
 * Get all chat sessions for current user
 */
export async function getChatSessions(): Promise<ChatSession[]> {
  const response = await chatApi.get<ChatSession[]>("/sessions");
  return response.data;
}

/**
 * Get chat session with messages
 */
export async function getChatHistory(sessionId: string): Promise<ChatHistory> {
  const response = await chatApi.get<ChatHistory>(`/sessions/${sessionId}`);
  return response.data;
}

/**
 * Send a message in a chat session
 */
export async function sendMessage(
  sessionId: string,
  content: string,
): Promise<SendMessageResponse> {
  const response = await chatApi.post<SendMessageResponse>(
    `/sessions/${sessionId}/messages`,
    { content },
  );
  return response.data;
}

/**
 * Create summary for a chat session
 */
export async function createSummary(
  sessionId: string,
): Promise<{ summary: string }> {
  const response = await chatApi.post<{ summary: string }>(
    `/sessions/${sessionId}/summary`,
  );
  return response.data;
}

/**
 * Delete a chat session
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
  await chatApi.delete(`/sessions/${sessionId}`);
}
