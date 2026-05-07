-- VERIFY CLEANUP - Check if database is actually clean

SELECT 'Current shifts in database:' as info;
SELECT id, name, start_time, end_time, created_at FROM shifts ORDER BY start_time;

SELECT 'Total appointments:' as info;
SELECT COUNT(*) as count FROM appointments;

SELECT 'Total time slots:' as info;
SELECT COUNT(*) as count FROM time_slots;

SELECT 'Total work schedules:' as info;
SELECT COUNT(*) as count FROM work_schedules;

-- Check if there are any invalid shifts remaining
SELECT 'Invalid shifts (should be 0):' as info;
SELECT COUNT(*) as invalid_count
FROM shifts 
WHERE NOT (
    (start_time >= '08:00:00' AND end_time <= '12:00:00') OR
    (start_time >= '13:30:00' AND end_time <= '17:30:00')
);

-- Check weekly schedules (new system)
SELECT 'Weekly schedules:' as info;
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