# Supabase Edge Functions Kurulum Rehberi

## Sorun Giderme Adımları

### 1. Edge Function'ları Deploy Edin

Edge Function'lar deploy edilmeden çalışmaz. Aşağıdaki komutları çalıştırın:

```bash
# Supabase CLI ile login olun (eğer yapmadıysanız)
supabase login

# Projenize bağlanın
supabase link --project-ref yvobgrquzdbauvaiapfi

# Edge Function'ları deploy edin
supabase functions deploy send-verification-email
supabase functions deploy send-password-reset
```

### 2. Migration'ları Çalıştırın

Database migration'larını çalıştırın:

```bash
supabase db push
```

Veya Supabase Dashboard'dan:
1. Supabase Dashboard > SQL Editor'e gidin
2. `supabase/migrations/001_create_verification_tokens.sql` dosyasını çalıştırın
3. `supabase/migrations/002_verify_token_function.sql` dosyasını çalıştırın
4. `supabase/migrations/003_fix_users_rls.sql` dosyasını çalıştırın

### 3. Environment Variables Ayarlayın

Supabase Dashboard > Project Settings > Edge Functions > Secrets bölümünden:

```
SITE_URL=http://localhost:3000
RESEND_API_KEY=your-resend-api-key (opsiyonel - e-posta göndermek için)
EMAIL_FROM=noreply@randevudent.com
```

**Not:** E-posta göndermek için Resend API key gerekli. Eğer yoksa:
- https://resend.com adresinden ücretsiz hesap oluşturun
- API key alın ve yukarıdaki gibi ekleyin

### 4. Console'da Hata Kontrolü

Şimdi kayıt işlemini tekrar deneyin ve browser console'unda şu mesajları kontrol edin:

- ✅ "Sending verification email to: ..." - E-posta gönderme başladı
- ✅ "Edge Function response status: 200" - Edge Function başarılı
- ✅ "Verification email sent successfully" - E-posta gönderildi
- ❌ Hata mesajları varsa, bunları not edin

### 5. Edge Function Loglarını Kontrol Edin

Eğer hala e-posta gelmiyorsa:

```bash
# Edge Function loglarını görüntüleyin
supabase functions logs send-verification-email
```

Veya Supabase Dashboard'dan:
1. Edge Functions > send-verification-email > Logs

### 6. Test Etme

Edge Function'ı manuel test etmek için:

```bash
curl -X POST \
  'https://yvobgrquzdbauvaiapfi.supabase.co/functions/v1/send-verification-email' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "userId": "test-id"
  }'
```

## Yaygın Hatalar ve Çözümleri

### Hata: "Edge Function not found" veya 404
**Çözüm:** Edge Function deploy edilmemiş. Yukarıdaki adım 1'i tekrar yapın.

### Hata: "RESEND_API_KEY is not set"
**Çözüm:** Environment variable'ı Supabase Dashboard'dan ekleyin (Adım 3).

### Hata: "Token kaydedilemedi"
**Çözüm:** Migration'lar çalıştırılmamış. Adım 2'yi tekrar yapın.

### Hata: HTTP 406 (Not Acceptable)
**Çözüm:** RLS politikaları sorunu. Migration 003'ü çalıştırın.

## E-posta Göndermeden Test Etme

E-posta servisi olmadan da test edebilirsiniz. Edge Function token oluşturur ve veritabanına kaydeder. 
Token'ı console'da görebilirsiniz (development için). Production'da token console'a yazdırılmaz.

Token'ı manuel olarak test etmek için:
1. Console'da token'ı kopyalayın
2. `http://localhost:3000/email-verified?token=TOKEN&email=EMAIL` adresine gidin

