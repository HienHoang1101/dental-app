import { Appointment } from "@/types";

interface ModalProps {
  onClose: () => void;
}

interface ConfirmModalProps extends ModalProps {
  onConfirm: () => void;
}

export function ConfirmModal({ onClose, onConfirm }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h3 className="text-lg font-bold mb-4">Xác nhận lịch hẹn</h3>
        <p className="mb-6">Bạn có chắc chắn muốn xác nhận lịch hẹn này?</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

interface CancelModalProps extends ModalProps {
  reason: string;
  setReason: (reason: string) => void;
  onConfirm: () => void;
}

export function CancelModal({
  onClose,
  reason,
  setReason,
  onConfirm,
}: CancelModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h3 className="text-lg font-bold mb-4">Hủy lịch hẹn</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lý do hủy
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-red-500 focus:border-red-500"
            rows={3}
            placeholder="Nhập lý do hủy..."
          />
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={onConfirm}
            disabled={!reason.trim()}
            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors"
          >
            Xác nhận hủy
          </button>
        </div>
      </div>
    </div>
  );
}

interface CompleteModalProps extends ModalProps {
  onConfirm: () => void;
}

export function CompleteModal({ onClose, onConfirm }: CompleteModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h3 className="text-lg font-bold mb-4">Hoàn thành lịch hẹn</h3>
        <p className="mb-6">
          Bạn có chắc chắn muốn đánh dấu lịch hẹn này đã hoàn thành?
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
          >
            Hoàn thành
          </button>
        </div>
      </div>
    </div>
  );
}

interface FollowUpModalProps extends ModalProps {
  data: {
    date: string;
    startTime: string;
    endTime: string;
    notes: string;
  };
  setData: (data: any) => void;
  onConfirm: () => void;
}

export function FollowUpModal({
  onClose,
  data,
  setData,
  onConfirm,
}: FollowUpModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Tạo lịch tái khám</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày tái khám
            </label>
            <input
              type="date"
              value={data.date}
              onChange={(e) => setData({ ...data, date: e.target.value })}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giờ bắt đầu
              </label>
              <input
                type="time"
                value={data.startTime}
                onChange={(e) => setData({ ...data, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giờ kết thúc
              </label>
              <input
                type="time"
                value={data.endTime}
                onChange={(e) => setData({ ...data, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú
            </label>
            <textarea
              value={data.notes}
              onChange={(e) => setData({ ...data, notes: e.target.value })}
              rows={3}
              placeholder="Lý do tái khám, hướng điều trị..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="text-sm text-gray-600">
            <strong>Lưu ý:</strong> Lịch tái khám có thể dài hơn 1 giờ nếu cần thiết.
          </p>
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
          >
            Tạo lịch tái khám
          </button>
        </div>
      </div>
    </div>
  );
}
