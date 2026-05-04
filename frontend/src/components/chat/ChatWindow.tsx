'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { ChatInput } from '@/components/chat/ChatInput'
import { chatApi } from '@/lib/api/chat'
import { LoadingSpinner } from '@/components/common/Loading'
import type { ChatMessage as ChatMessageType } from '@/types/chat'

export function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      sessionId: sessionId || '',
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])
    setLoading(true)

    try {
      const response = await chatApi.sendMessage({
        message: content,
        sessionId: sessionId, // Pass current sessionId
      })

      // Update sessionId if this is first message
      if (!sessionId) {
        setSessionId(response.sessionId)
      }

      // Add AI response
      const aiMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        sessionId: response.sessionId,
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
        confidence: response.confidence,
        sources: response.sources,
      }
      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error('Failed to send message:', error)
      // Add error message
      const errorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        sessionId: sessionId || '',
        role: 'assistant',
        content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="h-[700px] flex flex-col w-full">
      <CardHeader className="flex-shrink-0">
        <CardTitle>💬 Chat với AI Nha khoa</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8 px-4">
              <p className="text-lg mb-2">Xin chào! Tôi là trợ lý AI nha khoa.</p>
              <p className="text-sm">Bạn có thể hỏi tôi về các vấn đề nha khoa, triệu chứng, hoặc cách chăm sóc răng miệng.</p>
            </div>
          )}
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {loading && (
            <div className="flex justify-start w-full">
              <div className="bg-muted rounded-lg p-4">
                <LoadingSpinner size="sm" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="border-t p-4 flex-shrink-0">
          <ChatInput onSend={handleSendMessage} disabled={loading} />
        </div>
      </CardContent>
    </Card>
  )
}
