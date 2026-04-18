-- Migration: Add voting system
-- Run this in your Supabase SQL editor

-- Create vote_records table for bonus voting
CREATE TABLE IF NOT EXISTS public.vote_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  voter_id VARCHAR(255) NOT NULL,
  vote_type VARCHAR(20) NOT NULL DEFAULT 'bonus',
  encrypted_vote VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.vote_records ENABLE ROW LEVEL SECURITY;

-- Policy: Read all votes for org members
CREATE POLICY "Org members can read votes"
ON public.vote_records FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = voter_id
  )
);

-- Policy: Org members can insert votes
CREATE POLICY "Org members can vote"
ON public.vote_records FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()::text
  )
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_vote_records_org ON public.vote_records(organization_id);