-- DEBUG AND FIX - Find and handle the specific appointment causing the issue

-- Step 1: Find the specific appointment causing the problem
SELECT 'Appointment causing the issue:' as info;
SELECT 
    a.id as appointment_id,
    a.appointment_date,
    a.status,
    a.time_slot_id,
    u.full_name as patient_name,
    ts.start_time,
    ts.end_time,
    s.name as shift_name,
    s.start_time as shift_start,
    s.end_time as shift_end
FROM appointments a
JOIN users u ON a.patient_id = u.id
JOIN time_slots ts ON a.time_slot_id = ts.id
JOIN work_schedules ws ON ts.work_schedule_id = ws.id
JOIN shifts s ON ws.shift_id = s.id
WHERE ts.id = '94ce129f-37de-4460-a94c-bace3c8f2c84';

-- Step 2: Check all appointments referencing invalid time slots
SELECT 'All appointments with invalid time slots:' as info;
SELECT 
    a.id as appointment_id,
    a.appointment_date,
    a.status,
    a.time_slot_id,
    u.full_name as patient_name,
    ts.start_time,
    ts.end_time,
    s.name as shift_name
FROM appointments a
JOIN users u ON a.patient_id = u.id
JOIN time_slots ts ON a.time_slot_id = ts.id
JOIN work_schedules ws ON ts.work_schedule_id = ws.id
JOIN shifts s ON ws.shift_id = s.id
WHERE NOT (
    (s.start_time >= '08:00:00' AND s.end_time <= '12:00:00') OR
    (s.start_time >= '13:30:00' AND s.end_time <= '17:30:00')
);

-- Step 3: Force cancel ALL appointments with invalid time slots (including completed ones)
UPDATE appointments 
SET 
    status = 'cancelled',
    cancellation_reason = 'System cleanup: Invalid time slot outside working hours',
    updated_at = NOW()
WHERE time_slot_id IN (
    SELECT ts.id 
    FROM time_slots ts
    JOIN work_schedules ws ON ts.work_schedule_id = ws.id
    JOIN shifts s ON ws.shift_id = s.id
    WHERE NOT (
        (s.start_time >= '08:00:00' AND s.end_time <= '12:00:00') OR
        (s.start_time >= '13:30:00' AND s.end_time <= '17:30:00')
    )
);
-- Note: This updates ALL appointments, not just pending/confirmed

-- Step 4: Verify no appointments reference invalid time slots
SELECT 'Verification - should be 0:' as info;
SELECT COUNT(*) as remaining_appointments
FROM appointments a
JOIN time_slots ts ON a.time_slot_id = ts.id
JOIN work_schedules ws ON ts.work_schedule_id = ws.id
JOIN shifts s ON ws.shift_id = s.id
WHERE NOT (
    (s.start_time >= '08:00:00' AND s.end_time <= '12:00:00') OR
    (s.start_time >= '13:30:00' AND s.end_time <= '17:30:00')
)
AND a.status != 'cancelled';

-- Step 5: Now delete time slots (should work now)
DELETE FROM time_slots 
WHERE work_schedule_id IN (
    SELECT ws.id FROM work_schedules ws
    JOIN shifts s ON ws.shift_id = s.id
    WHERE NOT (
        (s.start_time >= '08:00:00' AND s.end_time <= '12:00:00') OR
        (s.start_time >= '13:30:00' AND s.end_time <= '17:30:00')
    )
);

-- Step 6: Delete work schedules
DELETE FROM work_schedules 
WHERE shift_id IN (
    SELECT id FROM shifts 
    WHERE NOT (
        (start_time >= '08:00:00' AND end_time <= '12:00:00') OR
        (start_time >= '13:30:00' AND end_time <= '17:30:00')
    )
);

-- Step 7: Delete invalid shifts
DELETE FROM shifts 
WHERE NOT (
    (start_time >= '08:00:00' AND end_time <= '12:00:00') OR
    (start_time >= '13:30:00' AND end_time <= '17:30:00')
);

-- Step 8: Create standard shifts
INSERT INTO shifts (name, start_time, end_time, created_at)
SELECT 'Morning', '08:00:00', '12:00:00', NOW()
WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE name = 'Morning' AND start_time = '08:00:00');

INSERT INTO shifts (name, start_time, end_time, created_at)
SELECT 'Afternoon', '13:30:00', '17:30:00', NOW()
WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE name = 'Afternoon' AND start_time = '13:30:00');

-- Step 9: Final verification
SELECT 'Final result - only valid shifts:' as info;
SELECT id, name, start_time, end_time FROM shifts ORDER BY start_time;

SELECT 'Cancelled appointments count:' as info;
SELECT COUNT(*) as cancelled_count
FROM appointments 
WHERE status = 'cancelled' 
AND cancellation_reason LIKE '%System cleanup%';