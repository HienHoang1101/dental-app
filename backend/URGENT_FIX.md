# 🚨 KHẮC PHỤC NGAY - Vẫn có khung giờ tối

## Vấn đề

Khách hàng vẫn thấy khung giờ: 20:30, 21:30, 22:30, 23:30, 17:00, 18:00

## Giải pháp NHANH NHẤT

### Cách 1: Chạy qua API (Server đang chạy)

```bash
# Mở Command Prompt, cd vào thư mục backend, chạy:
.\emergency_cleanup.bat
```

### Cách 2: Chạy SQL trực tiếp (Khuyến nghị)

1. Truy cập Supabase Dashboard
2. Vào SQL Editor
3. Copy nội dung file `simple_cleanup.sql` và chạy

**Hoặc nếu có psql:**

```bash
psql "your_supabase_url" -f simple_cleanup.sql
```

### Cách 3: Chạy qua Supabase Dashboard

1. Vào https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào SQL Editor
4. Chạy từng lệnh này:

```sql
-- Xóa time slots không hợp lệ
DELETE FROM time_slots
WHERE work_schedule_id IN (
    SELECT ws.id FROM work_schedules ws
    JOIN shifts s ON ws.shift_id = s.id
    WHERE NOT (
        (s.start_time >= '08:00:00' AND s.end_time <= '12:00:00') OR
        (s.start_time >= '13:30:00' AND s.end_time <= '17:30:00')
    )
);

-- Xóa work schedules không hợp lệ
DELETE FROM work_schedules
WHERE shift_id IN (
    SELECT id FROM shifts
    WHERE NOT (
        (start_time >= '08:00:00' AND end_time <= '12:00:00') OR
        (start_time >= '13:30:00' AND end_time <= '17:30:00')
    )
);

-- Xóa shifts không hợp lệ
DELETE FROM shifts
WHERE NOT (
    (start_time >= '08:00:00' AND end_time <= '12:00:00') OR
    (start_time >= '13:30:00' AND end_time <= '17:30:00')
);

-- Tạo shifts chuẩn
INSERT INTO shifts (name, start_time, end_time, created_at)
SELECT 'Morning', '08:00:00', '12:00:00', NOW()
WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE name = 'Morning');

INSERT INTO shifts (name, start_time, end_time, created_at)
SELECT 'Afternoon', '13:30:00', '17:30:00', NOW()
WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE name = 'Afternoon');
```

## Sau khi chạy

1. **Restart server** (nếu đang chạy)
2. **Clear browser cache** (Ctrl+F5)
3. **Test lại trang đặt lịch**

## Kết quả mong đợi

- Chỉ còn khung giờ: 8:00, 9:00, 10:00, 11:00 (sáng)
- Và: 13:30, 14:30, 15:30, 16:30 (chiều)
- **KHÔNG CÒN** khung giờ tối/khuya

## Nếu vẫn không được

### Kiểm tra frontend đang gọi endpoint nào:

1. Mở Developer Tools (F12)
2. Vào tab Network
3. Refresh trang đặt lịch
4. Tìm request có chứa "available" hoặc "slots"
5. Xem endpoint nào được gọi:
   - `/api/schedules/available-slots` (cũ - có thể có vấn đề)
   - `/api/doctors/{id}/available-slots` (mới - đúng)

### Nếu frontend gọi endpoint cũ:

Cần sửa frontend để gọi endpoint mới, hoặc đảm bảo endpoint cũ đã được fix.

## Liên hệ

Nếu vẫn không được, hãy:

1. Chụp màn hình kết quả sau khi chạy SQL
2. Chụp màn hình Network tab trong Developer Tools
3. Gửi cho tôi để debug tiếp

**CHẠY NGAY MỘT TRONG 3 CÁCH TRÊN!**
