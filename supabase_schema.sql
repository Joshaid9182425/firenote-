-- ── Supabase Database Schema for FlameBoard ─────────────────────────────────────
-- Run this script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)

-- 1. Create boards table
CREATE TABLE IF NOT EXISTS public.boards (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    background TEXT DEFAULT 'dots',
    dark_mode BOOLEAN DEFAULT FALSE,
    thumbnail TEXT,
    strokes JSONB DEFAULT '[]'::jsonb,
    sticky_notes JSONB DEFAULT '[]'::jsonb,
    shapes JSONB DEFAULT '[]'::jsonb,
    text_elements JSONB DEFAULT '[]'::jsonb,
    arrows JSONB DEFAULT '[]'::jsonb,
    tables JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies: Ensure users can only view, insert, update, delete their own boards
CREATE POLICY "Users can view own boards" 
ON public.boards FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own boards" 
ON public.boards FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own boards" 
ON public.boards FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own boards" 
ON public.boards FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Enable Realtime on boards table (optional)
ALTER PUBLICATION supabase_realtime ADD TABLE public.boards;
