-- Simple cleanup script - run this directly in your database
-- This will remove all invalid shifts and related data

-- Step 1: Show current invalid shifts
SELECT 'Current invalid shifts:' as info;
SELECT id, name, start_time, end_time FROM shifts 
WHERE NOT (
    (start_time >= '08:00:00' AND end_time <= '12:00:00') OR
    (start_time >= '13:30:00' AND end_time <= '17:30:00')
);

-- Step 2: Delete time slots from invalid shifts
DELETE FROM time_slots 
WHERE work_schedule_id IN (
    SELECT ws.id FROM work_schedules ws
    JOIN shifts s ON ws.shift_id = s.id
    WHERE NOT (
        (s.start_time >= '08:00:00' AND s.end_time <= '12:00:00') OR
        (s.start_time >= '13:30:00' AND s.end_time <= '17:30:00')
    )
);

-- Step 3: Delete work schedules from invalid shifts
DELETE FROM work_schedules 
WHERE shift_id IN (
    SELECT id FROM shifts 
    WHERE NOT (
        (start_time >= '08:00:00' AND end_time <= '12:00:00') OR
        (start_time >= '13:30:00' AND end_time <= '17:30:00')
    )
);

-- Step 4: Delete invalid shifts
DELETE FROM shifts 
WHERE NOT (
    (start_time >= '08:00:00' AND end_time <= '12:00:00') OR
    (start_time >= '13:30:00' AND end_time <= '17:30:00')
);

-- Step 5: Create standard shifts
INSERT INTO shifts (name, start_time, end_time, created_at)
SELECT 'Morning', '08:00:00', '12:00:00', NOW()
WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE name = 'Morning');

INSERT INTO shifts (name, start_time, end_time, created_at)
SELECT 'Afternoon', '13:30:00', '17:30:00', NOW()
WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE name = 'Afternoon');

-- Step 6: Show final result
SELECT 'Final shifts:' as info;
SELECT id, name, start_time, end_time FROM shifts ORDER BY start_time;