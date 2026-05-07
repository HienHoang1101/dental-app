-- Test script to verify database setup for schedule change requests

-- 1. Check if tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('schedule_change_requests', 'weekly_work_schedules', 'doctors', 'users')
ORDER BY table_name;

-- 2. Check if the test doctor exists
SELECT 
    id,
    user_id,
    full_name,
    specialty,
    is_active,
    created_at
FROM doctors 
WHERE id = 'a5f19446-1ac2-4b2f-9844-6b22787f8b0a';

-- 3. Check if the user exists for the doctor
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.is_active
FROM users u
WHERE u.id = 'a5f19446-1ac2-4b2f-9844-6b22787f8b0a';

-- 4. Check existing schedule change requests
SELECT 
    id,
    doctor_id,
    request_type,
    status,
    created_at
FROM schedule_change_requests
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check existing weekly work schedules
SELECT 
    id,
    doctor_id,
    day_of_week,
    session,
    start_time,
    end_time,
    is_active
FROM weekly_work_schedules
WHERE doctor_id = 'a5f19446-1ac2-4b2f-9844-6b22787f8b0a'
ORDER BY day_of_week, session;

-- 6. Test inserting a sample schedule change request (this should work if everything is set up correctly)
INSERT INTO schedule_change_requests (
    doctor_id,
    request_type,
    new_schedule_data,
    status
) VALUES (
    'a5f19446-1ac2-4b2f-9844-6b22787f8b0a',
    'add',
    '{"dayOfWeek": 1, "session": "morning", "startTime": "08:00", "endTime": "12:00"}',
    'pending'
) RETURNING id, doctor_id, request_type, status, created_at;