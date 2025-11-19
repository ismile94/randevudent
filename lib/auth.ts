// Supabase-based authentication utility

import { supabase } from './supabase';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  tc_number?: string;
  password_hash?: string; // Not returned in queries, only for internal use
  email_verified?: boolean;
  created_at: string;
  updated_at?: string;
}

// Map Supabase user to our User interface
function mapSupabaseUser(data: any): User {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    tc_number: data.tc_number,
    email_verified: data.email_verified || false,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

const SESSION_TOKEN_KEY = 'randevudent_session_token';

// Get Supabase URL for Edge Functions
function getSupabaseUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  }
  return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
}

// Get Supabase Anon Key
function getSupabaseAnonKey(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  }
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
}

// Get all users from Supabase (admin only - for migration purposes)
export async function getAllUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, tc_number, email_verified, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return data ? data.map(mapSupabaseUser) : [];
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return [];
  }
}

// Register a new user using Supabase Auth
export async function registerUser(userData: {
  name: string;
  email: string;
  phone: string;
  password: string;
  tcNumber?: string;
}): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    // Get site URL for redirect
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const redirectUrl = `${siteUrl}/email-verified`;

    // Register user with Supabase Auth - this automatically sends "Confirm your signup" email
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email.toLowerCase(),
      password: userData.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: userData.name,
          phone: userData.phone,
          tc_number: userData.tcNumber,
        },
      },
    });

    if (authError) {
      console.error('Error registering user with Supabase Auth:', authError);
      // Handle specific errors
      if (authError.message.includes('already registered')) {
        return { success: false, error: 'Bu e-posta adresi zaten kullanılıyor' };
      }
      return { success: false, error: authError.message || 'Kayıt başarısız' };
    }

    if (!authData.user) {
      return { success: false, error: 'Kullanıcı oluşturulamadı' };
    }

    // Check if TC kimlik numarası already exists (if provided)
    if (userData.tcNumber && userData.tcNumber.trim()) {
      const { data: existingUserByTC } = await supabase
        .from('users')
        .select('id, email')
        .eq('tc_number', userData.tcNumber.trim())
        .maybeSingle();

      if (existingUserByTC) {
        return {
          success: false,
          error: 'Bu TC kimlik numarası zaten başka bir hesapta kullanılıyor'
        };
      }
    }

    // Check if user already exists in users table (by email or id)
    const { data: existingUserByEmail } = await supabase
      .from('users')
      .select('id, name, email, phone, tc_number, email_verified, created_at, updated_at')
      .eq('email', userData.email.toLowerCase())
      .maybeSingle();

    const { data: existingUserById } = await supabase
      .from('users')
      .select('id, name, email, phone, tc_number, email_verified, created_at, updated_at')
      .eq('id', authData.user.id)
      .maybeSingle();

    let userData_db;

    if (existingUserById) {
      // Check if TC kimlik numarası is being changed and if it's already used by another user
      if (userData.tcNumber && userData.tcNumber.trim() && existingUserById.tc_number !== userData.tcNumber.trim()) {
        const { data: existingUserByTC } = await supabase
          .from('users')
          .select('id, email')
          .eq('tc_number', userData.tcNumber.trim())
          .neq('id', authData.user.id)
          .maybeSingle();

        if (existingUserByTC) {
          return {
            success: false,
            error: 'Bu TC kimlik numarası zaten başka bir hesapta kullanılıyor'
          };
        }
      }

      // User exists with same ID, update it
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          name: userData.name,
          phone: userData.phone,
          tc_number: userData.tcNumber,
          email_verified: false,
        })
        .eq('id', authData.user.id)
        .select('id, name, email, phone, tc_number, email_verified, created_at, updated_at')
        .single();

      if (updateError) {
        console.error('Error updating user record:', updateError);
        // Check if error is due to unique constraint violation on tc_number
        if (updateError.code === '23505' && updateError.message.includes('tc_number')) {
          return {
            success: false,
            error: 'Bu TC kimlik numarası zaten başka bir hesapta kullanılıyor'
          };
        }
        return { 
          success: false, 
          error: `Kullanıcı kaydı güncellenemedi: ${updateError.message || 'Bilinmeyen hata'}` 
        };
      }

      userData_db = updatedUser;
    } else if (existingUserByEmail) {
      // User exists with same email but different ID - this shouldn't happen with Supabase Auth
      // But if it does, return error
      return { 
        success: false, 
        error: 'Bu e-posta adresi zaten kullanılıyor' 
      };
    } else {
      // Create new user record in our users table
      // Note: password_hash is not needed since we're using Supabase Auth
      const { data: newUserData, error: dbError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          name: userData.name,
          email: userData.email.toLowerCase(),
          phone: userData.phone,
          tc_number: userData.tcNumber,
          password_hash: null, // Not needed with Supabase Auth
          email_verified: false, // Will be updated when email is confirmed
        })
        .select('id, name, email, phone, tc_number, email_verified, created_at, updated_at')
        .single();

      if (dbError) {
        console.error('Error creating user record in users table:', dbError);
        
        // If it's a duplicate key error, try to get existing user
        if (dbError.code === '23505') { // Unique violation
          // Check if it's a TC kimlik numarası violation
          if (dbError.message.includes('tc_number') || dbError.message.includes('idx_users_tc_number_unique')) {
            return {
              success: false,
              error: 'Bu TC kimlik numarası zaten başka bir hesapta kullanılıyor'
            };
          }

          const { data: existingUser } = await supabase
            .from('users')
            .select('id, name, email, phone, tc_number, email_verified, created_at, updated_at')
            .eq('id', authData.user.id)
            .maybeSingle();
          
          if (existingUser) {
            userData_db = existingUser;
          } else {
            // Try by email
            const { data: existingByEmail } = await supabase
              .from('users')
              .select('id, name, email, phone, tc_number, email_verified, created_at, updated_at')
              .eq('email', userData.email.toLowerCase())
              .maybeSingle();
            
            if (existingByEmail) {
              return { 
                success: false, 
                error: 'Bu e-posta adresi zaten kullanılıyor' 
              };
            }
            
            return { 
              success: false, 
              error: `Kullanıcı kaydı oluşturulamadı: ${dbError.message || 'Bilinmeyen hata'}` 
            };
          }
        } else {
          return { 
            success: false, 
            error: `Kullanıcı kaydı oluşturulamadı: ${dbError.message || 'Bilinmeyen hata'}` 
          };
        }
      } else {
        userData_db = newUserData;
      }
    }

    if (!userData_db) {
      return { success: false, error: 'Kullanıcı kaydı oluşturulamadı' };
    }

    const user = mapSupabaseUser(userData_db);

    // Note: Session is not created here because email needs to be verified first
    // Supabase Auth automatically sends the confirmation email

    return { success: true, user };
  } catch (error: any) {
    console.error('Error in registerUser:', error);
    return { success: false, error: error.message || 'Kayıt başarısız' };
  }
}

