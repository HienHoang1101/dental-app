-- Script to clean up invalid shifts (evening/night shifts)
-- Only keep morning (08:00-12:00) and afternoon (13:30-17:30) shifts

-- First, let's see what shifts exist
SELECT 
    id,
    name,
    start_time,
    end_time,
    CASE 
        WHEN start_time >= '08:00:00' AND end_time <= '12:00:00' THEN 'Valid Morning'
        WHEN start_time >= '13:30:00' AND end_time <= '17:30:00' THEN 'Valid Afternoon'
        ELSE 'INVALID - Outside working hours'
    END as validity_status
FROM shifts
ORDER BY start_time;

-- Check if any invalid shifts have work schedules
SELECT 
    s.id as shift_id,
    s.name,
    s.start_time,
    s.end_time,
    COUNT(ws.id) as work_schedule_count,
    COUNT(ts.id) as time_slot_count
FROM shifts s
LEFT JOIN work_schedules ws ON s.id = ws.shift_id
LEFT JOIN time_slots ts ON ws.id = ts.work_schedule_id
WHERE NOT (
    (s.start_time >= '08:00:00' AND s.end_time <= '12:00:00') OR
    (s.start_time >= '13:30:00' AND s.end_time <= '17:30:00')
)
GROUP BY s.id, s.name, s.start_time, s.end_time;

-- Check appointments using invalid time slots
SELECT 
    a.id as appointment_id,
    a.appointment_date,
    a.status,
    s.name as shift_name,
    s.start_time,
    s.end_time,
    u.full_name as patient_name
FROM appointments a
JOIN time_slots ts ON a.time_slot_id = ts.id
JOIN work_schedules ws ON ts.work_schedule_id = ws.id
JOIN shifts s ON ws.shift_id = s.id
JOIN users u ON a.patient_id = u.id
WHERE NOT (
    (s.start_time >= '08:00:00' AND s.end_time <= '12:00:00') OR
    (s.start_time >= '13:30:00' AND s.end_time <= '17:30:00')
)
ORDER BY a.appointment_date DESC;

-- CLEANUP STEPS (uncomment to execute):

-- Step 1: Cancel appointments with invalid time slots
/*
UPDATE appointments 
SET status = 'cancelled',
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

-- Step 2: Delete time slots for invalid shifts
/*
DELETE FROM time_slots 
WHERE work_schedule_id IN (
    SELECT ws.id 
    FROM work_schedules ws
    JOIN shifts s ON ws.shift_id = s.id
    WHERE NOT (
        (s.start_time >= '08:00:00' AND s.end_time <= '12:00:00') OR
        (s.start_time >= '13:30:00' AND s.end_time <= '17:30:00')
    )
);
*/

-- Step 3: Delete work schedules for invalid shifts
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

-- Step 4: Delete invalid shifts
/*
DELETE FROM shifts 
WHERE NOT (
    (start_time >= '08:00:00' AND end_time <= '12:00:00') OR
    (start_time >= '13:30:00' AND end_time <= '17:30:00')
);
*/

-- Step 5: Create standard shifts if they don't exist
/*
INSERT INTO shifts (name, start_time, end_time, created_at)
SELECT 'Morning', '08:00:00', '12:00:00', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM shifts 
    WHERE name = 'Morning' 
    AND start_time = '08:00:00' 
    AND end_time = '12:00:00'
);

INSERT INTO shifts (name, start_time, end_time, created_at)
SELECT 'Afternoon', '13:30:00', '17:30:00', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM shifts 
    WHERE name = 'Afternoon' 
    AND start_time = '13:30:00' 
    AND end_time = '17:30:00'
);
*/

-- Verify cleanup
SELECT 
    id,
    name,
    start_time,
    end_time,
    'Valid' as status
FROM shifts
ORDER BY start_time;