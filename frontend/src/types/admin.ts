export interface DashboardStats {
  totalAppointments: number
  pendingAppointments: number
  confirmedAppointments: number
  totalPatients: number
  todayAppointments: number
}

export interface KnowledgeBaseDocument {
  id: string
  title: string
  filename: string
  uploadedBy: string
  uploadedAt: string
  size: number
  chunks: number
  vectorIds: string[]
}

export interface UploadKBRequest {
  file: File
  title: string
}

export interface ChatHistoryItem {
  id: string
  patientId: string
  patientName: string
  sessionId: string
  startedAt: string
  endedAt?: string
  messageCount: number
}
