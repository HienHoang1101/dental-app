# Phase 1 Implementation - Schedule System Refactor

## Overview

Phase 1 refactors the appointment scheduling system from manual slot creation to a weekly schedule pattern with dynamic slot generation.

## Database Changes

### New Tables

#### 1. `weekly_work_schedules`

Stores fixed weekly work patterns for doctors.

- Each doctor can have multiple schedules (e.g., Monday morning, Tuesday afternoon)
- Session times are fixed: Morning (08:00-12:00), Afternoon (13:30-17:30)
- Generates 1-hour slots dynamically

#### 2. `schedule_exceptions`

Handles days off and schedule overrides.

- Type `off`: Doctor is unavailable (entire day or specific session)
- Type `override`: Custom hours for a specific date (e.g., 09:00-11:00 instead of 08:00-12:00)

#### 3. `schedule_change_requests`

Workflow for doctors to request schedule changes.

- Request types: `add`, `remove`, `modify`
- Status: `pending`, `approved`, `rejected`
- Admin approval required

### Modified Tables

#### `appointments`

Added columns:

- `start_time` (TIMESTAMPTZ): UTC timestamp for appointment start
- `end_time` (TIMESTAMPTZ): UTC timestamp for appointment end
- `parent_appointment_id` (UUID): Reference to original appointment for follow-ups
- `time_slot_id` made nullable for backward compatibility

## Migration Steps

### 1. Run the SQL Migration

```bash
# Connect to your database and run:
psql -U your_user -d your_database -f backend/migrations/phase1_refactor_schedule_system.sql
```

### 2. Verify Tables Created

```sql
-- Check new tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('weekly_work_schedules', 'schedule_exceptions', 'schedule_change_requests');

-- Check appointments columns added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'appointments'
AND column_name IN ('start_time', 'end_time', 'parent_appointment_id');
```

### 3. Build and Run Backend

```bash
cd backend
./gradlew build
./gradlew run
```

## API Endpoints

### Weekly Schedules

#### Get Doctor's Weekly Schedule

```http
GET /api/doctors/{doctorId}/weekly-schedules
```

#### Get Available Slots

```http
GET /api/doctors/{doctorId}/available-slots?date=2026-05-10
```

Returns dynamically generated 1-hour slots based on:

- Weekly schedule
- Exceptions (days off, overrides)
- Holidays
- Existing appointments
- Lead time (2 hours minimum)

#### Doctor: Request Schedule Change

```http
POST /api/doctor/weekly-schedules
Authorization: Bearer {token}
Content-Type: application/json

{
  "dayOfWeek": 1,
  "session": "morning",
  "startTime": "08:00",
  "endTime": "12:00"
}
```

### Schedule Exceptions

#### Doctor: Add Exception (Day Off)

```http
POST /api/doctor/schedule-exceptions
Authorization: Bearer {token}
Content-Type: application/json

{
  "exceptionDate": "2026-05-15",
  "exceptionType": "off",
  "session": "morning",
  "reason": "Personal appointment"
}
```

#### Doctor: Add Exception (Override Hours)

```http
POST /api/doctor/schedule-exceptions
Authorization: Bearer {token}
Content-Type: application/json

{
  "exceptionDate": "2026-05-20",
  "exceptionType": "override",
  "session": "morning",
  "overrideStartTime": "09:00",
  "overrideEndTime": "11:00",
  "reason": "Training session"
}
```

#### Doctor: Get Own Exceptions

```http
GET /api/doctor/schedule-exceptions?startDate=2026-05-01&endDate=2026-05-31
Authorization: Bearer {token}
```

#### Admin: Get Doctor's Exceptions

```http
GET /api/admin/doctors/{doctorId}/schedule-exceptions
Authorization: Bearer {token}
```

### Schedule Change Requests

#### Doctor: View Own Requests

```http
GET /api/doctor/schedule-change-requests?status=pending
Authorization: Bearer {token}
```

#### Admin: Get All Pending Requests

```http
GET /api/admin/schedule-change-requests/pending
Authorization: Bearer {token}
```

#### Admin: Approve Request

```http
POST /api/admin/schedule-change-requests/{requestId}/approve
Authorization: Bearer {token}
```

#### Admin: Reject Request

```http
POST /api/admin/schedule-change-requests/{requestId}/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "rejected",
  "rejectionReason": "Conflicts with clinic policy"
}
```

### Appointments V2 (Time-based Booking)

#### Patient: Create Appointment

```http
POST /api/appointments/v2
Authorization: Bearer {token}
Content-Type: application/json

{
  "doctorId": "uuid",
  "startTime": "2026-05-10T08:00:00Z",
  "endTime": "2026-05-10T09:00:00Z",
  "serviceId": "uuid",
  "notes": "First visit"
}
```

#### Doctor: Create Follow-up

```http
POST /api/appointments/follow-up
Authorization: Bearer {token}
Content-Type: application/json

{
  "parentAppointmentId": "uuid",
  "startTime": "2026-05-17T08:00:00Z",
  "endTime": "2026-05-17T09:00:00Z",
  "notes": "Follow-up checkup"
}
```

## Business Rules

### Slot Generation Algorithm

1. Get weekly schedule for doctor and day of week
2. Check schedule exceptions (days off, overrides)
3. Check holidays
4. Generate 1-hour slots from start to end time
5. Remove slots overlapping with existing appointments
6. Remove slots < 2 hours from now (lead time)
7. Return available slots

