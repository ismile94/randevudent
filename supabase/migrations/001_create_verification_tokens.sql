-- Verification Tokens Tablosu
-- Bu tablo e-posta doğrulama ve şifre sıfırlama token'larını saklar

CREATE TABLE IF NOT EXISTS verification_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('email_verification', 'password_reset')),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_verification_tokens_email ON verification_tokens(email);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_type ON verification_tokens(type);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires_at ON verification_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON verification_tokens(user_id);

-- Süresi dolmuş token'ları otomatik temizleme için fonksiyon
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_tokens
  WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Süresi dolmuş token'ları temizlemek için scheduled job (opsiyonel)
-- Bu için pg_cron extension'ı gerekir
-- SELECT cron.schedule('cleanup-expired-tokens', '0 * * * *', 'SELECT cleanup_expired_tokens()');

-- RLS (Row Level Security) politikaları
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

-- Herkes kendi token'larını okuyabilir (token ile)
CREATE POLICY "Token ile token okuyabilir"
  ON verification_tokens
  FOR SELECT
  USING (true);

-- Sadece authenticated kullanıcılar token oluşturabilir (Edge Function'dan gelecek)
CREATE POLICY "Authenticated kullanıcılar token oluşturabilir"
  ON verification_tokens
  FOR INSERT
  WITH CHECK (true);

-- Token kullanıldığında güncelleme
CREATE POLICY "Token güncellenebilir"
  ON verification_tokens
  FOR UPDATE
  USING (true);

-- Token silme (sadece expired olanlar)
CREATE POLICY "Expired token'lar silinebilir"
  ON verification_tokens
  FOR DELETE
  USING (expires_at < NOW() OR used = TRUE);

-- Updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_verification_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_verification_tokens_updated_at
  BEFORE UPDATE ON verification_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_verification_tokens_updated_at();

