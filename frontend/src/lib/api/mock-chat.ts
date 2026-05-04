/**
 * Mock Chat API for Testing
 */

import type {
  ChatSession,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  SymptomClassification,
} from '@/types/chat'

// Mock AI responses based on keywords
const generateAIResponse = (userMessage: string): string => {
  const message = userMessage.toLowerCase()

  if (message.includes('đau răng') || message.includes('dau rang')) {
    return `Dựa trên triệu chứng bạn mô tả, có thể bạn đang gặp vấn đề về răng. Một số nguyên nhân phổ biến gây đau răng:

1. **Sâu răng**: Khi vi khuẩn phá hủy men răng và ngà răng
2. **Viêm tủy răng**: Khi tủy răng bị nhiễm trùng
3. **Răng khôn mọc lệch**: Gây đau và viêm nướu

**Khuyến nghị:**
- Súc miệng nước muối ấm
- Tránh thức ăn quá nóng/lạnh
- Đặt lịch khám với bác sĩ để được chẩn đoán chính xác

Bạn có muốn đặt lịch khám ngay không?`
  }

  if (message.includes('chảy máu') || message.includes('chay mau')) {
    return `Chảy máu chân răng có thể do nhiều nguyên nhân:

1. **Viêm nướu**: Do vệ sinh răng miệng kém
2. **Viêm quanh răng**: Tình trạng nghiêm trọng hơn viêm nướu
3. **Đánh răng quá mạnh**: Làm tổn thương nướu

**Cách xử lý:**
- Đánh răng nhẹ nhàng 2 lần/ngày
- Dùng chỉ nha khoa
- Súc miệng nước muối
- Khám nha sĩ định kỳ 6 tháng/lần

Nếu chảy máu kéo dài, bạn nên đặt lịch khám để được điều trị kịp thời.`
  }

  if (message.includes('tẩy trắng') || message.includes('tay trang')) {
    return `Tẩy trắng răng là phương pháp làm sáng màu răng an toàn và hiệu quả.

**Các phương pháp tẩy trắng:**
1. **Tẩy trắng tại phòng khám** (Laser/Bleaching)
   - Hiệu quả nhanh (1-2 giờ)
   - Kết quả rõ rệt
   - Giá: 2.000.000 - 5.000.000đ

2. **Tẩy trắng tại nhà**
   - Sử dụng máng tẩy trắng
   - Thời gian dài hơn (2-4 tuần)
   - Giá rẻ hơn

**Lưu ý:**
- Không phù hợp với răng sứ, răng đã trám
- Có thể gây ê buốt tạm thời
- Cần duy trì bằng vệ sinh răng miệng tốt

Bạn muốn tư vấn thêm về phương pháp nào?`
  }

  if (message.includes('niềng răng') || message.includes('nieng rang') || message.includes('chỉnh nha')) {
    return `Niềng răng (chỉnh nha) giúp điều chỉnh răng và khớp cắn.

**Các loại niềng răng:**
1. **Niềng mắc cài kim loại**
   - Phổ biến nhất
   - Giá: 25-40 triệu
   - Thời gian: 18-24 tháng

2. **Niềng mắc cài sứ**
   - Thẩm mỹ hơn
   - Giá: 35-50 triệu

3. **Niềng trong suốt (Invisalign)**
   - Tháo lắp được
   - Thẩm mỹ cao
   - Giá: 60-100 triệu

**Quy trình:**
1. Khám và chụp X-quang
2. Lập kế hoạch điều trị
3. Gắn mắc cài
4. Tái khám định kỳ 4-6 tuần

Bạn muốn đặt lịch tư vấn chỉnh nha không?`
  }

  // Default response
  return `Cảm ơn bạn đã liên hệ! Tôi là trợ lý AI nha khoa, có thể giúp bạn:

- Tư vấn về các vấn đề răng miệng
- Giải đáp thắc mắc về dịch vụ nha khoa
- Hướng dẫn chăm sóc răng miệng
- Hỗ trợ đặt lịch khám

Bạn có thể hỏi tôi về:
• Đau răng, sâu răng
• Chảy máu chân răng
• Tẩy trắng răng
• Niềng răng, chỉnh nha
• Nhổ răng khôn
• Trám răng, bọc răng sứ

Bạn đang gặp vấn đề gì về răng miệng?`
}

// Mock sessions storage
const MOCK_SESSIONS: ChatSession[] = []

export const mockChatApi = {
  getSessions: async (): Promise<ChatSession[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return MOCK_SESSIONS
  },

  getMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const session = MOCK_SESSIONS.find((s) => s.id === sessionId)
    return session?.messages || []
  },

  sendMessage: async (data: ChatRequest): Promise<ChatResponse> => {
    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const sessionId = data.sessionId || `session_${Date.now()}`
    const aiResponse = generateAIResponse(data.message)

    return {
      response: aiResponse,
      confidence: 0.85 + Math.random() * 0.1, // 0.85 - 0.95
      sources: ['dental_care_guide.pdf', 'treatment_protocols.pdf'],
      disclaimer:
        '⚠️ Thông tin chỉ mang tính chất tham khảo. Vui lòng đặt lịch khám với bác sĩ để được tư vấn chính xác.',
      sessionId,
    }
  },

  classifySymptom: async (text: string): Promise<SymptomClassification> => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const message = text.toLowerCase()
    let category = 'Khác'
    let description = 'Triệu chứng chung'

    if (message.includes('đau') || message.includes('dau')) {
      category = 'Đau răng'
      description = 'Triệu chứng đau răng cấp tính'
    } else if (message.includes('chảy máu') || message.includes('chay mau')) {
      category = 'Chảy máu nướu'
      description = 'Viêm nướu, chảy máu chân răng'
    } else if (message.includes('sâu') || message.includes('sau')) {
      category = 'Sâu răng'
      description = 'Răng bị sâu, cần điều trị'
    }

    return {
      symptomCategory: category,
      confidence: 0.8 + Math.random() * 0.15,
      description,
    }
  },
}
