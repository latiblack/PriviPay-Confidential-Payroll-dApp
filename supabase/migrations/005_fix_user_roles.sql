-- Migration: Fix user_roles user_id type
-- Run this in your Supabase SQL editor

-- Drop foreign key
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Change user_id to VARCHAR
ALTER TABLE public.user_roles ALTER COLUMN user_id TYPE VARCHAR(255);