-- Run this SQL in your Supabase dashboard (SQL Editor)
-- This adds the wallet_address column to the invitations table

ALTER TABLE invitations ADD COLUMN wallet_address TEXT;

-- Create an index for faster lookups
CREATE INDEX idx_invitations_wallet_address ON invitations(wallet_address) WHERE wallet_address IS NOT NULL;