-- CHECK AND FIX DOCTORS - Find existing doctors or create test doctors

-- Step 1: Check existing doctors
SELECT 'Existing doctors:' as info;
SELECT id, full_name, specialty, is_active FROM doctors ORDER BY full_name;

-- Step 2: Check existing users (doctors might be in users table)
SELECT 'Users with doctor role:' as info;
SELECT id, email, full_name, role FROM users WHERE role = 'doctor';

-- Step 3: Check if the specific doctor exists in any table
SELECT 'Checking specific doctor ID:' as info;
SELECT 'doctors table' as table_name, COUNT(*) as count 
FROM doctors WHERE id = 'a5f19446-1ac2-4b2f-9844-6b22787f8b0a'
UNION ALL
SELECT 'users table' as table_name, COUNT(*) as count 
FROM users WHERE id = 'a5f19446-1ac2-4b2f-9844-6b22787f8b0a';

-- Step 4: If no doctors exist, create a test doctor
-- First create a user account
INSERT INTO users (id, email, full_name, role, created_at, updated_at)
SELECT 
    'a5f19446-1ac2-4b2f-9844-6b22787f8b0a',
    'doctor.test@example.com',
    'Bác sĩ Test',
    'doctor',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE id = 'a5f19446-1ac2-4b2f-9844-6b22787f8b0a'
);

-- Then create the doctor profile
INSERT INTO doctors (id, user_id, full_name, specialty, is_active, created_at, updated_at)
SELECT 
    'a5f19446-1ac2-4b2f-9844-6b22787f8b0a',
    'a5f19446-1ac2-4b2f-9844-6b22787f8b0a',
    'Bác sĩ Test',
    'Nha khoa tổng quát',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM doctors WHERE id = 'a5f19446-1ac2-4b2f-9844-6b22787f8b0a'
);

-- Step 5: Verify doctor was created
SELECT 'Doctor created successfully:' as info;
SELECT 
    d.id,
    d.full_name,
    d.specialty,
    d.is_active,
    u.email
FROM doctors d
JOIN users u ON d.user_id = u.id
WHERE d.id = 'a5f19446-1ac2-4b2f-9844-6b22787f8b0a';

-- Step 6: Now create weekly schedules for this doctor
DELETE FROM weekly_work_schedules WHERE doctor_id = 'a5f19446-1ac2-4b2f-9844-6b22787f8b0a';

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

-- Step 7: Final verification
SELECT 'Final weekly schedules:' as info;
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
    END as day_name,
    session,
    start_time,
    end_time
FROM weekly_work_schedules 
WHERE doctor_id = 'a5f19446-1ac2-4b2f-9844-6b22787f8b0a'
ORDER BY day_of_week, session;

SELECT 'SUCCESS: Doctor and schedules created!' as result;