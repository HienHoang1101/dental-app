# Database Migrations

## Chat Feature Migration

### File: `add_chat_tables.sql`

This migration adds chat functionality to the dental app.

### What it does:

1. **Creates `chat_sessions` table**
   - Stores chat sessions between patients and AI chatbot
   - Links to `users` table via `patient_id`
   - Includes summary and ML classification results

2. **Creates `chat_messages` table**
   - Stores individual messages (user and assistant)
   - Links to `chat_sessions`
   - Includes ML label and confidence for each message

3. **Updates `appointments` table**
   - Adds `chat_session_id` column
   - Links appointments to chat sessions

4. **Sets up Row Level Security (RLS)**
   - Patients can only see their own chats
   - Doctors can see chats linked to their appointments
   - Proper access control for all operations

### How to run:

#### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `add_chat_tables.sql`
5. Click **Run** or press `Ctrl+Enter`

#### Option 2: Supabase CLI

```bash
# Make sure you're in the backend directory
cd backend

# Run the migration
supabase db push --file migrations/add_chat_tables.sql
```

#### Option 3: psql command line

```bash
psql -h <your-supabase-host> -U postgres -d postgres -f migrations/add_chat_tables.sql
```

### Verify migration:

After running the migration, verify it worked:

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('chat_sessions', 'chat_messages');

-- Check if appointments has chat_session_id
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'appointments'
AND column_name = 'chat_session_id';

-- Check RLS policies
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('chat_sessions', 'chat_messages');
```

### Rollback (if needed):

If you need to rollback this migration:

```sql
-- Drop tables (will cascade delete all data)
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_sessions CASCADE;

-- Remove column from appointments
ALTER TABLE public.appointments DROP COLUMN IF EXISTS chat_session_id;
```

⚠️ **Warning**: Rollback will delete all chat data permanently!
