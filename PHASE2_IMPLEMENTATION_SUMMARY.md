# Phase 2 - Frontend Refactor Implementation Summary

## ✅ Hoàn thành: 100%

Phase 2 đã hoàn thành việc refactor toàn bộ frontend để sử dụng hệ thống lịch mới (weekly schedules + dynamic slot generation) thay vì hệ thống cũ (manual time slots).

---

## 📋 Tổng quan thay đổi

### **1. API Layer Updates**

#### `frontend/src/lib/patientApi.ts`

- ✅ Thêm `getAvailableSlotsV2()` - Lấy slot khả dụng từ API mới
- ✅ Thêm `createAppointmentV2()` - Đặt lịch với `startTime/endTime` thay vì `timeSlotId`
- ✅ Giữ nguyên API cũ để backward compatibility

#### `frontend/src/lib/doctorApi.ts`

- ✅ Thêm `getMyWeeklySchedules()` - Lấy lịch tuần của bác sĩ
- ✅ Thêm `requestScheduleChange()` - Tạo yêu cầu thay đổi lịch
- ✅ Thêm `getMyScheduleChangeRequests()` - Xem lịch sử yêu cầu
- ✅ Thêm `createFollowUpAppointment()` - Tạo lịch tái khám

#### `frontend/src/lib/adminApi.ts`

- ✅ Thêm `getScheduleChangeRequests()` - Lấy danh sách yêu cầu đổi lịch
- ✅ Thêm `approveScheduleChange()` - Duyệt yêu cầu
- ✅ Thêm `rejectScheduleChange()` - Từ chối yêu cầu
- ✅ Thêm `getScheduleExceptions()` - Lấy danh sách ngoại lệ
- ✅ Thêm `createScheduleException()` - Tạo ngoại lệ (nghỉ/ghi đè)
- ✅ Thêm `deleteScheduleException()` - Xóa ngoại lệ

---

### **2. Patient Booking Flow**

#### `frontend/src/app/patient/appointments/book/by-doctor/select-date/page.tsx`

**Thay đổi lớn:** Merge trang chọn ngày + chọn giờ thành 1 trang

**Tính năng:**

- ✅ Hiển thị calendar chọn ngày (bên trái)
- ✅ Hiển thị slot 1 giờ khả dụng (bên phải)
- ✅ Gọi API `getAvailableSlotsV2()` khi chọn ngày
- ✅ Chia slot theo buổi (Sáng/Chiều)
- ✅ Format slot: "08:00 - 09:00", "09:00 - 10:00", ...
- ✅ Chuyển `startTime/endTime` sang trang confirm

**UI:**

```
┌─────────────────────────────────────────┐
│  [Doctor Info Card]                     │
├──────────────────┬──────────────────────┤
│  📅 Chọn ngày    │  🕐 Chọn giờ         │
│  [Calendar]      │  Buổi sáng:          │
│                  │  [08:00-09:00] [...] │
│                  │  Buổi chiều:         │
│                  │  [13:30-14:30] [...] │
└──────────────────┴──────────────────────┘
```

#### `frontend/src/app/patient/appointments/book/confirm/page.tsx`

**Thay đổi:** Hỗ trợ cả 2 hệ thống (old + new)

**Tính năng:**

- ✅ Nhận `startTime/endTime` từ URL (hệ thống mới)
- ✅ Nhận `timeSlotId` từ URL (hệ thống cũ)
- ✅ Gọi `createAppointmentV2()` nếu có `startTime/endTime`
- ✅ Gọi `createAppointment()` nếu có `timeSlotId`
- ✅ Format hiển thị giờ cho cả 2 hệ thống

---

### **3. Doctor Schedule Management**

#### `frontend/src/app/doctor/schedule/page.tsx`

**Thay đổi lớn:** Viết lại hoàn toàn UI thành bảng lịch tuần

**Tính năng:**

- ✅ Bảng 7 cột (Thứ 2 - Chủ nhật) x 2 hàng (Sáng/Chiều)
- ✅ Ô xanh = Đã đăng ký, Ô trắng = Chưa đăng ký
- ✅ Click vào ô để thêm/xóa lịch → Tạo `schedule_change_request`
- ✅ Hiển thị trạng thái "Chờ duyệt" cho request pending
- ✅ Lịch sử yêu cầu thay đổi (10 gần nhất)
- ✅ Modal xác nhận khi thêm lịch

