# Supabase Edge Functions ve Migrations

Bu klasör, RandevuDent projesi için Supabase Edge Functions ve database migration'larını içerir.

## Kurulum

### 1. Supabase CLI Kurulumu

```bash
npm install -g supabase
```

### 2. Supabase Projesine Bağlanma

```bash
supabase login
supabase link --project-ref your-project-ref
```

### 3. Migration'ları Çalıştırma

```bash
supabase db push
```

veya

```bash
supabase migration up
```

### 4. Edge Functions'ları Deploy Etme

```bash
# Tüm fonksiyonları deploy et
supabase functions deploy

# Veya tek tek deploy et
supabase functions deploy send-verification-email
supabase functions deploy send-password-reset
```

## Edge Functions

### 1. send-verification-email

Yeni kayıt olan kullanıcılara e-posta doğrulama linki gönderir.

**Endpoint:** `POST /functions/v1/send-verification-email`

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "Kullanıcı Adı",
  "userId": "uuid-optional"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Doğrulama e-postası gönderildi"
}
```

### 2. send-password-reset

Şifresini unutan kullanıcılara şifre sıfırlama linki gönderir.

**Endpoint:** `POST /functions/v1/send-password-reset`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Şifre sıfırlama e-postası gönderildi"
}
```

## Environment Variables

Edge Functions için gerekli environment variable'lar:

```bash
# Supabase Dashboard > Project Settings > Edge Functions > Secrets

SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SITE_URL=https://yourdomain.com  # Production için
RESEND_API_KEY=your-resend-api-key  # E-posta göndermek için (opsiyonel)
EMAIL_FROM=noreply@randevudent.com  # Gönderen e-posta adresi
```

## E-posta Servisi Yapılandırması

Edge Functions, e-posta göndermek için Resend API'sini kullanır. Alternatif olarak:

1. **Resend** (Önerilen)
   - https://resend.com adresinden hesap oluşturun
   - API key alın ve `RESEND_API_KEY` olarak ekleyin

2. **SendGrid**
   - Edge Function'ları SendGrid API'sini kullanacak şekilde güncelleyin

3. **Supabase Auth** (Eğer Supabase Auth kullanıyorsanız)
   - Supabase'in kendi e-posta servisini kullanabilirsiniz

## Database Schema

### verification_tokens Tablosu

Token'ları saklamak için kullanılan tablo:

- `id`: UUID (Primary Key)
- `email`: TEXT (Kullanıcı e-postası)
- `token`: TEXT (Unique token)
- `type`: TEXT ('email_verification' veya 'password_reset')
- `user_id`: UUID (Kullanıcı ID, opsiyonel)
- `expires_at`: TIMESTAMPTZ (Token son kullanma tarihi)
- `used`: BOOLEAN (Token kullanıldı mı?)
- `created_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ

## Kullanım Örnekleri

### Frontend'den Edge Function Çağırma

```typescript
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/auth';

// E-posta doğrulama gönderme
await sendVerificationEmail('user@example.com', 'Kullanıcı Adı', 'user-id');

// Şifre sıfırlama e-postası gönderme
await sendPasswordResetEmail('user@example.com');
```

### Token Doğrulama

```typescript
import { verifyEmailWithToken, resetPasswordWithToken } from '@/lib/auth';

// E-posta doğrulama
await verifyEmailWithToken(token, email);

// Şifre sıfırlama
await resetPasswordWithToken(token, email, newPassword);
```

## Local Development

Edge Functions'ları local olarak test etmek için:

```bash
# Local Supabase başlat
supabase start

# Edge Functions'ı local olarak çalıştır
supabase functions serve send-verification-email
supabase functions serve send-password-reset
```

## Güvenlik Notları

1. **Token Güvenliği**: Token'lar UUID kullanılarak oluşturulur ve 24 saat (doğrulama) veya 1 saat (şifre sıfırlama) geçerlidir.

2. **Email Enumeration**: Şifre sıfırlama fonksiyonu, kullanıcı yoksa bile başarılı döner (güvenlik için).

3. **Token Tek Kullanım**: Token'lar kullanıldıktan sonra `used` olarak işaretlenir ve tekrar kullanılamaz.

4. **RLS Policies**: `verification_tokens` tablosu Row Level Security ile korunur.

## Troubleshooting

### E-posta gönderilmiyor

1. `RESEND_API_KEY` environment variable'ının doğru ayarlandığından emin olun
2. Resend dashboard'da domain doğrulaması yapıldığından emin olun
3. Edge Function loglarını kontrol edin: `supabase functions logs send-verification-email`

### Token doğrulanamıyor

1. Migration'ların çalıştırıldığından emin olun
2. `verify_token` fonksiyonunun database'de oluşturulduğunu kontrol edin
3. Token'ın süresinin dolmadığından emin olun

