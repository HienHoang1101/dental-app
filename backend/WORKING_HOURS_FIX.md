# Sửa lỗi: Khách hàng đặt lịch ngoài giờ làm việc của bác sĩ

## Vấn đề

Hệ thống cho phép khách hàng đặt lịch vào các khung giờ tối và khuya (18h-22h, thậm chí cả đêm), trong khi bác sĩ chỉ làm việc:

- **Sáng**: 8h00 - 12h00
- **Chiều**: 13h30 - 17h30

## Nguyên nhân

Hệ thống có **hai hệ thống lịch làm việc song song**:

### 1. Hệ thống mới (đúng)

- Sử dụng `WeeklyWorkSchedules` với giờ làm việc cố định
- Chỉ cho phép morning (08:00-12:00) và afternoon (13:30-17:30)
- Được sử dụng bởi API V2: `POST /appointments/v2`

### 2. Hệ thống cũ (có vấn đề)

- Sử dụng `Shifts` → `WorkSchedules` → `TimeSlots`
- Cho phép admin tạo "ca tối" hoặc "ca khuya" với bất kỳ giờ nào
- Được sử dụng bởi API legacy: `POST /appointments`
- **Không có validation giờ làm việc**

## Giải pháp đã triển khai

### 1. Thêm validation vào việc tạo Shift

**File**: `backend/src/main/kotlin/com/nhom2/schedule/ScheduleService.kt`

```kotlin
fun createShift(request: CreateShiftRequest): ShiftDTO {
    // Validate working hours - only allow morning (8:00-12:00) and afternoon (13:30-17:30)
    val isValidMorningShift = startTime >= LocalTime.of(8, 0) && endTime <= LocalTime.of(12, 0)
    val isValidAfternoonShift = startTime >= LocalTime.of(13, 30) && endTime <= LocalTime.of(17, 30)

    if (!isValidMorningShift && !isValidAfternoonShift) {
        throw IllegalArgumentException(
            "Invalid shift time. Only morning shifts (08:00-12:00) and afternoon shifts (13:30-17:30) are allowed."
        )
    }
}
```

### 2. Thêm validation vào việc cập nhật Shift

Tương tự như createShift, `updateShift()` cũng được thêm validation để không cho phép sửa shift thành giờ không hợp lệ.

### 3. Thêm validation vào đặt lịch legacy

**File**: `backend/src/main/kotlin/com/nhom2/appointment/AppointmentService.kt`

```kotlin
fun createAppointment(patientId: UUID, request: CreateAppointmentRequest): Result<AppointmentDTO> {
    // VALIDATE WORKING HOURS: Only allow morning (8:00-12:00) and afternoon (13:30-17:30)
    val isValidMorningShift = shiftStartTime >= LocalTime.of(8, 0) && shiftEndTime <= LocalTime.of(12, 0)
    val isValidAfternoonShift = shiftStartTime >= LocalTime.of(13, 30) && shiftEndTime <= LocalTime.of(17, 30)

    if (!isValidMorningShift && !isValidAfternoonShift) {
        return Result.failure(Exception(
            "Invalid appointment time. Appointments are only available during working hours: " +
            "Morning (08:00-12:00) and Afternoon (13:30-17:30)."
        ))
    }
}
```

### 4. Tạo endpoint cleanup cho admin

**Endpoint**: `POST /api/schedules/cleanup-invalid-shifts`

Endpoint này cho phép admin:

- Tìm và liệt kê tất cả shift không hợp lệ
- Hủy các appointment đang sử dụng time slot không hợp lệ
- Xóa time slots và work schedules liên quan
- Xóa các shift không hợp lệ
- Tạo shift chuẩn (Morning, Afternoon) nếu chưa có

### 5. Tạo script SQL để kiểm tra và cleanup

**File**: `backend/cleanup_invalid_shifts.sql`

Script này giúp:

- Kiểm tra shift nào ngoài giờ làm việc
- Xem appointment nào bị ảnh hưởng
- Thực hiện cleanup an toàn từng bước

## Cách sử dụng

### 1. Kiểm tra tình trạng hiện tại

```bash
# Chạy script SQL để xem có shift nào không hợp lệ
psql -d dental_app -f cleanup_invalid_shifts.sql
```

### 2. Thực hiện cleanup (Admin)

