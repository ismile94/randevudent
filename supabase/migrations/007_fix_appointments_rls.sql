-- Fix Appointments RLS for custom session system
-- Bu migration, appointments tablosu için RLS politikalarını custom session sistemi ile uyumlu hale getirir

-- Appointments INSERT politikasını güncelle (herkes oluşturabilir - custom session sistemi için)
DROP POLICY IF EXISTS "Users can create appointments" ON appointments;
CREATE POLICY "Users can create appointments"
  ON appointments
  FOR INSERT
  WITH CHECK (true);

-- Appointments SELECT politikasını güncelle
DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;
CREATE POLICY "Users can view own appointments"
  ON appointments
  FOR SELECT
  USING (true); -- Geçici olarak herkes görebilir

-- Patients INSERT politikasını güncelle (get_or_create_patient fonksiyonu için)
DROP POLICY IF EXISTS "Clinics can manage own patients" ON patients;
CREATE POLICY "Clinics can manage own patients"
  ON patients
  FOR ALL
  USING (true)
  WITH CHECK (true);

