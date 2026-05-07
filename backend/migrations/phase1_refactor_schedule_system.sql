-- Phase 1: Refactor Schedule System
-- Migration for new weekly schedule system with dynamic slot generation

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. CREATE NEW TABLE: weekly_work_schedules
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS weekly_work_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Mon, 7=Sun
    session TEXT NOT NULL CHECK (session IN ('morning', 'afternoon')),
    start_time TIME NOT NULL,  -- Morning: 08:00, Afternoon: 13:30
    end_time TIME NOT NULL,    -- Morning: 12:00, Afternoon: 17:30
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (doctor_id, day_of_week, session),
    CHECK (start_time < end_time)
);

CREATE INDEX idx_weekly_schedules_doctor ON weekly_work_schedules(doctor_id) WHERE is_active = true;
CREATE INDEX idx_weekly_schedules_day ON weekly_work_schedules(day_of_week) WHERE is_active = true;

COMMENT ON TABLE weekly_work_schedules IS 'Fixed weekly work schedules for doctors';
COMMENT ON COLUMN weekly_work_schedules.day_of_week IS '1=Monday, 2=Tuesday, ..., 7=Sunday';
COMMENT ON COLUMN weekly_work_schedules.session IS 'morning (08:00-12:00) or afternoon (13:30-17:30)';

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. CREATE NEW TABLE: schedule_exceptions
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS schedule_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    exception_date DATE NOT NULL,
    exception_type TEXT NOT NULL CHECK (exception_type IN ('off', 'override')),
    session TEXT CHECK (session IN ('morning', 'afternoon')),  -- NULL = entire day
    override_start_time TIME,  -- Only used when type = 'override'
    override_end_time TIME,    -- Only used when type = 'override'
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (doctor_id, exception_date, session),
    CHECK (
        (exception_type = 'off') OR 
        (exception_type = 'override' AND override_start_time IS NOT NULL AND override_end_time IS NOT NULL)
    ),
    CHECK (override_start_time IS NULL OR override_start_time < override_end_time)
);

CREATE INDEX idx_exceptions_doctor_date ON schedule_exceptions(doctor_id, exception_date);
CREATE INDEX idx_exceptions_date ON schedule_exceptions(exception_date);

COMMENT ON TABLE schedule_exceptions IS 'Days off and schedule overrides for doctors';
COMMENT ON COLUMN schedule_exceptions.exception_type IS 'off = day off, override = custom hours for that day';
COMMENT ON COLUMN schedule_exceptions.session IS 'NULL = entire day, morning/afternoon = specific session';

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. CREATE NEW TABLE: schedule_change_requests
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS schedule_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL CHECK (request_type IN ('add', 'remove', 'modify')),
    old_schedule_data JSONB,  -- Old schedule (for modify/remove)
    new_schedule_data JSONB,  -- New schedule (for add/modify)
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (
        (request_type = 'add' AND new_schedule_data IS NOT NULL) OR
        (request_type = 'remove' AND old_schedule_data IS NOT NULL) OR
        (request_type = 'modify' AND old_schedule_data IS NOT NULL AND new_schedule_data IS NOT NULL)
    )
);

CREATE INDEX idx_change_requests_doctor ON schedule_change_requests(doctor_id);
CREATE INDEX idx_change_requests_status ON schedule_change_requests(status);
CREATE INDEX idx_change_requests_pending ON schedule_change_requests(doctor_id, status) WHERE status = 'pending';

COMMENT ON TABLE schedule_change_requests IS 'Workflow for doctors to request schedule changes';
COMMENT ON COLUMN schedule_change_requests.old_schedule_data IS 'JSON: {day_of_week, session, start_time, end_time}';
COMMENT ON COLUMN schedule_change_requests.new_schedule_data IS 'JSON: {day_of_week, session, start_time, end_time}';

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. MODIFY TABLE: appointments
-- ══════════════════════════════════════════════════════════════════════════════
-- Add new columns for time-based booking
ALTER TABLE appointments 
    ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS parent_appointment_id UUID REFERENCES appointments(id);

-- Create indexes for overlap checking and follow-up queries
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_time 
    ON appointments (doctor_id, start_time, end_time)
    WHERE status IN ('pending', 'confirmed');

CREATE INDEX IF NOT EXISTS idx_appointments_parent 
    ON appointments (parent_appointment_id)
    WHERE parent_appointment_id IS NOT NULL;

-- Add constraint to ensure start_time < end_time
ALTER TABLE appointments 
    ADD CONSTRAINT IF NOT EXISTS chk_appointments_time 
    CHECK (start_time IS NULL OR start_time < end_time);

COMMENT ON COLUMN appointments.start_time IS 'Appointment start time (UTC) - new booking system';
COMMENT ON COLUMN appointments.end_time IS 'Appointment end time (UTC) - new booking system';
COMMENT ON COLUMN appointments.parent_appointment_id IS 'Reference to original appointment for follow-ups';

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. HELPER FUNCTION: Check appointment overlap
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION check_appointment_overlap(
    p_doctor_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_exclude_appointment_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    overlap_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO overlap_count
    FROM appointments
    WHERE doctor_id = p_doctor_id
      AND status IN ('pending', 'confirmed')
      AND start_time < p_end_time
      AND end_time > p_start_time
      AND (p_exclude_appointment_id IS NULL OR id != p_exclude_appointment_id);
    
    RETURN overlap_count > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_appointment_overlap IS 'Check if appointment time overlaps with existing appointments';

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. TRIGGER: Update updated_at timestamp
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_weekly_work_schedules_updated_at
    BEFORE UPDATE ON weekly_work_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. SAMPLE DATA: Default session times
-- ══════════════════════════════════════════════════════════════════════════════
-- Note: This is just for reference. Actual schedules will be created via API

-- Morning session: 08:00 - 12:00 (4 hours = 4 slots of 1 hour each)
-- Afternoon session: 13:30 - 17:30 (4 hours = 4 slots of 1 hour each)

-- Example for a doctor (uncomment and replace doctor_id to use):
-- INSERT INTO weekly_work_schedules (doctor_id, day_of_week, session, start_time, end_time)
-- VALUES 
--     ('doctor-uuid-here', 1, 'morning', '08:00', '12:00'),    -- Monday morning
--     ('doctor-uuid-here', 1, 'afternoon', '13:30', '17:30'),  -- Monday afternoon
--     ('doctor-uuid-here', 2, 'morning', '08:00', '12:00'),    -- Tuesday morning
--     ('doctor-uuid-here', 3, 'morning', '08:00', '12:00');    -- Wednesday morning

-- ══════════════════════════════════════════════════════════════════════════════
-- ROLLBACK SCRIPT (for reference, do not execute)
-- ══════════════════════════════════════════════════════════════════════════════
-- DROP FUNCTION IF EXISTS check_appointment_overlap(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID);
-- DROP TRIGGER IF EXISTS update_weekly_work_schedules_updated_at ON weekly_work_schedules;
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- ALTER TABLE appointments DROP CONSTRAINT IF EXISTS chk_appointments_time;
-- DROP INDEX IF EXISTS idx_appointments_parent;
-- DROP INDEX IF EXISTS idx_appointments_doctor_time;
-- ALTER TABLE appointments DROP COLUMN IF EXISTS parent_appointment_id;
-- ALTER TABLE appointments DROP COLUMN IF EXISTS end_time;
-- ALTER TABLE appointments DROP COLUMN IF EXISTS start_time;
-- DROP TABLE IF EXISTS schedule_change_requests;
-- DROP TABLE IF EXISTS schedule_exceptions;
-- DROP TABLE IF EXISTS weekly_work_schedules;
