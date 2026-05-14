/**
 * Utility functions for Prescription printing and formatting
 */

export const escapeHtml = (value?: string | null) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const formatDate = (date?: string) =>
  date ? new Date(date).toLocaleDateString("vi-VN") : "-";

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value || 0);

/**
 * Common print function for prescriptions used by Doctor, Admin, and Patient
 */
export const printPrescription = (prescription: any) => {
  if (!prescription) return;

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    alert("Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép popup.");
    return;
  }

  const medicineRows = prescription.items?.length
    ? prescription.items
        .map(
          (item: any, index: number) => `
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
