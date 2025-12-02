-- Insert Test Clinic and Mock Data
-- Bu migration, test@klinik.com için gerçek klinik verilerini ve mock klinikleri ekler

-- 1. Test Klinik (test@klinik.com)
-- Şifre: test123 (bcrypt hash: $2b$10$rOzJ1J8qJ1J8qJ1J8qJ1Ju - bu sadece örnek, gerçek hash kullanılmalı)
-- Not: Gerçek uygulamada password_hash bcrypt ile hash'lenmeli
INSERT INTO clinics (
  id,
  clinic_name,
  tax_number,
  trade_registry_number,
  phone,
  email,
  password_hash,
  website,
  address,
  district,
  city,
  postal_code,
  authorized_person_name,
  authorized_person_tc,
  authorized_person_phone,
  authorized_person_email,
  authorized_person_title,
  status,
  verified,
  created_at,
  updated_at
) VALUES (
  'ae7b6b43-25b7-43a3-8a54-5d1266dec9b4', -- UUID (mevcut ID'yi koruyoruz)
  'Ağız ve Diş Sağlığı Merkezi',
  '1234567890',
  'TR-12345',
  '0216 123 45 67',
  'test@klinik.com',
  'test123', -- Gerçek uygulamada bcrypt hash kullanılmalı
  'https://www.agizdis.com',
  'Atatürk Cad. No:123 Daire:5',
  'Kadıköy',
  'İstanbul',
  '34700',
  'Dr. Ahmet Yılmaz',
  '12345678901',
  '0555 123 45 67',
  'ahmet@klinik.com',
  'Klinik Müdürü',
  'approved',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  clinic_name = EXCLUDED.clinic_name,
  tax_number = EXCLUDED.tax_number,
  trade_registry_number = EXCLUDED.trade_registry_number,
  phone = EXCLUDED.phone,
  website = EXCLUDED.website,
  address = EXCLUDED.address,
  district = EXCLUDED.district,
  city = EXCLUDED.city,
  postal_code = EXCLUDED.postal_code,
  authorized_person_name = EXCLUDED.authorized_person_name,
  authorized_person_tc = EXCLUDED.authorized_person_tc,
  authorized_person_phone = EXCLUDED.authorized_person_phone,
  authorized_person_email = EXCLUDED.authorized_person_email,
  authorized_person_title = EXCLUDED.authorized_person_title,
  status = EXCLUDED.status,
  verified = EXCLUDED.verified,
  updated_at = NOW();

-- 2. Test Klinik için Staff (Diş Hekimleri)
-- Dr. Ahmet Yılmaz - Ortodonti
INSERT INTO staff (
  clinic_id,
  name,
  title,
  specialty,
  phone,
  email,
  services,
  is_active,
  created_at,
  updated_at
) VALUES (
  'ae7b6b43-25b7-43a3-8a54-5d1266dec9b4',
  'Dr. Ahmet Yılmaz',
  'Diş Hekimi',
  ARRAY['Ortodonti'],
  '0555 111 22 33',
  'ahmet.yilmaz@klinik.com',
  ARRAY[
    'Metal–Seramik Teller',
    'Şeffaf Plak/Invisalign',
    'Çocuk Ortodontisi'
  ],
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Dr. Ayşe Demir - Estetik Diş Hekimliği
INSERT INTO staff (
  clinic_id,
  name,
  title,
  specialty,
  phone,
  email,
  services,
  is_active,
  created_at,
  updated_at
) VALUES (
  'ae7b6b43-25b7-43a3-8a54-5d1266dec9b4',
  'Dr. Ayşe Demir',
  'Diş Hekimi',
  ARRAY['Estetik Diş Hekimliği / Gülüş Tasarımı'],
  '0555 222 33 44',
  'ayse.demir@klinik.com',
  ARRAY[
    'Hollywood Smile',
    'Diş Beyazlatma (Ofis–Ev Tipi)',
    'E-max Porselen / Laminate Veneer'
  ],
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Dr. Mehmet Kaya - İmplantoloji
INSERT INTO staff (
  clinic_id,
  name,
  title,
  specialty,
  phone,
  email,
  services,
  is_active,
  created_at,
  updated_at
) VALUES (
  'ae7b6b43-25b7-43a3-8a54-5d1266dec9b4',
  'Dr. Mehmet Kaya',
  'Diş Hekimi',
  ARRAY['İmplantoloji'],
  '0555 333 44 55',
  'mehmet.kaya@klinik.com',
  ARRAY[
    'Tek İmplant',
    'All-on-4 / All-on-6 Sabit Protez',
    'Kemik Artırma (GBR – Greftleme)'
  ],
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- 3. Mock Klinikler (Örnek klinikler)
-- Modern Diş Kliniği
INSERT INTO clinics (
  clinic_name,
  tax_number,
  trade_registry_number,
  phone,
  email,
  password_hash,
  website,
  address,
  district,
  city,
  postal_code,
  authorized_person_name,
  authorized_person_tc,
  authorized_person_phone,
  authorized_person_email,
  authorized_person_title,
  status,
  verified,
  created_at,
  updated_at
) VALUES (
  'Modern Diş Kliniği',
  '2345678901',
  'TR-23456',
  '0216 234 56 78',
  'info@moderndis.com',
  'moderndis123', -- Gerçek uygulamada bcrypt hash kullanılmalı
  'https://www.moderndis.com',
  'Bağdat Cad. No:456',
  'Bostancı',
  'İstanbul',
  '34740',
  'Dr. Zeynep Şahin',
  '23456789012',
  '0555 444 55 66',
  'zeynep@moderndis.com',
  'Klinik Müdürü',
  'approved',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Modern Diş Kliniği için Staff
-- Dr. Zeynep Şahin - Endodonti
INSERT INTO staff (
  clinic_id,
  name,
  title,
  specialty,
  phone,
  email,
  services,
  is_active,
  created_at,
  updated_at
)
SELECT 
  c.id,
  'Dr. Zeynep Şahin',
  'Diş Hekimi',
  ARRAY['Endodonti (Kanal Tedavisi)'],
  '0555 444 55 66',
  'zeynep@moderndis.com',
  ARRAY[
    'Tek Kök / Çok Kök Kanal',
    'Mikroskop Destekli Kanal',
    'Kanal Yenileme (Retreatment)'
  ],
  true,
  NOW(),
  NOW()
FROM clinics c
WHERE c.email = 'info@moderndis.com'
ON CONFLICT DO NOTHING;

-- Gülümseme Diş Kliniği
INSERT INTO clinics (
  clinic_name,
  tax_number,
  trade_registry_number,
  phone,
  email,
  password_hash,
  website,
  address,
  district,
  city,
  postal_code,
  authorized_person_name,
  authorized_person_tc,
  authorized_person_phone,
  authorized_person_email,
  authorized_person_title,
  status,
  verified,
  created_at,
  updated_at
) VALUES (
  'Gülümseme Diş Kliniği',
  '3456789012',
  'TR-34567',
  '0312 345 67 89',
  'info@gulumseme.com',
  'gulumseme123', -- Gerçek uygulamada bcrypt hash kullanılmalı
  'https://www.gulumseme.com',
  'Tunalı Hilmi Cad. No:789',
  'Çankaya',
  'Ankara',
  '06420',
  'Dr. Can Özkan',
  '34567890123',
  '0555 555 66 77',
  'can@gulumseme.com',
  'Klinik Müdürü',
  'approved',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Gülümseme Diş Kliniği için Staff
-- Dr. Can Özkan - Restoratif Diş Tedavisi
INSERT INTO staff (
  clinic_id,
  name,
  title,
  specialty,
  phone,
  email,
  services,
  is_active,
  created_at,
  updated_at
)
SELECT 
  c.id,
  'Dr. Can Özkan',
  'Diş Hekimi',
  ARRAY['Restoratif Diş Tedavisi'],
  '0555 555 66 77',
  'can@gulumseme.com',
  ARRAY[
    'Kompozit Dolgu',
    'Diş Taşı Temizliği (Detartraj)',
    'Kırık Diş Onarımı'
  ],
  true,
  NOW(),
  NOW()
FROM clinics c
WHERE c.email = 'info@gulumseme.com'
ON CONFLICT DO NOTHING;

-- 4. Test Klinik için Örnek Hasta Verileri (Opsiyonel - sadece test için)
-- Not: Bu veriler gerçek hasta kayıtları değil, sadece test amaçlıdır
-- Gerçek uygulamada hastalar users tablosundan gelecek

-- Örnek: Eğer patients tablosu varsa (şu an yok gibi görünüyor, bu yüzden yorum satırı)
/*
INSERT INTO patients (
  clinic_id,
  user_id,
  name,
  phone,
  email,
  tc_number,
  address,
  birth_date,
  gender,
  blood_type,
  allergies,
  chronic_diseases,
  medications,
  notes,
  first_appointment_date,
  last_appointment_date,
  total_appointments,
  created_at,
  updated_at
) VALUES (
  'ae7b6b43-25b7-43a3-8a54-5d1266dec9b4',
  (SELECT id FROM users WHERE email = 'mehmet@example.com' LIMIT 1),
  'Mehmet Yılmaz',
  '0555 111 22 33',
  'mehmet@example.com',
  '12345678901',
  'Kadıköy, İstanbul',
  '1985-05-15',
  'male',
  'A+',
  ARRAY['Penisilin'],
  ARRAY[]::TEXT[],
  ARRAY['Aspirin'],
  'Düzenli hasta. Diş taşı temizliği yapıldı.',
  NOW() - INTERVAL '90 days',
  NOW() - INTERVAL '7 days',
  5,
  NOW() - INTERVAL '90 days',
  NOW() - INTERVAL '7 days'
) ON CONFLICT DO NOTHING;
*/

-- Not: Şifre hash'leri için bcrypt kullanılmalı
-- Örnek bcrypt hash oluşturma (Node.js):
-- const bcrypt = require('bcrypt');
-- const hash = await bcrypt.hash('test123', 10);
-- Sonra password_hash alanına hash değeri yazılmalı