**UI:**

```
┌────────────────────────────────────────────────────────┐
│  Buổi  │ Thứ 2 │ Thứ 3 │ Thứ 4 │ Thứ 5 │ Thứ 6 │ Thứ 7 │ CN │
├────────┼───────┼───────┼───────┼───────┼───────┼───────┼────┤
│ Sáng   │   ✓   │   +   │   ✓   │   +   │   ✓   │   +   │ +  │
│ 08-12  │       │       │       │       │       │       │    │
├────────┼───────┼───────┼───────┼───────┼───────┼───────┼────┤
│ Chiều  │   +   │   ✓   │   +   │   ✓   │   +   │   ✓   │ +  │
│ 13-17  │       │       │       │       │       │       │    │
└────────┴───────┴───────┴───────┴───────┴───────┴───────┴────┘
```

---

### **4. Doctor Follow-up Appointments**

#### `frontend/src/app/doctor/appointments/page.tsx`

**Thêm tính năng:** Nút "Tái khám" cho appointment đã completed

**Tính năng:**

- ✅ Nút "Tái khám" hiển thị khi `status = 'completed'`
- ✅ Modal form: Chọn ngày + giờ bắt đầu + giờ kết thúc + ghi chú
- ✅ Cho phép lịch tái khám > 1 giờ
- ✅ Gọi API `createFollowUpAppointment()`
- ✅ Tự động link với appointment gốc qua `parentAppointmentId`

**UI Modal:**

```
┌─────────────────────────────────────┐
│  Tạo lịch tái khám                  │
├─────────────────────────────────────┤
│  Ngày tái khám: [date picker]      │
│  Giờ bắt đầu:   [time picker]      │
│  Giờ kết thúc:  [time picker]      │
│  Ghi chú:       [textarea]          │
│                                     │
│  [Hủy]  [Tạo lịch tái khám]        │
└─────────────────────────────────────┘
```

---

### **5. Admin Schedule Change Approval**

#### `frontend/src/app/admin/schedule-changes/page.tsx` _(MỚI)_

**Trang mới:** Duyệt yêu cầu thay đổi lịch của bác sĩ

**Tính năng:**

- ✅ Danh sách yêu cầu (filter: pending/approved/rejected)
- ✅ Hiển thị so sánh lịch cũ vs lịch mới
- ✅ Badge trạng thái: Chờ duyệt / Đã duyệt / Từ chối
- ✅ Nút "Duyệt" và "Từ chối" cho request pending
- ✅ Modal nhập lý do khi từ chối
- ✅ Hiển thị lý do từ chối (nếu có)

**UI Card:**

```
┌─────────────────────────────────────────────────┐
│  [Chờ duyệt] Thêm lịch                          │
│  Bác sĩ: Nguyễn Văn A                           │
│  Ngày tạo: 07/05/2026 10:30                     │
├──────────────────────┬──────────────────────────┤
│  Lịch cũ:            │  Lịch mới:               │
│  Thứ 2 - Sáng        │  Thứ 3 - Chiều           │
│  (08:00 - 12:00)     │  (13:30 - 17:30)         │
└──────────────────────┴──────────────────────────┘
│  [Duyệt]  [Từ chối]                             │
└─────────────────────────────────────────────────┘
```

---

### **6. Admin Schedule Exception Management**

#### `frontend/src/app/admin/schedules/page.tsx`

**Thêm tính năng:** Nút "+ Thêm ngoại lệ" và modal tạo exception

**Tính năng:**

- ✅ Nút "+ Thêm ngoại lệ" ở header
- ✅ Modal form tạo ngoại lệ:
  - Chọn bác sĩ
  - Chọn ngày
  - Loại: Nghỉ / Ghi đè giờ làm
  - Buổi: Cả ngày / Sáng / Chiều
  - Giờ ghi đè (nếu chọn "Ghi đè")
  - Lý do
- ✅ Validation: Bắt buộc nhập giờ nếu chọn "Ghi đè"
- ✅ Gọi API `createScheduleException()`

**Use cases:**

