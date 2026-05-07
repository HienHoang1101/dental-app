-- Check current shifts in the database
SELECT 
    id,
    name,
    start_time,
    end_time,
    CASE 
        WHEN start_time >= '08:00:00' AND end_time <= '12:00:00' THEN 'Valid Morning'
        WHEN start_time >= '13:30:00' AND end_time <= '17:30:00' THEN 'Valid Afternoon'
        ELSE 'INVALID - Outside working hours'
    END as validity_status,
    created_at
FROM shifts
ORDER BY start_time;

-- Check work schedules using invalid shifts
SELECT 
    ws.id as work_schedule_id,
    ws.date,
    s.name as shift_name,
    s.start_time,
    s.end_time,
    d.full_name as doctor_name
FROM work_schedules ws
JOIN shifts s ON ws.shift_id = s.id
JOIN doctors doc ON ws.doctor_id = doc.id
JOIN users d ON doc.user_id = d.id
WHERE NOT (
    (s.start_time >= '08:00:00' AND s.end_time <= '12:00:00') OR
    (s.start_time >= '13:30:00' AND s.end_time <= '17:30:00')
)
ORDER BY ws.date DESC;

-- Check time slots from invalid shifts
SELECT 
    ts.id as time_slot_id,
    ts.start_time,
    ts.end_time,
    ws.date,
    s.name as shift_name,
    COUNT(a.id) as appointment_count
FROM time_slots ts
JOIN work_schedules ws ON ts.work_schedule_id = ws.id
JOIN shifts s ON ws.shift_id = s.id
LEFT JOIN appointments a ON ts.id = a.time_slot_id AND a.status IN ('pending', 'confirmed')
WHERE NOT (
    (s.start_time >= '08:00:00' AND s.end_time <= '12:00:00') OR
    (s.start_time >= '13:30:00' AND s.end_time <= '17:30:00')
)
GROUP BY ts.id, ts.start_time, ts.end_time, ws.date, s.name
ORDER BY ws.date DESC, ts.start_time;