"use client";

import { useEffect, useState } from "react";
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
    items: [] as { medicationId: string; name: string; unit: string; quantity: number; unitPrice: number; dosageInstruction: string }[],
  });

  useEffect(() => {
    loadData();
  }, [appointment.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const meds = await doctorApi.getMedications(true);
      setMedications(meds);

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
            unitPrice: item.unitPrice,
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
          unitPrice: med.price,
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

  const escapeHtml = (value?: string | null) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const formatDate = (date?: string) =>
    date ? new Date(date).toLocaleDateString("vi-VN") : "-";

  const handlePrint = () => {
    if (!prescription) return;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      toast.error("Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép popup.");
      return;
    }

    const formatCurrency = (value: number) =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value || 0);

    const medicineRows = prescription.items.length
      ? prescription.items
          .map(
            (item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td style="font-weight: bold;">${escapeHtml(item.medicationName)}</td>
                <td style="text-align: center;">${item.quantity} ${escapeHtml(item.unit)}</td>
                <td style="text-align: right;">${formatCurrency(item.unitPrice)}</td>
                <td style="text-align: right; font-weight: bold;">${formatCurrency(item.totalPrice)}</td>
                <td style="font-style: italic;">${escapeHtml(item.dosageInstruction || "-")}</td>
              </tr>`,
          )
          .join("")
      : `<tr><td colspan="6" style="text-align: center; color: #6b7280;">Không có thông tin thuốc</td></tr>`;

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Đơn thuốc ${prescription.id.substring(0, 8).toUpperCase()}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111827; margin: 32px; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1e40af; padding-bottom: 16px; margin-bottom: 24px; }
            .clinic-info h1 { margin: 0; font-size: 20px; color: #1e40af; text-transform: uppercase; }
            .clinic-info p { margin: 2px 0; font-size: 12px; color: #4b5563; }
            .doc-info { text-align: right; font-size: 13px; }
            .title { text-align: center; margin: 32px 0; }
            .title h2 { margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px; }
            .patient-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 32px; margin-bottom: 24px; }
            .patient-info div { font-size: 14px; }
            .label { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin: 24px 0; }
            th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
            th { background: #f3f4f6; font-size: 12px; text-transform: uppercase; }
            .totals { width: 320px; margin-left: auto; margin-top: 16px; }
            .totals div { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
            .totals .grand { border-top: 2px solid #111827; margin-top: 8px; padding-top: 8px; font-size: 16px; font-weight: bold; }
            .footer { margin-top: 32px; display: grid; grid-template-columns: 1fr 1fr; }
            .advice-section { font-size: 14px; }
            .signature { text-align: center; }
            .signature-space { height: 80px; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="clinic-info">
              <h1>Phòng khám Nha khoa</h1>
              <p>Địa chỉ: 123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh</p>
              <p>Hotline: 1900 1234 - Website: nhakhoa-antigravity.vn</p>
            </div>
            <div class="doc-info">
              <p><strong>Mã đơn:</strong> ${prescription.id.substring(0, 8).toUpperCase()}</p>
              <p><strong>Ngày:</strong> ${formatDate(prescription.createdAt)}</p>
            </div>
          </div>

          <div class="title">
            <h2>Đơn Thuốc</h2>
          </div>

          <div class="patient-info">
            <div><span class="label">Bệnh nhân:</span> ${escapeHtml(prescription.patientName)}</div>
            <div><span class="label">Chẩn đoán:</span> ${escapeHtml(prescription.diagnosis || "-")}</div>
            <div><span class="label">Bác sĩ:</span> ${escapeHtml(prescription.doctorName)}</div>
            <div><span class="label">Ngày tái khám:</span> ${formatDate(prescription.followUpDate)}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px;">STT</th>
                <th>Tên thuốc / Hàm lượng</th>
                <th style="width: 80px; text-align: center;">SL</th>
                <th style="width: 120px; text-align: right;">Đơn giá</th>
                <th style="width: 120px; text-align: right;">Thành tiền</th>
                <th>Cách dùng</th>
              </tr>
            </thead>
            <tbody>${medicineRows}</tbody>
          </table>

          <div class="totals">
            <div>
              <span>Tiền dịch vụ:</span>
              <span>${formatCurrency(prescription.servicePrice)}</span>
            </div>
            <div>
              <span>Tổng tiền thuốc:</span>
              <span>${formatCurrency(prescription.totalMedicationPrice)}</span>
            </div>
            <div class="grand">
              <span>Tổng cộng:</span>
              <span>${formatCurrency(prescription.totalAmount)}</span>
            </div>
          </div>

          <div class="footer">
            <div class="advice-section">
              <p><strong>Lời dặn:</strong></p>
              <p style="font-style: italic;">${escapeHtml(prescription.advice || "Khám lại sau khi hết thuốc hoặc có dấu hiệu bất thường.")}</p>
            </div>
            <div class="signature">
              <p>Ngày ${new Date().toLocaleDateString("vi-VN")}</p>
              <p><strong>Bác sĩ điều trị</strong></p>
              <div class="signature-space"></div>
              <p><strong>${escapeHtml(prescription.doctorName)}</strong></p>
            </div>
          </div>

          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredMeds = medications.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value || 0);

  const medicationTotal = formData.items.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0,
  );
  const servicePrice = Number(appointment.service?.price || 0);
  const totalAmount = servicePrice + medicationTotal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Kê đơn thuốc</h2>
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
                            <div className="text-xs text-gray-500">
                              {med.unit} • {formatCurrency(med.price)}
                            </div>
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
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase w-32">Đơn giá</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase w-32">Thành tiền</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hướng dẫn sử dụng</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {formData.items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-400 italic">
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
                          <td className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-4 py-2 text-right text-sm font-semibold text-gray-900">
                            {formatCurrency(item.unitPrice * item.quantity)}
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
              <div className="mt-4 flex justify-end">
                <div className="w-full max-w-sm space-y-2 rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tiền dịch vụ</span>
                    <span className="font-medium">{formatCurrency(servicePrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tổng tiền thuốc</span>
                    <span className="font-medium">{formatCurrency(medicationTotal)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-base font-bold text-gray-900">
                    <span>Tổng cộng</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
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
    </div>
  );
}
