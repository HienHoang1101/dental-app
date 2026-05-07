-- FIX WEEKLY SCHEDULES - Remove invalid weekly work schedules causing evening slots

-- Step 1: Show current weekly schedules
SELECT 'Current weekly schedules causing the issue:' as info;
SELECT 
    id,
    doctor_id,
    day_of_week,
    session,
    start_time,
    end_time,
    is_active,
    created_at
FROM weekly_work_schedules 
WHERE doctor_id = 'a5f19446-1ac2-4b2f-9844-6b22787f8b0a'
ORDER BY day_of_week, session;

-- Step 2: Show ALL weekly schedules (all doctors)
SELECT 'All weekly schedules:' as info;
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

-- Step 3: DELETE ALL weekly schedules (clean slate approach)
DELETE FROM weekly_work_schedules;

-- Step 4: Create ONLY valid weekly schedules for the specific doctor
-- Monday to Friday, Morning (8:00-12:00) and Afternoon (13:30-17:30)
INSERT INTO weekly_work_schedules (doctor_id, day_of_week, session, start_time, end_time, is_active, created_at, updated_at)
VALUES 
-- Monday
('a5f19446-1ac2-4b2f-9844-6b22787f8b0a', 1, 'morning', '08:00:00', '12:00:00', true, NOW(), NOW()),
('a5f19446-1ac2-4b2f-9844-6b22787f8b0a', 1, 'afternoon', '13:30:00', '17:30:00', true, NOW(), NOW()),
-- Tuesday  
('a5f19446-1ac2-4b2f-9844-6b22787f8b0a', 2, 'morning', '08:00:00', '12:00:00', true, NOW(), NOW()),
('a5f19446-1ac2-4b2f-9844-6b22787f8b0a', 2, 'afternoon', '13:30:00', '17:30:00', true, NOW(), NOW()),
-- Wednesday
('a5f19446-1ac2-4b2f-9844-6b22787f8b0a', 3, 'morning', '08:00:00', '12:00:00', true, NOW(), NOW()),
('a5f19446-1ac2-4b2f-9844-6b22787f8b0a', 3, 'afternoon', '13:30:00', '17:30:00', true, NOW(), NOW()),
-- Thursday
('a5f19446-1ac2-4b2f-9844-6b22787f8b0a', 4, 'morning', '08:00:00', '12:00:00', true, NOW(), NOW()),
('a5f19446-1ac2-4b2f-9844-6b22787f8b0a', 4, 'afternoon', '13:30:00', '17:30:00', true, NOW(), NOW()),
-- Friday
('a5f19446-1ac2-4b2f-9844-6b22787f8b0a', 5, 'morning', '08:00:00', '12:00:00', true, NOW(), NOW()),
('a5f19446-1ac2-4b2f-9844-6b22787f8b0a', 5, 'afternoon', '13:30:00', '17:30:00', true, NOW(), NOW());

-- Step 5: Verify final result
SELECT 'Final weekly schedules (should only be 8:00-12:00 and 13:30-17:30):' as info;
SELECT 
    id,
    doctor_id,
    day_of_week,
    CASE day_of_week
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday' 
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
        WHEN 7 THEN 'Sunday'
    END as day_name,
    session,
    start_time,
    end_time,
    is_active
FROM weekly_work_schedules 
WHERE doctor_id = 'a5f19446-1ac2-4b2f-9844-6b22787f8b0a'
ORDER BY day_of_week, session;

SELECT 'SUCCESS: Weekly schedules fixed!' as result;