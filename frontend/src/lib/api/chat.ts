import apiClient from './axios'
import { API_ENDPOINTS } from '@/lib/constants/api-endpoints'
import type {
  ChatSession,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  SymptomClassification,
} from '@/types/chat'
import { mockChatApi } from './mock-chat'

// Toggle between mock and real API
const USE_MOCK_API = true // Set to false when ML service is ready

export const chatApi = USE_MOCK_API ? mockChatApi : {
  getSessions: async (): Promise<ChatSession[]> => {
    const response = await apiClient.get(API_ENDPOINTS.CHAT.SESSIONS)
    return response.data
  },

  getMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    const response = await apiClient.get(
      API_ENDPOINTS.CHAT.MESSAGES(sessionId)
    )
    return response.data
  },

  sendMessage: async (data: ChatRequest): Promise<ChatResponse> => {
    const response = await apiClient.post(API_ENDPOINTS.ML.CHAT, data)
    return response.data
  },

  classifySymptom: async (text: string): Promise<SymptomClassification> => {
    const response = await apiClient.post(API_ENDPOINTS.ML.CLASSIFY_SYMPTOM, {
      text,
    })
    return response.data
  },
}
