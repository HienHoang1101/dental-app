# Refactor Hệ Thống Lịch Khám Nha Khoa

Refactor toàn bộ nghiệp vụ quản lý lịch làm việc bác sĩ và đặt lịch khám. Chuyển từ mô hình "tạo slot thủ công theo ngày" sang "lịch cố định theo tuần + sinh slot động". Hỗ trợ tái khám và workflow duyệt đổi lịch.

## Quyết định từ User

- ✅ Chia phase thực hiện
- ✅ Có thể reset DB nếu cần
- ✅ `schedule_exceptions` thiết kế theo hướng "ghi đè lịch cố định" (override)
- ✅ Tái khám cần trong phase đầu
- ✅ Bỏ qua phí hủy (chưa có hệ thống thanh toán)

---

## Phase 1 — Database + Backend Core

> [!IMPORTANT]
> Phase này tập trung vào nền tảng: schema mới, business logic core, và API. Chưa đụng đến frontend.

### Database

#### [NEW] Bảng `weekly_work_schedules`

```sql
CREATE TABLE weekly_work_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id),
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Mon, 7=Sun
    session TEXT NOT NULL CHECK (session IN ('morning', 'afternoon')),
    start_time TIME NOT NULL,  -- Sáng: 08:00, Chiều: 13:30
    end_time TIME NOT NULL,    -- Sáng: 12:00, Chiều: 17:30
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (doctor_id, day_of_week, session)
);
```

- Ràng buộc UNIQUE đảm bảo mỗi bác sĩ chỉ có 1 lịch/buổi/ngày trong tuần
- `start_time/end_time` cố định theo `session` (Sáng: 08:00-12:00, Chiều: 13:30-17:30), không cho tùy chỉnh giờ lẻ

#### [NEW] Bảng `schedule_exceptions`

```sql
CREATE TABLE schedule_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id),
    exception_date DATE NOT NULL,
    exception_type TEXT NOT NULL CHECK (exception_type IN ('off', 'override')),
    -- Nếu 'off': bác sĩ nghỉ ngày đó (cả ngày hoặc 1 buổi)
    -- Nếu 'override': ghi đè lịch cố định bằng giờ khác
    session TEXT CHECK (session IN ('morning', 'afternoon')),  -- NULL = cả ngày
    override_start_time TIME,  -- Chỉ dùng khi type = 'override'
    override_end_time TIME,    -- Chỉ dùng khi type = 'override'
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (doctor_id, exception_date, session)
);
```

- `exception_type = 'off'` + `session = NULL` → Nghỉ cả ngày
- `exception_type = 'off'` + `session = 'morning'` → Chỉ nghỉ buổi sáng
- `exception_type = 'override'` → Thay đổi giờ làm ngày đó (ví dụ: sáng thường 8-12, hôm nay 9-11)

#### [NEW] Bảng `schedule_change_requests`

```sql
CREATE TABLE schedule_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id),
    request_type TEXT NOT NULL CHECK (request_type IN ('add', 'remove', 'modify')),
    old_schedule_data JSONB,  -- Lịch cũ (nếu modify/remove)
    new_schedule_data JSONB,  -- Lịch mới (nếu add/modify)
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### [MODIFY] Bảng `appointments`

```sql
ALTER TABLE appointments
    ADD COLUMN start_time TIMESTAMPTZ,
    ADD COLUMN end_time TIMESTAMPTZ,
    ADD COLUMN parent_appointment_id UUID REFERENCES appointments(id);

-- Index cho overlap check
CREATE INDEX idx_appointments_doctor_time
    ON appointments (doctor_id, start_time, end_time)
    WHERE status IN ('pending', 'confirmed');

