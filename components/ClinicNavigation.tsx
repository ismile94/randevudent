"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentClinic, logoutClinic } from '@/lib/auth-clinic';
import { Building2, LayoutDashboard, Calendar, Users, Settings, LogOut } from 'lucide-react';

interface ClinicNavigationProps {
  clinicName?: string;
}

export default function ClinicNavigation({ clinicName: propClinicName }: ClinicNavigationProps) {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [clinic, setClinic] = useState<any>(null);

  useEffect(() => {
    const currentClinic = getCurrentClinic();
    if (currentClinic) {
      setClinic(currentClinic);
    }
  }, []);

  const handleLogout = () => {
    logoutClinic();
    setClinic(null);
    setShowUserMenu(false);
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="relative z-20 px-4 md:px-6 py-4 md:py-6 flex justify-between items-center max-w-7xl mx-auto gap-4">
      <Link href="/clinic/dashboard" className="flex items-center gap-2 flex-shrink-0">
        <Building2 size={24} className="text-blue-400" />
        <span className="text-lg md:text-xl font-light tracking-wider">Klinik Paneli</span>
      </Link>
      
      <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
        <div className="hidden md:flex gap-8 text-sm font-light">
          <Link href="/clinic/dashboard" className="hover:text-blue-400 transition flex items-center gap-2">
            <LayoutDashboard size={16} />
            Dashboard
          </Link>
          <Link href="/clinic/appointments" className="hover:text-blue-400 transition flex items-center gap-2">
            <Calendar size={16} />
            Randevular
          </Link>
          <Link href="/clinic/patients" className="hover:text-blue-400 transition flex items-center gap-2">
            <Users size={16} />
            Hastalar
          </Link>
          <Link href="/clinic/staff" className="hover:text-blue-400 transition flex items-center gap-2">
            <Users size={16} />
            Kadro
          </Link>
          <Link href="/clinic/settings" className="hover:text-blue-400 transition flex items-center gap-2">
            <Settings size={16} />
            Ayarlar
          </Link>
        </div>
        
        {clinic ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm border border-slate-600/50 hover:border-blue-400/50 hover:text-blue-400 rounded-lg transition font-light whitespace-nowrap"
            >
              {clinic.clinicName || 'Klinik'}
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800/95 backdrop-blur border border-slate-700/50 rounded-lg shadow-lg py-2 z-50">
                <Link
                  href="/clinic/dashboard"
                  className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-blue-400 transition font-light"
                  onClick={() => setShowUserMenu(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/clinic/settings"
                  className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-blue-400 transition font-light"
                  onClick={() => setShowUserMenu(false)}
                >
                  Ayarlar
                </Link>
                <div className="border-t border-slate-700/50 my-2"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-red-400 transition font-light flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login">
            <button className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition whitespace-nowrap">
              Giriş Yap
            </button>
          </Link>
        )}
      </div>
    </nav>
  );
}

