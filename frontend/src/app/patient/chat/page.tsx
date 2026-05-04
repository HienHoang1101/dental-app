import { ChatWindow } from '@/components/chat/ChatWindow'

export default function ChatPage() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Chat với AI Nha khoa</h1>
        <p className="text-muted-foreground mt-2">
          Tư vấn nha khoa 24/7 với trợ lý AI thông minh
        </p>
      </div>
      
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          ⚠️ <strong>Lưu ý:</strong> Thông tin từ AI chỉ mang tính chất tham khảo. 
          Vui lòng đặt lịch khám với bác sĩ để được tư vấn chính xác.
        </p>
      </div>

      <div className="w-full">
        <ChatWindow />
      </div>
    </div>
  )
}
