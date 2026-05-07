-- Migration: Add chat tables and update appointments table
-- Date: 2026-05-07
-- Description: Add chat_sessions, chat_messages tables and link to appointments

-- ══════════════════════════════════════════════════════════
-- 1. Create chat_sessions table
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    summary TEXT,
    primary_label TEXT,
    primary_confidence DOUBLE PRECISION CHECK (primary_confidence >= 0 AND primary_confidence <= 1),
    CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_sessions_patient_id ON public.chat_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_started_at ON public.chat_sessions(started_at DESC);

-- ══════════════════════════════════════════════════════════
-- 2. Create chat_messages table
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    ml_label TEXT,
    ml_confidence DOUBLE PRECISION CHECK (ml_confidence >= 0 AND ml_confidence <= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_session FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id) ON DELETE CASCADE
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(session_id, created_at ASC);

-- ══════════════════════════════════════════════════════════
-- 3. Add chat_session_id to appointments table
-- ══════════════════════════════════════════════════════════

-- Check if column exists before adding
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'chat_session_id'
    ) THEN
        ALTER TABLE public.appointments 
        ADD COLUMN chat_session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_appointments_chat_session_id 
        ON public.appointments(chat_session_id);
    END IF;
END $$;

-- ══════════════════════════════════════════════════════════
-- 4. Row Level Security (RLS) Policies
-- ══════════════════════════════════════════════════════════

-- Enable RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Patients can only see their own chat sessions
CREATE POLICY "Patients can view own chat sessions"
ON public.chat_sessions
FOR SELECT
USING (auth.uid() = patient_id);

-- Policy: Patients can create their own chat sessions
CREATE POLICY "Patients can create own chat sessions"
ON public.chat_sessions
FOR INSERT
WITH CHECK (auth.uid() = patient_id);

-- Policy: Patients can update their own chat sessions
CREATE POLICY "Patients can update own chat sessions"
ON public.chat_sessions
FOR UPDATE
USING (auth.uid() = patient_id);

-- Policy: Patients can delete their own chat sessions
CREATE POLICY "Patients can delete own chat sessions"
ON public.chat_sessions
FOR DELETE
USING (auth.uid() = patient_id);

-- Policy: Doctors can view chat sessions of their appointments
CREATE POLICY "Doctors can view chat sessions of appointments"
ON public.chat_sessions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.appointments a
        INNER JOIN public.doctors d ON a.doctor_id = d.id
        WHERE a.chat_session_id = chat_sessions.id
        AND d.user_id = auth.uid()
    )
);

-- Policy: Users can view messages of their sessions
CREATE POLICY "Users can view messages of own sessions"
ON public.chat_messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.chat_sessions cs
        WHERE cs.id = chat_messages.session_id
        AND cs.patient_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.chat_sessions cs
        INNER JOIN public.appointments a ON a.chat_session_id = cs.id
        INNER JOIN public.doctors d ON a.doctor_id = d.id
        WHERE cs.id = chat_messages.session_id
        AND d.user_id = auth.uid()
    )
);

-- Policy: Users can create messages in their sessions
CREATE POLICY "Users can create messages in own sessions"
ON public.chat_messages
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.chat_sessions cs
        WHERE cs.id = chat_messages.session_id
        AND cs.patient_id = auth.uid()
    )
);

-- ══════════════════════════════════════════════════════════
-- 5. Comments for documentation
-- ══════════════════════════════════════════════════════════

COMMENT ON TABLE public.chat_sessions IS 'Chat sessions between patients and AI chatbot';
COMMENT ON TABLE public.chat_messages IS 'Individual messages in chat sessions';
COMMENT ON COLUMN public.chat_sessions.summary IS 'AI-generated summary of the chat for doctors';
COMMENT ON COLUMN public.chat_sessions.primary_label IS 'Primary ML classification label (sau_rang, viem_nuou, etc.)';
COMMENT ON COLUMN public.chat_sessions.primary_confidence IS 'Confidence score of primary label (0-1)';
COMMENT ON COLUMN public.chat_messages.ml_label IS 'ML classification label for this message';
COMMENT ON COLUMN public.chat_messages.ml_confidence IS 'ML confidence score for this message (0-1)';
COMMENT ON COLUMN public.appointments.chat_session_id IS 'Link to chat session that led to this appointment';
