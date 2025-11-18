"use client";
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { loginUser } from '@/lib/auth';
import { loginClinic, getAllClinics } from '@/lib/auth-clinic';
import { initializeMockClinicData } from '@/lib/mock-data-clinic';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    // Check if redirected from password reset
    if (searchParams?.get('passwordReset') === 'success') {
      showToast('Şifreniz başarıyla güncellendi! Giriş yapabilirsiniz.', 'success');
    }
  }, [searchParams]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'E-posta zorunludur';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Şifre zorunludur';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    setTimeout(() => {
      // First try patient login
      const patientResult = loginUser(formData.email, formData.password);
      
      if (patientResult.success && patientResult.user) {
        setIsSubmitting(false);
        showToast('Giriş başarılı! Yönlendiriliyorsunuz...', 'success');
        setTimeout(() => {
          // Check for redirect parameter
          const redirect = searchParams?.get('redirect');
          if (redirect) {
            router.push(redirect);
          } else {
            router.push('/dashboard');
          }
          router.refresh();
        }, 1500);
        return;
      }
      
      // If patient login failed, try clinic login
      // Check if it's test clinic
      if (formData.email === 'test@klinik.com' && formData.password === 'test123') {
        const mockClinic = {
          id: 'clinic-1',
          clinicName: 'Ağız ve Diş Sağlığı Merkezi',
          taxNumber: '1234567890',
          tradeRegistryNumber: 'TR-12345',
          phone: '0216 123 45 67',
          email: 'test@klinik.com',
          password: 'test123',
          website: 'https://www.agizdis.com',
          address: 'Atatürk Cad. No:123 Daire:5',
          district: 'Kadıköy',
          city: 'İstanbul',
          postalCode: '34700',
          authorizedPersonName: 'Dr. Ahmet Yılmaz',
          authorizedPersonTC: '12345678901',
          authorizedPersonPhone: '0555 123 45 67',
          authorizedPersonEmail: 'ahmet@klinik.com',
          authorizedPersonTitle: 'Klinik Müdürü',
          status: 'approved' as const,
          createdAt: new Date().toISOString(),
          verified: true,
        };
        
        localStorage.setItem('randevudent_current_clinic', JSON.stringify(mockClinic));
        initializeMockClinicData(mockClinic.id);
        
        setIsSubmitting(false);
        showToast('Klinik girişi başarılı! Yönlendiriliyorsunuz...', 'success');
        setTimeout(() => {
          router.push('/clinic/dashboard');
          router.refresh();
        }, 1500);
        return;
      }
      
      // Try regular clinic login
      const clinics = getAllClinics();
      const clinic = clinics.find(
        c => c.email.toLowerCase() === formData.email.toLowerCase() && c.password === formData.password
      );
      
      if (clinic) {
        localStorage.setItem('randevudent_current_clinic', JSON.stringify(clinic));
        setIsSubmitting(false);
        showToast('Klinik girişi başarılı! Yönlendiriliyorsunuz...', 'success');
        setTimeout(() => {
          router.push('/clinic/dashboard');
          router.refresh();
        }, 1500);
        return;
      }
      
      // Both failed
      setIsSubmitting(false);
      showToast('E-posta veya şifre hatalı!', 'error');
    }, 500);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

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
              <LogIn className="text-slate-950" size={24} />
            </div>
            <h1 className="text-3xl md:text-4xl font-light">Giriş Yap</h1>
          </div>
          <p className="text-slate-400 font-light">
            Hesabınıza giriş yaparak randevu alabilirsiniz
          </p>
        </div>

        {/* Form */}
        <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-light text-slate-300 mb-2">
                E-posta <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
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

            {/* Password */}
            <div>
              <label className="block text-sm font-light text-slate-300 mb-2">
                Şifre <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <Link 
                href="/forgot-password" 
                className="text-sm text-blue-400 hover:text-blue-300 transition font-light"
              >
                Şifremi Unuttum
              </Link>
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
                  Giriş yapılıyor...
                </>
              ) : (
                <>
                  Giriş Yap
                  <LogIn size={18} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-800/30 text-slate-400 font-light">veya</span>
            </div>
          </div>

          {/* Register Links */}
          <div className="text-center space-y-2">
            <p className="text-sm text-slate-400 font-light">
              Hesabınız yok mu?{' '}
              <Link 
                href="/register" 
                className="text-blue-400 hover:text-blue-300 transition font-light"
              >
                Hasta Üye Ol
              </Link>
              {' veya '}
              <Link 
                href="/clinic-register" 
                className="text-blue-400 hover:text-blue-300 transition font-light"
              >
                Klinik Kaydı
              </Link>
            </p>
            <p className="text-xs text-slate-500 font-light mt-2">
              Test için: test@klinik.com / test123
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link 
            href="/" 
            className="text-sm text-slate-400 hover:text-slate-300 transition font-light"
          >
            ← Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
