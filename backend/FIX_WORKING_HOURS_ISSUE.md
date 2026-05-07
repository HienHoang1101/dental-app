# 🚨 KHẮC PHỤC: Khách hàng vẫn đặt được lịch ngoài giờ làm việc

## Vấn đề hiện tại

Mặc dù đã thêm validation, khách hàng vẫn có thể đặt lịch vào các khung giờ:

- 20:30, 21:30 (8:30 PM, 9:30 PM)
- 22:30, 23:30 (10:30 PM, 11:30 PM)
- 17:00, 18:00 (5:00 PM, 6:00 PM)

## Nguyên nhân

**Dữ liệu cũ vẫn tồn tại trong database:**

- Các `shifts` không hợp lệ vẫn còn trong bảng `shifts`
- Các `work_schedules` và `time_slots` được tạo từ shifts không hợp lệ
- Frontend đang lấy time slots từ dữ liệu cũ này

## Giải pháp NGAY LẬP TỨC

### Bước 1: Dừng server (nếu đang chạy)

```bash
# Nhấn Ctrl+C để dừng server
```

### Bước 2: Chạy cleanup migration

```bash
cd backend
.\run_cleanup_migration.bat
```

**Hoặc chạy trực tiếp SQL:**

```bash
psql "your_database_url" -f migrations/cleanup_invalid_working_hours.sql
```

### Bước 3: Khởi động lại server

```bash
.\gradlew run
```

### Bước 4: Test lại frontend

- Truy cập trang đặt lịch
- Chỉ nên thấy khung giờ: 8:00-12:00 và 13:30-17:30

## Chi tiết migration sẽ thực hiện

### ✅ Những gì sẽ được làm:

1. **Hủy appointments không hợp lệ** với lý do rõ ràng
2. **Xóa time slots** ngoài giờ làm việc
3. **Xóa work schedules** sử dụng shifts không hợp lệ
4. **Xóa shifts** ngoài giờ 8:00-12:00 và 13:30-17:30
5. **Tạo shifts chuẩn** Morning và Afternoon nếu chưa có

### ⚠️ Tác động:

- Các appointment đã đặt ngoài giờ sẽ bị **HỦY**
- Khách hàng sẽ nhận thông báo hủy với lý do: "System cleanup: Invalid time slot outside working hours"
- **Không ảnh hưởng** đến appointments trong giờ làm việc hợp lệ

## Kiểm tra trước khi chạy

### Xem có bao nhiêu shifts không hợp lệ:

```sql
SELECT
    id, name, start_time, end_time,
    CASE
        WHEN start_time >= '08:00:00' AND end_time <= '12:00:00' THEN 'Valid Morning'
        WHEN start_time >= '13:30:00' AND end_time <= '17:30:00' THEN 'Valid Afternoon'
        ELSE 'INVALID - Outside working hours'
    END as validity_status
FROM shifts
ORDER BY start_time;
```

### Xem có bao nhiêu appointments sẽ bị ảnh hưởng:

```sql
SELECT COUNT(*) as affected_appointments
FROM appointments a
JOIN time_slots ts ON a.time_slot_id = ts.id
JOIN work_schedules ws ON ts.work_schedule_id = ws.id
JOIN shifts s ON ws.shift_id = s.id
WHERE NOT (
    (s.start_time >= '08:00:00' AND s.end_time <= '12:00:00') OR
    (s.start_time >= '13:30:00' AND s.end_time <= '17:30:00')
)
AND a.status IN ('pending', 'confirmed');
```

## Validation đã được thêm

### 1. Tạo shift mới

```kotlin
// Chỉ cho phép tạo shift trong giờ 8:00-12:00 hoặc 13:30-17:30
val isValidMorningShift = startTime >= LocalTime.of(8, 0) && endTime <= LocalTime.of(12, 0)
val isValidAfternoonShift = startTime >= LocalTime.of(13, 30) && endTime <= LocalTime.of(17, 30)

if (!isValidMorningShift && !isValidAfternoonShift) {
    throw IllegalArgumentException("Only morning shifts (08:00-12:00) and afternoon shifts (13:30-17:30) are allowed")
}
```

