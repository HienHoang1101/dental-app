"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MOCK_CHAT_HISTORY = [
  {
    id: "1",
    patientId: "1",
    patientName: "Nguyễn Văn A",
    sessionId: "session_1",
    startedAt: "2026-05-02T08:30:00Z",
    endedAt: "2026-05-02T08:45:00Z",
    messageCount: 8,
    topics: ["Đau răng", "Sâu răng"],
    lastMessage: "Cảm ơn bác sĩ, tôi sẽ đặt lịch khám",
  },
  {
    id: "2",
    patientId: "2",
    patientName: "Trần Thị B",
    sessionId: "session_2",
    startedAt: "2026-05-02T10:15:00Z",
    endedAt: "2026-05-02T10:30:00Z",
    messageCount: 12,
    topics: ["Chảy máu nướu", "Viêm nướu"],
    lastMessage: "Tôi hiểu rồi, cảm ơn bạn",
  },
  {
    id: "3",
    patientId: "3",
    patientName: "Lê Văn C",
    sessionId: "session_3",
    startedAt: "2026-05-02T14:00:00Z",
    endedAt: "2026-05-02T14:20:00Z",
    messageCount: 15,
    topics: ["Niềng răng", "Chỉnh nha", "Chi phí"],
    lastMessage: "Cho tôi hỏi thêm về chi phí",
  },
  {
    id: "4",
    patientId: "1",
    patientName: "Nguyễn Văn A",
    sessionId: "session_4",
    startedAt: "2026-05-02T16:30:00Z",
    endedAt: null,
    messageCount: 5,
    topics: ["Tẩy trắng răng"],
    lastMessage: "Tẩy trắng răng có an toàn không?",
  },
];

const MOCK_MESSAGES = [
  {
    id: "1",
    role: "user",
    content: "Tôi bị đau răng hàm dưới, phải làm sao?",
    timestamp: "2026-05-02T08:30:00Z",
  },
  {
    id: "2",
    role: "assistant",
    content:
      "Dựa trên triệu chứng bạn mô tả, có thể bạn đang gặp vấn đề về răng...",
    timestamp: "2026-05-02T08:31:00Z",
    confidence: 0.89,
  },
  {
    id: "3",
    role: "user",
    content: "Tôi có nên đi khám ngay không?",
    timestamp: "2026-05-02T08:32:00Z",
  },
  {
    id: "4",
    role: "assistant",
    content:
      "Nếu đau kéo dài hoặc đau nhiều, bạn nên đặt lịch khám với bác sĩ...",
    timestamp: "2026-05-02T08:33:00Z",
    confidence: 0.92,
  },
];

export default function ChatHistoryPage() {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages] = useState(MOCK_MESSAGES);

  const handleViewSession = (sessionId: string) => {
    setSelectedSession(sessionId);
    // In real app, load messages for this session
  };

  const selectedSessionData = MOCK_CHAT_HISTORY.find(
    (s) => s.sessionId === selectedSession,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Lịch sử Chat AI</h1>
        <p className="text-muted-foreground mt-2">
          Xem lại các cuộc trò chuyện giữa bệnh nhân và AI chatbot
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Tổng phiên chat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{MOCK_CHAT_HISTORY.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Đang hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {MOCK_CHAT_HISTORY.filter((s) => !s.endedAt).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tổng tin nhắn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {MOCK_CHAT_HISTORY.reduce((sum, s) => sum + s.messageCount, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Hôm nay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {MOCK_CHAT_HISTORY.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sessions List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">💬 Các phiên chat</h2>

          {MOCK_CHAT_HISTORY.map((session) => (
            <Card
              key={session.id}
              className={`cursor-pointer transition-colors ${
                selectedSession === session.sessionId
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/50"
              }`}
              onClick={() => handleViewSession(session.sessionId)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">
                      {session.patientName}
                    </CardTitle>
                    <CardDescription>
                      {new Date(session.startedAt).toLocaleString("vi-VN")}
                    </CardDescription>
                  </div>
                  {!session.endedAt && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Đang chat
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {session.topics.map((topic, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {session.messageCount} tin nhắn
                  </p>
                  <p className="text-sm italic">
                    &ldquo;{session.lastMessage}&rdquo;
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Messages View */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            📝 Chi tiết cuộc trò chuyện
          </h2>

          {selectedSession ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedSessionData?.patientName}</CardTitle>
                <CardDescription>Session ID: {selectedSession}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                        {message.role === "assistant" && message.confidence && (
                          <p className="text-xs opacity-70 mt-2">
                            Độ tin cậy: {(message.confidence * 100).toFixed(0)}%
                          </p>
                        )}
                        <p className="text-xs opacity-50 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString(
                            "vi-VN",
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      📥 Export
                    </Button>
                    <Button variant="outline" className="flex-1">
                      📊 Phân tích
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  Chọn một phiên chat để xem chi tiết
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
