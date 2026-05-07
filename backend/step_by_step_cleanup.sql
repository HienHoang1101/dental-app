-- STEP BY STEP CLEANUP - Run each section separately

-- ===== STEP 1: CHECK WHAT WILL BE AFFECTED =====
-- Run this first to see what appointments will be cancelled
SELECT 
    'Appointments to be cancelled:' as info,
    COUNT(*) as count
FROM appointments a
JOIN time_slots ts ON a.time_slot_id = ts.id
JOIN work_schedules ws ON ts.work_schedule_id = ws.id
JOIN shifts s ON ws.shift_id = s.id
WHERE NOT (
    (s.start_time >= '08:00:00' AND s.end_time <= '12:00:00') OR
    (s.start_time >= '13:30:00' AND s.end_time <= '17:30:00')
)
AND a.status IN ('pending', 'confirmed');

-- ===== STEP 2: CANCEL APPOINTMENTS =====
-- Run this after reviewing step 1
/*
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
)
AND status IN ('pending', 'confirmed');
*/

-- ===== STEP 3: DELETE TIME SLOTS =====
-- Run this after step 2
/*
DELETE FROM time_slots 
WHERE work_schedule_id IN (
    SELECT ws.id FROM work_schedules ws
    JOIN shifts s ON ws.shift_id = s.id
    WHERE NOT (
        (s.start_time >= '08:00:00' AND s.end_time <= '12:00:00') OR
        (s.start_time >= '13:30:00' AND s.end_time <= '17:30:00')
    )
);
*/

-- ===== STEP 4: DELETE WORK SCHEDULES =====
-- Run this after step 3
/*
DELETE FROM work_schedules 
WHERE shift_id IN (
    SELECT id FROM shifts 
    WHERE NOT (
        (start_time >= '08:00:00' AND end_time <= '12:00:00') OR
        (start_time >= '13:30:00' AND end_time <= '17:30:00')
    )
);
*/

-- ===== STEP 5: DELETE INVALID SHIFTS =====
-- Run this after step 4
/*
DELETE FROM shifts 
WHERE NOT (
    (start_time >= '08:00:00' AND end_time <= '12:00:00') OR
    (start_time >= '13:30:00' AND end_time <= '17:30:00')
);
*/

-- ===== STEP 6: CREATE STANDARD SHIFTS =====
-- Run this last
/*
INSERT INTO shifts (name, start_time, end_time, created_at)
SELECT 'Morning', '08:00:00', '12:00:00', NOW()
WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE name = 'Morning');

INSERT INTO shifts (name, start_time, end_time, created_at)
SELECT 'Afternoon', '13:30:00', '17:30:00', NOW()
WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE name = 'Afternoon');
*/