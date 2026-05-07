-- FIXED CLEANUP SCRIPT - Handle foreign key constraints properly
-- Run this in Supabase SQL Editor

-- Step 1: Show what will be affected
SELECT 'Appointments that will be cancelled:' as info;
SELECT 
    a.id,
    a.appointment_date,
    a.status,
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
)
AND a.status IN ('pending', 'confirmed');

-- Step 2: Cancel appointments using invalid time slots FIRST
UPDATE appointments 
SET 
    status = 'cancelled',
    cancellation_reason = 'System cleanup: Invalid time slot outside working hours (8:00-12:00, 13:30-17:30)',
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
)
AND status IN ('pending', 'confirmed');

-- Step 3: Now delete time slots (appointments are cancelled, so no FK constraint)
DELETE FROM time_slots 
WHERE work_schedule_id IN (
    SELECT ws.id FROM work_schedules ws
    JOIN shifts s ON ws.shift_id = s.id
    WHERE NOT (
        (s.start_time >= '08:00:00' AND s.end_time <= '12:00:00') OR
        (s.start_time >= '13:30:00' AND s.end_time <= '17:30:00')
    )
);

-- Step 4: Delete work schedules from invalid shifts
DELETE FROM work_schedules 
WHERE shift_id IN (
    SELECT id FROM shifts 
    WHERE NOT (
        (start_time >= '08:00:00' AND end_time <= '12:00:00') OR
        (start_time >= '13:30:00' AND end_time <= '17:30:00')
    )
);

-- Step 5: Delete invalid shifts
DELETE FROM shifts 
WHERE NOT (
    (start_time >= '08:00:00' AND end_time <= '12:00:00') OR
    (start_time >= '13:30:00' AND end_time <= '17:30:00')
);

-- Step 6: Create standard shifts if they don't exist
INSERT INTO shifts (name, start_time, end_time, created_at)
SELECT 'Morning', '08:00:00', '12:00:00', NOW()
WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE name = 'Morning' AND start_time = '08:00:00');

INSERT INTO shifts (name, start_time, end_time, created_at)
SELECT 'Afternoon', '13:30:00', '17:30:00', NOW()
WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE name = 'Afternoon' AND start_time = '13:30:00');

-- Step 7: Show final result
SELECT 'Final shifts (should only be Morning and Afternoon):' as info;
SELECT id, name, start_time, end_time, created_at FROM shifts ORDER BY start_time;

-- Step 8: Show cancelled appointments
SELECT 'Cancelled appointments:' as info;
SELECT 
    COUNT(*) as cancelled_count
FROM appointments 
WHERE status = 'cancelled' 
AND cancellation_reason LIKE '%System cleanup%';

-- Step 9: Verify no invalid data remains
SELECT 'Verification - Should return 0:' as info;
SELECT COUNT(*) as invalid_shifts_remaining
FROM shifts 
WHERE NOT (
    (start_time >= '08:00:00' AND end_time <= '12:00:00') OR
    (start_time >= '13:30:00' AND end_time <= '17:30:00')
);