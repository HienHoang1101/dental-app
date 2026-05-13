# Hệ thống Quản lý Phòng Khám Nha Khoa Thông Minh (Tích hợp AI)

Hệ thống quản lý phòng khám nha khoa toàn diện với 3 actors: Khách hàng (Patient), Bác sĩ (Doctor), và Quản trị viên (Admin). Đặc biệt, hệ thống tích hợp dịch vụ Machine Learning để hỗ trợ Chatbot thông minh và gợi ý lịch hẹn.

## 📋 Tính năng

### Khách hàng (Patient)
- ✅ Đăng ký/Đăng nhập an toàn
- ✅ Quản lý hồ sơ sức khỏe cá nhân
- ✅ Đặt lịch khám theo 3 hình thức: Chuyên khoa, Ngày, hoặc Bác sĩ
- ✅ Xem lịch sử và trạng thái lịch khám
- ✅ Chatbot AI hỗ trợ tư vấn nha khoa (Giải đáp thắc mắc, RAG với tài liệu y khoa)

### Bác sĩ (Doctor)
- ✅ Xem và chỉnh sửa thông tin cá nhân
- ✅ Xem lịch hẹn với bệnh nhân
- ✅ Xác nhận/Hủy lịch hẹn
- ✅ Quản lý lịch làm việc cố định (Weekly Schedules)
- ✅ Tạo yêu cầu thay đổi lịch làm việc (Xin nghỉ, Đổi ca)
- ✅ Xem hồ sơ bệnh án của bệnh nhân

### Quản trị viên (Admin)
- 🚧 Dashboard thống kê
- 🚧 Quản lý bệnh nhân & Bác sĩ (CRUD)
- 🚧 Quản lý lịch hẹn & Dịch vụ
- 🚧 Duyệt yêu cầu thay đổi lịch làm việc của bác sĩ
- 🚧 Quản lý người dùng & phân quyền

**Chú thích**: ✅ Đã hoàn thành | 🚧 Đang phát triển

## 🛠 Tech Stack

### Backend (Core API)
- **Language**: Kotlin
- **Framework**: Ktor
- **Database**: PostgreSQL (Supabase)
- **ORM**: Exposed
- **Authentication**: JWT & BCrypt

### Frontend (User Interface)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios

### ML Service (AI & Chatbot)
- **Language**: Python 3
- **Framework**: FastAPI
- **AI/LLM**: Google Gemini API
- **Vector DB**: Pinecone (RAG System)
- **Data Science**: Pandas, Scikit-learn

## 📁 Cấu trúc dự án

```text
.
├── backend/                    # Kotlin Ktor Backend
│   ├── src/main/kotlin/...     # Source code (Auth, Schedules, Appointments, etc.)
│   ├── migrations/             # SQL scripts for database setup
│   └── build.gradle.kts        # Gradle config
│
├── frontend/                   # Next.js Frontend
│   ├── src/
│   │   ├── app/                # Pages (Patient, Doctor, Admin routes)
│   │   ├── components/         # Reusable UI components
│   │   ├── lib/                # API clients (axios configs)
│   │   └── stores/             # Zustand state management
│   └── package.json
│
├── ml-service/                 # Python AI Service
│   ├── main.py                 # FastAPI application
│   ├── rag_pipeline.py         # RAG logic with Pinecone/Gemini
│   ├── models/                 # Machine learning models (if any)
│   ├── pdf_docs/               # Dental knowledge documents
│   └── requirements.txt
│
└── docs/                       # System Documentation & Designs
```

## 🚀 Hướng dẫn Cài đặt và Chạy

### Yêu cầu hệ thống
- JDK 21+
- Node.js 18+
- Python 3.10+
- PostgreSQL 12+ (Hoặc tài khoản Supabase)

### 1. Backend Setup
1. Di chuyển vào thư mục backend: `cd backend`
2. Tạo file `.env`:
   ```env
   DATABASE_URL=jdbc:postgresql://your-supabase-url:5432/postgres
   DATABASE_USER=postgres
   DATABASE_PASSWORD=your-password
   JWT_SECRET=your-secret-key
   ```
3. Chạy backend bằng Gradle:
   ```bash
   ./gradlew run
   ```
   *Backend sẽ chạy tại `http://localhost:8080`*

### 2. Frontend Setup
1. Di chuyển vào thư mục frontend: `cd frontend`
2. Cài đặt thư viện: `npm install`
3. Tạo file `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```
4. Chạy development server:
   ```bash
   npm run dev
   ```
   *Frontend sẽ chạy tại `http://localhost:3000`*

### 3. ML Service Setup (AI Chatbot)
1. Di chuyển vào thư mục ML: `cd ml-service`
2. Tạo Virtual Environment và kích hoạt:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```
3. Cài đặt thư viện: `pip install -r requirements-windows.txt` (hoặc `requirements.txt`)
4. Tạo file `.env`:
   ```env
   GEMINI_API_KEY=your-gemini-key
   PINECONE_API_KEY=your-pinecone-key
   ```
5. Chạy FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *ML Service sẽ chạy tại `http://localhost:8000`*

## 📊 Database Schema (Cập nhật)

Hệ thống sử dụng các bảng chính:
- **users, doctors, patients**: Quản lý tài khoản và hồ sơ.
- **specialties, services**: Quản lý danh mục khám.
- **weekly_work_schedules**: Lịch làm việc cố định của bác sĩ.
- **schedule_change_requests, schedule_exceptions**: Quản lý xin nghỉ / đổi lịch.
- **appointments**: Quản lý lịch hẹn thực tế.
- **holidays**: Ngày nghỉ lễ của toàn phòng khám.

*Chi tiết cấu trúc xem tại `docs/DATABASE_DESIGN.md`*

## 🗺 Roadmap

- [x] **Phase 1: Core System** (Auth, Profiles, Basic UI)
- [x] **Phase 2: Advanced Scheduling** (Dynamic Time Slots, Weekly Schedules, Booking Flow)
- [x] **Phase 3: AI Integration** (Chatbot, RAG with medical docs)
- [ ] **Phase 4: Admin & Management** (Dashboards, Approval Workflows)
- [ ] **Phase 5: Polish & Optimizations** (Real-time notifications, Mobile Responsiveness)

## 🤝 Contributing
1. Fork dự án
2. Tạo nhánh tính năng (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên nhánh (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License
Dự án được phân phối dưới giấy phép MIT.

## 📞 Support
Nếu có vấn đề hoặc câu hỏi, vui lòng tạo Issue trên kho lưu trữ (repository) này.
