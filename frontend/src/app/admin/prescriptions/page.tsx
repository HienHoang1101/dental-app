"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { adminApi } from "@/lib/adminApi";
import { Prescription } from "@/types";
import { Search, Eye, Printer, Filter, X } from "lucide-react";
import { toast } from "react-hot-toast";

export default function AdminPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      const data = await adminApi.getPrescriptions();
      setPrescriptions(data);
    } catch (error) {
      toast.error("Không thể tải danh sách đơn thuốc");
    } finally {
      setLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter(
    (p) =>
      p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date?: string) =>
    date ? new Date(date).toLocaleDateString("vi-VN") : "-";

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value || 0);

  const escapeHtml = (value?: string | null) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const handleView = async (prescription: Prescription) => {
    setViewingId(prescription.id);
    try {
      const detail = await adminApi.getPrescription(prescription.id);
      setSelectedPrescription(detail);
    } catch (error) {
      toast.error("Không thể tải chi tiết đơn thuốc");
    } finally {
      setViewingId(null);
    }
  };

  const handlePrint = async (prescription: Prescription) => {
    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      toast.error("Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép popup và thử lại.");
      return;
    }

    setPrintingId(prescription.id);
    printWindow.document.write("<p style='font-family: Arial, sans-serif; padding: 24px;'>Đang tải đơn thuốc...</p>");

    try {
      const p = await adminApi.getPrescription(prescription.id);

      const medicineRows = p.items.length
      ? p.items
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

      printWindow.document.open();
      printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Đơn thuốc ${p.id.substring(0, 8).toUpperCase()}</title>
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
              <p><strong>Mã đơn:</strong> ${p.id.substring(0, 8).toUpperCase()}</p>
              <p><strong>Ngày:</strong> ${formatDate(p.createdAt)}</p>
            </div>
          </div>

          <div class="title">
            <h2>Đơn Thuốc</h2>
          </div>

          <div class="patient-info">
            <div><span class="label">Bệnh nhân:</span> ${escapeHtml(p.patientName)}</div>
            <div><span class="label">Chẩn đoán:</span> ${escapeHtml(p.diagnosis || "-")}</div>
            <div><span class="label">Bác sĩ:</span> ${escapeHtml(p.doctorName)}</div>
            <div><span class="label">Ngày tái khám:</span> ${formatDate(p.followUpDate)}</div>
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
              <span>${formatCurrency(p.servicePrice)}</span>
            </div>
            <div>
              <span>Tổng tiền thuốc:</span>
              <span>${formatCurrency(p.totalMedicationPrice)}</span>
            </div>
            <div class="grand">
              <span>Tổng cộng:</span>
              <span>${formatCurrency(p.totalAmount)}</span>
            </div>
          </div>

          <div class="footer">
            <div class="advice-section">
              <p><strong>Lời dặn:</strong></p>
              <p style="font-style: italic;">${escapeHtml(p.advice || "Khám lại sau khi hết thuốc hoặc có dấu hiệu bất thường.")}</p>
            </div>
            <div class="signature">
              <p>Ngày ${new Date().toLocaleDateString("vi-VN")}</p>
              <p><strong>Bác sĩ điều trị</strong></p>
              <div class="signature-space"></div>
              <p><strong>${escapeHtml(p.doctorName)}</strong></p>
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
      printWindow.focus();
    } catch (error) {
      printWindow.close();
      toast.error("Không thể tải đơn thuốc để in");
    } finally {
      setPrintingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Danh sách đơn thuốc</h1>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Tìm kiếm bệnh nhân, bác sĩ hoặc chẩn đoán..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full focus:outline-none text-gray-700"
            />
          </div>
          <button className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600">
            <Filter className="w-4 h-4 mr-2" />
            Bộ lọc
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bệnh nhân
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bác sĩ kê đơn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chẩn đoán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày kê
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng cộng
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredPrescriptions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Chưa có đơn thuốc nào được kê
                    </td>
                  </tr>
                ) : (
                  filteredPrescriptions.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{p.patientName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{p.doctorName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 truncate max-w-xs">{p.diagnosis || "-"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(p.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                        {formatCurrency(p.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => handleView(p)}
                          disabled={viewingId === p.id}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          title="Xem chi tiết"
                        >
                          {viewingId === p.id ? (
                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrint(p)}
                          disabled={printingId === p.id}
                          className="text-gray-600 hover:text-gray-900"
                          title="In đơn thuốc"
                        >
                          {printingId === p.id ? (
                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
                          ) : (
                            <Printer className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedPrescription && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
              <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Chi tiết đơn thuốc</h2>
                  <p className="text-sm text-gray-500">
                    Mã đơn: {selectedPrescription.id.substring(0, 8).toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPrescription(null)}
                  className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  title="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6 p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Bệnh nhân</p>
                    <p className="text-gray-900 font-semibold">{selectedPrescription.patientName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Bác sĩ kê đơn</p>
                    <p className="text-gray-900 font-semibold">{selectedPrescription.doctorName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ngày kê</p>
                    <p className="text-gray-900">{formatDate(selectedPrescription.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ngày tái khám</p>
                    <p className="text-gray-900">{formatDate(selectedPrescription.followUpDate)}</p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium uppercase tracking-wider text-gray-500">Chẩn đoán</p>
                  <div className="rounded-lg bg-blue-50 p-4 text-gray-800">
                    {selectedPrescription.diagnosis || "Chưa có chẩn đoán chi tiết"}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-500">Danh mục thuốc</p>
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tên thuốc</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Số lượng</th>
                          <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Đơn giá</th>
                          <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Thành tiền</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Cách dùng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {selectedPrescription.items.length > 0 ? (
                          selectedPrescription.items.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3">
                                <div className="text-sm font-medium text-gray-900">{item.medicationName}</div>
                                <div className="text-xs text-gray-500">{item.unit}</div>
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                {item.quantity} {item.unit}
                              </td>
                              <td className="px-4 py-3 text-right text-sm text-gray-700">{formatCurrency(item.unitPrice)}</td>
                              <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{formatCurrency(item.totalPrice)}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{item.dosageInstruction || "-"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Không có thông tin thuốc</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <div className="w-full max-w-sm space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tiền dịch vụ ({selectedPrescription.serviceName || "Không có dịch vụ"})</span>
                        <span className="font-medium">{formatCurrency(selectedPrescription.servicePrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tổng tiền thuốc</span>
                        <span className="font-medium">{formatCurrency(selectedPrescription.totalMedicationPrice)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 text-base font-bold text-gray-900">
                        <span>Tổng cộng</span>
                        <span>{formatCurrency(selectedPrescription.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium uppercase tracking-wider text-gray-500">Lời dặn bác sĩ</p>
                  <div className="rounded-lg bg-gray-50 p-4 text-gray-800">
                    {selectedPrescription.advice || "Không có lời dặn"}
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t pt-4">
                  <button
                    onClick={() => setSelectedPrescription(null)}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={() => handlePrint(selectedPrescription)}
                    className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    In đơn thuốc
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
