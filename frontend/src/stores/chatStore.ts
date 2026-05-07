/**
 * Chat Store - Zustand
 */

import { create } from "zustand";
import type { ChatSession, ChatMessage, ServiceSuggestion } from "@/types/chat";
import * as chatApi from "@/lib/api/chatApi";

interface ChatState {
  // Current session
  currentSession: ChatSession | null;
  messages: ChatMessage[];
  suggestions: ServiceSuggestion[] | null;

  // UI state
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  isOpen: boolean;

  // Actions
  openChat: () => Promise<void>;
  closeChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  loadHistory: (sessionId: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  currentSession: null,
  messages: [],
  suggestions: null,
  isLoading: false,
  isSending: false,
  error: null,
  isOpen: false,

  // Open chat widget
  openChat: async () => {
    set({ isOpen: true, isLoading: true, error: null });

    try {
      // Create new session
      const session = await chatApi.createChatSession();
      set({ currentSession: session, messages: [], isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Failed to create chat session",
        isLoading: false,
      });
    }
  },

  // Close chat widget
  closeChat: () => {
    set({ isOpen: false });
  },

  // Send message
  sendMessage: async (content: string) => {
    const { currentSession } = get();
    if (!currentSession) return;

    set({ isSending: true, error: null });

    try {
      const response = await chatApi.sendMessage(currentSession.id, content);

      // Add both user and assistant messages
      set((state) => ({
        messages: [
          ...state.messages,
          response.userMessage,
          response.assistantMessage,
        ],
        suggestions: response.suggestions,
        isSending: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Failed to send message",
        isSending: false,
      });
    }
  },

  // Load chat history
  loadHistory: async (sessionId: string) => {
    set({ isLoading: true, error: null });

    try {
      const history = await chatApi.getChatHistory(sessionId);
      set({
        currentSession: history.session,
        messages: history.messages,
        isLoading: false,
        isOpen: true,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Failed to load chat history",
        isLoading: false,
      });
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Reset state
  reset: () => {
    set({
      currentSession: null,
      messages: [],
      suggestions: null,
      isLoading: false,
      isSending: false,
      error: null,
      isOpen: false,
    });
  },
}));
