# Phase 2 - Quick Start Guide

## 🚀 Bắt đầu nhanh

### 1. Khởi động Backend

```bash
cd backend
./gradlew run
```

Backend chạy tại: http://127.0.0.1:8080

### 2. Khởi động Frontend

```bash
cd frontend
npm run dev
```

Frontend chạy tại: http://localhost:3000

---

## 👨‍⚕️ Luồng Doctor - Đăng ký lịch tuần

1. **Login** với tài khoản doctor
2. **Vào trang:** `/doctor/schedule`
3. **Xem bảng lịch tuần** (7 cột x 2 hàng)
4. **Click vào ô trống** để đăng ký lịch
5. **Xác nhận** → Yêu cầu được gửi (status: pending)
6. **Chờ admin duyệt**

**Ví dụ:**

- Click ô "Thứ 2 - Sáng" → Modal xác nhận → Gửi request
- Request hiển thị "Chờ duyệt" trong lịch sử

---

## 👨‍💼 Luồng Admin - Duyệt yêu cầu

1. **Login** với tài khoản admin
2. **Vào trang:** `/admin/schedule-changes`
3. **Xem danh sách** yêu cầu chờ duyệt
4. **Click "Duyệt"** hoặc **"Từ chối"**
5. **Nếu từ chối:** Nhập lý do

**Kết quả:**

- Duyệt → Lịch bác sĩ cập nhật ngay lập tức
- Từ chối → Bác sĩ thấy lý do trong lịch sử

---

## 👨‍💼 Luồng Admin - Tạo ngoại lệ

1. **Vào trang:** `/admin/schedules`
2. **Click nút:** "+ Thêm ngoại lệ"
3. **Điền form:**
   - Chọn bác sĩ
   - Chọn ngày
   - Chọn loại: Nghỉ / Ghi đè
   - Chọn buổi (hoặc cả ngày)
   - Nhập giờ (nếu ghi đè)
4. **Click "Tạo ngoại lệ"**

**Use cases:**

- **Bác sĩ nghỉ cả ngày 10/05:** `type=off, session=null, date=2026-05-10`
- **Bác sĩ chỉ làm 9h-11h sáng 11/05:** `type=override, session=morning, startTime=09:00, endTime=11:00`

---

## 🏥 Luồng Patient - Đặt lịch mới

1. **Login** với tài khoản patient
2. **Vào trang:** `/patient/appointments/book`
3. **Chọn:** "Khám theo bác sĩ"
4. **Chọn bác sĩ** → **Chọn dịch vụ**
5. **Trang mới:** Chọn ngày (bên trái) + Chọn giờ (bên phải)
6. **Click slot** (ví dụ: 08:00-09:00)
7. **Click "Tiếp tục"** → Trang confirm
8. **Xác nhận đặt lịch**

**Lưu ý:**

- Slot hiển thị theo buổi (Sáng/Chiều)
- Slot < 2 giờ từ hiện tại bị ẩn
- Slot đã đặt không hiển thị

---

## 👨‍⚕️ Luồng Doctor - Tạo lịch tái khám

1. **Vào trang:** `/doctor/appointments`
2. **Tìm appointment** có status = "Đã khám"
3. **Click nút:** "Tái khám"
4. **Điền form:**
   - Chọn ngày tái khám
   - Chọn giờ bắt đầu
   - Chọn giờ kết thúc (có thể > 1 giờ)
   - Nhập ghi chú
5. **Click "Tạo lịch tái khám"**

**Kết quả:**

- Lịch tái khám được tạo
- Tự động link với appointment gốc
- Bệnh nhân thấy lịch mới trong history

---

## 🧪 Test Scenarios

### Scenario 1: Doctor đăng ký lịch → Admin duyệt → Patient đặt lịch

1. **Doctor:** Đăng ký Thứ 2 Sáng
2. **Admin:** Duyệt yêu cầu
3. **Patient:** Chọn ngày Thứ 2 tuần sau → Thấy slot 08:00-09:00, 09:00-10:00, ...
4. **Patient:** Chọn slot 09:00-10:00 → Đặt lịch thành công
5. **Patient khác:** Chọn cùng ngày → Slot 09:00-10:00 biến mất

### Scenario 2: Admin tạo ngoại lệ "Nghỉ"

1. **Admin:** Tạo ngoại lệ nghỉ cả ngày 15/05 cho Bác sĩ A
2. **Patient:** Chọn ngày 15/05 → Không có slot nào
3. **Patient:** Chọn ngày 16/05 → Slot hiển thị bình thường

### Scenario 3: Doctor tạo lịch tái khám

1. **Doctor:** Hoàn thành appointment của Patient X
2. **Doctor:** Click "Tái khám" → Chọn ngày 20/05, 14:00-15:30
3. **Patient X:** Vào history → Thấy lịch tái khám mới

---

## 🐛 Troubleshooting

### Không thấy slot nào khi chọn ngày

**Nguyên nhân:**

- Bác sĩ chưa đăng ký lịch tuần
- Admin chưa duyệt yêu cầu
- Ngày đó có ngoại lệ "Nghỉ"
- Tất cả slot đã được đặt

**Giải pháp:**

1. Kiểm tra bác sĩ đã đăng ký lịch chưa
2. Kiểm tra admin đã duyệt chưa
3. Kiểm tra có ngoại lệ không

### Request "Chờ duyệt" mãi không được duyệt

**Nguyên nhân:**

- Admin chưa vào trang `/admin/schedule-changes`

**Giải pháp:**

- Login admin → Vào trang duyệt → Click "Duyệt"

### Lỗi khi tạo lịch tái khám

**Nguyên nhân:**

- Parent appointment chưa completed
- Ngày tái khám > 30 ngày từ parent
- Giờ bắt đầu >= Giờ kết thúc

**Giải pháp:**

- Kiểm tra parent appointment status
- Chọn ngày trong vòng 30 ngày
- Kiểm tra giờ hợp lệ

---

## 📞 API Endpoints Mới

### Public (No Auth)

- `GET /api/doctors/{id}/weekly-schedules` - Lấy lịch tuần
- `GET /api/doctors/{id}/available-slots?date=YYYY-MM-DD` - Lấy slot khả dụng

### Doctor

- `POST /api/doctor/schedule-change-requests` - Tạo yêu cầu đổi lịch
- `GET /api/doctor/schedule-change-requests` - Xem lịch sử yêu cầu
- `POST /api/doctor/appointments/follow-up` - Tạo lịch tái khám

### Admin

- `GET /api/admin/schedule-change-requests?status=pending` - Lấy yêu cầu chờ duyệt
- `POST /api/admin/schedule-change-requests/{id}/approve` - Duyệt
- `POST /api/admin/schedule-change-requests/{id}/reject` - Từ chối
- `POST /api/admin/schedule-exceptions` - Tạo ngoại lệ
- `GET /api/admin/schedule-exceptions?doctorId=...&startDate=...&endDate=...` - Lấy ngoại lệ
- `DELETE /api/admin/schedule-exceptions/{id}` - Xóa ngoại lệ

---

## ✅ Checklist hoàn thành Phase 2

- [x] Patient có thể đặt lịch với slot 1 giờ
- [x] Doctor có thể đăng ký lịch tuần
- [x] Doctor có thể tạo lịch tái khám
- [x] Admin có thể duyệt yêu cầu đổi lịch
- [x] Admin có thể tạo ngoại lệ (nghỉ/ghi đè)
- [x] Backward compatibility với hệ thống cũ
- [x] UI responsive và user-friendly

---

## 🎉 Phase 2 Complete!

Hệ thống mới đã sẵn sàng để test và sử dụng!
