-- Migration: Fix RLS policies for employees table
-- Run this in your Supabase SQL editor

-- Enable RLS on employees if not already enabled
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can read employees" ON employees;
DROP POLICY IF EXISTS "Anyone can insert employees" ON employees;
DROP POLICY IF EXISTS "Anyone can update employees" ON employees;
DROP POLICY IF EXISTS "Anyone can delete employees" ON employees;

-- Policy: Anyone can read employees (needed for org members)
CREATE POLICY "Anyone can read employees"
ON public.employees FOR SELECT
USING (true);

-- Policy: Anyone can insert (app handles authorization)
CREATE POLICY "Anyone can insert employees"
ON public.employees FOR INSERT
WITH CHECK (true);

-- Policy: Anyone can update (app handles authorization)
CREATE POLICY "Anyone can update employees"
ON public.employees FOR UPDATE
USING (true);

-- Policy: Anyone can delete (app handles authorization)
CREATE POLICY "Anyone can delete employees"
ON public.employees FOR DELETE
USING (true);