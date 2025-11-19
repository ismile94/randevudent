"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logoutUser } from '@/lib/auth';

interface NavigationProps {
  isAuthenticated?: boolean;
  userName?: string;
}

export default function Navigation({ isAuthenticated: propIsAuthenticated, userName: propUserName }: NavigationProps) {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(propIsAuthenticated ?? false);
  const [userName, setUserName] = useState(propUserName);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    // Check authentication status from Supabase
    const checkAuth = async () => {
      const user = await getCurrentUser();
      if (user) {
        setIsAuthenticated(true);
        setUserName(user.name);
      } else {
        setIsAuthenticated(false);
        setUserName(undefined);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setIsAuthenticated(false);
    setUserName(undefined);
    setShowUserMenu(false);
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="relative z-20 px-4 md:px-6 py-4 md:py-6 flex justify-between items-center max-w-7xl mx-auto gap-4">
      <Link href="/" className="flex items-center flex-shrink-0 group">
        {!logoError ? (
          <img 
            src="/logo.png" 
            alt="RandevuDent Logo" 
            className="h-14 md:h-16 object-contain transition-all duration-300 hover:scale-110 hover:brightness-110 cursor-pointer"
            onError={() => setLogoError(true)}
          />
        ) : (
          <span className="text-xl md:text-2xl font-light tracking-wider transition-all duration-300 group-hover:text-blue-400 group-hover:scale-105 cursor-pointer">
            RandevuDent
          </span>
        )}
      </Link>
      <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
        <div className="hidden md:flex gap-8 text-sm font-light">
          <Link href="/clinics" className="hover:text-blue-400 transition">
            Klinikler
          </Link>
          <Link href="/contact" className="hover:text-blue-400 transition">
            İletişim
          </Link>
        </div>
        {isAuthenticated ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm border border-slate-600/50 hover:border-blue-400/50 hover:text-blue-400 rounded-lg transition font-light whitespace-nowrap"
            >
              {userName || 'Hesabım'}
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800/95 backdrop-blur border border-slate-700/50 rounded-lg shadow-lg py-2 z-50">
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-blue-400 transition font-light"
                  onClick={() => setShowUserMenu(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-blue-400 transition font-light"
                  onClick={() => setShowUserMenu(false)}
                >
                  Profil
                </Link>
                <Link
                  href="/appointments"
                  className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-blue-400 transition font-light"
                  onClick={() => setShowUserMenu(false)}
                >
                  Randevularım
                </Link>
                <div className="border-t border-slate-700/50 my-2"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-red-400 transition font-light"
                >
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-2 md:gap-3">
            <Link href="/register">
              <button className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm border border-slate-600/50 hover:border-blue-400/50 hover:text-blue-400 rounded-lg transition font-light whitespace-nowrap">
                Üye Ol
              </button>
            </Link>
            <Link href="/login">
              <button className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition whitespace-nowrap">
                Giriş Yap
              </button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

