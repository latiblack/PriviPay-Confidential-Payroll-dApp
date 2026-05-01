-- Check current RLS status and policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'bonuses';

-- Also check if RLS is enabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'bonuses';