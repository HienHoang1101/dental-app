-- CLEANUP WEEKLY SCHEDULES - Remove invalid weekly work schedules

-- Step 1: Show current weekly schedules
SELECT 'Current weekly schedules:' as info;
SELECT 
    id,
    doctor_id,
    day_of_week,
    session,
    start_time,
    end_time,
    is_active
FROM weekly_work_schedules 
ORDER BY doctor_id, day_of_week, session;

-- Step 2: Show invalid weekly schedules
SELECT 'Invalid weekly schedules to be deleted:' as info;
SELECT 
    id,
    doctor_id,
    day_of_week,
    session,
    start_time,
    end_time,
    'INVALID' as status
FROM weekly_work_schedules
WHERE is_active = true
AND NOT (
    (session = 'morning' AND start_time >= '08:00:00' AND end_time <= '12:00:00') OR
    (session = 'afternoon' AND start_time >= '13:30:00' AND end_time <= '17:30:00')
);

-- Step 3: Delete invalid weekly schedules
DELETE FROM weekly_work_schedules
WHERE is_active = true
AND NOT (
    (session = 'morning' AND start_time >= '08:00:00' AND end_time <= '12:00:00') OR
    (session = 'afternoon' AND start_time >= '13:30:00' AND end_time <= '17:30:00')
);

-- Step 4: Create standard weekly schedules for all doctors (if needed)
-- This creates morning and afternoon schedules for Monday to Friday for all active doctors

-- Get all active doctors
SELECT 'Active doctors:' as info;
SELECT id, full_name FROM doctors WHERE is_active = true;

-- You can manually insert standard schedules for specific doctors like this:
-- INSERT INTO weekly_work_schedules (doctor_id, day_of_week, session, start_time, end_time, is_active, created_at, updated_at)
-- VALUES 
-- ('a5f19446-1ac2-4b2f-9844-6b22787f8b0a', 1, 'morning', '08:00:00', '12:00:00', true, NOW(), NOW()),
-- ('a5f19446-1ac2-4b2f-9844-6b22787f8b0a', 1, 'afternoon', '13:30:00', '17:30:00', true, NOW(), NOW());

-- Step 5: Show final result
SELECT 'Final weekly schedules (should only be valid ones):' as info;
SELECT 
    id,
    doctor_id,
    day_of_week,
    session,
    start_time,
    end_time,
    is_active
FROM weekly_work_schedules 
WHERE is_active = true
ORDER BY doctor_id, day_of_week, session;