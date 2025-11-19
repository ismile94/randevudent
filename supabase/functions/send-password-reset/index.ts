// Supabase Edge Function: Şifre Sıfırlama E-postası Gönderme
// Bu fonksiyon şifresini unutan kullanıcılara şifre sıfırlama e-postası gönderir

// @deno-types="https://deno.land/x/types/index.d.ts"
// @ts-ignore - Deno runtime için
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - Deno runtime için
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Deno global type declaration
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Supabase client oluştur
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Request body'den email al
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email gerekli' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Kullanıcının var olup olmadığını kontrol et
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('id, name, email')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (userError || !user) {
      // Güvenlik için kullanıcı yoksa da başarılı dönelim (email enumeration saldırısını önlemek için)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Eğer bu e-posta adresi kayıtlıysa, şifre sıfırlama linki gönderildi' 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Şifre sıfırlama token'ı oluştur
    const resetToken = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // 1 saat geçerli

    // Eski token'ları sil (aynı email için)
    await supabaseClient
      .from('verification_tokens')
      .delete()
      .eq('email', email.toLowerCase())
      .eq('type', 'password_reset')

    // Yeni token'ı veritabanına kaydet
    const { error: tokenError } = await supabaseClient
      .from('verification_tokens')
      .insert({
        email: email.toLowerCase(),
        token: resetToken,
        type: 'password_reset',
        expires_at: expiresAt.toISOString(),
        user_id: user.id,
      })

    if (tokenError) {
      console.error('Token kaydetme hatası:', tokenError)
      return new Response(
        JSON.stringify({ error: 'Token kaydedilemedi' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Şifre sıfırlama linki oluştur
    const baseUrl = Deno.env.get('SITE_URL') || 'http://localhost:3000'
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`

    // E-posta içeriği (HTML)
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Şifre Sıfırlama</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">Şifre Sıfırlama</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
          <p style="font-size: 16px; margin-bottom: 20px;">Merhaba <strong>${user.name}</strong>,</p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            Şifrenizi sıfırlamak için aşağıdaki linke tıklayın. Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 500;">
              Şifremi Sıfırla
            </a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Veya aşağıdaki linki tarayıcınıza kopyalayıp yapıştırabilirsiniz:
          </p>
          <p style="font-size: 12px; color: #999; word-break: break-all; background: #fff; padding: 10px; border-radius: 5px; border: 1px solid #e0e0e0;">
            ${resetLink}
          </p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 12px; color: #999; margin: 0;">
              <strong>Güvenlik Uyarısı:</strong> Bu link 1 saat geçerlidir ve sadece bir kez kullanılabilir. 
              Eğer bu talebi siz yapmadıysanız, hesabınızın güvenliği için şifrenizi değiştirmenizi öneririz.
            </p>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} RandevuDent. Tüm hakları saklıdır.</p>
        </div>
      </body>
      </html>
    `

    const emailText = `
Merhaba ${user.name},

Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:

${resetLink}

Bu link 1 saat geçerlidir ve sadece bir kez kullanılabilir.

Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.

© ${new Date().getFullYear()} RandevuDent. Tüm hakları saklıdır.
    `

    // E-posta gönderme için Resend kullanımı (opsiyonel)
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    if (RESEND_API_KEY) {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: Deno.env.get('EMAIL_FROM') || 'noreply@randevudent.com',
          to: email,
          subject: 'RandevuDent - Şifre Sıfırlama',
          html: emailHtml,
          text: emailText,
        }),
      })

      if (!resendResponse.ok) {
        const errorData = await resendResponse.text()
        console.error('E-posta gönderme hatası:', errorData)
        // Token oluşturuldu ama e-posta gönderilemedi
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Şifre sıfırlama e-postası gönderildi'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error: unknown) {
    console.error('Hata:', error)
    const errorMessage = error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

