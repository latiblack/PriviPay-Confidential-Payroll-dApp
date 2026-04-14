-- Migration: Fix owner_id to use VARCHAR for wallet addresses
-- Run this in your Supabase SQL editor

-- Drop ALL policies on organizations
DROP POLICY IF EXISTS "Owners can update org" ON organizations;
DROP POLICY IF EXISTS "Owners can delete org" ON organizations;
DROP POLICY IF EXISTS "Anyone can view orgs" ON organizations;
DROP POLICY IF EXISTS "Org members can view org" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create orgs" ON organizations;

-- Drop ALL policies on invitations
DROP POLICY IF EXISTS "Owners can manage invitations" ON invitations;
DROP POLICY IF EXISTS "Anyone can read invitations by code" ON invitations;

-- Drop foreign key constraint
ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_owner_id_fkey;

-- Change owner_id from UUID to VARCHAR
ALTER TABLE public.organizations 
ALTER COLUMN owner_id TYPE VARCHAR(255) USING owner_id::VARCHAR;