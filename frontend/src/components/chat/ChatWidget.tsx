"use client";

/**
 * Chat Widget - Floating chat interface
 */

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Plus, History } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { ML_LABEL_NAMES } from "@/types/chat";
import { ServiceSuggestionCard } from "./ServiceSuggestionCard";

export function ChatWidget() {
  const { user, isAuthenticated } = useAuthStore();

  const {
    isOpen,
    currentSession,
    messages,
    suggestions,
    isLoading,
    isSending,
    error,
    openChat,
    closeChat,
    sendMessage,
    startNewSession,
    clearError,
    reset,
  } = useChatStore();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const message = input.trim();
    setInput("");
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Only show chatbot for logged-in patients
  if (!isAuthenticated || !user || user.role !== "patient") {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={openChat}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110 z-50"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <h3 className="font-semibold">Chat tư vấn nha khoa</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => startNewSession()}
            className="hover:bg-blue-700 rounded p-1 transition-colors"
            title="Cuộc trò chuyện mới"
            aria-label="New chat"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => (window.location.href = "/patient/chat-history")}
            className="hover:bg-blue-700 rounded p-1 transition-colors"
            title="Lịch sử trò chuyện"
            aria-label="Chat history"
          >
            <History className="w-5 h-5" />
          </button>
          <button
            onClick={closeChat}
            className="hover:bg-blue-700 rounded p-1 transition-colors ml-1"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
            <button
              onClick={clearError}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>Xin chào! Tôi có thể giúp gì cho bạn?</p>
            <p className="text-sm mt-1">Hãy mô tả triệu chứng của bạn</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>

              {message.role === "assistant" && message.mlLabel && (
                <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                  <span className="font-medium">Phân loại:</span>{" "}
                  {ML_LABEL_NAMES[message.mlLabel] || message.mlLabel}
                  {message.mlConfidence && (
                    <span className="ml-1">
                      ({Math.round(message.mlConfidence * 100)}%)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Service Suggestions */}
        {suggestions && suggestions.length > 0 && (
          <div className="pb-2">
            <div className="flex items-center gap-1 mb-2 px-1">
              <div className="h-px flex-1 bg-gray-200"></div>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Dịch vụ gợi ý</span>
              <div className="h-px flex-1 bg-gray-200"></div>
            </div>
            <div className="flex flex-col gap-2">
              {suggestions.map((suggestion) => (
                <ServiceSuggestionCard
                  key={suggestion.serviceId}
                  suggestion={suggestion}
                  sessionId={currentSession?.id || ""}
                />
              ))}
            </div>
          </div>
        )}

        {isSending && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn..."
            disabled={isSending || !currentSession}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending || !currentSession}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          ⚠️ Kết quả chỉ mang tính tham khảo. Vui lòng gặp bác sĩ để được chẩn
          đoán chính xác.
        </p>
      </div>
    </div>
  );
}
