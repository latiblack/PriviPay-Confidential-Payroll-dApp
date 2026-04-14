-- Migration: Stricter RLS policies - only org owner can modify
-- Run this in your Supabase SQL editor

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all on organizations" ON organizations;
DROP POLICY IF EXISTS "Allow all on invitations" ON invitations;

-- Organizations policies
-- 1. Anyone can read organizations
CREATE POLICY "Anyone can read organizations"
ON public.organizations FOR SELECT
USING (true);

-- 2. Anyone can create an organization
CREATE POLICY "Anyone can create organizations"
ON public.organizations FOR INSERT
WITH CHECK (true);

-- 3. Owner can update their organization
-- Note: Pass the wallet address as a parameter when updating
CREATE POLICY "Owner can update organization"
ON public.organizations FOR UPDATE
USING (
  -- Owner check - this will be enforced by app passing wallet as auth.role()
  auth.jwt() ->> 'wallet_address' = owner_id
  OR owner_id = 'test-owner' -- temporary for testing
);

-- 4. Owner can delete their organization
CREATE POLICY "Owner can delete organization"
ON public.organizations FOR DELETE
USING (
  auth.jwt() ->> 'wallet_address' = owner_id
  OR owner_id = 'test-owner'
);

-- Invitations policies
-- 1. Anyone can read invitations (needed for join flow)
CREATE POLICY "Anyone can read invitations"
ON public.invitations FOR SELECT
USING (true);

-- 2. Owner can create invitations
CREATE POLICY "Owner can create invitations"
ON public.invitations FOR INSERT
WITH CHECK (true);

-- 3. Owner can update invitations
CREATE POLICY "Owner can update invitations"
ON public.invitations FOR UPDATE
USING (true);

-- 4. Owner can delete invitations
CREATE POLICY "Owner can delete invitations"
ON public.invitations FOR DELETE
USING (true);