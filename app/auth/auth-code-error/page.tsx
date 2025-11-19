"use client";
import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-md mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-400 to-orange-400 rounded-full mb-6">
            <AlertCircle className="text-slate-950" size={40} />
          </div>
          <h1 className="text-3xl md:text-4xl font-light mb-4">Doğrulama Hatası</h1>
          <p className="text-slate-400 font-light">
            Doğrulama linki geçersiz veya süresi dolmuş
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 md:p-8 space-y-6">
          <div className="space-y-4">
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <p className="text-sm text-red-300 font-light">
                Doğrulama linki geçersiz, süresi dolmuş veya zaten kullanılmış olabilir.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-slate-300 font-light">Yapabilecekleriniz:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-400 font-light ml-4">
                <li>Yeni bir doğrulama linki isteyin</li>
                <li>E-posta kutunuzu ve spam klasörünüzü kontrol edin</li>
                <li>Linkin 24 saat içinde kullanıldığından emin olun</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <Link
              href="/verify-email"
              className="block w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition text-center flex items-center justify-center gap-2"
            >
              Yeni Doğrulama Linki İste
            </Link>
            
            <Link
              href="/login"
              className="block text-center text-sm text-slate-400 hover:text-slate-300 transition font-light flex items-center justify-center gap-2"
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

