-- CLEAN SLATE - Delete all old appointments and start fresh
-- This is the simplest approach for testing/development

-- Step 1: Show what will be deleted
SELECT 'Total appointments to be deleted:' as info, COUNT(*) as count FROM appointments;

SELECT 'Appointments by status:' as info;
SELECT status, COUNT(*) as count FROM appointments GROUP BY status;

SELECT 'Appointments by date range:' as info;
SELECT 
    CASE 
        WHEN appointment_date < CURRENT_DATE THEN 'Past appointments'
        WHEN appointment_date = CURRENT_DATE THEN 'Today appointments'
        ELSE 'Future appointments'
    END as date_category,
    COUNT(*) as count
FROM appointments 
GROUP BY 
    CASE 
        WHEN appointment_date < CURRENT_DATE THEN 'Past appointments'
        WHEN appointment_date = CURRENT_DATE THEN 'Today appointments'
        ELSE 'Future appointments'
    END;

-- Step 2: DELETE ALL APPOINTMENTS (clean slate)
DELETE FROM appointments;

-- Step 3: Now delete all time slots (no foreign key constraints)
DELETE FROM time_slots;

-- Step 4: Delete all work schedules
DELETE FROM work_schedules;

-- Step 5: Delete all shifts
DELETE FROM shifts;

-- Step 6: Create only the standard shifts
INSERT INTO shifts (name, start_time, end_time, created_at) VALUES
('Morning', '08:00:00', '12:00:00', NOW()),
('Afternoon', '13:30:00', '17:30:00', NOW());

-- Step 7: Show final clean state
SELECT 'Final shifts (only valid ones):' as info;
SELECT id, name, start_time, end_time FROM shifts ORDER BY start_time;

SELECT 'Remaining appointments (should be 0):' as info;
SELECT COUNT(*) as count FROM appointments;

SELECT 'Remaining time slots (should be 0):' as info;
SELECT COUNT(*) as count FROM time_slots;

SELECT 'Remaining work schedules (should be 0):' as info;
SELECT COUNT(*) as count FROM work_schedules;

SELECT 'SUCCESS: Database cleaned! Only valid shifts remain.' as result;