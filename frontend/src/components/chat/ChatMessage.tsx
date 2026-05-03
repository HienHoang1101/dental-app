import { cn } from '@/lib/utils/cn'
import type { ChatMessage as ChatMessageType } from '@/types/chat'

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-lg p-4 break-words',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        )}
      >
        <div className="whitespace-pre-wrap break-words overflow-wrap-anywhere">
          {message.content}
        </div>
        
        {!isUser && message.confidence && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <p className="text-xs opacity-70">
              Độ tin cậy: {(message.confidence * 100).toFixed(0)}%
            </p>
          </div>
        )}
        
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <p className="text-xs opacity-70 break-words">
              Nguồn: {message.sources.join(', ')}
            </p>
          </div>
        )}
        
        <p className="text-xs opacity-50 mt-2">
          {new Date(message.timestamp).toLocaleTimeString('vi-VN')}
        </p>
      </div>
    </div>
  )
}
