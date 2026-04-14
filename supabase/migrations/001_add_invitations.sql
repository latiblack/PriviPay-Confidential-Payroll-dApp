-- Migration: Add invitations table for organization invites
-- Run this in your Supabase SQL editor

-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code VARCHAR(20) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'employee',
  email VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_by VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique index on code
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_code ON public.invitations(code);

-- Add index on organization_id
CREATE INDEX IF NOT EXISTS idx_invitations_org ON public.invitations(organization_id);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read invitations by code (for joining)
CREATE POLICY "Anyone can read invitations by code"
ON public.invitations FOR SELECT
USING (code = auth.jwt() ->> 'code' OR true);

-- Policy: Only org owners can manage invitations
CREATE POLICY "Owners can manage invitations"
ON public.invitations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = organization_id
    AND owner_id = auth.uid()
  )
);

-- Add organization_code column for easy sharing
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS invite_code VARCHAR(20) UNIQUE;

-- Function to generate invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invite_code := UPPER(
    SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4) || '-' ||
    SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4) || '-' ||
    SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate invite code on organization create
CREATE TRIGGER set_organization_code
  BEFORE INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION generate_invite_code();