- **Nghỉ cả ngày:** `type=off, session=null`
- **Nghỉ buổi sáng:** `type=off, session=morning`
- **Ghi đè giờ sáng:** `type=override, session=morning, startTime=09:00, endTime=11:00`

---

## 🔄 Backward Compatibility

**Hệ thống cũ vẫn hoạt động:**

- ✅ API cũ (`getAvailableTimeSlots`, `createAppointment`) vẫn giữ nguyên
- ✅ Trang confirm hỗ trợ cả 2 hệ thống
- ✅ Database vẫn có `time_slot_id` và `schedule_id` (chưa xóa)
- ✅ Frontend có thể dùng song song trong giai đoạn chuyển đổi

---

## 📁 Files Changed

### **API Clients (3 files)**

- `frontend/src/lib/patientApi.ts` - Thêm V2 methods
- `frontend/src/lib/doctorApi.ts` - Thêm weekly schedule methods
- `frontend/src/lib/adminApi.ts` - Thêm schedule change + exception methods

### **Patient Pages (2 files)**

- `frontend/src/app/patient/appointments/book/by-doctor/select-date/page.tsx` - Merge date + time selection
- `frontend/src/app/patient/appointments/book/confirm/page.tsx` - Support both systems

### **Doctor Pages (2 files)**

- `frontend/src/app/doctor/schedule/page.tsx` - Complete rewrite with weekly grid
- `frontend/src/app/doctor/appointments/page.tsx` - Add follow-up feature

### **Admin Pages (2 files)**

- `frontend/src/app/admin/schedule-changes/page.tsx` - **NEW** - Approval page
- `frontend/src/app/admin/schedules/page.tsx` - Add exception management

---

## 🧪 Testing Checklist

### **Patient Flow**

- [ ] Chọn bác sĩ → Chọn ngày → Thấy slot 1 giờ
- [ ] Chọn slot → Confirm → Đặt lịch thành công
- [ ] Slot đã đặt không hiển thị cho bệnh nhân khác
- [ ] Slot < 2 giờ từ hiện tại bị ẩn

### **Doctor Flow**

- [ ] Xem bảng lịch tuần hiện tại
- [ ] Click ô trống → Tạo request thêm lịch
- [ ] Click ô xanh → Tạo request xóa lịch
- [ ] Request hiển thị "Chờ duyệt"
- [ ] Appointment completed → Nút "Tái khám" xuất hiện
- [ ] Tạo lịch tái khám thành công

### **Admin Flow**

- [ ] Xem danh sách request chờ duyệt
- [ ] Duyệt request → Lịch bác sĩ cập nhật
- [ ] Từ chối request → Hiển thị lý do
- [ ] Tạo ngoại lệ "Nghỉ cả ngày" → Slot ngày đó biến mất
- [ ] Tạo ngoại lệ "Ghi đè" → Slot thay đổi theo giờ mới

---

## 🚀 Next Steps (Phase 3)

Phase 3 sẽ cleanup hệ thống cũ:

1. **Database Cleanup**
   - Xóa bảng `time_slots`, `work_schedules`, `doctor_schedules`
   - Xóa cột `time_slot_id`, `schedule_id` khỏi `appointments`

2. **Backend Cleanup**
   - Xóa code cũ trong `ScheduleService.kt`
   - Xóa DTOs cũ (`TimeSlotDTO`, `WorkScheduleDTO`)

3. **Frontend Cleanup**
   - Xóa API cũ (`getAvailableTimeSlots`, `createAppointment`)
   - Xóa trang `select-time` (đã merge vào `select-date`)
   - Rename V2 methods → remove "V2" suffix

---

## 📝 Notes

- **Lead time:** Slot < 2 giờ từ hiện tại bị ẩn (backend validation)
- **Booking window:** Chỉ đặt được trong vòng 30 ngày (backend validation)
- **Overlap check:** Backend kiểm tra overlap trước khi tạo appointment
- **Follow-up:** Chỉ bác sĩ được tạo, parent phải `status=completed`
- **Schedule changes:** Tất cả thay đổi cần admin duyệt

---

## ✅ Phase 2 Complete!

Tất cả tính năng Phase 2 đã được implement và sẵn sàng để test!
