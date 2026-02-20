# Supabase Setup Instructions

Follow these steps to configure Supabase for the Sebooth Photobooth application.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Enter project details:
   - Name: `sebooth` (or your preferred name)
   - Database Password: (save this securely)
   - Region: Choose closest to your location
4. Wait for the project to be provisioned

## 2. Get API Credentials

1. Go to **Settings** → **API** in your project dashboard
2. Copy these values:
   - **Project URL** (e.g., `https://xxxx.supabase.co`)
   - **anon public** key

3. Create `.env` file in project root:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Create Database Tables

Go to **SQL Editor** and run this script:

```sql
-- Session logs table
CREATE TABLE session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Config table for remote settings
CREATE TABLE configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE configs ENABLE ROW LEVEL SECURITY;

-- Allow public insert for session logs (kiosk use)
CREATE POLICY "Allow public insert" ON session_logs
  FOR INSERT WITH CHECK (true);

-- Allow public read/write for configs
CREATE POLICY "Allow public read" ON configs
  FOR SELECT USING (true);
  
CREATE POLICY "Allow public write" ON configs
  FOR ALL USING (true);
```

## 4. Create Storage Buckets

1. Go to **Storage** in your project dashboard
2. Create three buckets:

| Bucket Name | Public |
|-------------|--------|
| `frames`    | Yes    |
| `luts`      | Yes    |
| `exports`   | Yes    |

3. For each bucket, go to **Policies** and add:
   - Allow public uploads
   - Allow public reads

## 5. Test Connection

Run the app and verify:
- No Supabase errors in console
- Session logs appear in database after email submission
