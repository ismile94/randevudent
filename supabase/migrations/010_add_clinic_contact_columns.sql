-- Add missing columns to appointments table
-- Bu migration, appointments tablosuna eksik kolonları ekler

-- Eğer kolonlar yoksa ekle
DO $$
BEGIN
  -- clinic_address kolonu
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'clinic_address'
  ) THEN
    ALTER TABLE appointments ADD COLUMN clinic_address TEXT;
  END IF;

  -- clinic_phone kolonu
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'clinic_phone'
  ) THEN
    ALTER TABLE appointments ADD COLUMN clinic_phone TEXT;
  END IF;

  -- clinic_email kolonu
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'clinic_email'
  ) THEN
    ALTER TABLE appointments ADD COLUMN clinic_email TEXT;
  END IF;

  -- doctor_name kolonu
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'doctor_name'
  ) THEN
    ALTER TABLE appointments ADD COLUMN doctor_name TEXT;
  END IF;
END $$;