// Login user using Supabase Auth
export async function loginUser(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: password,
    });

    if (authError) {
      console.error('Login error:', authError);
      
      // Check if email is not verified
      if (authError.message.includes('Email not confirmed') || authError.message.includes('email_not_confirmed')) {
        // Get user data from our users table
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, email, phone, tc_number, email_verified, created_at, updated_at')
          .eq('email', email.toLowerCase())
          .maybeSingle();

        if (userData) {
          return { 
            success: false, 
            error: 'email_not_verified',
            user: mapSupabaseUser(userData)
          };
        }
        
        return { 
          success: false, 
          error: 'E-posta adresinizi doğrulamanız gerekiyor. Lütfen e-posta kutunuzu kontrol edin.' 
        };
      }

      return { success: false, error: 'E-posta veya şifre hatalı' };
    }

    if (!authData.user) {
      return { success: false, error: 'Giriş başarısız' };
    }

    // Check if email is verified
    if (!authData.user.email_confirmed_at) {
      // Get user data from our users table
      const { data: userData } = await supabase
        .from('users')
        .select('id, name, email, phone, tc_number, email_verified, created_at, updated_at')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (userData) {
        return { 
          success: false, 
          error: 'email_not_verified',
          user: mapSupabaseUser(userData)
        };
      }

      return { 
        success: false, 
        error: 'E-posta adresinizi doğrulamanız gerekiyor. Lütfen e-posta kutunuzu kontrol edin.' 
      };
    }

    // Get user data from our users table
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('id, name, email, phone, tc_number, email_verified, created_at, updated_at')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (dbError) {
      console.error('Error fetching user data:', dbError);
      return { success: false, error: 'Kullanıcı bilgileri alınamadı' };
    }

    if (!userData) {
      // Check if TC kimlik numarası already exists (if provided)
      const tcNumber = authData.user.user_metadata?.tc_number;
      if (tcNumber && tcNumber.trim()) {
        const { data: existingUserByTC } = await supabase
          .from('users')
          .select('id, email')
          .eq('tc_number', tcNumber.trim())
          .maybeSingle();

        if (existingUserByTC) {
          return {
            success: false,
            error: 'Bu TC kimlik numarası zaten başka bir hesapta kullanılıyor'
          };
        }
      }

      // User record doesn't exist in our users table, create it
      const { data: newUserData, error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || '',
          email: authData.user.email || '',
          phone: authData.user.user_metadata?.phone || '',
          tc_number: tcNumber,
          password_hash: null, // Not needed with Supabase Auth
          email_verified: true, // Email is confirmed in Supabase Auth
        })
        .select('id, name, email, phone, tc_number, email_verified, created_at, updated_at')
        .single();

      if (insertError) {
        console.error('Error creating user record:', insertError);
        // Check if error is due to unique constraint violation on tc_number
        if (insertError.code === '23505' && (insertError.message.includes('tc_number') || insertError.message.includes('idx_users_tc_number_unique'))) {
          return {
            success: false,
            error: 'Bu TC kimlik numarası zaten başka bir hesapta kullanılıyor'
          };
        }
        return { success: false, error: 'Kullanıcı kaydı oluşturulamadı' };
      }

      if (newUserData) {
        const user = mapSupabaseUser(newUserData);
        // Update session in our sessions table
        await createSession(user.id);
        return { success: true, user };
      }
    }

    if (!userData) {
      return { success: false, error: 'Kullanıcı bilgileri alınamadı' };
    }

    // Update email_verified status if needed
    // If email is confirmed in Supabase Auth but not in our users table, update it
    if (authData.user.email_confirmed_at && !userData.email_verified) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ email_verified: true })
        .eq('id', authData.user.id);

      if (updateError) {
        console.error('Error updating email_verified status:', updateError);
        // Continue anyway - user can still login
      } else {
        // Update userData to reflect the change
        userData.email_verified = true;
      }
    }

    const user = mapSupabaseUser(userData);
    
    // Create session in our sessions table
    await createSession(user.id);

    return { success: true, user };
  } catch (error: any) {
    console.error('Error in loginUser:', error);
    return { success: false, error: error.message || 'Giriş başarısız' };
  }
}