```bash
# Gọi API cleanup
curl -X POST http://localhost:8080/api/schedules/cleanup-invalid-shifts \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json"
```

### 3. Tạo shift chuẩn (nếu cần)

```bash
# Tạo ca sáng
curl -X POST http://localhost:8080/api/schedules/shifts \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Morning",
    "startTime": "08:00",
    "endTime": "12:00"
  }'

# Tạo ca chiều
curl -X POST http://localhost:8080/api/schedules/shifts \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Afternoon",
    "startTime": "13:30",
    "endTime": "17:30"
  }'
```

## Kết quả

### ✅ Trước khi sửa:

- Admin có thể tạo shift "Evening" (18:00-22:00)
- Hệ thống tạo time slots tối (18:00-19:00, 19:00-20:00, ...)
- Khách hàng có thể đặt lịch vào các slot này
- Bác sĩ nhận appointment ngoài giờ làm việc

### ✅ Sau khi sửa:

- Admin chỉ có thể tạo shift trong giờ 08:00-12:00 hoặc 13:30-17:30
- Khách hàng không thể đặt lịch ngoài giờ làm việc
- Các appointment không hợp lệ sẽ bị hủy với lý do rõ ràng
- Hệ thống đảm bảo chỉ có appointment trong giờ làm việc

## Validation Messages

### Khi tạo shift không hợp lệ:

```
Invalid shift time. Only morning shifts (08:00-12:00) and afternoon shifts (13:30-17:30) are allowed.
Provided: 18:00-22:00
```

### Khi đặt lịch ngoài giờ:

```
Invalid appointment time. Appointments are only available during working hours:
Morning (08:00-12:00) and Afternoon (13:30-17:30).
Requested time slot: 18:00-22:00
```

## Files đã thay đổi

1. **backend/src/main/kotlin/com/nhom2/schedule/ScheduleService.kt**
   - Thêm validation vào `createShift()` và `updateShift()`
   - Thêm method `cleanupInvalidShifts()`

2. **backend/src/main/kotlin/com/nhom2/schedule/ScheduleRoutes.kt**
   - Thêm endpoint `POST /schedules/cleanup-invalid-shifts`

3. **backend/src/main/kotlin/com/nhom2/appointment/AppointmentService.kt**
   - Thêm validation vào `createAppointment()` (legacy API)

4. **backend/cleanup_invalid_shifts.sql**
   - Script SQL để kiểm tra và cleanup dữ liệu

5. **backend/WORKING_HOURS_FIX.md**
   - Tài liệu này

## Testing

### Test case 1: Tạo shift không hợp lệ

```bash
curl -X POST http://localhost:8080/api/schedules/shifts \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Evening",
    "startTime": "18:00",
    "endTime": "22:00"
  }'
# Expected: 400 Bad Request với message validation
```

### Test case 2: Đặt lịch với time slot không hợp lệ (nếu còn tồn tại)

```bash
curl -X POST http://localhost:8080/api/appointments \
  -H "Authorization: Bearer <patient_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "timeSlotId": "<invalid_evening_slot_id>",
    "serviceId": "<service_id>",
    "notes": "Test evening appointment"
  }'
# Expected: 400 Bad Request với message validation
```

### Test case 3: Cleanup invalid shifts

```bash
curl -X POST http://localhost:8080/api/schedules/cleanup-invalid-shifts \
  -H "Authorization: Bearer <admin_token>"
# Expected: 200 OK với thống kê cleanup
```

## Lưu ý quan trọng

1. **Backup database** trước khi chạy cleanup
2. **Thông báo khách hàng** về việc hủy appointment nếu có
3. **Chạy cleanup vào giờ ít người dùng** để tránh ảnh hưởng
4. **Kiểm tra kỹ** các appointment bị ảnh hưởng trước khi cleanup

## Kết luận

Vấn đề đã được giải quyết hoàn toàn:

- ✅ Ngăn chặn tạo shift ngoài giờ làm việc
- ✅ Ngăn chặn đặt lịch ngoài giờ làm việc
- ✅ Cung cấp tool cleanup cho dữ liệu cũ
- ✅ Đảm bảo chỉ có appointment trong giờ 8h-12h và 13h30-17h30

Hệ thống giờ đây đã đồng bộ và chỉ cho phép đặt lịch trong giờ làm việc chính thức của bác sĩ.
