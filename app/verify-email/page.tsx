"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // Get email from URL params or localStorage
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    const storedEmail = localStorage.getItem('pendingVerificationEmail');
    
    if (emailParam) {
      setEmail(emailParam);
      localStorage.setItem('pendingVerificationEmail', emailParam);
    } else if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (!email || countdown > 0) return;

    setIsResending(true);
    
    try {
      // Use Supabase Auth to resend confirmation email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      setIsResending(false);
      
      if (error) {
        console.error('Error resending verification email:', error);
        // Still show success to user (security best practice)
      }
      
      setResendSuccess(true);
      setCountdown(60); // 60 second cooldown
      
      setTimeout(() => {
        setResendSuccess(false);
      }, 3000);
    } catch (error: any) {
      setIsResending(false);
      console.error('Error resending verification email:', error);
      // Still show success to user (security best practice)
      setResendSuccess(true);
      setCountdown(60);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-md mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full mb-6">
            <Mail className="text-slate-950" size={40} />
          </div>
          <h1 className="text-3xl md:text-4xl font-light mb-4">E-posta Onayı Gerekli</h1>
          <p className="text-slate-400 font-light">
            Hesabınızı aktifleştirmek için e-posta adresinizi onaylamanız gerekiyor
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 md:p-8 space-y-6">
          {/* Email Display */}
          {email && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
              <p className="text-sm text-slate-400 font-light mb-1">E-posta adresiniz:</p>
              <p className="text-blue-400 font-light break-all">{email}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-400 text-sm font-light">1</span>
              </div>
              <div>
                <p className="text-slate-300 font-light mb-1">E-posta kutunuzu kontrol edin</p>
                <p className="text-sm text-slate-400 font-light">
                  {email || 'E-posta adresinize'} gönderilen onay linkine tıklayın
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-400 text-sm font-light">2</span>
              </div>
              <div>
                <p className="text-slate-300 font-light mb-1">Spam klasörünü kontrol edin</p>
                <p className="text-sm text-slate-400 font-light">
                  E-postamız spam klasörüne düşmüş olabilir
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-400 text-sm font-light">3</span>
              </div>
              <div>
                <p className="text-slate-300 font-light mb-1">Onay linkine tıklayın</p>
                <p className="text-sm text-slate-400 font-light">
                  Linke tıkladıktan sonra hesabınız otomatik olarak aktifleşecek
                </p>
              </div>
            </div>
          </div>

          {/* Resend Email */}
          <div className="pt-4 border-t border-slate-700/50">
            <p className="text-sm text-slate-400 font-light mb-4 text-center">
              E-posta gelmedi mi?
            </p>
            <button
              onClick={handleResendEmail}
              disabled={isResending || countdown > 0}
              className="w-full px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-lg font-light transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isResending ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Gönderiliyor...
                </>
              ) : countdown > 0 ? (
                <>
                  <RefreshCw size={18} />
                  {countdown} saniye sonra tekrar gönder
                </>
              ) : (
                <>
                  <Mail size={18} />
                  E-postayı Tekrar Gönder
                </>
              )}
            </button>

            {resendSuccess && (
              <div className="mt-3 flex items-center gap-2 text-sm text-green-400 bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                <CheckCircle2 size={16} />
                <span className="font-light">E-posta başarıyla gönderildi!</span>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-blue-300 font-light flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>
                E-posta onayı yapılmadan hesabınızla giriş yapamazsınız. Onay linki 24 saat geçerlidir.
              </span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <Link
            href="/login"
            className="block w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition text-center flex items-center justify-center gap-2"
          >
            Giriş Sayfasına Dön
            <ArrowRight size={18} />
          </Link>
          
          <Link
            href="/"
            className="block text-center text-sm text-slate-400 hover:text-slate-300 transition font-light"
          >
            ← Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
}

