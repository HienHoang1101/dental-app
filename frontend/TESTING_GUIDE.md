# Hướng dẫn Test 3 Dashboard

## Tài khoản test

Hệ thống đã được tạo sẵn 3 tài khoản test cho 3 role khác nhau:

### 1. Tài khoản Bệnh nhân (Patient)

- **Email:** `patient@test.com`
- **Password:** `123456`
- **Dashboard:** `/patient/dashboard`

**Chức năng có thể test:**

- ✅ Xem dashboard với thống kê
- ✅ Chat với AI chatbot
- ✅ Đặt lịch khám với bác sĩ
- ✅ Xem lịch sử khám bệnh
- ✅ Cập nhật hồ sơ cá nhân
- ✅ Xem danh sách bác sĩ và dịch vụ

### 2. Tài khoản Bác sĩ (Doctor)

- **Email:** `doctor@test.com`
- **Password:** `doctor123`
- **Dashboard:** `/doctor/dashboard`

**Chức năng có thể test:**

- ✅ Xem dashboard với thống kê lịch hẹn
- ✅ Quản lý lịch hẹn của bác sĩ
- ✅ Xem chi tiết lịch hẹn và thông tin bệnh nhân
- ✅ Xem lịch sử chat AI của bệnh nhân
- ✅ Thêm ghi chú bác sĩ cho lịch hẹn
- ✅ Hoàn thành lịch hẹn
- ✅ Xem lịch làm việc
- ✅ Xem danh sách bệnh nhân đã khám
- ✅ Cập nhật hồ sơ cá nhân

### 3. Tài khoản Admin

- **Email:** `admin@test.com`
- **Password:** `admin123`
- **Dashboard:** `/admin/dashboard`

**Chức năng có thể test:**

- ✅ Xem dashboard tổng quan hệ thống
- ✅ Quản lý tất cả lịch hẹn
- ✅ Xác nhận/Hủy lịch hẹn
- ✅ Quản lý danh sách bệnh nhân
- ✅ Xem chi tiết bệnh nhân và lịch sử chat AI
- ✅ Quản lý bác sĩ (Thêm/Sửa/Vô hiệu hóa)
- ✅ Quản lý dịch vụ nha khoa (Thêm/Sửa)
- ✅ Quản lý Knowledge Base (Upload PDF cho AI)
- ✅ Xem lịch sử chat AI của tất cả bệnh nhân

## Cách chạy ứng dụng

### 1. Cài đặt dependencies

```bash
cd frontend
npm install
```

### 2. Chạy development server

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: `http://localhost:3000`

### 3. Đăng nhập

- Truy cập `http://localhost:3000/auth/login`
- Sử dụng một trong 3 tài khoản test ở trên
- Hệ thống sẽ tự động chuyển đến dashboard tương ứng với role

## Cấu trúc Dashboard

### Patient Dashboard (`/patient/*`)

```
/patient/dashboard     - Trang chủ bệnh nhân
/patient/chat          - Chat với AI
/patient/booking       - Đặt lịch khám
/patient/history       - Lịch sử khám
/patient/profile       - Hồ sơ cá nhân
```

### Doctor Dashboard (`/doctor/*`)

```
/doctor/dashboard           - Trang chủ bác sĩ
/doctor/appointments        - Danh sách lịch hẹn
/doctor/appointments/[id]   - Chi tiết lịch hẹn
/doctor/schedule            - Lịch làm việc
/doctor/patients            - Danh sách bệnh nhân
/doctor/profile             - Hồ sơ cá nhân
```

### Admin Dashboard (`/admin/*`)

```
/admin/dashboard            - Trang chủ admin
/admin/appointments         - Quản lý lịch hẹn
/admin/appointments/[id]    - Chi tiết lịch hẹn
/admin/patients             - Quản lý bệnh nhân
/admin/patients/[id]        - Chi tiết bệnh nhân
/admin/doctors              - Quản lý bác sĩ
/admin/services             - Quản lý dịch vụ
/admin/knowledge-base       - Quản lý Knowledge Base
/admin/chat-history         - Lịch sử chat AI
```

## Tính năng đặc biệt

### 1. Role-based Access Control

- Mỗi role chỉ có thể truy cập dashboard của mình
- Tự động redirect nếu truy cập sai dashboard
- Protected routes với authentication check

### 2. Responsive Design

- Tất cả dashboard đều responsive
- Hoạt động tốt trên mobile, tablet và desktop
- Sidebar có thể thu gọn trên mobile

### 3. Real-time Updates

- Dashboard tự động cập nhật khi có thay đổi
- Toast notifications cho các hành động
- Loading states cho tất cả API calls

### 4. Doctor Features

- Xem lịch sử chat AI của bệnh nhân trước khi khám
- Thêm ghi chú chẩn đoán
- Xem thông tin dị ứng và tiền sử bệnh
- Hoàn thành lịch hẹn với ghi chú

### 5. Admin Features

- Quản lý toàn bộ hệ thống
- Xác nhận/Hủy lịch hẹn với lý do
- Thêm/Sửa bác sĩ và dịch vụ
- Upload tài liệu PDF cho AI Knowledge Base

## Lưu ý khi test

### Mock Data

- Hiện tại đang sử dụng mock data
- Dữ liệu sẽ reset khi refresh trang
- Để test đầy đủ, cần kết nối với Backend API

### Backend Integration

Để kết nối với Backend thật:

1. Cập nhật `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_ML_API_URL=http://localhost:8000
```

2. Thay đổi import trong các API files từ mock sang real API

### Các chức năng cần Backend

- Chat AI với ML model
- Upload Knowledge Base
- Email notifications
- Real-time data persistence
- Image upload cho avatar

## Troubleshooting

### Lỗi TypeScript

```bash
npm run type-check
```

### Lỗi ESLint

```bash
npm run lint
```

### Clear cache và rebuild

```bash
rm -rf .next
npm run dev
```

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **State Management:** Zustand
- **Icons:** Lucide React
- **HTTP Client:** Axios

## Liên hệ

Nếu gặp vấn đề khi test, vui lòng liên hệ team phát triển.