### Validation Rules

- **Lead Time**: Appointments must be booked at least 2 hours in advance
- **Booking Window**: Appointments can only be booked up to 30 days in advance
- **Overlap Check**: No overlapping appointments for the same doctor
- **Follow-ups**:
  - Only doctors can create follow-ups
  - Parent appointment must be completed
  - Must be within 30 days of parent appointment
  - Auto-confirmed (no patient approval needed)

### Schedule Change Workflow

1. Doctor submits change request (add/modify/remove schedule)
2. Request status = `pending`
3. Admin reviews request
4. If approved: Changes applied to `weekly_work_schedules`
5. If rejected: Doctor notified with reason

## Testing

### Manual Testing Checklist

#### 1. Weekly Schedule Management

- [ ] Doctor requests to add Monday morning schedule
- [ ] Admin approves request
- [ ] Schedule appears in doctor's weekly schedules
- [ ] Doctor requests to modify schedule
- [ ] Admin rejects with reason
- [ ] Doctor sees rejection reason

#### 2. Available Slots

- [ ] Get available slots for doctor with weekly schedule
- [ ] Verify 1-hour slots generated (08:00-09:00, 09:00-10:00, etc.)
- [ ] Add day off exception → slots disappear
- [ ] Add override exception → slots reflect new hours
- [ ] Book appointment → slot disappears from available list

#### 3. Appointments V2

- [ ] Patient books appointment using available slot
- [ ] Verify overlap check prevents double booking
- [ ] Verify lead time validation (< 2 hours rejected)
- [ ] Verify booking window validation (> 30 days rejected)
- [ ] Complete appointment
- [ ] Doctor creates follow-up
- [ ] Verify follow-up auto-confirmed

#### 4. Exceptions

- [ ] Doctor adds day off for entire day
- [ ] Doctor adds day off for morning only
- [ ] Doctor adds override with custom hours
- [ ] Admin adds exception for doctor
- [ ] Delete exception
- [ ] Verify slots update accordingly

### API Testing Script

```bash
# Set variables
export API_URL="http://localhost:8080/api"
export DOCTOR_TOKEN="your_doctor_jwt_token"
export PATIENT_TOKEN="your_patient_jwt_token"
export ADMIN_TOKEN="your_admin_jwt_token"
export DOCTOR_ID="doctor_uuid"

# 1. Get available slots
curl -X GET "$API_URL/doctors/$DOCTOR_ID/available-slots?date=2026-05-10"

# 2. Doctor requests schedule
curl -X POST "$API_URL/doctor/weekly-schedules" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dayOfWeek": 1,
    "session": "morning"
  }'

# 3. Admin approves request
curl -X POST "$API_URL/admin/schedule-change-requests/{requestId}/approve" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 4. Patient books appointment
curl -X POST "$API_URL/appointments/v2" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "'$DOCTOR_ID'",
    "startTime": "2026-05-10T08:00:00Z",
    "endTime": "2026-05-10T09:00:00Z",
    "serviceId": "service_uuid",
    "notes": "Test appointment"
  }'
```

## Backward Compatibility

### Old System Still Works

- Old `POST /api/appointments` endpoint still functional
- Uses `time_slot_id` from old system
- Dual-write: New appointments also populate `start_time`/`end_time` if possible

### Migration Path

Phase 1 maintains both systems:

- Old tables (`time_slots`, `work_schedules`) remain
- New tables added alongside
- Phase 2 will migrate frontend
- Phase 3 will remove old tables

## Known Limitations

### Phase 1 Scope

- ✅ Backend API complete
- ✅ Database schema updated
- ❌ Frontend not updated yet (Phase 2)
- ❌ Old tables not removed yet (Phase 3)
- ❌ Timezone handling simplified (UTC only)

### Future Enhancements (Post-Phase 1)

- Multi-timezone support
- Recurring exceptions (e.g., "every Monday")
- Bulk schedule operations
- Schedule templates
- Conflict resolution UI

## Troubleshooting

### Issue: Migration fails with "relation already exists"

**Solution**: Tables already created. Check if migration was run before.

```sql
SELECT * FROM weekly_work_schedules LIMIT 1;
```

### Issue: "time_slot_id cannot be null" error

**Solution**: Old appointment creation still requires time_slot_id. Use V2 endpoint instead:

```
POST /api/appointments/v2
```

### Issue: No available slots returned

**Check**:

1. Doctor has weekly schedule? `GET /api/doctors/{id}/weekly-schedules`
2. Date is not a holiday? Check `holidays` table
3. Date is not marked as exception? `GET /api/doctor/schedule-exceptions`
4. Slots not all booked? Check existing appointments

### Issue: "Selected time slot is not available"

**Causes**:

- Slot overlaps with existing appointment
- Slot is < 2 hours from now
- Slot is > 30 days from now
- Doctor has no schedule for that day/session

## Support

For issues or questions:

1. Check logs: `backend/logs/application.log`
2. Verify database state with SQL queries above
3. Test with curl commands provided
4. Review implementation plan: `implementation_plan.md`

## Next Steps

After Phase 1 is verified:

- **Phase 2**: Update frontend to use new APIs
- **Phase 3**: Remove old tables and cleanup code