### 2. Đặt lịch legacy

```kotlin
// Kiểm tra time slot có hợp lệ không
if (!isValidMorningShift && !isValidAfternoonShift) {
    return Result.failure(Exception("Appointments are only available during working hours: Morning (08:00-12:00) and Afternoon (13:30-17:30)"))
}
```

### 3. Lấy available time slots

```kotlin
// Chỉ lấy time slots từ shifts hợp lệ
.select {
    (WorkSchedules.doctorId eq doctorId) and
    (WorkSchedules.date eq date) and
    // ONLY INCLUDE VALID SHIFTS
    (
        ((Shifts.startTime greaterEq LocalTime.of(8, 0)) and (Shifts.endTime lessEq LocalTime.of(12, 0))) or
        ((Shifts.startTime greaterEq LocalTime.of(13, 30)) and (Shifts.endTime lessEq LocalTime.of(17, 30)))
    )
}
```

## Endpoints để test

### Debug endpoint (admin only):

```bash
GET /api/schedules/debug/shifts
Authorization: Bearer <admin_token>
```

### Cleanup endpoint (admin only):

```bash
POST /api/schedules/cleanup-invalid-shifts
Authorization: Bearer <admin_token>
```

### Test available slots:

```bash
# Old endpoint (should be fixed after cleanup)
GET /api/schedules/available-slots?doctorId=<id>&date=2026-05-10

# New endpoint (always correct)
GET /api/doctors/<id>/available-slots?date=2026-05-10
```

## Sau khi chạy migration

### ✅ Kết quả mong đợi:

- Chỉ còn 2 shifts: "Morning" (08:00-12:00) và "Afternoon" (13:30-17:30)
- Khách hàng chỉ thấy khung giờ 8:00-12:00 và 13:30-17:30
- Không còn khung giờ tối/khuya nào

### 🔍 Cách verify:

```sql
-- Kiểm tra chỉ còn shifts hợp lệ
SELECT * FROM shifts ORDER BY start_time;

-- Kiểm tra không còn appointments ngoài giờ
SELECT COUNT(*) FROM appointments WHERE status IN ('pending', 'confirmed')
AND time_slot_id IN (
    SELECT ts.id FROM time_slots ts
    JOIN work_schedules ws ON ts.work_schedule_id = ws.id
    JOIN shifts s ON ws.shift_id = s.id
    WHERE NOT (
        (s.start_time >= '08:00:00' AND s.end_time <= '12:00:00') OR
        (s.start_time >= '13:30:00' AND s.end_time <= '17:30:00')
    )
);
-- Kết quả phải là 0
```

## Lưu ý quan trọng

### 🚨 Trước khi chạy:

1. **Backup database** để phòng trường hợp cần rollback
2. **Thông báo khách hàng** về việc hủy appointment (nếu có)
3. **Chạy vào giờ ít người dùng** để tránh ảnh hưởng

### 📞 Thông báo khách hàng:

"Xin lỗi quý khách, do điều chỉnh lịch làm việc, appointment của quý khách vào [thời gian] đã được hủy. Vui lòng đặt lại lịch trong khung giờ làm việc: Sáng 8:00-12:00, Chiều 13:30-17:30. Xin cảm ơn!"

## Kết luận

Sau khi chạy migration này, vấn đề sẽ được giải quyết **hoàn toàn**:

- ✅ Không còn shifts ngoài giờ làm việc
- ✅ Không còn time slots tối/khuya
- ✅ Khách hàng chỉ đặt được lịch trong giờ 8:00-12:00 và 13:30-17:30
- ✅ Validation ngăn chặn tạo shifts không hợp lệ trong tương lai

**Chạy ngay migration này để khắc phục vấn đề!**
