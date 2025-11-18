"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Search, MapPin, Shield, Users, ChevronRight, ArrowRight, Calendar } from 'lucide-react';


export interface Service {
  id: string;
  name: string;
  price: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'patient' | 'clinic' | 'admin';
  createdAt: Date;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  verified: boolean;
  rating: number;
  services: Service[];
}

export interface Appointment {
  id: string;
  userId: string;
  clinicId: string;
  dateTime: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export default function RandevuDent() {
  const router = useRouter();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [searchCity, setSearchCity] = useState('');
  const [searchService, setSearchService] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setMousePos({ x, y });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Klinikler sayfasına yönlendir
    const params = new URLSearchParams();
    if (searchCity.trim()) params.set('city', searchCity.trim());
    if (searchService.trim()) params.set('service', searchService.trim());
    router.push(`/clinics?${params.toString()}`);
  };

  return (
    <div className="overflow-hidden bg-slate-950 text-white">
      {/* Metalik gradient background */}
      <div 
        ref={containerRef}
        className="relative min-h-screen w-full overflow-hidden"
        style={{
          background: `
            radial-gradient(
              circle at ${mousePos.x * 100}% ${mousePos.y * 100}%,
              rgba(100, 150, 255, 0.15) 0%,
              transparent 50%
            ),
            linear-gradient(135deg, #1a2140 0%, #16213e 50%, #0f3460 100%)
          `,
          transition: 'background 100ms ease-out'
        }}
      >
        {/* Metalik accent lines */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl opacity-30" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-cyan-500/20 to-transparent rounded-full blur-3xl opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-500/5 to-transparent" />
        </div>

        <Navigation />

        {/* Hero Section */}
        <div className="relative z-10 px-6 py-20 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-light mb-6 tracking-tight">
              Diş Randevu
              <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Dakikalar İçinde
              </span>
            </h1>
            <p className="text-lg text-slate-300 font-light max-w-2xl mx-auto mb-12">
              Türkiye'nin güvenilir diş kliniklerinden kolayca randevu alın. 
              Doğrulanmış klinikler, şeffaf fiyatlar, anlık müsaitlik.
            </p>

            {/* Search Box */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-2 flex flex-col md:flex-row gap-2">
                <div className="flex-1 flex items-center gap-3 px-4 py-3">
                  <MapPin size={20} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Şehir veya ilçe"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="bg-transparent outline-none w-full text-white placeholder-slate-400 font-light"
                  />
                </div>
                <div className="flex-1 flex items-center gap-3 px-4 py-3 border-t md:border-t-0 md:border-l border-slate-700/50">
                  <Search size={20} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Hizmet: Temizlik, İmplant, vb."
                    value={searchService}
                    onChange={(e) => setSearchService(e.target.value)}
                    className="bg-transparent outline-none w-full text-white placeholder-slate-400 font-light"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition transform hover:scale-105 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  Klinik Ara <ArrowRight size={18} />
                </button>
              </div>
              
              {/* Randevu Al Button */}
              <div className="mt-4 text-center">
                <Link href="/appointments/find">
                  <button className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg font-light transition transform hover:scale-105 flex items-center justify-center gap-2 mx-auto shadow-lg shadow-blue-500/20">
                    <Calendar size={20} />
                    Randevu Al
                  </button>
                </Link>
                <p className="text-xs text-slate-400 font-light mt-2">
                  Şehir ve ilçe seçerek, önceliğinize göre uygun klinikleri bulun
                </p>
              </div>
            </div>

            {/* Quick links */}
            <div className="flex flex-wrap justify-center gap-3">
              {['İstanbul', 'Ankara', 'İzmir', 'Antalya'].map((city) => (
                <button
                  key={city}
                  onClick={() => setSearchCity(city)}
                  className="px-4 py-2 text-sm border border-slate-600/50 hover:border-blue-400/50 hover:text-blue-400 rounded-lg transition font-light"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-20">
            {[
              {
                icon: Shield,
                title: 'Doğrulanmış Klinikler',
                desc: 'Her klinik belgeler ile kontrol edildikten sonra platforma eklenmiştir'
              },
              {
                icon: MapPin,
                title: 'Yakındaki Klinikler',
                desc: 'Konumunuza göre en yakın ve uygun klinikleri bulun'
              },
              {
                icon: Users,
                title: 'Gerçek Yorumlar',
                desc: 'Diğer hastalardan deneyim paylaşımlarını okuyun'
              }
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="group bg-slate-800/30 backdrop-blur border border-slate-700/30 hover:border-blue-500/50 rounded-xl p-6 transition duration-300 hover:bg-slate-800/50"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition">
                    <Icon size={24} className="text-blue-400" />
                  </div>
                  <h3 className="text-lg font-light mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400 font-light">{feature.desc}</p>
                </div>
              );
            })}
          </div>

          {/* CTA Section */}
          <div className="mt-24 text-center">
            <div className="inline-block bg-slate-800/40 backdrop-blur border border-slate-700/50 rounded-xl px-8 py-6">
              <p className="text-slate-300 font-light mb-4">Klinik sahibi misiniz?</p>
              <Link href="/clinic-register">
                <button className="px-6 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg font-light transition flex items-center gap-2 mx-auto">
                  Klinik Ekle <ChevronRight size={18} />
                </button>
              </Link>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-6">
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}