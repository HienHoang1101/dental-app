-- FORCE FIX - Handle the stubborn appointment

-- Step 1: Check the specific appointment that's causing trouble
SELECT 'Checking the problematic appointment:' as info;
SELECT 
    id,
    patient_id,
    time_slot_id,
    status,
    appointment_date,
    cancellation_reason,
    updated_at
FROM appointments 
WHERE time_slot_id = '94ce129f-37de-4460-a94c-bace3c8f2c84';

-- Step 2: Check if there are multiple appointments with the same time_slot_id
SELECT 'All appointments with this time slot:' as info;
SELECT 
    id,
    patient_id,
    status,
    appointment_date
FROM appointments 
WHERE time_slot_id = '94ce129f-37de-4460-a94c-bace3c8f2c84';

-- Step 3: FORCE DELETE the appointment (drastic measure)
-- This will completely remove the appointment record
DELETE FROM appointments 
WHERE time_slot_id = '94ce129f-37de-4460-a94c-bace3c8f2c84';

-- Step 4: Verify the appointment is gone
SELECT 'Verification - should be empty:' as info;
SELECT COUNT(*) as remaining_count
FROM appointments 
WHERE time_slot_id = '94ce129f-37de-4460-a94c-bace3c8f2c84';

-- Step 5: Now delete the time slot (should work)
DELETE FROM time_slots 
WHERE id = '94ce129f-37de-4460-a94c-bace3c8f2c84';

-- Step 6: Continue with full cleanup - delete all remaining invalid time slots
DELETE FROM time_slots 
WHERE work_schedule_id IN (
    SELECT ws.id FROM work_schedules ws
    JOIN shifts s ON ws.shift_id = s.id
    WHERE NOT (
        (s.start_time >= '08:00:00' AND s.end_time <= '12:00:00') OR
        (s.start_time >= '13:30:00' AND s.end_time <= '17:30:00')
    )
);

-- Step 7: Delete work schedules
DELETE FROM work_schedules 
WHERE shift_id IN (
    SELECT id FROM shifts 
    WHERE NOT (
        (start_time >= '08:00:00' AND end_time <= '12:00:00') OR
        (start_time >= '13:30:00' AND end_time <= '17:30:00')
    )
);

-- Step 8: Delete invalid shifts
DELETE FROM shifts 
WHERE NOT (
    (start_time >= '08:00:00' AND end_time <= '12:00:00') OR
    (start_time >= '13:30:00' AND end_time <= '17:30:00')
);

-- Step 9: Create standard shifts
INSERT INTO shifts (name, start_time, end_time, created_at)
SELECT 'Morning', '08:00:00', '12:00:00', NOW()
WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE name = 'Morning' AND start_time = '08:00:00');

INSERT INTO shifts (name, start_time, end_time, created_at)
SELECT 'Afternoon', '13:30:00', '17:30:00', NOW()
WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE name = 'Afternoon' AND start_time = '13:30:00');

-- Step 10: Final check
SELECT 'Final shifts:' as info;
SELECT id, name, start_time, end_time FROM shifts ORDER BY start_time;

SELECT 'Remaining invalid time slots (should be 0):' as info;
SELECT COUNT(*) as invalid_slots
FROM time_slots ts
JOIN work_schedules ws ON ts.work_schedule_id = ws.id
JOIN shifts s ON ws.shift_id = s.id
WHERE NOT (
    (s.start_time >= '08:00:00' AND s.end_time <= '12:00:00') OR
    (s.start_time >= '13:30:00' AND s.end_time <= '17:30:00')
);