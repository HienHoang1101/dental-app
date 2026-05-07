-- FIND REAL DOCTOR - Get actual doctor IDs from database

-- Step 1: Find all existing doctors
SELECT 'All existing doctors:' as info;
SELECT 
    d.id as doctor_id,
    d.full_name,
    d.specialty,
    d.is_active,
    u.email
FROM doctors d
LEFT JOIN users u ON d.user_id = u.id
ORDER BY d.full_name;

-- Step 2: Find users with doctor role (might not have doctor profile yet)
SELECT 'Users with doctor role:' as info;
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    u.role,
    CASE WHEN d.id IS NOT NULL THEN 'Has doctor profile' ELSE 'No doctor profile' END as doctor_status
FROM users u
LEFT JOIN doctors d ON u.id = d.user_id
WHERE u.role = 'doctor'
ORDER BY u.full_name;

-- Step 3: Show current weekly schedules and their doctor IDs
SELECT 'Current weekly schedules by doctor:' as info;
SELECT 
    ws.doctor_id,
    d.full_name,
    COUNT(*) as schedule_count
FROM weekly_work_schedules ws
LEFT JOIN doctors d ON ws.doctor_id = d.id
GROUP BY ws.doctor_id, d.full_name
ORDER BY d.full_name;

-- Step 4: Clean up weekly schedules for non-existent doctors
DELETE FROM weekly_work_schedules 
WHERE doctor_id NOT IN (SELECT id FROM doctors);

SELECT 'Cleaned up weekly schedules for non-existent doctors' as info;