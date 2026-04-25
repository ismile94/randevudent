import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';

  if (!code && (!token_hash || !type)) {
    return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
  }

  const supabase = createServerClient();

  // Supabase can return either a PKCE code or token_hash/type pair.
  // Support both so password recovery links remain valid across templates.
  let data: any = null;
  let error: any = null;
  let verifiedType = type;

  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    data = result.data;
    error = result.error;
  } else if (token_hash && type) {
    const result = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    data = result.data;
    error = result.error;
  }

  const user = data?.user ?? data?.session?.user;
  if (error || !user) {
    console.error('Error verifying OTP:', error);
    return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
  }

  // Ensure user exists in our users table and update email_verified status
  if (verifiedType === 'email' || verifiedType === 'signup' || (code && next !== '/reset-password')) {
    // Check if user exists in users table
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email_verified')
      .eq('id', user.id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking user existence:', checkError);
    }

    if (!existingUser) {
      // Check if TC kimlik numarası already exists (if provided)
      const tcNumber = user.user_metadata?.tc_number;
      if (tcNumber && tcNumber.trim()) {
        const { data: existingUserByTC } = await supabase
          .from('users')
          .select('id, email')
          .eq('tc_number', tcNumber.trim())
          .maybeSingle();

        if (existingUserByTC) {
          console.error('TC kimlik numarası zaten kullanılıyor:', tcNumber, 'Mevcut kullanıcı:', existingUserByTC.email);
          // Continue anyway - user is verified in Auth, but log the error
        }
      }

      // User doesn't exist in users table, create it
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || '',
          email: user.email || '',
          phone: user.user_metadata?.phone || '',
          tc_number: tcNumber,
          password_hash: null, // Not needed with Supabase Auth
          email_verified: true,
        });

      if (insertError) {
        console.error('Error creating user record during email verification:', insertError);
        // Check if error is due to unique constraint violation on tc_number
        if (insertError.code === '23505' && (insertError.message.includes('tc_number') || insertError.message.includes('idx_users_tc_number_unique'))) {
          console.error('TC kimlik numarası unique constraint violation:', tcNumber);
          // Continue anyway - user is verified in Auth, but log the error
        } else {
          // Continue anyway - user is verified in Auth
        }
      } else {
        console.log('User record created successfully during email verification');
      }
    } else {
      // User exists, update email_verified status if it's not already true
      if (!existingUser.email_verified) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ email_verified: true })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating email_verified status:', updateError);
          // Continue anyway - user is verified in Auth
        } else {
          console.log('Email verified status updated successfully');
        }
      }
    }
  }

  // Handle password recovery flow
  if (verifiedType === 'recovery' || next === '/reset-password') {
    // Redirect to reset password page with session
    const redirectUrl = new URL('/reset-password', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // For email confirmation, redirect to email verified page
  if (type === 'email') {
    const redirectUrl = new URL('/email-verified', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Default redirect
  const redirectUrl = new URL(next, request.url);
  return NextResponse.redirect(redirectUrl);
}

