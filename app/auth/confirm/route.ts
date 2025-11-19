import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
  }

  const supabase = createServerClient();

  // Verify the OTP token
  const { data, error } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  });

  if (error || !data.user) {
    console.error('Error verifying OTP:', error);
    return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
  }

  // Ensure user exists in our users table and update email_verified status
  if (type === 'email') {
    // Check if user exists in users table
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email_verified')
      .eq('id', data.user.id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking user existence:', checkError);
    }

    if (!existingUser) {
      // Check if TC kimlik numarası already exists (if provided)
      const tcNumber = data.user.user_metadata?.tc_number;
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
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || '',
          email: data.user.email || '',
          phone: data.user.user_metadata?.phone || '',
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
          .eq('id', data.user.id);

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
  if (type === 'recovery') {
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