-- Constraint
ALTER TABLE appointments ADD CONSTRAINT chk_time CHECK (start_time < end_time);
```

- `start_time/end_time` dùng TIMESTAMPTZ (UTC) thay vì tách date + time
- `time_slot_id` và `schedule_id` giữ nullable, **không xóa** trong phase này
- `parent_appointment_id` cho tái khám

---

### Backend (Kotlin/Ktor)

#### [NEW] `models/NewTables.kt`

Exposed table definitions cho 3 bảng mới + sửa `Appointments` thêm cột.

#### [NEW] `weekschedule/WeeklyScheduleService.kt`

| Hàm | Mô tả |
|-----|--------|
| `getByDoctor(doctorId)` | Lấy lịch cố định của bác sĩ |
| `upsert(doctorId, dayOfWeek, session)` | Thêm/sửa lịch cố định |
| `deactivate(id)` | Tắt 1 lịch |
| `getAvailableSlots(doctorId, date)` | **Thuật toán chính** — sinh slot 1h khả dụng |

**Thuật toán `getAvailableSlots`:**
```
1. Lấy day_of_week từ date → tìm weekly_work_schedules
2. Kiểm tra schedule_exceptions cho date đó
   - Nếu 'off' → loại bỏ buổi/ngày
   - Nếu 'override' → dùng giờ ghi đè
3. Kiểm tra holidays → loại bỏ nếu trùng
4. Sinh slot 1 giờ từ start_time đến end_time
5. Query appointments WHERE doctor_id AND date AND status IN ('pending','confirmed')
6. Loại bỏ slot bị overlap với appointment đã đặt
7. Loại bỏ slot < 2 giờ kể từ hiện tại (lead time)
8. Trả về danh sách slot {start, end}
```

#### [NEW] `weekschedule/WeeklyScheduleRoutes.kt`

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/api/doctors/{id}/weekly-schedules` | Lấy lịch cố định |
| GET | `/api/doctors/{id}/available-slots?date=YYYY-MM-DD` | Sinh slot khả dụng |
| POST | `/api/doctor/weekly-schedules` | Bác sĩ đăng ký lịch (tạo change request) |
| PUT | `/api/doctor/weekly-schedules/{id}` | Bác sĩ sửa lịch (tạo change request) |

#### [NEW] `schedulechange/ScheduleChangeService.kt`

| Hàm | Mô tả |
|-----|--------|
| `createRequest(doctorId, request)` | Tạo yêu cầu đổi lịch |
| `approve(id, reviewerId)` | Admin duyệt → cập nhật weekly_work_schedules |
| `reject(id, reviewerId, reason)` | Admin từ chối |
| `getByDoctor(doctorId)` | Lịch sử yêu cầu của bác sĩ |
| `getPending()` | Danh sách chờ duyệt cho admin |

#### [NEW] `exception/ScheduleExceptionService.kt`

| Hàm | Mô tả |
|-----|--------|
| `addException(doctorId, date, type, ...)` | Thêm ngoại lệ |
| `getExceptions(doctorId, startDate, endDate)` | Lấy ngoại lệ trong khoảng |
| `deleteException(id)` | Xóa ngoại lệ |

#### [MODIFY] `appointment/AppointmentService.kt`

- **`createAppointment`**: Nhận `start_time, end_time` thay vì `time_slot_id`
  - Validate overlap bằng SQL query:
    ```sql
    SELECT COUNT(*) FROM appointments
    WHERE doctor_id = ? AND status IN ('pending','confirmed')
    AND start_time < ? AND end_time > ?  -- new_end, new_start
    ```
  - Validate bác sĩ có lịch làm ngày đó
  - Validate lead time (≥ 2 giờ, ≤ 30 ngày)
  - Ghi cả `time_slot_id` (dual-write) nếu tìm được slot cũ match → giữ compat
- **`createFollowUp`** (mới): Tạo lịch tái khám
  - Chỉ bác sĩ được tạo
  - Parent appointment phải `status = 'completed'`
  - Trong vòng 30 ngày kể từ parent
  - Cho phép > 1 giờ

#### [MODIFY] `common/DTOs.kt`

Thêm các DTO mới:
- `WeeklyScheduleDTO`, `CreateWeeklyScheduleRequest`
- `ScheduleExceptionDTO`, `CreateExceptionRequest`
- `ScheduleChangeRequestDTO`
- `AvailableSlotDTO { start: String, end: String }`
- `CreateAppointmentRequestV2 { doctorId, startTime, endTime, serviceId, notes, parentAppointmentId? }`
- Sửa `AppointmentDTO` thêm `startTime?, endTime?, parentAppointmentId?`

---

