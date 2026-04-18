-- Migration: Add notifications table
-- Run this in your Supabase SQL editor

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id VARCHAR(255),
  type VARCHAR(20) NOT NULL DEFAULT 'announcement',
  title VARCHAR(255) NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Read notifications for org members
CREATE POLICY "Org members can read notifications"
ON public.notifications FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = user_id
  )
);

-- Policy: Only owners can create notifications
CREATE POLICY "Owners can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = organization_id
    AND owner_id = auth.uid()::text
  )
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_notifications_org ON public.notifications(organization_id, created_at DESC);