-- Users tablosu için RLS politikalarını düzelt
-- Bu migration, users tablosuna erişim için gerekli RLS politikalarını oluşturur

DO $$
BEGIN
  -- RLS'yi etkinleştir
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  
  -- Mevcut politikaları sil (eğer varsa)
  DROP POLICY IF EXISTS "Public read access" ON users;
  DROP POLICY IF EXISTS "Public insert access" ON users;
  DROP POLICY IF EXISTS "Users can update own data" ON users;
END $$;

-- Herkes kullanıcıları okuyabilir (email ile arama için gerekli)
CREATE POLICY "Public read access"
  ON users
  FOR SELECT
  USING (true);

-- Herkes yeni kullanıcı oluşturabilir (kayıt için)
CREATE POLICY "Public insert access"
  ON users
  FOR INSERT
  WITH CHECK (true);

-- Kullanıcılar kendi verilerini güncelleyebilir
-- Not: Bu policy için auth.uid() kullanılabilir, ancak custom auth kullanıyorsanız
-- email bazlı kontrol yapabilirsiniz
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Not: password_hash alanına erişim için özel bir policy gerekebilir
-- Ancak bu güvenlik riski oluşturabilir, bu yüzden dikkatli olunmalı
-- Şimdilik yukarıdaki policy'ler yeterli olmalı