## Phase 2 — Frontend Refactor

### Bệnh nhân — Luồng đặt lịch mới

#### [MODIFY] `patient/appointments/book/by-doctor/select-date/`

Thay vì load `work_schedules` theo ngày, gọi API mới:
- `GET /api/doctors/{id}/available-slots?date=2026-05-10`
- Hiển thị danh sách slot 1 giờ dạng nút bấm (08:00-09:00, 09:00-10:00, ...)
- Bỏ trang `select-time` (merge vào `select-date`)

#### [MODIFY] `patient/appointments/book/confirm/`

- Gửi `POST /api/appointments` với `{ startTime, endTime }` thay vì `{ timeSlotId }`

#### [MODIFY] `lib/patientApi.ts`

- Thêm `getAvailableSlots(doctorId, date)`
- Sửa `createAppointment` request body

---

### Bác sĩ — Quản lý lịch tuần

#### [MODIFY] `doctor/schedule/page.tsx`

Viết lại UI thành **bảng lịch tuần** (7 cột, 2 hàng Sáng/Chiều):
- Checkbox toggle Sáng/Chiều cho mỗi ngày
- Sửa → tạo `schedule_change_request` (pending)
- Hiển thị trạng thái pending/approved

#### [NEW] `doctor/follow-up/` hoặc thêm vào `doctor/appointments/`

- Nút "Tạo lịch tái khám" ở appointment đã completed
- Form chọn ngày + giờ (cho phép > 1h)

#### [MODIFY] `lib/doctorApi.ts`

- Thêm `getWeeklySchedules()`, `createChangeRequest()`, `createFollowUp()`

---

### Admin — Duyệt đổi lịch

#### [NEW] `admin/schedule-changes/page.tsx`

- Danh sách yêu cầu đổi lịch (filter: pending/approved/rejected)
- Chi tiết: so sánh lịch cũ vs lịch mới
- Nút Duyệt / Từ chối (có lý do)

#### [MODIFY] `admin/schedules/`

- Hiển thị lịch tuần của tất cả bác sĩ
- Quản lý `schedule_exceptions` (thêm ngày nghỉ đột xuất)

#### [MODIFY] `lib/adminApi.ts`

- Thêm API cho schedule changes và exceptions

---

## Phase 3 — Cleanup & Polish

- [ ] Xóa bảng `time_slots`, `work_schedules`, `doctor_schedules` (sau khi FE không còn dùng)
- [ ] Xóa cột `time_slot_id`, `schedule_id` khỏi `appointments`
- [ ] Xóa code cũ trong `ScheduleService.kt` (shift management, time slot generation)
- [ ] Xóa DTOs cũ (`TimeSlotDTO`, `WorkScheduleDTO`, etc.)
- [ ] Chuyển hoàn toàn sang timezone UTC nếu cần

---

## Verification Plan

### Automated Tests
Vì project hiện chưa có test suite, sẽ verify bằng:
- Script Python test API trực tiếp (giống cách đã test chatbot)
- Test cases cho thuật toán sinh slot
- Test overlap validation

### Manual Verification
- **Luồng đặt lịch**: Bệnh nhân chọn bác sĩ → chọn ngày → thấy slot → đặt thành công
- **Overlap**: Đặt 2 lịch trùng giờ → bị chặn
- **Tái khám**: Bác sĩ tạo follow-up từ appointment completed
- **Đổi lịch**: Bác sĩ gửi yêu cầu → Admin duyệt → Lịch cập nhật
- **Ngoại lệ**: Admin thêm ngày nghỉ → Slot ngày đó biến mất
- **Lead time**: Đặt lịch < 2 giờ → bị chặn

---

## Ước tính khối lượng

| Phase | Files mới | Files sửa | Dòng code ước tính |
|-------|-----------|-----------|-------------------|
| Phase 1 | 6-8 | 4-5 | ~1500 |
| Phase 2 | 3-4 | 8-10 | ~2000 |
| Phase 3 | 0 | 5-6 | -500 (xóa) |

> [!NOTE]
> Bắt đầu từ Phase 1. Sau khi hoàn thành Phase 1 sẽ xin feedback trước khi sang Phase 2.
