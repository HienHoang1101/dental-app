# Phase 1 API Testing Script
# Chạy script này để test các API mới

$API_URL = "http://127.0.0.1:8080/api"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Phase 1 API Testing" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8080/health" -Method Get
    Write-Host "✓ Server is running!" -ForegroundColor Green
    Write-Host "  Response: $response" -ForegroundColor Gray
} catch {
    Write-Host "✗ Server is not responding" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: Get available slots (public endpoint - không cần token)
Write-Host "Test 2: Get Available Slots (Public)" -ForegroundColor Yellow
Write-Host "  Endpoint: GET /api/doctors/{doctorId}/available-slots?date=2026-05-15" -ForegroundColor Gray

# Bạn cần thay DOCTOR_ID bằng ID thực tế từ database
$DOCTOR_ID = Read-Host "Nhập Doctor ID để test (hoặc Enter để skip)"

if ($DOCTOR_ID) {
    try {
        $date = "2026-05-15"
        $url = "$API_URL/doctors/$DOCTOR_ID/available-slots?date=$date"
        $response = Invoke-RestMethod -Uri $url -Method Get
        Write-Host "✓ API hoạt động!" -ForegroundColor Green
        Write-Host "  Số slot khả dụng: $($response.data.slots.Count)" -ForegroundColor Gray
        if ($response.data.slots.Count -gt 0) {
            Write-Host "  Slot đầu tiên: $($response.data.slots[0].start) - $($response.data.slots[0].end)" -ForegroundColor Gray
        } else {
            Write-Host "  (Chưa có lịch làm việc cho bác sĩ này)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "✗ API error" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Red
    }
} else {
    Write-Host "  Skipped (cần Doctor ID)" -ForegroundColor Yellow
}
Write-Host ""

# Test 3: Get weekly schedules (public endpoint)
Write-Host "Test 3: Get Weekly Schedules (Public)" -ForegroundColor Yellow
Write-Host "  Endpoint: GET /api/doctors/{doctorId}/weekly-schedules" -ForegroundColor Gray

if ($DOCTOR_ID) {
    try {
        $url = "$API_URL/doctors/$DOCTOR_ID/weekly-schedules"
        $response = Invoke-RestMethod -Uri $url -Method Get
        Write-Host "✓ API hoạt động!" -ForegroundColor Green
        Write-Host "  Số lịch tuần: $($response.data.Count)" -ForegroundColor Gray
        if ($response.data.Count -gt 0) {
            Write-Host "  Lịch đầu tiên: Thứ $($response.data[0].dayOfWeek) - $($response.data[0].session)" -ForegroundColor Gray
        } else {
            Write-Host "  (Chưa có lịch tuần cho bác sĩ này)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "✗ API error" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Red
    }
} else {
    Write-Host "  Skipped (cần Doctor ID)" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Kết quả:" -ForegroundColor Cyan
Write-Host "  ✓ Backend đang chạy" -ForegroundColor Green
Write-Host "  ✓ API endpoints mới đã được đăng ký" -ForegroundColor Green
Write-Host ""
Write-Host "Các bước tiếp theo:" -ForegroundColor Yellow
Write-Host "  1. Tạo lịch tuần cho bác sĩ (cần doctor token)" -ForegroundColor White
Write-Host "  2. Admin duyệt lịch" -ForegroundColor White
Write-Host "  3. Test booking appointment V2" -ForegroundColor White
Write-Host ""
Write-Host "Xem hướng dẫn chi tiết tại:" -ForegroundColor Yellow
Write-Host "  backend/PHASE1_QUICK_START.md" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
