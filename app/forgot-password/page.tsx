"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { sendPasswordResetEmail } from '@/lib/auth';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [emailSent, setEmailSent] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'E-posta zorunludur';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const result = await sendPasswordResetEmail(email);
      
      setIsSubmitting(false);
      
      if (result.success) {
        setEmailSent(true);
        showToast('Şifre sıfırlama e-postası gönderildi! E-posta kutunuzu kontrol edin.', 'success');
      } else {
        showToast(result.error || 'E-posta gönderilemedi. Lütfen tekrar deneyin.', 'error');
      }
    } catch (error: any) {
      setIsSubmitting(false);
      showToast(error.message || 'E-posta gönderilemedi. Lütfen tekrar deneyin.', 'error');
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        {/* Toast Notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur border min-w-[300px] max-w-md transition-all duration-300 animate-fade-in ${
                toast.type === 'success'
                  ? 'bg-green-900/90 border-green-500/50 text-green-100'
                  : 'bg-red-900/90 border-red-500/50 text-red-100'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="flex-shrink-0" size={20} />
              ) : (
                <AlertCircle className="flex-shrink-0" size={20} />
              )}
              <p className="flex-1 text-sm font-light">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-slate-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>

        <div className="max-w-md mx-auto px-4 py-12 md:py-20">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full mb-6">
              <Mail className="text-slate-950" size={40} />
            </div>
            <h1 className="text-3xl md:text-4xl font-light mb-4">E-posta Gönderildi</h1>
            <p className="text-slate-400 font-light">
              Şifre sıfırlama linki e-posta adresinize gönderildi
            </p>
          </div>

          {/* Main Content */}
          <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 md:p-8 space-y-6">
            {/* Email Display */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
              <p className="text-sm text-slate-400 font-light mb-1">E-posta adresiniz:</p>
              <p className="text-blue-400 font-light break-all">{email}</p>
            </div>

            {/* Instructions */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-400 text-sm font-light">1</span>
                </div>
                <div>
                  <p className="text-slate-300 font-light mb-1">E-posta kutunuzu kontrol edin</p>
                  <p className="text-sm text-slate-400 font-light">
                    {email} adresine gönderilen şifre sıfırlama linkine tıklayın
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
                  <p className="text-slate-300 font-light mb-1">Yeni şifrenizi belirleyin</p>
                  <p className="text-sm text-slate-400 font-light">
                    Linke tıkladıktan sonra yeni şifrenizi girebilirsiniz
                  </p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-300 font-light flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>
                  Şifre sıfırlama linki 1 saat geçerlidir. E-posta gelmediyse spam klasörünü kontrol edin veya tekrar deneyin.
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
              <ArrowLeft size={18} />
            </Link>
            
            <Link
              href="/"
              className="block text-center text-sm text-slate-400 hover:text-slate-300 transition font-light"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur border min-w-[300px] max-w-md transition-all duration-300 animate-fade-in ${
              toast.type === 'success'
                ? 'bg-green-900/90 border-green-500/50 text-green-100'
                : 'bg-red-900/90 border-red-500/50 text-red-100'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="flex-shrink-0" size={20} />
            ) : (
              <AlertCircle className="flex-shrink-0" size={20} />
            )}
            <p className="flex-1 text-sm font-light">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-slate-400 hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>

      <div className="max-w-md mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center">
              <Mail className="text-slate-950" size={24} />
            </div>
            <h1 className="text-3xl md:text-4xl font-light">Şifremi Unuttum</h1>
          </div>
          <p className="text-slate-400 font-light">
            E-posta adresinize şifre sıfırlama linki göndereceğiz
          </p>
        </div>

        {/* Form */}
        <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-light text-slate-300 mb-2">
                E-posta Adresi <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.email;
                        return newErrors;
                      });
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                  placeholder="ornek@email.com"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Info */}
            <div className="bg-slate-800/20 border border-slate-700/30 rounded-lg p-4">
              <p className="text-sm text-slate-400 font-light">
                Kayıtlı e-posta adresinizi girin. Size şifre sıfırlama linki göndereceğiz.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  Şifre Sıfırlama Linki Gönder
                  <Mail size={18} />
                </>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-slate-400 hover:text-slate-300 transition font-light flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} />
              Giriş Sayfasına Dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

