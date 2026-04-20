-- Migration: Fix RLS policies for user_roles table
-- Run this in your Supabase SQL editor

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read user_roles" ON user_roles;
DROP POLICY IF EXISTS "Anyone can insert user_roles" ON user_roles;
DROP POLICY IF EXISTS "Anyone can update user_roles" ON user_roles;
DROP POLICY IF EXISTS "Anyone can delete user_roles" ON user_roles;

-- Policy: Anyone can read user_roles (needed for checking membership)
CREATE POLICY "Anyone can read user_roles"
ON public.user_roles FOR SELECT
USING (true);

-- Policy: Anyone can insert (app handles authorization)
CREATE POLICY "Anyone can insert user_roles"
ON public.user_roles FOR INSERT
WITH CHECK (true);

-- Policy: Anyone can update (app handles authorization)
CREATE POLICY "Anyone can update user_roles"
ON public.user_roles FOR UPDATE
USING (true);

-- Policy: Anyone can delete (app handles authorization)
CREATE POLICY "Anyone can delete user_roles"
ON public.user_roles FOR DELETE
USING (true);