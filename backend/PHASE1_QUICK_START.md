# Phase 1 Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Run Database Migration

```bash
# Navigate to backend directory
cd backend

# Run migration (adjust connection details)
psql -U postgres -d dental_app -f migrations/phase1_refactor_schedule_system.sql
```

### Step 2: Build & Run Backend

```bash
# Build
./gradlew build

# Run
./gradlew run
```

### Step 3: Test Basic Flow

#### 1. Doctor Requests Schedule

```bash
curl -X POST http://localhost:8080/api/doctor/weekly-schedules \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dayOfWeek": 1,
    "session": "morning"
  }'
```

#### 2. Admin Approves Request

```bash
# Get pending requests
curl -X GET http://localhost:8080/api/admin/schedule-change-requests/pending \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Approve (use ID from response)
curl -X POST http://localhost:8080/api/admin/schedule-change-requests/{REQUEST_ID}/approve \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### 3. Check Available Slots

```bash
curl -X GET "http://localhost:8080/api/doctors/{DOCTOR_ID}/available-slots?date=2026-05-10"
```

#### 4. Patient Books Appointment

```bash
curl -X POST http://localhost:8080/api/appointments/v2 \
  -H "Authorization: Bearer YOUR_PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "DOCTOR_UUID",
    "startTime": "2026-05-10T08:00:00Z",
    "endTime": "2026-05-10T09:00:00Z",
    "serviceId": "SERVICE_UUID",
    "notes": "First visit"
  }'
```

## 📋 Common Operations

### Add Day Off

```bash
curl -X POST http://localhost:8080/api/doctor/schedule-exceptions \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exceptionDate": "2026-05-15",
    "exceptionType": "off",
    "session": "morning",
    "reason": "Personal appointment"
  }'
```

### Override Schedule Hours

```bash
curl -X POST http://localhost:8080/api/doctor/schedule-exceptions \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exceptionDate": "2026-05-20",
    "exceptionType": "override",
    "session": "morning",
    "overrideStartTime": "09:00",
    "overrideEndTime": "11:00",
    "reason": "Training"
  }'
```

### Create Follow-up

```bash
curl -X POST http://localhost:8080/api/appointments/follow-up \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentAppointmentId": "PARENT_UUID",
    "startTime": "2026-05-17T08:00:00Z",
    "endTime": "2026-05-17T09:00:00Z",
    "notes": "Follow-up checkup"
  }'
```

## 🔍 Verification Queries

### Check Tables Created

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('weekly_work_schedules', 'schedule_exceptions', 'schedule_change_requests');
```

### View Doctor's Schedule

```sql
SELECT * FROM weekly_work_schedules WHERE doctor_id = 'YOUR_DOCTOR_UUID';
```

### View Exceptions

```sql
SELECT * FROM schedule_exceptions WHERE doctor_id = 'YOUR_DOCTOR_UUID';
```

### View Pending Requests

```sql
SELECT * FROM schedule_change_requests WHERE status = 'pending';
```

## 🎯 Key Endpoints Reference

| Method | Endpoint                                            | Auth    | Description         |
| ------ | --------------------------------------------------- | ------- | ------------------- |
| GET    | `/api/doctors/{id}/weekly-schedules`                | Public  | Get weekly schedule |
| GET    | `/api/doctors/{id}/available-slots?date=YYYY-MM-DD` | Public  | Get available slots |
| POST   | `/api/doctor/weekly-schedules`                      | Doctor  | Request schedule    |
| POST   | `/api/doctor/schedule-exceptions`                   | Doctor  | Add exception       |
| GET    | `/api/admin/schedule-change-requests/pending`       | Admin   | View pending        |
| POST   | `/api/admin/schedule-change-requests/{id}/approve`  | Admin   | Approve request     |
| POST   | `/api/appointments/v2`                              | Patient | Book appointment    |
| POST   | `/api/appointments/follow-up`                       | Doctor  | Create follow-up    |

## ⚙️ Configuration

### Default Session Times

- **Morning**: 08:00 - 12:00 (4 hours = 4 slots)
- **Afternoon**: 13:30 - 17:30 (4 hours = 4 slots)

### Slot Settings

- **Duration**: 1 hour
- **Lead Time**: 2 hours minimum
- **Booking Window**: 30 days maximum

### Day of Week Values

- 1 = Monday
- 2 = Tuesday
- 3 = Wednesday
- 4 = Thursday
- 5 = Friday
- 6 = Saturday
- 7 = Sunday

## 🐛 Troubleshooting

### No slots returned?

1. Check doctor has weekly schedule
2. Check date is not a holiday
3. Check no exception for that date
4. Check slots not all booked

### "Time slot not available" error?

- Slot overlaps with existing appointment
- Slot is < 2 hours from now
- Slot is > 30 days from now
- Doctor has no schedule for that day

### Migration fails?

- Check if tables already exist
- Verify database connection
- Check user permissions

## 📚 Full Documentation

- **Detailed Guide**: `migrations/PHASE1_README.md`
- **Implementation Summary**: `PHASE1_IMPLEMENTATION_SUMMARY.md`
- **Original Plan**: `../implementation_plan.md`

## 🎉 Success Indicators

You know Phase 1 is working when:

- ✅ All 3 new tables exist in database
- ✅ Doctor can request schedule changes
- ✅ Admin can approve/reject requests
- ✅ Available slots endpoint returns slots
- ✅ Patient can book using V2 endpoint
- ✅ Overlap prevention works
- ✅ Exceptions affect available slots
- ✅ Follow-ups can be created

## 🔜 Next: Phase 2

Once Phase 1 is verified, proceed to Phase 2:

- Update frontend to use new APIs
- Migrate patient booking flow
- Update doctor schedule management UI
- Add admin approval interface

---

**Need Help?** Check the troubleshooting section in `migrations/PHASE1_README.md`
