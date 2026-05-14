/**
 * Chat Types
 */

export interface ChatSession {
  id: string;
  patientId: string;
  startedAt: string;
  endedAt: string | null;
  summary: string | null;
  primaryLabel: string | null;
  primaryConfidence: number | null;
  isDeleted: boolean;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  mlLabel: string | null;
  mlConfidence: number | null;
  createdAt: string;
}

export interface ServiceSuggestion {
  serviceId: string;
  serviceName: string;
  specialtyId?: string | null;
  confidence: number;
  estimatedPrice: string | null;
}

export interface SendMessageResponse {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  suggestions: ServiceSuggestion[] | null;
}

export interface ChatHistory {
  session: ChatSession;
  messages: ChatMessage[];
}

// ML Label display names (Synced with ML-Service v2.0)
export const ML_LABEL_NAMES: Record<string, string> = {
  sau_rang: "Sâu răng",
  viem_tuy: "Viêm tủy răng",
  viem_nuou: "Viêm nướu",
  viem_nha_chu: "Viêm nha chu",
  rang_khon_moc_lech: "Răng khôn mọc lệch",
  nhay_cam_nga: "Nhạy cảm ngà răng",
  gay_vo_rang: "Gãy / vỡ răng",
  nhiem_trung_rang: "Nhiễm trùng / áp xe răng",
  chinh_nha: "Chỉnh nha / Niềng răng",
  tham_my: "Nha thẩm mỹ",
  mat_rang: "Mất răng / Phục hình",
  khac: "Tổng quát",
};
