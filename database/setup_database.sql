-- ============================================================
-- FULL DATABASE SETUP SCRIPT (Version 2026.2)
-- Khớp hoàn toàn với cấu trúc Supabase của người dùng
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. USERS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT        NOT NULL UNIQUE,
    password_hash TEXT,
    full_name     TEXT        NOT NULL,
    phone         TEXT,
    role          TEXT        NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
    is_active     BOOLEAN     NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 11. SPECIALTIES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.specialties (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL UNIQUE,
    description TEXT,
    is_active   BOOLEAN     NOT NULL DEFAULT true,
    created_at  TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- ── 3. DOCTORS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.doctors (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        UNIQUE REFERENCES public.users(id) ON DELETE SET NULL,
    full_name   TEXT        NOT NULL,
    specialty   TEXT,
    degree      TEXT,
    bio         TEXT,
    avatar_url  TEXT,
    is_active   BOOLEAN     NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. SERVICES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.services (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name             TEXT        NOT NULL,
    description      TEXT,
    price            INTEGER     CHECK (price > 0),
    duration_minutes INTEGER     NOT NULL DEFAULT 30,
    category         TEXT,
    is_active        BOOLEAN     NOT NULL DEFAULT true,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    specialty_id     UUID        REFERENCES public.specialties(id) ON DELETE SET NULL
);

-- ── 10. HEALTH RECORDS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.health_records (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    full_name       TEXT        NOT NULL,
    date_of_birth   DATE        NOT NULL,
    ethnicity       TEXT,
    gender          TEXT        NOT NULL,
    occupation      TEXT,
    phone           TEXT        NOT NULL,
    email           TEXT        NOT NULL,
    national_id     TEXT,
    address         TEXT        NOT NULL,
    allergy_notes   TEXT,
    medical_history TEXT,
    dental_status   TEXT,
    created_at      TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- ── 2. PATIENT PROFILES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.patient_profiles (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    date_of_birth   DATE,
    gender          TEXT        CHECK (gender IN ('male', 'female', 'other')),
    allergy_notes   TEXT,
    medical_history TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. DOCTOR SCHEDULES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id   UUID        NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    work_date   DATE        NOT NULL,
    slot_start  TIME        NOT NULL,
    slot_end    TIME        NOT NULL,
    is_booked   BOOLEAN     NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 7. CHAT SESSIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id  UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at    TIMESTAMPTZ,
    summary     TEXT,
    primary_label TEXT,
    primary_confidence DOUBLE PRECISION
);

-- ── 8. CHAT MESSAGES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id     UUID        NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role           TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
    content        TEXT        NOT NULL,
    ml_label       TEXT,
    ml_confidence  DOUBLE PRECISION CHECK (ml_confidence >= 0 AND ml_confidence <= 1),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. APPOINTMENTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id          UUID        NOT NULL REFERENCES public.users(id),
    doctor_id           UUID        NOT NULL REFERENCES public.doctors(id),
    service_id          UUID        REFERENCES public.services(id),
    schedule_id         UUID        REFERENCES public.doctor_schedules(id) ON DELETE SET NULL,
    status              TEXT        NOT NULL DEFAULT 'pending' 
                                    CHECK (status IN ('pending','confirmed','completed','cancelled','rescheduled')),
    patient_note        TEXT,
    doctor_note         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    health_record_id    UUID        REFERENCES public.health_records(id) ON DELETE SET NULL,
    time_slot_id        UUID        NULL, -- Will link to time_slots later
    appointment_date    DATE,
    notes               TEXT,
    cancellation_reason TEXT,
    chat_session_id     UUID        REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
    start_time          TIMESTAMPTZ,
    end_time            TIMESTAMPTZ,
    parent_appointment_id UUID      REFERENCES public.appointments(id) ON DELETE SET NULL
);

-- ── 9. KNOWLEDGE DOCUMENTS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    filename          TEXT        NOT NULL,
    original_name     TEXT        NOT NULL,
    vector_namespace  TEXT        NOT NULL UNIQUE,
    chunk_count       INTEGER,
    status            TEXT        NOT NULL DEFAULT 'processing'
                                  CHECK (status IN ('processing', 'completed', 'failed')),
    uploaded_by       UUID        REFERENCES public.users(id) ON DELETE SET NULL,
    uploaded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 12. HOLIDAYS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.holidays (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    date        DATE        NOT NULL UNIQUE,
    name        TEXT        NOT NULL,
    description TEXT,
    created_at  TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- ── 13. SHIFTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shifts (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL,
    start_time  TIME        NOT NULL,
    end_time    TIME        NOT NULL,
    created_at  TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- ── 14. WORK SCHEDULES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.work_schedules (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id            UUID        NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    shift_id             UUID        NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
    date                 DATE        NOT NULL,
    slot_duration        INTEGER     NOT NULL DEFAULT 30,
    max_patient_per_slot INTEGER     NOT NULL DEFAULT 1,
    created_at           TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- ── 15. TIME SLOTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.time_slots (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    work_schedule_id     UUID        NOT NULL REFERENCES public.work_schedules(id) ON DELETE CASCADE,
    start_time           TIME        NOT NULL,
    end_time             TIME        NOT NULL,
    max_patient_per_slot INTEGER     NOT NULL DEFAULT 1,
    created_at           TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Add missing FK to appointments for time_slots
ALTER TABLE public.appointments 
ADD CONSTRAINT fk_appointments_time_slot 
FOREIGN KEY (time_slot_id) REFERENCES public.time_slots(id) ON DELETE SET NULL;

-- ── 16. LEAVE REQUESTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id   UUID        NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    start_date  DATE        NOT NULL,
    end_date    DATE        NOT NULL,
    reason      TEXT        NOT NULL,
    status      TEXT        NOT NULL DEFAULT 'pending',
    reviewed_by UUID        REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITHOUT TIME ZONE,
    created_at  TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- ── 17. WEEKLY WORK SCHEDULES ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.weekly_work_schedules (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id   UUID        NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    day_of_week INTEGER     NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
    session     TEXT        NOT NULL CHECK (session IN ('morning', 'afternoon')),
    start_time  TIME        NOT NULL,
    end_time    TIME        NOT NULL,
    is_active   BOOLEAN     NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (doctor_id, day_of_week, session)
);

-- ── 18. SCHEDULE EXCEPTIONS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.schedule_exceptions (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id         UUID        NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    exception_date    DATE        NOT NULL,
    exception_type    TEXT        NOT NULL CHECK (exception_type IN ('off', 'override')),
    session           TEXT        CHECK (session IN ('morning', 'afternoon')),
    override_start_time TIME,
    override_end_time   TIME,
    reason            TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (doctor_id, exception_date, session)
);

-- ── 19. SCHEDULE CHANGE REQUESTS ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.schedule_change_requests (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id       UUID        NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    request_type    TEXT        NOT NULL CHECK (request_type IN ('add', 'remove', 'modify')),
    old_schedule_data JSONB,
    new_schedule_data JSONB,
    status          TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    reviewed_by     UUID        REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 20. MEDICATIONS & PRESCRIPTIONS (Extra tables from Code) ──
CREATE TABLE IF NOT EXISTS public.medications (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name           TEXT        NOT NULL,
    unit           TEXT        NOT NULL,
    price          INTEGER     NOT NULL DEFAULT 0,
    description    TEXT,
    default_dosage TEXT,
    is_active      BOOLEAN     NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.prescriptions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    patient_id     UUID NOT NULL REFERENCES public.users(id),
    doctor_id      UUID NOT NULL REFERENCES public.doctors(id),
    diagnosis      TEXT,
    advice         TEXT,
    follow_up_date DATE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.prescription_items (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id    UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    medication_id      UUID NOT NULL REFERENCES public.medications(id),
    quantity          INTEGER NOT NULL,
    unit_price         INTEGER NOT NULL DEFAULT 0,
    dosage_instruction TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
