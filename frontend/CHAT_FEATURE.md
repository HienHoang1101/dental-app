# 💬 Chat Feature - Frontend

## ✅ Đã tạo

### **1. Types** (`src/types/chat.ts`)

- `ChatSession` - Chat session interface
- `ChatMessage` - Message interface
- `ServiceSuggestion` - Service suggestion interface
- `SendMessageResponse` - API response interface
- `ChatHistory` - Chat history interface
- `ML_LABEL_NAMES` - Label display names

### **2. API** (`src/lib/api/chatApi.ts`)

- `createChatSession()` - Tạo session mới
- `getChatSessions()` - Lấy danh sách sessions
- `getChatHistory()` - Lấy chi tiết session
- `sendMessage()` - Gửi tin nhắn
- `createSummary()` - Tạo summary
- `deleteChatSession()` - Xóa session

### **3. Store** (`src/stores/chatStore.ts`)

- Zustand store cho chat state management
- Actions: `openChat`, `closeChat`, `sendMessage`, `loadHistory`
- State: `currentSession`, `messages`, `suggestions`, `isLoading`, `isSending`

### **4. Components**

#### **ChatWidget** (`src/components/chat/ChatWidget.tsx`)

- Floating chat widget (góc phải màn hình)
- Real-time messaging
- Service suggestions display
- ML classification display
- Auto-scroll to bottom
- Loading states

#### **ServiceSuggestionCard** (`src/components/chat/ServiceSuggestionCard.tsx`)

- Display service suggestions
- Confidence score
- Estimated price
- "Đặt lịch" button → navigate to booking

#### **ChatHistoryPage** (`src/app/patient/chat-history/page.tsx`)

- List all chat sessions
- View session details
- Delete sessions
- Display summary and ML classification

### **5. Layout Integration** (`src/app/layout.tsx`)

- ChatWidget added to root layout
- Available on all pages

---

## 🚀 Cách sử dụng

### **1. Chat Widget**

Widget tự động hiển thị ở góc phải màn hình:

```tsx
// Đã được thêm vào layout.tsx
<ChatWidget />
```

User flow:

1. Click icon 💬 ở góc phải
2. Chat widget mở ra
3. Gửi tin nhắn về triệu chứng
4. Nhận phản hồi từ AI + service suggestions
5. Click "Đặt lịch" để book appointment

### **2. Chat History**

Navigate to `/patient/chat-history`:

```tsx
// Link trong patient dashboard
<Link href="/patient/chat-history">Lịch sử chat</Link>
```

### **3. Programmatic Usage**

```tsx
import { useChatStore } from "@/stores/chatStore";

function MyComponent() {
  const { openChat, sendMessage } = useChatStore();

  // Open chat programmatically
  const handleOpenChat = () => {
    openChat();
  };

  // Send message programmatically
  const handleSend = async () => {
    await sendMessage("Răng tôi đau");
  };

  return <button onClick={handleOpenChat}>Chat với AI</button>;
}
```

---

## 🎨 UI/UX Features

### **Chat Widget**

- ✅ Floating button (minimized state)
- ✅ Expandable chat window (600px height)
- ✅ Message bubbles (user: blue, assistant: white)
- ✅ ML classification badge
- ✅ Service suggestion cards
- ✅ Loading indicators
- ✅ Error handling
- ✅ Auto-scroll
- ✅ Disclaimer message

### **Service Suggestions**

- ✅ Confidence score display
- ✅ Estimated price
- ✅ "Đặt lịch" button
- ✅ Hover effects

### **Chat History**

- ✅ Session list with summary
- ✅ ML classification badge
- ✅ Date/time display
- ✅ View/Delete actions
- ✅ Empty state

---

## 🔧 Configuration

### **Environment Variables**

File `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### **Tailwind CSS**

Chat components sử dụng Tailwind classes. Đảm bảo `tailwind.config.ts` đã cấu hình:

```ts
content: [
  './src/**/*.{js,ts,jsx,tsx,mdx}',
],
```

---

## 📱 Responsive Design

- ✅ Desktop: 384px width (w-96)
- ✅ Mobile: Full width với padding
- ✅ Floating button: Fixed position
- ✅ Chat widget: Fixed position, responsive height

---

## 🧪 Testing

### **Manual Testing**

1. **Open Chat**
   - Click floating button
   - Verify chat window opens
   - Verify session is created

2. **Send Message**
   - Type message
   - Press Enter or click Send
   - Verify user message appears
   - Verify assistant response appears
   - Verify ML classification badge

3. **Service Suggestions**
   - Send message with high confidence
   - Verify suggestions appear
   - Click "Đặt lịch"
   - Verify navigation to booking page

4. **Chat History**
   - Navigate to `/patient/chat-history`
   - Verify sessions list
   - Click "Xem" → verify chat opens
   - Click "Xóa" → verify session deleted

### **API Testing**

```bash
# Test with curl
TOKEN="your_jwt_token"

# Create session
curl -X POST http://localhost:8080/api/chat/sessions \
  -H "Authorization: Bearer $TOKEN"

# Send message
curl -X POST http://localhost:8080/api/chat/sessions/{sessionId}/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Răng tôi đau"}'
```

---

## 🐛 Troubleshooting

### **Chat widget không hiển thị**

- Kiểm tra `layout.tsx` đã import `ChatWidget`
- Kiểm tra CSS classes (Tailwind)
- Check browser console for errors

### **API calls fail**

- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check JWT token in localStorage
- Verify backend is running (http://localhost:8080)

### **Messages không gửi được**

- Check network tab for API errors
- Verify session exists
- Check token expiration

### **Service suggestions không hiển thị**

- Verify ML confidence > 0.6
- Check API response structure
- Verify `suggestions` in store

---

## 🔄 Integration với Booking

Khi user click "Đặt lịch" từ service suggestion:

```tsx
// ServiceSuggestionCard.tsx
const handleBooking = async () => {
  // 1. Create summary
  await createSummary(sessionId);

  // 2. Navigate to booking with params
  router.push(`/booking?serviceId=${serviceId}&sessionId=${sessionId}`);
};
```

Booking page cần:

1. Read `serviceId` và `sessionId` from URL params
2. Pre-select service
3. Link `chat_session_id` to appointment when creating

---

## 📊 State Management

```
ChatStore (Zustand)
├── currentSession: ChatSession | null
├── messages: ChatMessage[]
├── suggestions: ServiceSuggestion[] | null
├── isLoading: boolean
├── isSending: boolean
├── error: string | null
└── isOpen: boolean

Actions:
├── openChat() → Create new session
├── closeChat() → Close widget
├── sendMessage(content) → Send message + update state
├── loadHistory(sessionId) → Load past session
└── reset() → Clear state
```

---

## ✨ Future Enhancements

- [ ] Typing indicator
- [ ] Message timestamps
- [ ] Emoji support
- [ ] File upload (images)
- [ ] Voice input
- [ ] Chat export to PDF
- [ ] Multi-language support
- [ ] Push notifications
- [ ] Unread message count

---

## 📚 Dependencies

```json
{
  "axios": "^1.x",
  "zustand": "^4.x",
  "lucide-react": "^0.x",
  "next": "^14.x",
  "react": "^18.x",
  "tailwindcss": "^3.x"
}
```

---

**Chat feature is ready to use! 🎉**

Start chatting by clicking the 💬 button in the bottom-right corner!
