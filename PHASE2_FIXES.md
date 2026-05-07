# Phase 2 - Fixes & Improvements

## 🐛 Fix 1: Lỗi 404 khi doctor đăng ký lịch

### Vấn đề:

```
POST http://localhost:8080/api/doctor/schedule-change-requests 404 (Not Found)
```

### Nguyên nhân:

Backend Phase 1 thiếu endpoint POST để doctor tạo schedule change request.

### Giải pháp:

✅ Thêm endpoint vào `backend/src/main/kotlin/com/nhom2/schedulechange/ScheduleChangeRoutes.kt`:

```kotlin
/**
 * POST /api/doctor/schedule-change-requests
 * Create a new schedule change request
 */
post("/api/doctor/schedule-change-requests") {
    // ... implementation
}
```

**Vị trí:** Đặt TRƯỚC endpoint GET để đúng thứ tự routing

---

## ✨ Improvement 1: UI chọn nhiều buổi rồi submit 1 lần

### Yêu cầu:

Thay vì click từng ô → confirm → gửi request, cho phép:

1. Chọn nhiều ô (nhiều ngày, nhiều buổi)
2. Click nút "Gửi yêu cầu" 1 lần
3. Tạo nhiều request cùng lúc

### Thay đổi UI:

#### **Trước:**

```
Click ô → Modal xác nhận → Gửi 1 request
```

#### **Sau:**

```
Click nhiều ô → Hiển thị số ô đã chọn → Click "Gửi X yêu cầu" → Gửi tất cả
```

### Tính năng mới:

1. **Selection State**
   - Ô trắng: Chưa chọn → Click để chọn
   - Ô xanh dương: Đã chọn → Click lại để bỏ chọn
   - Ô xanh lá: Đã đăng ký → Không thể chọn
   - Ô vàng: Chờ duyệt → Không thể chọn

2. **Selection Info Banner**
   - Hiển thị khi có ô được chọn
   - Liệt kê tất cả ô đã chọn
   - Ví dụ: "Đã chọn 3 buổi: Thứ 2 - Sáng, Thứ 3 - Chiều, Thứ 5 - Sáng"

3. **Action Buttons**
   - Nút "Hủy chọn" - Xóa tất cả selection
   - Nút "Gửi X yêu cầu" - Submit tất cả cùng lúc
   - Hiển thị "Đang gửi..." khi submitting

4. **Batch Submit**
   - Tạo nhiều request song song với `Promise.all()`
   - Hiển thị thông báo: "Đã gửi 3 yêu cầu đăng ký lịch thành công!"
   - Tự động clear selection sau khi thành công

### Code Changes:

**State Management:**

```typescript
const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
const [submitting, setSubmitting] = useState(false);
```

**Toggle Selection:**

```typescript
const handleToggleSlot = (dayOfWeek, session) => {
  // Don't allow if already scheduled or pending
  if (hasSchedule(...) || hasPendingRequest(...)) return;

  // Toggle selection
  setSelectedSlots(prev => {
    const exists = prev.some(...);
    return exists ? prev.filter(...) : [...prev, { dayOfWeek, session }];
  });
};
```

**Batch Submit:**

```typescript
const handleSubmitRequests = async () => {
  const promises = selectedSlots.map(slot =>
    doctorApi.requestScheduleChange({
      requestType: "add",
      newScheduleData: { ... }
    })
  );

  await Promise.all(promises);
  alert(`Đã gửi ${selectedSlots.length} yêu cầu thành công!`);
};
```

---

## 📋 Testing Checklist

### Backend Fix:

- [ ] Restart backend: `cd backend && ./gradlew run`
- [ ] Test endpoint: `POST /api/doctor/schedule-change-requests`
- [ ] Verify request created in database

### Frontend Improvement:

- [ ] Login as doctor
- [ ] Go to `/doctor/schedule`
- [ ] Click multiple empty slots (should turn blue)
- [ ] See selection info banner
- [ ] Click "Gửi X yêu cầu"
- [ ] Verify all requests created
- [ ] Check slots show "Chờ duyệt"

### Admin Approval:

- [ ] Login as admin
- [ ] Go to `/admin/schedule-changes`
- [ ] See all pending requests
- [ ] Approve all
- [ ] Doctor schedule page shows green checkmarks

---

## 🎨 UI Comparison

### Old UI:

```
┌────────────────────────────────────────┐
│  Lịch làm việc theo tuần               │
├────────┬───────┬───────┬───────┬───────┤
│ Sáng   │   ✓   │   +   │   ✓   │   +   │
│        │       │ Click │       │ Click │
│        │       │   ↓   │       │   ↓   │
│        │       │ Modal │       │ Modal │
└────────┴───────┴───────┴───────┴───────┘
```

### New UI:

```
┌────────────────────────────────────────────────────┐
│  Lịch làm việc theo tuần    [Hủy] [Gửi 3 yêu cầu] │
├────────────────────────────────────────────────────┤
│  ℹ️ Đã chọn 3 buổi: Thứ 2-Sáng, Thứ 3-Chiều, ... │
├────────┬───────┬───────┬───────┬───────┬──────────┤
│ Sáng   │   ✓   │   ☑   │   ✓   │   ☑   │    ☑     │
│        │ Green │ Blue  │ Green │ Blue  │  Blue    │
└────────┴───────┴───────┴───────┴───────┴──────────┘
                    Click "Gửi 3 yêu cầu"
                            ↓
                    3 requests created!
```

---

## 🚀 Benefits

1. **Faster workflow** - Chọn nhiều ô 1 lúc thay vì từng ô
2. **Better UX** - Thấy rõ những gì đã chọn trước khi submit
3. **Fewer clicks** - Không cần confirm từng ô
4. **Batch operation** - Tạo nhiều request cùng lúc
5. **Clear feedback** - Hiển thị số lượng request đã gửi

---

## 📝 Notes

- Selection chỉ áp dụng cho ô trống (chưa đăng ký, chưa pending)
- Ô đã đăng ký (xanh lá) và ô chờ duyệt (vàng) không thể chọn
- Click vào ô đã chọn (xanh dương) để bỏ chọn
- Nút "Hủy chọn" xóa tất cả selection
- Sau khi submit thành công, selection tự động clear

---

## ✅ Status

- [x] Backend: Thêm POST endpoint
- [x] Frontend: Implement multi-selection UI
- [x] Frontend: Batch submit logic
- [x] Documentation: Update guides

**Ready to test!** 🎉
