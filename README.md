# Hệ thống Quản lý Phòng Khám Nha Khoa

Hệ thống quản lý phòng khám nha khoa với 3 actors: Khách hàng (Patient), Bác sĩ (Doctor), và Quản trị viên (Admin).

## 📋 Tính năng

### Khách hàng (Patient)

- ✅ Đăng ký/Đăng nhập
- ✅ Tạo và quản lý hồ sơ sức khỏe
- 🚧 Đặt khám theo 3 hình thức:
  - Khám theo chuyên khoa
  - Khám theo ngày
  - Khám theo bác sĩ (có search & filter)
- 🚧 Xem lịch sử đặt khám (filter, sort)
- 🚧 Nhận thông báo

### Bác sĩ (Doctor)

- 🚧 Xem và chỉnh sửa thông tin cá nhân
- 🚧 Xem lịch hẹn với bệnh nhân
- 🚧 Xác nhận/Hủy lịch hẹn
- 🚧 Quản lý lịch làm việc
- 🚧 Đăng ký ca làm việc
- 🚧 Xin nghỉ phép
- 🚧 Xem hồ sơ bệnh nhân

### Quản trị viên (Admin)

- 🚧 Dashboard thống kê
- 🚧 Quản lý bệnh nhân (CRUD)
- 🚧 Quản lý bác sĩ (CRUD)
- 🚧 Quản lý lịch hẹn
- 🚧 Quản lý dịch vụ (CRUD)
- 🚧 Quản lý chuyên khoa (CRUD)
- 🚧 Quản lý lịch làm việc
- 🚧 Phân ca cho bác sĩ
- 🚧 Quản lý ngày nghỉ/lễ
- 🚧 Duyệt đơn nghỉ phép
- 🚧 Quản lý người dùng & phân quyền

**Chú thích**: ✅ Đã hoàn thành | 🚧 Đang phát triển

## 🛠 Tech Stack

### Backend

- **Language**: Kotlin
- **Framework**: Ktor
- **Database**: PostgreSQL (Supabase)
- **ORM**: Exposed
- **Authentication**: JWT
- **Password Hashing**: BCrypt

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Icons**: Lucide React

## 📁 Cấu trúc dự án

```
.
├── backend/                    # Kotlin Backend
│   ├── src/main/kotlin/com/nhom2/
│   │   ├── models/            # Database tables
│   │   ├── common/            # DTOs, utilities
│   │   ├── config/            # Database, JWT config
│   │   ├── auth/              # Authentication
│   │   ├── healthrecord/      # Health records
│   │   ├── specialty/         # Specialties
│   │   ├── doctors/           # Doctors
│   │   ├── services/          # Services
│   │   ├── schedule/          # Work schedules
│   │   ├── appointment/       # Appointments
│   │   ├── notification/      # Notifications
│   │   ├── dashboard/         # Dashboard stats
│   │   ├── patient/           # Patient management
│   │   └── plugins/           # Ktor plugins
│   └── build.gradle.kts
│
├── frontend/                   # Next.js Frontend
│   ├── src/
│   │   ├── app/               # Next.js pages
│   │   │   ├── (auth)/        # Auth pages
│   │   │   ├── (patient)/     # Patient pages
│   │   │   ├── (doctor)/      # Doctor pages
│   │   │   └── (admin)/       # Admin pages
│   │   ├── components/        # React components
│   │   ├── lib/               # API clients, utilities
│   │   ├── stores/            # Zustand stores
│   │   └── types/             # TypeScript types
│   └── package.json
│
├── docs/                       # Documentation
│   ├── BRD.md
│   ├── DATABASE_DESIGN.md
│   ├── REQUIREMENTS_SPECIFICATION.md
│   └── SYSTEM_DESIGN.md
│
├── IMPLEMENTATION_PLAN.md      # Implementation roadmap
├── IMPLEMENTATION_GUIDE.md     # Detailed implementation guide
└── README.md                   # This file
```

## 🚀 Cài đặt và Chạy

### Prerequisites

- JDK 21+
- Node.js 18+
- PostgreSQL 12+ hoặc Supabase account
- Gradle 8.x

### Backend Setup

1. **Clone repository và di chuyển vào thư mục backend**

```bash
cd backend
```

2. **Tạo file `.env`**

```env
DATABASE_URL=jdbc:postgresql://your-supabase-url:5432/postgres
DATABASE_USER=postgres
DATABASE_PASSWORD=your-password
JWT_SECRET=your-secret-key-change-this-in-production
```

3. **Chạy backend**

```bash
./gradlew run
```

Backend sẽ chạy tại `http://localhost:8080`

### Frontend Setup

1. **Di chuyển vào thư mục frontend**

```bash
cd frontend
```

2. **Cài đặt dependencies**

```bash
npm install
```

3. **Tạo file `.env.local`**

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

4. **Chạy development server**

```bash
npm run dev
```

Frontend sẽ chạy tại `http://localhost:3000`

## 📊 Database Schema

Hệ thống sử dụng 17 bảng chính:

