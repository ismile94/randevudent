-- Sessions Tablosu
-- Bu tablo kullanıcı oturumlarını saklar (localStorage yerine)

CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Süresi dolmuş session'ları otomatik temizleme için fonksiyon
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security) politikaları
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Herkes token ile session okuyabilir
CREATE POLICY "Token ile session okuyabilir"
  ON sessions
  FOR SELECT
  USING (true);

-- Herkes session oluşturabilir (login için)
CREATE POLICY "Public session oluşturabilir"
  ON sessions
  FOR INSERT
  WITH CHECK (true);

-- Session güncellenebilir
CREATE POLICY "Session güncellenebilir"
  ON sessions
  FOR UPDATE
  USING (true);

-- Session silinebilir (logout için)
CREATE POLICY "Session silinebilir"
  ON sessions
  FOR DELETE
  USING (true);

-- Updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_sessions_updated_at();

-- Session doğrulama fonksiyonu
CREATE OR REPLACE FUNCTION verify_session(p_token TEXT)
RETURNS TABLE (
  is_valid BOOLEAN,
  user_id UUID,
  user_data JSONB
) AS $$
DECLARE
  v_session sessions%ROWTYPE;
  v_user users%ROWTYPE;
BEGIN
  -- Session'ı bul
  SELECT s.* INTO v_session
  FROM sessions s
  WHERE s.token = p_token
    AND s.expires_at > NOW();

  -- Session bulunamadı veya geçersiz
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN as is_valid,
      NULL::UUID as user_id,
      NULL::JSONB as user_data;
    RETURN;
  END IF;

  -- Kullanıcı bilgilerini al
  SELECT u.* INTO v_user
  FROM users u
  WHERE u.id = v_session.user_id;

  -- Kullanıcı bulunamadı
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN as is_valid,
      NULL::UUID as user_id,
      NULL::JSONB as user_data;
    RETURN;
  END IF;

  -- Session geçerli, kullanıcı bilgilerini döndür
  RETURN QUERY SELECT 
    TRUE::BOOLEAN as is_valid,
    v_user.id as user_id,
    jsonb_build_object(
      'id', v_user.id,
      'name', v_user.name,
      'email', v_user.email,
      'phone', v_user.phone,
      'tc_number', v_user.tc_number,
      'email_verified', v_user.email_verified,
      'created_at', v_user.created_at,
      'updated_at', v_user.updated_at
    ) as user_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