// Create session in Supabase
async function createSession(userId: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    // Generate session token
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    // Delete old sessions for this user
    await supabase
      .from('sessions')
      .delete()
      .eq('user_id', userId);

    // Create new session
    const { error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        token: sessionToken,
        expires_at: expiresAt.toISOString(),
      });

    if (error) {
      console.error('Error creating session:', error);
      return { success: false, error: error.message };
    }

    // Store token in localStorage (only token, not user data)
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
    }

    return { success: true, token: sessionToken };
  } catch (error: any) {
    console.error('Error in createSession:', error);
    return { success: false, error: error.message };
  }
}

// Get current logged in user from Supabase
export async function getCurrentUser(): Promise<User | null> {
  if (typeof window === 'undefined') return null;

  try {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!sessionToken) {
      return null;
    }

    // Verify session and get user from Supabase
    const { data, error } = await supabase.rpc('verify_session', {
      p_token: sessionToken,
    });

    if (error) {
      console.error('Error verifying session:', error);
      // Clear invalid token
      localStorage.removeItem(SESSION_TOKEN_KEY);
      return null;
    }

    if (!data || data.length === 0 || !data[0].is_valid) {
      // Session invalid, clear token
      localStorage.removeItem(SESSION_TOKEN_KEY);
      return null;
    }

    // Parse user data from JSONB
    const userData = data[0].user_data;
    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      tc_number: userData.tc_number,
      email_verified: userData.email_verified || false,
      created_at: userData.created_at,
      updated_at: userData.updated_at,
    };
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

