-- STEP BY STEP FIX - Run each command separately

-- Command 1: Find existing doctors
SELECT id, full_name, specialty FROM doctors WHERE is_active = true;

-- Command 2: Clean up all weekly schedules
-- DELETE FROM weekly_work_schedules;

-- Command 3: Replace 'DOCTOR_ID_HERE' with actual doctor ID from Command 1
-- Then run these INSERT commands:

/*
INSERT INTO weekly_work_schedules (doctor_id, day_of_week, session, start_time, end_time, is_active, created_at, updated_at)
VALUES 
('DOCTOR_ID_HERE', 1, 'morning', '08:00:00', '12:00:00', true, NOW(), NOW()),
('DOCTOR_ID_HERE', 1, 'afternoon', '13:30:00', '17:30:00', true, NOW(), NOW()),
('DOCTOR_ID_HERE', 2, 'morning', '08:00:00', '12:00:00', true, NOW(), NOW()),
('DOCTOR_ID_HERE', 2, 'afternoon', '13:30:00', '17:30:00', true, NOW(), NOW()),
('DOCTOR_ID_HERE', 3, 'morning', '08:00:00', '12:00:00', true, NOW(), NOW()),
('DOCTOR_ID_HERE', 3, 'afternoon', '13:30:00', '17:30:00', true, NOW(), NOW()),
('DOCTOR_ID_HERE', 4, 'morning', '08:00:00', '12:00:00', true, NOW(), NOW()),
('DOCTOR_ID_HERE', 4, 'afternoon', '13:30:00', '17:30:00', true, NOW(), NOW()),
('DOCTOR_ID_HERE', 5, 'morning', '08:00:00', '12:00:00', true, NOW(), NOW()),
('DOCTOR_ID_HERE', 5, 'afternoon', '13:30:00', '17:30:00', true, NOW(), NOW());
*/

-- Command 4: Verify result
-- SELECT * FROM weekly_work_schedules ORDER BY doctor_id, day_of_week, session;