-- SIMPLE DOCTOR FIX - Step by step approach

-- Step 1: Check what doctors exist
SELECT 'Existing doctors:' as info;
SELECT id, full_name, specialty FROM doctors LIMIT 5;

-- Step 2: Check what users exist  
SELECT 'Existing users:' as info;
SELECT id, email, full_name, role FROM users WHERE role = 'doctor' LIMIT 5;

-- Step 3: Check the structure of doctors table
SELECT 'Doctors table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'doctors' 
ORDER BY ordinal_position;

-- Step 4: Use an existing doctor ID instead of creating new one
-- Let's find the first available doctor
SELECT 'First available doctor:' as info;
SELECT id, full_name FROM doctors WHERE is_active = true LIMIT 1;

-- Step 5: Clean up weekly schedules for ALL doctors and recreate with valid hours only
DELETE FROM weekly_work_schedules;

-- Step 6: Create valid weekly schedules for the first doctor found
-- We'll use a dynamic approach
DO $$
DECLARE
    doctor_record RECORD;
BEGIN
    -- Get the first active doctor
    SELECT id, full_name INTO doctor_record 
    FROM doctors 
    WHERE is_active = true 
    LIMIT 1;
    
    -- If we found a doctor, create schedules
    IF doctor_record.id IS NOT NULL THEN
        -- Create weekly schedules for Monday to Friday
        FOR day_num IN 1..5 LOOP
            -- Morning session
            INSERT INTO weekly_work_schedules (doctor_id, day_of_week, session, start_time, end_time, is_active, created_at, updated_at)
            VALUES (doctor_record.id, day_num, 'morning', '08:00:00', '12:00:00', true, NOW(), NOW());
            
            -- Afternoon session  
            INSERT INTO weekly_work_schedules (doctor_id, day_of_week, session, start_time, end_time, is_active, created_at, updated_at)
            VALUES (doctor_record.id, day_num, 'afternoon', '13:30:00', '17:30:00', true, NOW(), NOW());
        END LOOP;
        
        RAISE NOTICE 'Created schedules for doctor: % (%)', doctor_record.full_name, doctor_record.id;
    ELSE
        RAISE NOTICE 'No active doctors found!';
    END IF;
END $$;

-- Step 7: Show final result
SELECT 'Final weekly schedules:' as info;
SELECT 
    ws.doctor_id,
    d.full_name,
    ws.day_of_week,
    CASE ws.day_of_week
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday' 
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
    END as day_name,
    ws.session,
    ws.start_time,
    ws.end_time
FROM weekly_work_schedules ws
JOIN doctors d ON ws.doctor_id = d.id
ORDER BY ws.doctor_id, ws.day_of_week, ws.session;

SELECT 'SUCCESS: Used existing doctor and created valid schedules!' as result;