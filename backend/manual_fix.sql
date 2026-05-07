-- MANUAL FIX - Run each command one by one

-- Command 1: Check doctors table structure
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'doctors';

-- Command 2: Check if doctor exists
SELECT id, full_name FROM doctors WHERE id = 'a5f19446-1ac2-4b2f-9844-6b22787f8b0a';

-- Command 3: If doctor doesn't exist, create user first
INSERT INTO users (id, email, full_name, role, created_at)
VALUES ('a5f19446-1ac2-4b2f-9844-6b22787f8b0a', 'doctor.test@example.com', 'Bác sĩ Test', 'doctor', NOW());

-- Command 4: Create doctor (adjust columns based on step 1 result)
-- If doctors table has updated_at:
-- INSERT INTO doctors (id, user_id, full_name, specialty, is_active, created_at, updated_at)
-- VALUES ('a5f19446-1ac2-4b2f-9844-6b22787f8b0a', 'a5f19446-1ac2-4b2f-9844-6b22787f8b0a', 'Bác sĩ Test', 'Nha khoa tổng quát', true, NOW(), NOW());

-- If doctors table doesn't have updated_at:
INSERT INTO doctors (id, user_id, full_name, specialty, is_active, created_at)
VALUES ('a5f19446-1ac2-4b2f-9844-6b22787f8b0a', 'a5f19446-1ac2-4b2f-9844-6b22787f8b0a', 'Bác sĩ Test', 'Nha khoa tổng quát', true, NOW());

-- Command 5: Clean weekly schedules
DELETE FROM weekly_work_schedules;

-- Command 6: Create valid weekly schedules (only 8:00-12:00 and 13:30-17:30)
INSERT INTO weekly_work_schedules (doctor_id, day_of_week, session, start_time, end_time, is_active, created_at, updated_at)
VALUES 
('a5f19446-1ac2-4b2f-9844-6b22787f8b0a', 1, 'morning', '08:00:00', '12:00:00', true, NOW(), NOW()),
('a5f19446-1ac2-4b2f-9844-6b22787f8b0a', 1, 'afternoon', '13:30:00', '17:30:00', true, NOW(), NOW()),
('a5f19446-1ac2-4b2f-9844-6b22787f8b0a', 2, 'morning', '08:00:00', '12:00:00', true, NOW(), NOW()),
('a5f19446-1ac2-4b2f-9844-6b22787f8b0a', 2, 'afternoon', '13:30:00', '17:30:00', true, NOW(), NOW()),
('a5f19446-1ac2-4b2f-9844-6b22787f8b0a', 3, 'morning', '08:00:00', '12:00:00', true, NOW(), NOW()),
('a5f19446-1ac2-4b2f-9844-6b22787f8b0a', 3, 'afternoon', '13:30:00', '17:30:00', true, NOW(), NOW()),
('a5f19446-1ac2-4b2f-9844-6b22787f8b0a', 4, 'morning', '08:00:00', '12:00:00', true, NOW(), NOW()),
('a5f19446-1ac2-4b2f-9844-6b22787f8b0a', 4, 'afternoon', '13:30:00', '17:30:00', true, NOW(), NOW()),
('a5f19446-1ac2-4b2f-9844-6b22787f8b0a', 5, 'morning', '08:00:00', '12:00:00', true, NOW(), NOW()),
('a5f19446-1ac2-4b2f-9844-6b22787f8b0a', 5, 'afternoon', '13:30:00', '17:30:00', true, NOW(), NOW());

-- Command 7: Verify result
SELECT * FROM weekly_work_schedules ORDER BY day_of_week, session;