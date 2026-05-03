'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/common/Loading'

interface CancelAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => Promise<void>
  appointmentInfo?: {
    date: string
    time: string
    doctor?: string
    service?: string
  }
}

export function CancelAppointmentDialog({
  open,
  onOpenChange,
  onConfirm,
  appointmentInfo,
}: CancelAppointmentDialogProps) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do hủy lịch')
      return
    }

    if (reason.trim().length < 10) {
      setError('Lý do hủy phải có ít nhất 10 ký tự')
      return
    }

    setLoading(true)
    setError('')

    try {
      await onConfirm(reason.trim())
      setReason('')
      onOpenChange(false)
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setReason('')
    setError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Hủy lịch hẹn</DialogTitle>
          <DialogDescription>
            Vui lòng cho chúng tôi biết lý do bạn muốn hủy lịch hẹn này.
          </DialogDescription>
        </DialogHeader>

        {appointmentInfo && (
          <div className="p-4 bg-muted rounded-lg space-y-1">
            <p className="text-sm">
              <strong>Ngày khám:</strong> {appointmentInfo.date}
            </p>
            <p className="text-sm">
              <strong>Giờ khám:</strong> {appointmentInfo.time}
            </p>
            {appointmentInfo.doctor && (
              <p className="text-sm">
                <strong>Bác sĩ:</strong> {appointmentInfo.doctor}
              </p>
            )}
            {appointmentInfo.service && (
              <p className="text-sm">
                <strong>Dịch vụ:</strong> {appointmentInfo.service}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="reason">
            Lý do hủy <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="reason"
            placeholder="Ví dụ: Tôi có việc đột xuất, không thể đến khám được..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              setError('')
            }}
            disabled={loading}
            rows={4}
            className={error ? 'border-red-500' : ''}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <p className="text-xs text-muted-foreground">
            Lý do hủy phải có ít nhất 10 ký tự
          </p>
        </div>

        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Lưu ý:</strong> Sau khi hủy, bạn sẽ nhận được email xác nhận.
            Nếu cần đặt lại lịch, vui lòng đặt lịch mới.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Đóng
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading || !reason.trim()}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Đang hủy...</span>
              </>
            ) : (
              'Xác nhận hủy'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