// Logout user (delete session from Supabase)
export async function logoutUser(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (sessionToken) {
      // Delete session from Supabase
      await supabase
        .from('sessions')
        .delete()
        .eq('token', sessionToken);
    }
  } catch (error) {
    console.error('Error in logoutUser:', error);
  } finally {
    // Clear token from localStorage
    localStorage.removeItem(SESSION_TOKEN_KEY);
  }
}

// Check if user is authenticated (from Supabase)
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

// Send verification email via Edge Function
export async function sendVerificationEmail(
  email: string,
  name: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseUrl = getSupabaseUrl();
    const supabaseAnonKey = getSupabaseAnonKey();

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase yapılandırması eksik:', { supabaseUrl: !!supabaseUrl, supabaseAnonKey: !!supabaseAnonKey });
      return { success: false, error: 'Supabase yapılandırması eksik' };
    }

    const functionUrl = `${supabaseUrl}/functions/v1/send-verification-email`;
    console.log('Sending verification email to:', email, 'via:', functionUrl);

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        email,
        name,
        userId,
      }),
    });

    console.log('Edge Function response status:', response.status, response.statusText);

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      const text = await response.text();
      console.error('Response parse error:', text);
      return { 
        success: false, 
        error: `Edge Function hatası (${response.status}): ${text || 'Yanıt parse edilemedi'}` 
      };
    }

    if (!response.ok) {
      console.error('Edge Function error:', data);
      return { 
        success: false, 
        error: data.error || data.message || `E-posta gönderilemedi (${response.status})` 
      };
    }

    console.log('Verification email sent successfully:', data);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending verification email:', error);
    return { 
      success: false, 
      error: error.message || 'E-posta gönderilemedi. Edge Function deploy edilmiş mi kontrol edin.' 
    };
  }
}

// Send password reset email using Supabase Auth
export async function sendPasswordResetEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get site URL for redirect
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    // Use /auth/confirm endpoint for PKCE flow token exchange
    const redirectUrl = `${siteUrl}/auth/confirm?next=/reset-password`;

    // Use Supabase Auth's built-in password reset - this automatically sends "Reset password" email
    const { data, error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        name: error.name,
        code: (error as any).code,
      });
      
      // Check for specific error types
      if (error.status === 500 || error.message.includes('unexpected_failure') || (error as any).code === 'unexpected_failure') {
        // This usually means email service is not configured
        return { 
          success: false, 
          error: 'E-posta servisi yapılandırılmamış. Lütfen Supabase Dashboard > Authentication > Email Settings bölümünden email servisini yapılandırın. SMTP ayarlarını kontrol edin veya Supabase\'in varsayılan email servisini aktif edin.' 
        };
      }
      
      if (error.message.includes('redirect') || error.message.includes('URL') || error.message.includes('redirect_to')) {
        return { 
          success: false, 
          error: `Redirect URL yapılandırması hatalı. Lütfen Supabase Dashboard > Authentication > URL Configuration bölümünden "${redirectUrl}" adresini Redirect URLs listesine ekleyin.` 
        };
      }
      
      // For other errors, show the actual error message for debugging
      return { 
        success: false, 
        error: `E-posta gönderilemedi: ${error.message || 'Bilinmeyen hata'}. Lütfen Supabase Dashboard'daki email ayarlarını kontrol edin.` 
      };
    }

    // Success - email sent
    return { success: true };
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    return { 
      success: false, 
      error: 'E-posta gönderilemedi. Lütfen tekrar deneyin.' 
    };
  }
}

// Verify token (for email verification or password reset)
export async function verifyToken(
  token: string,
  type: 'email_verification' | 'password_reset',
  email?: string
): Promise<{ success: boolean; error?: string; userId?: string; email?: string }> {
  try {
    const { data, error } = await supabase.rpc('verify_token', {
      p_token: token,
      p_type: type,
      p_email: email || null,
    });

    if (error) {
      return { success: false, error: error.message || 'Token doğrulanamadı' };
    }

    if (!data || data.length === 0 || !data[0].is_valid) {
      return { success: false, error: data?.[0]?.error_message || 'Token geçersiz veya süresi dolmuş' };
    }

    return {
      success: true,
      userId: data[0].user_id,
      email: data[0].email,
    };
  } catch (error: any) {
    console.error('Error verifying token:', error);
    return { success: false, error: error.message || 'Token doğrulanamadı' };
  }
}

