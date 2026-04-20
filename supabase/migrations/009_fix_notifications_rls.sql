-- Migration: Fix notifications RLS policies
-- Run this in your Supabase SQL editor

-- Drop existing policies
DROP POLICY IF EXISTS "Org members can read notifications" ON public.notifications;
DROP POLICY IF EXISTS "Owners can create notifications" ON public.notifications;

-- Policy: Anyone in the org can read notifications
CREATE POLICY "Anyone in org can read notifications"
ON public.notifications FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = user_id
  )
  OR
  organization_id IN (
    SELECT id FROM public.organizations WHERE owner_id = user_id
  )
);

-- Policy: Allow anyone to insert notifications (app handles authorization)
CREATE POLICY "Allow insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Policy: Allow updates
CREATE POLICY "Allow update notifications"
ON public.notifications FOR UPDATE
USING (true);

-- Policy: Allow delete
CREATE POLICY "Allow delete notifications"
ON public.notifications FOR DELETE
USING (true);