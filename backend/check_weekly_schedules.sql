-- Check if the issue is from Weekly Schedules instead of Shifts

SELECT 'Weekly Work Schedules:' as info;
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
ORDER BY doctor_id, day_of_week, session;

-- Check if there are any invalid weekly schedules
SELECT 'Invalid weekly schedules (should be 0):' as info;
SELECT COUNT(*) as invalid_count
FROM weekly_work_schedules
WHERE is_active = true
AND NOT (
    (session = 'morning' AND start_time >= '08:00:00' AND end_time <= '12:00:00') OR
    (session = 'afternoon' AND start_time >= '13:30:00' AND end_time <= '17:30:00')
);

-- Show any invalid weekly schedules
SELECT 'Invalid weekly schedules details:' as info;
SELECT 
    id,
    doctor_id,
    day_of_week,
    session,
    start_time,
    end_time,
    'INVALID' as status
FROM weekly_work_schedules
WHERE is_active = true
AND NOT (
    (session = 'morning' AND start_time >= '08:00:00' AND end_time <= '12:00:00') OR
    (session = 'afternoon' AND start_time >= '13:30:00' AND end_time <= '17:30:00')
);