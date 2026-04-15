
-- Drop policies that depend on user_id column
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Drop foreign key constraint to auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Now change the column type
ALTER TABLE public.profiles ALTER COLUMN user_id TYPE text USING user_id::text;

-- Recreate with open policies (wallet-based auth)
CREATE POLICY "Anyone can insert profiles"
ON public.profiles FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update own profile"
ON public.profiles FOR UPDATE
USING (true);
