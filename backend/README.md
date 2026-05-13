# Dental Appointment System - Backend

Backend API cho hệ thống đặt lịch hẹn nha khoa, được xây dựng với Kotlin + Ktor framework.

## 🚀 Features

### Quản lý Người dùng & Xác thực

- ✅ Đăng ký và đăng nhập với JWT authentication
- ✅ 3 vai trò: Patient, Doctor, Admin
- ✅ Quản lý hồ sơ sức khỏe bệnh nhân
- ✅ Phân quyền dựa trên vai trò

### Đặt lịch hẹn

- ✅ Đặt khám theo chuyên khoa
- ✅ Đặt khám theo ngày
- ✅ Đặt khám theo bác sĩ
- ✅ Tìm kiếm và lọc bác sĩ
- ✅ Xem lịch sử đặt khám
- ✅ Hủy lịch hẹn

### Quản lý Bác sĩ

- ✅ Quản lý thông tin bác sĩ
- ✅ Quản lý lịch làm việc
- ✅ Xác nhận/hủy lịch hẹn
- ✅ Đơn xin nghỉ phép
- ✅ Xem hồ sơ bệnh nhân

### Quản lý Admin

- ✅ Dashboard thống kê
- ✅ Quản lý bệnh nhân
- ✅ Quản lý bác sĩ
- ✅ Quản lý dịch vụ
- ✅ Quản lý chuyên khoa
- ✅ Quản lý lịch làm việc
- ✅ Quản lý ngày nghỉ lễ
- ✅ Duyệt đơn nghỉ phép

### Thông báo

- ✅ Thông báo tự động khi có thay đổi lịch hẹn
- ✅ Đánh dấu đã đọc
- ✅ Đếm số thông báo chưa đọc

## 🛠 Tech Stack

- **Language**: Kotlin
- **Framework**: Ktor
- **Database**: PostgreSQL
- **ORM**: Exposed
- **Authentication**: JWT
- **Password Hashing**: BCrypt

## 📋 Prerequisites

- JDK 21 or higher
- PostgreSQL 12 or higher
- Gradle 8.x

## 🔧 Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd backend
```

### 2. Create PostgreSQL database

```sql
CREATE DATABASE dental_appointment;
```

### 3. Configure environment variables

Create `.env` file in `backend/` directory:

```env
DATABASE_URL=jdbc:postgresql://localhost:5432/dental_appointment
DATABASE_USER=your_username
DATABASE_PASSWORD=your_password
JWT_SECRET=your_secret_key_change_this_in_production
```

### 4. Enable seed data (optional)

Edit `backend/src/main/resources/application.yaml`:

```yaml
app:
  seedData: true # Set to true to seed initial data
```

### 5. Build and run

```bash
./gradlew run
```

The server will start on `http://localhost:8080`

### 6. Verify installation

```bash
curl http://localhost:8080/health
```

Should return: `OK`

## 📚 Documentation

- **API Documentation**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Implementation Guide**: [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
- **Requirements**: [.kiro/specs/dental-appointment-system/requirements.md](../.kiro/specs/dental-appointment-system/requirements.md)

## 🔑 Default Credentials (After Seeding)

### Admin

- Email: `admin@dental.com`
- Password: `admin123`

### Doctors

- Email: `doctor1@dental.com` / Password: `doctor123` (General Dentistry)
- Email: `doctor2@dental.com` / Password: `doctor123` (Orthodontics)
- Email: `doctor3@dental.com` / Password: `doctor123` (Cosmetic Dentistry)

### Patient

- Email: `patient@example.com`
- Password: `patient123`

## 🗂 Project Structure

```
backend/
├── src/main/kotlin/com/nhom2/
│   ├── common/              # DTOs and common models
│   ├── models/              # Database table definitions
│   ├── config/              # Configuration (DB, JWT)
│   ├── auth/                # Authentication
│   ├── healthrecord/        # Health record management
│   ├── specialty/           # Specialty management
│   ├── doctors/             # Doctor management
│   ├── services/            # Service management
│   ├── appointment/         # Appointment booking
│   ├── schedule/            # Work schedule & leave
│   ├── notification/        # Notification system
│   ├── dashboard/           # Dashboard statistics
│   ├── plugins/             # Ktor plugins
│   └── utils/               # Utilities & seed data
├── src/main/resources/
│   ├── application.yaml     # Application configuration
│   └── logback.xml          # Logging configuration
├── build.gradle.kts         # Gradle build file
├── .env                     # Environment variables
├── API_DOCUMENTATION.md     # API reference
└── IMPLEMENTATION_GUIDE.md  # Implementation details
```

## 🧪 Testing

### Manual Testing with curl

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API examples.

### Example: Create an appointment

```bash
# 1. Login as patient
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@example.com","password":"patient123"}'

# 2. Get available time slots
curl -X GET "http://localhost:8080/schedules/available-slots?doctorId=<doctor-id>&date=2024-12-25" \
  -H "Authorization: Bearer <token>"

# 3. Create appointment
curl -X POST http://localhost:8080/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "doctorId": "<doctor-id>",
    "timeSlotId": "<slot-id>",
    "serviceId": "<service-id>",
    "appointmentDate": "2024-12-25",
    "notes": "First visit"
  }'
```

## 🔒 Security

- Passwords hashed with bcrypt (cost factor 12)
- JWT tokens expire after 24 hours
- Role-based access control on all protected endpoints
- SQL injection protection via Exposed ORM
- Input validation on all requests

## 📊 Database Schema

The system uses 12 main tables:

1. **users** - User accounts
2. **health_records** - Patient health information
3. **specialties** - Medical specialties
4. **doctors** - Doctor profiles
5. **services** - Dental services
6. **holidays** - Holiday calendar
7. **shifts** - Work shifts
8. **work_schedules** - Doctor schedules
9. **time_slots** - Appointment slots
10. **appointments** - Bookings
11. **leave_requests** - Doctor leave requests
12. **notifications** - User notifications

## 🚧 Troubleshooting

### Database connection failed

- Verify PostgreSQL is running
- Check credentials in `.env`
- Ensure database exists

### JWT token invalid

- Check JWT_SECRET in `.env`
- Verify token hasn't expired (24h)
- Ensure correct Authorization header format

### Port already in use

- Change port in `application.yaml`
- Or stop the process using port 8080

## 📝 License

[Your License Here]

## 👥 Contributors

[Your Team Here]

## 📞 Support

For issues or questions:

- Check documentation files
- Review API examples
- Contact development team
