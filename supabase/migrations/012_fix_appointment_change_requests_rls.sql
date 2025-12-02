-- Fix RLS policy for appointment_change_requests
-- Klinikler Supabase Auth kullanmadığı için anon kullanıcılar için de izin veriyoruz

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow all for authenticated users" ON appointment_change_requests;
DROP POLICY IF EXISTS "Allow all operations" ON appointment_change_requests;

-- Create new policy that allows all operations for all users
-- (App-level checks will handle authorization)
CREATE POLICY "Allow all operations"
  ON appointment_change_requests
  FOR ALL
  USING (true)
  WITH CHECK (true);

