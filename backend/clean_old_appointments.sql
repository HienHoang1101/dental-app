-- CLEAN OLD APPOINTMENTS - Keep future appointments, delete old ones

-- Step 1: Show what will be deleted
SELECT 'Old appointments to be deleted:' as info;
SELECT COUNT(*) as count 
FROM appointments 
WHERE appointment_date < CURRENT_DATE;

SELECT 'Future appointments to keep:' as info;
SELECT COUNT(*) as count 
FROM appointments 
WHERE appointment_date >= CURRENT_DATE;

-- Step 2: Delete old appointments (before today)
DELETE FROM appointments 
WHERE appointment_date < CURRENT_DATE;

-- Step 3: Delete appointments with invalid time slots (any date)
DELETE FROM appointments 
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

-- Step 4: Now delete invalid time slots
DELETE FROM time_slots 
WHERE work_schedule_id IN (
    SELECT ws.id FROM work_schedules ws
    JOIN shifts s ON ws.shift_id = s.id
    WHERE NOT (
        (s.start_time >= '08:00:00' AND s.end_time <= '12:00:00') OR
        (s.start_time >= '13:30:00' AND s.end_time <= '17:30:00')
    )
);

-- Step 5: Delete invalid work schedules
DELETE FROM work_schedules 
WHERE shift_id IN (
    SELECT id FROM shifts 
    WHERE NOT (
        (start_time >= '08:00:00' AND end_time <= '12:00:00') OR
        (start_time >= '13:30:00' AND end_time <= '17:30:00')
    )
);

-- Step 6: Delete invalid shifts
DELETE FROM shifts 
WHERE NOT (
    (start_time >= '08:00:00' AND end_time <= '12:00:00') OR
    (start_time >= '13:30:00' AND end_time <= '17:30:00')
);

-- Step 7: Create standard shifts if they don't exist
INSERT INTO shifts (name, start_time, end_time, created_at)
SELECT 'Morning', '08:00:00', '12:00:00', NOW()
WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE name = 'Morning' AND start_time = '08:00:00');

INSERT INTO shifts (name, start_time, end_time, created_at)
SELECT 'Afternoon', '13:30:00', '17:30:00', NOW()
WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE name = 'Afternoon' AND start_time = '13:30:00');

-- Step 8: Show results
SELECT 'Final shifts:' as info;
SELECT id, name, start_time, end_time FROM shifts ORDER BY start_time;

SELECT 'Remaining appointments:' as info;
SELECT COUNT(*) as count FROM appointments;

SELECT 'Future appointments by status:' as info;
SELECT status, COUNT(*) as count 
FROM appointments 
WHERE appointment_date >= CURRENT_DATE
GROUP BY status;