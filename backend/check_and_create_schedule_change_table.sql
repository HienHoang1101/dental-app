-- Check if schedule_change_requests table exists and create it if not
DO $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'schedule_change_requests') THEN
        -- Create the table
        CREATE TABLE schedule_change_requests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
            request_type TEXT NOT NULL CHECK (request_type IN ('add', 'remove', 'modify')),
            old_schedule_data JSONB, -- JSON: {day_of_week, session, start_time, end_time}
            new_schedule_data JSONB, -- JSON: {day_of_week, session, start_time, end_time}
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
            rejection_reason TEXT,
            reviewed_by UUID REFERENCES users(id),
            reviewed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX idx_change_requests_doctor ON schedule_change_requests(doctor_id);
        CREATE INDEX idx_change_requests_status ON schedule_change_requests(status);
        CREATE INDEX idx_change_requests_pending ON schedule_change_requests(doctor_id, status) WHERE status = 'pending';

        -- Add comments
        COMMENT ON TABLE schedule_change_requests IS 'Workflow for doctors to request schedule changes';
        COMMENT ON COLUMN schedule_change_requests.old_schedule_data IS 'JSON: {day_of_week, session, start_time, end_time}';
        COMMENT ON COLUMN schedule_change_requests.new_schedule_data IS 'JSON: {day_of_week, session, start_time, end_time}';

        RAISE NOTICE 'Created schedule_change_requests table successfully';
    ELSE
        RAISE NOTICE 'schedule_change_requests table already exists';
    END IF;
END $$;

-- Check if weekly_work_schedules table exists and create it if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'weekly_work_schedules') THEN
        CREATE TABLE weekly_work_schedules (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
            day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday, 7=Sunday
            session TEXT NOT NULL CHECK (session IN ('morning', 'afternoon')),
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            UNIQUE(doctor_id, day_of_week, session)
        );

        CREATE INDEX idx_weekly_schedules_doctor ON weekly_work_schedules(doctor_id);
        CREATE INDEX idx_weekly_schedules_active ON weekly_work_schedules(doctor_id, is_active) WHERE is_active = true;

        COMMENT ON TABLE weekly_work_schedules IS 'Weekly recurring work schedules for doctors';

        RAISE NOTICE 'Created weekly_work_schedules table successfully';
    ELSE
        RAISE NOTICE 'weekly_work_schedules table already exists';
    END IF;
END $$;

-- Verify tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name = 'schedule_change_requests' THEN 'Schedule change requests table'
        WHEN table_name = 'weekly_work_schedules' THEN 'Weekly work schedules table'
        ELSE table_name
    END as description
FROM information_schema.tables 
WHERE table_name IN ('schedule_change_requests', 'weekly_work_schedules')
ORDER BY table_name;