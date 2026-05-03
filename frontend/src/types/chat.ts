export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  symptomCategory?: string
  confidence?: number
  sources?: string[]
}

export interface ChatSession {
  id: string
  patientId: string
  startedAt: string
  endedAt?: string
  messages: ChatMessage[]
}

export interface ChatRequest {
  message: string
  sessionId?: string
}

export interface ChatResponse {
  response: string
  confidence: number
  sources: string[]
  disclaimer: string
  sessionId: string
}

export interface SymptomClassification {
  symptomCategory: string
  confidence: number
  description: string
}
