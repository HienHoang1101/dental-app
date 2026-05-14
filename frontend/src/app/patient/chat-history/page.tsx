"use client";

/**
 * Chat History Page - Patient can view past chat sessions
 */

import { useEffect, useState } from "react";
import { MessageCircle, Calendar, Trash2, Eye } from "lucide-react";
import { getChatSessions, deleteChatSession } from "@/lib/api/chatApi";
import { useChatStore } from "@/stores/chatStore";
import type { ChatSession } from "@/types/chat";
import { ML_LABEL_NAMES } from "@/types/chat";

export default function ChatHistoryPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { loadHistory } = useChatStore();

  useEffect(() => {
    loadSessions();
  }, []);

  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const data = await getChatSessions();
      setSessions(data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load chat history");
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = async (sessionId: string) => {
    await loadHistory(sessionId);
  };

  const handleDelete = async (sessionId: string) => {
    if (deletingSessionId !== sessionId) {
      setDeletingSessionId(sessionId);
      // Tự động reset sau 3 giây nếu không bấm xác nhận
      setTimeout(() => setDeletingSessionId(null), 3000);
      return;
    }

    try {
      await deleteChatSession(sessionId);
      setSessions(sessions.filter((s) => s.id !== sessionId));
      setDeletingSessionId(null);
    } catch (err: any) {
      alert(err.response?.data?.error || "Không thể xóa cuộc trò chuyện");
      setDeletingSessionId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lịch sử chat</h1>
        <p className="text-gray-600">
          Xem lại các cuộc trò chuyện với AI tư vấn
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MessageCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Chưa có cuộc trò chuyện nào
          </h3>
          <p className="text-gray-600">
            Bắt đầu chat với AI để nhận tư vấn về triệu chứng của bạn
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">
                      Cuộc trò chuyện
                    </h3>
                    {session.primaryLabel && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {ML_LABEL_NAMES[session.primaryLabel] ||
                          session.primaryLabel}
                      </span>
                    )}
                  </div>

                  {session.summary && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {session.summary}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(session.startedAt).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    {session.primaryConfidence && (
                      <span className="text-green-600">
                        {Math.round(session.primaryConfidence * 100)}% độ chính
                        xác
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleView(session.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Xem
                  </button>
                  <button
                    onClick={() => handleDelete(session.id)}
                    className={`${
                      deletingSessionId === session.id
                        ? "bg-orange-600 hover:bg-orange-700"
                        : "bg-red-600 hover:bg-red-700"
                    } text-white px-4 py-2 rounded-md transition-all flex items-center gap-2`}
                  >
                    {deletingSessionId === session.id ? (
                      <>
                        <Trash2 className="w-4 h-4 animate-pulse" />
                        Xác nhận?
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Xóa
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
