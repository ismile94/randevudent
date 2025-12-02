-- Appointment Change Requests Migration
-- Bu migration, randevu değişiklik talepleri için tablo oluşturur

-- Appointment Change Requests Tablosu
CREATE TABLE IF NOT EXISTS appointment_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL, -- user_id veya clinic_id
  requested_by_type TEXT NOT NULL CHECK (requested_by_type IN ('user', 'clinic')),
  new_date DATE,
  new_time TIME,
  new_doctor_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  new_service TEXT,
  reason TEXT, -- Değişiklik nedeni (opsiyonel)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_change_requests_appointment_id ON appointment_change_requests(appointment_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_requested_by ON appointment_change_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON appointment_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_change_requests_appointment_status ON appointment_change_requests(appointment_id, status);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_appointment_change_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS appointment_change_requests_updated_at ON appointment_change_requests;
CREATE TRIGGER appointment_change_requests_updated_at
  BEFORE UPDATE ON appointment_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_appointment_change_requests_updated_at();

-- RLS Policies (Uygulama seviyesinde kontrol edilecek)
ALTER TABLE appointment_change_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all for authenticated users" ON appointment_change_requests;
DROP POLICY IF EXISTS "Allow all operations" ON appointment_change_requests;

-- Allow all operations for all users (app-level checks will handle authorization)
-- Note: Klinikler Supabase Auth kullanmadığı için anon kullanıcılar için de izin veriyoruz
CREATE POLICY "Allow all operations"
  ON appointment_change_requests
  FOR ALL
  USING (true)
  WITH CHECK (true);

