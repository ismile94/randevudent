-- Token doğrulama fonksiyonu
-- Bu fonksiyon bir token'ın geçerli olup olmadığını kontrol eder

CREATE OR REPLACE FUNCTION verify_token(
  p_token TEXT,
  p_type TEXT,
  p_email TEXT DEFAULT NULL
)
RETURNS TABLE (
  is_valid BOOLEAN,
  user_id UUID,
  email TEXT,
  error_message TEXT
) AS $$
DECLARE
  v_token_record verification_tokens%ROWTYPE;
BEGIN
  -- Token'ı bul
  SELECT * INTO v_token_record
  FROM verification_tokens
  WHERE token = p_token
    AND type = p_type
    AND (p_email IS NULL OR email = LOWER(p_email))
    AND used = FALSE
    AND expires_at > NOW();

  -- Token bulunamadı veya geçersiz
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN as is_valid,
      NULL::UUID as user_id,
      NULL::TEXT as email,
      'Token geçersiz veya süresi dolmuş'::TEXT as error_message;
    RETURN;
  END IF;

  -- Token geçerli
  RETURN QUERY SELECT 
    TRUE::BOOLEAN as is_valid,
    v_token_record.user_id,
    v_token_record.email,
    NULL::TEXT as error_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Token'ı kullanıldı olarak işaretleme fonksiyonu
CREATE OR REPLACE FUNCTION mark_token_as_used(
  p_token TEXT,
  p_type TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE verification_tokens
  SET used = TRUE,
      updated_at = NOW()
  WHERE token = p_token
    AND type = p_type
    AND used = FALSE
    AND expires_at > NOW();

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

