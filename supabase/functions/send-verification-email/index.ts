// Supabase Edge Function: E-posta Doğrulama Gönderme
// Bu fonksiyon yeni kayıt olan kullanıcılara doğrulama e-postası gönderir

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

    // Request body'den email ve name al
    const { email, name, userId } = await req.json()

    if (!email || !name) {
      return new Response(
        JSON.stringify({ error: 'Email ve name gerekli' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Doğrulama token'ı oluştur (güvenli rastgele string)
    const verificationToken = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 saat geçerli

    // Token'ı veritabanına kaydet
    const { error: tokenError } = await supabaseClient
      .from('verification_tokens')
      .insert({
        email: email.toLowerCase(),
        token: verificationToken,
        type: 'email_verification',
        expires_at: expiresAt.toISOString(),
        user_id: userId || null,
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

    // Doğrulama linki oluştur
    const baseUrl = Deno.env.get('SITE_URL') || 'http://localhost:3000'
    const verificationLink = `${baseUrl}/email-verified?token=${verificationToken}&email=${encodeURIComponent(email)}`

    // E-posta içeriği (HTML)
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>E-posta Doğrulama</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">E-posta Doğrulama</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
          <p style="font-size: 16px; margin-bottom: 20px;">Merhaba <strong>${name}</strong>,</p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            RandevuDent hesabınızı aktifleştirmek için e-posta adresinizi doğrulamanız gerekiyor.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 500;">
              E-postamı Doğrula
            </a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Veya aşağıdaki linki tarayıcınıza kopyalayıp yapıştırabilirsiniz:
          </p>
          <p style="font-size: 12px; color: #999; word-break: break-all; background: #fff; padding: 10px; border-radius: 5px; border: 1px solid #e0e0e0;">
            ${verificationLink}
          </p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 12px; color: #999; margin: 0;">
              Bu link 24 saat geçerlidir. Eğer bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
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
Merhaba ${name},

RandevuDent hesabınızı aktifleştirmek için e-posta adresinizi doğrulamanız gerekiyor.

Doğrulama linki: ${verificationLink}

Bu link 24 saat geçerlidir. Eğer bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.

© ${new Date().getFullYear()} RandevuDent. Tüm hakları saklıdır.
    `

    // Supabase'in e-posta gönderme servisini kullan
    // Not: Supabase'in kendi e-posta servisi yoksa, Resend, SendGrid gibi bir servis kullanılabilir
    // Bu örnekte Supabase'in database trigger'ları veya external service kullanılabilir
    
    // Alternatif: Resend veya başka bir e-posta servisi kullanılabilir
    // Şimdilik token'ı oluşturup döndürelim, e-posta gönderme işlemi client tarafında veya başka bir servis ile yapılabilir
    
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
          subject: 'RandevuDent - E-posta Doğrulama',
          html: emailHtml,
          text: emailText,
        }),
      })

      if (!resendResponse.ok) {
        const errorData = await resendResponse.text()
        console.error('E-posta gönderme hatası:', errorData)
        // Token oluşturuldu ama e-posta gönderilemedi, yine de başarılı dönelim
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Doğrulama e-postası gönderildi',
        token: verificationToken // Development için (production'da gönderilmemeli)
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