// Mark token as used
export async function markTokenAsUsed(
  token: string,
  type: 'email_verification' | 'password_reset'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('mark_token_as_used', {
      p_token: token,
      p_type: type,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error marking token as used:', error);
    return { success: false, error: error.message };
  }
}

// Verify email with token
export async function verifyEmailWithToken(
  token: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify token
    const tokenVerification = await verifyToken(token, 'email_verification', email);
    if (!tokenVerification.success) {
      return tokenVerification;
    }

    // Mark token as used
    await markTokenAsUsed(token, 'email_verification');

    // Update user email verification status
    const { error } = await supabase
      .from('users')
      .update({ email_verified: true })
      .eq('email', email.toLowerCase());

    if (error) {
      return { success: false, error: error.message };
    }

    // Session will be updated on next getCurrentUser() call

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Update user email verification status (legacy function, kept for backward compatibility)
export async function verifyUserEmail(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ email_verified: true })
      .eq('email', email.toLowerCase());

    if (error) {
      return { success: false, error: error.message };
    }

    // Session will be updated on next getCurrentUser() call

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Update user password (for password reset)
export async function updateUserPassword(email: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Hash password with bcrypt in production
    // const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { error } = await supabase
      .from('users')
      .update({ 
        password_hash: newPassword, // TODO: Hash this in production
        updated_at: new Date().toISOString(),
      })
      .eq('email', email.toLowerCase());

    if (error) {
      return { success: false, error: error.message || 'Şifre güncellenemedi' };
    }

    // Session will be updated on next getCurrentUser() call

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Şifre güncellenemedi' };
  }
}

// Reset password with token
export async function resetPasswordWithToken(
  token: string,
  email: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify token
    const tokenVerification = await verifyToken(token, 'password_reset', email);
    if (!tokenVerification.success) {
      return tokenVerification;
    }

    // Mark token as used
    await markTokenAsUsed(token, 'password_reset');

    // Update password
    return await updateUserPassword(email, newPassword);
  } catch (error: any) {
    return { success: false, error: error.message || 'Şifre sıfırlanamadı' };
  }
}

// Check if email exists
export async function emailExists(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    return !error && !!data;
  } catch (error) {
    return false;
  }
}

// Update user profile
export async function updateUserProfile(userId: string, updates: {
  name?: string;
  phone?: string;
  tc_number?: string;
}): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    // Get current user data to check if TC kimlik numarası is being changed
    const { data: currentUser } = await supabase
      .from('users')
      .select('tc_number')
      .eq('id', userId)
      .maybeSingle();

    // Check if TC kimlik numarası is being changed and if it's already used by another user
    if (updates.tc_number !== undefined && updates.tc_number !== null && updates.tc_number.trim()) {
      const newTCNumber = updates.tc_number.trim();
      const currentTCNumber = currentUser?.tc_number?.trim() || null;

      // Only check if the TC number is actually changing
      if (newTCNumber !== currentTCNumber) {
        const { data: existingUserByTC } = await supabase
          .from('users')
          .select('id, email')
          .eq('tc_number', newTCNumber)
          .neq('id', userId)
          .maybeSingle();

        if (existingUserByTC) {
          return {
            success: false,
            error: 'Bu TC kimlik numarası zaten başka bir hesapta kullanılıyor'
          };
        }
      }
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name) updateData.name = updates.name;
    if (updates.phone) updateData.phone = updates.phone;
    if (updates.tc_number !== undefined) updateData.tc_number = updates.tc_number;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, name, email, phone, tc_number, email_verified, created_at, updated_at')
      .single();

    if (error) {
      // Check if error is due to unique constraint violation on tc_number
      if (error.code === '23505' && (error.message.includes('tc_number') || error.message.includes('idx_users_tc_number_unique'))) {
        return {
          success: false,
          error: 'Bu TC kimlik numarası zaten başka bir hesapta kullanılıyor'
        };
      }
      return { success: false, error: error.message };
    }

    const user = mapSupabaseUser(data);

    // Session will be updated on next getCurrentUser() call

    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
