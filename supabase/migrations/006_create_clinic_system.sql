-- Clinic System Migration
-- Bu migration, klinik sistemi için gerekli tüm tabloları, ilişkileri ve politikaları oluşturur

-- 1. Clinics Tablosu
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_name TEXT NOT NULL,
  tax_number TEXT UNIQUE NOT NULL,
  trade_registry_number TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  website TEXT,
  address TEXT NOT NULL,
  district TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  authorized_person_name TEXT NOT NULL,
  authorized_person_tc TEXT NOT NULL,
  authorized_person_phone TEXT NOT NULL,
  authorized_person_email TEXT NOT NULL,
  authorized_person_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Staff Tablosu (Appointments'tan önce oluşturulmalı)
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  specialty TEXT,
  phone TEXT,
  email TEXT,
  services TEXT[],
  working_hours JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Appointments Tablosu
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  clinic_name TEXT NOT NULL,
  clinic_address TEXT,
  clinic_phone TEXT,
  clinic_email TEXT,
  doctor_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  doctor_name TEXT,
  service TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  notes TEXT,
  complaint TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  price DECIMAL(10,2),
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  is_urgent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Patients Tablosu (Klinik bazlı hasta kayıtları)
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  tc_number TEXT,
  address TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  blood_type TEXT,
  allergies TEXT[],
  chronic_diseases TEXT[],
  medications TEXT[],
  notes TEXT,
  first_appointment_date DATE NOT NULL,
  last_appointment_date DATE NOT NULL,
  total_appointments INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, user_id)
);

-- 5. Indexes (Performance)
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date ON appointments(clinic_id, date);
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_clinic_user ON patients(clinic_id, user_id);
CREATE INDEX IF NOT EXISTS idx_staff_clinic_id ON staff(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinics_email ON clinics(email);
CREATE INDEX IF NOT EXISTS idx_clinics_status ON clinics(status);

-- 6. Updated_at Trigger Fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Updated_at Triggers
DROP TRIGGER IF EXISTS update_clinics_updated_at ON clinics;
CREATE TRIGGER update_clinics_updated_at
  BEFORE UPDATE ON clinics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_staff_updated_at ON staff;
CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. RLS (Row Level Security) Politikaları
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Clinics Policies
DROP POLICY IF EXISTS "Clinics are viewable by everyone" ON clinics;
CREATE POLICY "Clinics are viewable by everyone"
  ON clinics
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Clinics can insert" ON clinics;
CREATE POLICY "Clinics can insert"
  ON clinics
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Clinics can update own data" ON clinics;
CREATE POLICY "Clinics can update own data"
  ON clinics
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Appointments Policies
DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;
CREATE POLICY "Users can view own appointments"
  ON appointments
  FOR SELECT
  USING (auth.uid() = user_id OR true); -- Geçici olarak herkes görebilir, clinic auth eklendikten sonra güncellenecek

DROP POLICY IF EXISTS "Users can create appointments" ON appointments;
CREATE POLICY "Users can create appointments"
  ON appointments
  FOR INSERT
  WITH CHECK (true); -- Geçici olarak herkes oluşturabilir, custom session sistemi için

DROP POLICY IF EXISTS "Clinics can update own appointments" ON appointments;
CREATE POLICY "Clinics can update own appointments"
  ON appointments
  FOR UPDATE
  USING (true) -- Geçici olarak herkes güncelleyebilir, clinic auth eklendikten sonra güncellenecek
  WITH CHECK (true);

-- Patients Policies
DROP POLICY IF EXISTS "Clinics can view own patients" ON patients;
CREATE POLICY "Clinics can view own patients"
  ON patients
  FOR SELECT
  USING (true); -- Geçici olarak herkes görebilir, clinic auth eklendikten sonra güncellenecek

DROP POLICY IF EXISTS "Clinics can manage own patients" ON patients;
CREATE POLICY "Clinics can manage own patients"
  ON patients
  FOR ALL
  USING (true) -- Geçici olarak herkes yönetebilir, clinic auth eklendikten sonra güncellenecek
  WITH CHECK (true);

-- Staff Policies
DROP POLICY IF EXISTS "Clinics can manage own staff" ON staff;
CREATE POLICY "Clinics can manage own staff"
  ON staff
  FOR ALL
  USING (true) -- Geçici olarak herkes yönetebilir, clinic auth eklendikten sonra güncellenecek
  WITH CHECK (true);

-- 9. Helper Functions

-- Patient oluştur veya güncelle (randevu oluşturulduğunda kullanılacak)
CREATE OR REPLACE FUNCTION get_or_create_patient(
  p_clinic_id UUID,
  p_user_id UUID,
  p_name TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_appointment_date DATE
)
RETURNS UUID AS $$
DECLARE
  v_patient_id UUID;
  v_existing_patient patients%ROWTYPE;
BEGIN
  -- Mevcut hasta kaydını kontrol et
  SELECT * INTO v_existing_patient
  FROM patients
  WHERE clinic_id = p_clinic_id AND user_id = p_user_id
  LIMIT 1;

  IF FOUND THEN
    -- Güncelle
    UPDATE patients
    SET 
      last_appointment_date = p_appointment_date,
      total_appointments = total_appointments + 1,
      updated_at = NOW()
    WHERE id = v_existing_patient.id
    RETURNING id INTO v_patient_id;
    
    RETURN v_patient_id;
  ELSE
    -- Yeni hasta kaydı oluştur
    INSERT INTO patients (
      clinic_id,
      user_id,
      name,
      phone,
      email,
      first_appointment_date,
      last_appointment_date,
      total_appointments
    )
    VALUES (
      p_clinic_id,
      p_user_id,
      p_name,
      p_phone,
      p_email,
      p_appointment_date,
      p_appointment_date,
      1
    )
    RETURNING id INTO v_patient_id;
    
    RETURN v_patient_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Klinik istatistikleri
CREATE OR REPLACE FUNCTION get_clinic_stats(p_clinic_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_appointments', COUNT(*) FILTER (WHERE clinic_id = p_clinic_id),
    'today_appointments', COUNT(*) FILTER (WHERE clinic_id = p_clinic_id AND date = CURRENT_DATE),
    'pending_appointments', COUNT(*) FILTER (WHERE clinic_id = p_clinic_id AND status = 'pending'),
    'confirmed_appointments', COUNT(*) FILTER (WHERE clinic_id = p_clinic_id AND status = 'confirmed'),
    'cancelled_appointments', COUNT(*) FILTER (WHERE clinic_id = p_clinic_id AND status = 'cancelled'),
    'completed_appointments', COUNT(*) FILTER (WHERE clinic_id = p_clinic_id AND status = 'completed'),
    'total_revenue', COALESCE(SUM(price) FILTER (WHERE clinic_id = p_clinic_id AND payment_status = 'paid'), 0),
    'total_patients', (SELECT COUNT(DISTINCT user_id) FROM patients WHERE clinic_id = p_clinic_id)
  ) INTO v_stats
  FROM appointments
  WHERE clinic_id = p_clinic_id;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

