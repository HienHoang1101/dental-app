"use client";

import { useEffect, useState, useRef } from "react";
import { X, Plus, Trash2, Printer, Save, Search, Pill } from "lucide-react";
import { doctorApi } from "@/lib/doctorApi";
import { Medication, Prescription, Appointment } from "@/types";
import { toast } from "react-hot-toast";

interface PrescriptionModalProps {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PrescriptionModal({
  appointment,
  onClose,
  onSuccess,
}: PrescriptionModalProps) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  
  const [formData, setFormData] = useState({
    diagnosis: "",
    advice: "",
    followUpDate: "",
    items: [] as { medicationId: string; name: string; unit: string; quantity: number; dosageInstruction: string }[],
  });

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, [appointment.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load medications for selection
      const meds = await doctorApi.getMedications(true);
      setMedications(meds);

      // Check if prescription already exists
      const existing = await doctorApi.getPrescriptionByAppointment(appointment.id);
      if (existing) {
        setPrescription(existing);
        setFormData({
          diagnosis: existing.diagnosis || "",
          advice: existing.advice || "",
          followUpDate: existing.followUpDate || "",
          items: existing.items.map(item => ({
            medicationId: item.medicationId,
            name: item.medicationName,
            unit: item.unit,
            quantity: item.quantity,
            dosageInstruction: item.dosageInstruction || "",
          })),
        });
      }
    } catch (error) {
      console.error("Failed to load prescription data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (med: Medication) => {
    if (formData.items.find(item => item.medicationId === med.id)) {
      toast.error("Thuốc này đã có trong đơn");
      return;
    }

    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          medicationId: med.id,
          name: med.name,
          unit: med.unit,
          quantity: 1,
          dosageInstruction: med.defaultDosage || "",
        },
      ],
    });
    setSearchTerm("");
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    (newItems[index] as any)[field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      toast.error("Vui lòng thêm ít nhất một loại thuốc");
      return;
    }

    try {
      setSaving(true);
      const requestData = {
        appointmentId: appointment.id,
        patientId: appointment.patient.id,
        diagnosis: formData.diagnosis,
        advice: formData.advice,
        followUpDate: formData.followUpDate || undefined,
        items: formData.items.map(item => ({
          medicationId: item.medicationId,
          quantity: item.quantity,
          dosageInstruction: item.dosageInstruction,
        })),
      };

      const result = await doctorApi.createPrescription(requestData);
      setPrescription(result);
      toast.success("Lưu đơn thuốc thành công");
      onSuccess();
    } catch (error) {
      toast.error("Không thể lưu đơn thuốc");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredMeds = medications.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Đơn thuốc</h2>
            <p className="text-sm text-gray-500">Bệnh nhân: {appointment.patient.fullName}</p>
          </div>
          <div className="flex items-center space-x-2">
            {prescription && (
              <button
                onClick={handlePrint}
                className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Printer className="w-4 h-4 mr-2" />
                In đơn thuốc
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="prescription-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chẩn đoán *</label>
                <textarea
                  required
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={2}
                  placeholder="Nhập chẩn đoán..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hẹn tái khám</label>
                <input
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lời dặn bác sĩ</label>
              <textarea
                value={formData.advice}
                onChange={(e) => setFormData({ ...formData, advice: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                rows={2}
                placeholder="Dặn dò bệnh nhân..."
              />
            </div>

            {/* Drug selection */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Pill className="w-5 h-5 mr-2 text-blue-600" />
                Danh mục thuốc kê đơn
              </h3>
              
              <div className="relative mb-4">
                <div className="flex items-center px-4 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 bg-white">
                  <Search className="w-5 h-5 text-gray-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Tìm thuốc để thêm vào đơn..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full focus:outline-none"
                  />
                </div>
                
                {searchTerm && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {filteredMeds.length > 0 ? (
                      filteredMeds.map(med => (
                        <button
                          key={med.id}
                          type="button"
                          onClick={() => handleAddItem(med)}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 flex justify-between items-center"
                        >
                          <div>
                            <div className="font-medium">{med.name}</div>
                            <div className="text-xs text-gray-500">{med.unit}</div>
                          </div>
                          <Plus className="w-4 h-4 text-blue-600" />
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500">Không tìm thấy thuốc</div>
                    )}
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tên thuốc</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">SL</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hướng dẫn sử dụng</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {formData.items.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">
                          Chưa có thuốc nào trong đơn
                        </td>
                      </tr>
                    ) : (
                      formData.items.map((item, index) => (
                        <tr key={index} className="bg-white">
                          <td className="px-4 py-2">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-500">{item.unit}</div>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(index, "quantity", parseInt(e.target.value) || 1)}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={item.dosageInstruction}
                              onChange={(e) => handleUpdateItem(index, "dosageInstruction", e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Sáng 1, tối 1..."
                            />
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Đóng
          </button>
          <button
            form="prescription-form"
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Lưu đơn thuốc
          </button>
        </div>
      </div>

      {/* Hidden Print Template */}
      <div className="hidden print:block fixed inset-0 bg-white z-[100] p-8 text-black" style={{ fontSize: '14px' }}>
        <div className="max-w-3xl mx-auto border p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold uppercase text-blue-800">Phòng khám Nha khoa Antigravity</h1>
              <p>Địa chỉ: 123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh</p>
              <p>Hotline: 1900 1234 - Website: nhakhoa-antigravity.vn</p>
            </div>
            <div className="text-right">
              <p className="font-bold">Mã đơn: {prescription?.id.substring(0, 8).toUpperCase()}</p>
              <p>Ngày: {new Date().toLocaleDateString("vi-VN")}</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-center mb-8 uppercase">Đơn Thuốc</h2>

          <div className="grid grid-cols-2 gap-y-2 mb-6">
            <p><span className="font-bold">Họ và tên bệnh nhân:</span> {appointment.patient.fullName}</p>
            <p><span className="font-bold">Ngày sinh:</span> {appointment.healthRecord?.dateOfBirth || "N/A"}</p>
            <p><span className="font-bold">Địa chỉ:</span> {appointment.healthRecord?.address || "N/A"}</p>
            <p><span className="font-bold">Chẩn đoán:</span> {formData.diagnosis}</p>
          </div>

          <table className="w-full border-collapse mb-8">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-2 text-left w-12">STT</th>
                <th className="py-2 text-left">Tên thuốc / Hàm lượng</th>
                <th className="py-2 text-center w-24">Số lượng</th>
                <th className="py-2 text-left">Cách dùng</th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-3 text-left">{index + 1}</td>
                  <td className="py-3 text-left font-bold">{item.name}</td>
                  <td className="py-3 text-center">{item.quantity} {item.unit}</td>
                  <td className="py-3 text-left italic">{item.dosageInstruction}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mb-8">
            <p><span className="font-bold italic underline">Lời dặn:</span> {formData.advice || "Khám lại sau khi hết thuốc hoặc có dấu hiệu bất thường."}</p>
            {formData.followUpDate && (
              <p className="font-bold text-red-600 mt-2">Hẹn tái khám: {new Date(formData.followUpDate).toLocaleDateString("vi-VN")}</p>
            )}
          </div>

          <div className="flex justify-end mt-12">
            <div className="text-center w-64">
              <p className="mb-20">Bác sĩ điều trị</p>
              <p className="font-bold text-lg">{appointment.doctor.fullName}</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\:block, .print\:block * {
            visibility: visible;
          }
          .print\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