1. **users** - Tài khoản người dùng
2. **health_records** - Hồ sơ sức khỏe bệnh nhân
3. **specialties** - Chuyên khoa
4. **doctors** - Thông tin bác sĩ
5. **services** - Dịch vụ nha khoa
6. **holidays** - Ngày nghỉ lễ
7. **shifts** - Ca làm việc
8. **work_schedules** - Lịch làm việc bác sĩ
9. **time_slots** - Khung giờ khám
10. **appointments** - Lịch hẹn
11. **leave_requests** - Đơn xin nghỉ phép
12. **notifications** - Thông báo
13. **chat_sessions** - Phiên chat (future)
14. **chat_messages** - Tin nhắn chat (future)
15. **knowledge_documents** - Tài liệu (future)
16. **patient_profiles** - Hồ sơ bệnh nhân (legacy)
17. **doctor_schedules** - Lịch bác sĩ (legacy)

Chi tiết schema xem tại `docs/DATABASE_DESIGN.md`

## 🔑 API Endpoints

### Authentication

```
POST   /auth/register          - Đăng ký
POST   /auth/login             - Đăng nhập
GET    /auth/me                - Lấy thông tin user hiện tại
POST   /auth/logout            - Đăng xuất
```

### Patient

```
GET    /patient/profile        - Xem hồ sơ sức khỏe
POST   /patient/profile        - Tạo hồ sơ sức khỏe
PUT    /patient/profile        - Cập nhật hồ sơ sức khỏe
```

### Specialties

```
GET    /specialties            - Lấy danh sách chuyên khoa
```

### Doctors

```
GET    /doctors                - Lấy danh sách bác sĩ (có filter)
GET    /doctors/:id            - Lấy chi tiết bác sĩ
```

### Appointments

```
POST   /appointments           - Đặt lịch khám
GET    /appointments           - Lịch sử đặt khám
GET    /appointments/:id       - Chi tiết lịch hẹn
DELETE /appointments/:id       - Hủy lịch hẹn
```

### Notifications

```
GET    /notifications          - Lấy thông báo
GET    /notifications/unread-count - Đếm thông báo chưa đọc
PUT    /notifications/:id/read - Đánh dấu đã đọc
PUT    /notifications/read-all - Đánh dấu tất cả đã đọc
```

Xem đầy đủ API documentation tại `IMPLEMENTATION_GUIDE.md`

## 📝 Hướng dẫn Phát triển

### Thêm một tính năng mới

1. **Backend**:
   - Tạo DTOs trong `common/DTOs.kt`
   - Tạo Service trong module tương ứng
   - Tạo Routes và đăng ký trong `plugins/Routing.kt`
   - Test API với Postman/curl

2. **Frontend**:
   - Thêm types trong `types/index.ts`
   - Tạo API client trong `lib/`
   - Tạo components cần thiết
   - Tạo pages trong `app/`

### Code Style

**Backend (Kotlin)**:

- Sử dụng camelCase cho biến và hàm
- Sử dụng PascalCase cho class và object
- Sử dụng transaction cho database operations
- Xử lý errors với try-catch

**Frontend (TypeScript)**:

- Sử dụng functional components với hooks
- Sử dụng TypeScript strict mode
- Sử dụng Tailwind CSS cho styling
- Xử lý errors với try-catch và hiển thị user-friendly messages

## 🧪 Testing

### Backend

```bash
cd backend
./gradlew test
```

### Frontend

```bash
cd frontend
npm run test
```

## 📦 Build & Deploy

### Backend

```bash
cd backend
./gradlew build
java -jar build/libs/backend-0.0.1.jar
```

### Frontend

```bash
cd frontend
npm run build
npm start
```

## 🗺 Roadmap

### Phase 1: Core Features (Hiện tại)

- [x] Authentication & Authorization
- [x] Health Record Management
- [x] Basic UI Components
- [ ] Complete Booking Flow
- [ ] Appointment Management

### Phase 2: Advanced Features

- [ ] Doctor Schedule Management
- [ ] Leave Request System
- [ ] Notification System
- [ ] Admin Dashboard

### Phase 3: Enhancement

- [ ] AI Chatbot Integration
- [ ] Real-time Notifications
- [ ] Email Notifications
- [ ] SMS Reminders

### Phase 4: Polish

- [ ] Performance Optimization
- [ ] UI/UX Improvements
- [ ] Mobile Responsive
- [ ] Accessibility

## 📚 Tài liệu

- [Implementation Plan](IMPLEMENTATION_PLAN.md) - Kế hoạch triển khai tổng thể
- [Implementation Guide](IMPLEMENTATION_GUIDE.md) - Hướng dẫn triển khai chi tiết
- [System Design](docs/SYSTEM_DESIGN.md) - Thiết kế hệ thống
- [Database Design](docs/DATABASE_DESIGN.md) - Thiết kế database
- [Requirements](docs/REQUIREMENTS_SPECIFICATION.md) - Yêu cầu chi tiết

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

- Backend Developer: [Your Name]
- Frontend Developer: [Your Name]
- UI/UX Designer: [Your Name]

## 📞 Support

Nếu có vấn đề hoặc câu hỏi, vui lòng:

- Tạo issue trên GitHub
- Liên hệ qua email: support@dentalclinic.com

---

**Note**: Dự án đang trong giai đoạn phát triển. Một số tính năng có thể chưa hoàn thiện.
