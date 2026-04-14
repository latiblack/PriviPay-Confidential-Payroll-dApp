-- Migration: Add user profiles and fix schema
-- Run this in your Supabase SQL editor

-- Create profiles table if not exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  avatar_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique index on wallet_address
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_wallet ON public.profiles(wallet_address);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy for profiles
CREATE POLICY "Anyone can read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update profiles" ON public.profiles FOR UPDATE USING (true);

-- Ensure employees table has encrypted salary/bonus columns
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS encrypted_salary VARCHAR(255);
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS encrypted_bonus VARCHAR(255);

-- Ensure user_roles table has user_id as VARCHAR
ALTER TABLE public.user_roles ALTER COLUMN user_id TYPE VARCHAR(255);