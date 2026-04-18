-- Migration: Add pending role to user_roles
-- Run this in your Supabase SQL editor

-- Add pending status to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'pending';

-- Create index on user_roles for pending status
CREATE INDEX IF NOT EXISTS idx_user_roles_pending ON public.user_roles(organization_id, user_id) WHERE role = 'pending';