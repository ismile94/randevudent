"use client";
import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function EmailVerifiedPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-md mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full mb-6">
            <CheckCircle2 className="text-slate-950" size={40} />
          </div>
          <h1 className="text-3xl md:text-4xl font-light mb-4">E-posta Onaylandı!</h1>
          <p className="text-slate-400 font-light">
            Hesabınız başarıyla aktifleştirildi
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 md:p-8 space-y-6">
          <div className="text-center space-y-4">
            <p className="text-slate-300 font-light">
              E-posta adresiniz başarıyla doğrulandı. Artık hesabınıza giriş yapabilirsiniz.
            </p>
            
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <p className="text-sm text-green-300 font-light">
                Hesabınız aktif! Randevu almaya başlayabilirsiniz.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <Link
              href="/login"
              className="block w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition text-center flex items-center justify-center gap-2"
            >
              Giriş Yap
              <ArrowRight size={18} />
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
    </div>
  );
}

