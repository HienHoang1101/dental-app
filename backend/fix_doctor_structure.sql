-- FIX DOCTOR STRUCTURE - Check table structure and insert correctly

-- Step 1: Check the actual structure of doctors table
SELECT 'Doctors table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'doctors' 
ORDER BY ordinal_position;

-- Step 2: Check existing doctors
SELECT 'Existing doctors:' as info;
SELECT * FROM doctors LIMIT 3;

-- Step 3: Insert doctor without updated_at column (since it doesn't exist)
INSERT INTO users (id, email, full_name, role, created_at)
SELECT 
    'a5f19446-1ac2-4b2f-9844-6b22787f8b0a',
    'doctor.test@example.com',
    'Bác sĩ Test',
    'doctor',
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE id = 'a5f19446-1ac2-4b2f-9844-6b22787f8b0a'
);

-- Step 4: Insert into doctors table (without updated_at)
INSERT INTO doctors (id, user_id, full_name, specialty, is_active, created_at)
SELECT 
    'a5f19446-1ac2-4b2f-9844-6b22787f8b0a',
    'a5f19446-1ac2-4b2f-9844-6b22787f8b0a',
    'Bác sĩ Test',
    'Nha khoa tổng quát',
    true,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM doctors WHERE id = 'a5f19446-1ac2-4b2f-9844-6b22787f8b0a'
);

-- Step 5: Verify doctor was created
SELECT 'Doctor created:' as info;
SELECT id, full_name, specialty, is_active FROM doctors 
WHERE id = 'a5f19446-1ac2-4b2f-9844-6b22787f8b0a';

-- Step 6: Clean up weekly schedules
DELETE FROM weekly_work_schedules;

-- Step 7: Create valid weekly schedules
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

-- Step 8: Final verification
SELECT 'Final weekly schedules:' as info;
SELECT 
    doctor_id,
    day_of_week,
    CASE day_of_week
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday' 
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
    END as day_name,
    session,
    start_time,
    end_time
FROM weekly_work_schedules 
WHERE doctor_id = 'a5f19446-1ac2-4b2f-9844-6b22787f8b0a'
ORDER BY day_of_week, session;

SELECT 'SUCCESS: Doctor and valid schedules created!' as result;