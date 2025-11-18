"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ClinicNavigation from '@/components/ClinicNavigation';
import Footer from '@/components/Footer';
import { getCurrentClinic } from '@/lib/auth-clinic';
import {
  Calendar,
  Clock,
  User,
  Filter,
  CheckCircle2,
  X,
  AlertCircle,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

export default function ClinicAppointmentsPage() {
  const router = useRouter();
  const [clinic, setClinic] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all');
  const [filterDate, setFilterDate] = useState<'all' | 'today' | 'upcoming' | 'past'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const currentClinic = getCurrentClinic();
    if (!currentClinic) {
      router.push('/clinic/login');
      return;
    }
    setClinic(currentClinic);
    
    // TODO: Fetch appointments from API
    setAppointments([]);
  }, [router]);

  const handleAppointmentAction = (appointmentId: string, action: 'confirm' | 'cancel' | 'complete') => {
    // TODO: Implement appointment actions
    console.log(`Action: ${action} for appointment: ${appointmentId}`);
  };

  if (!clinic) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-cyan-500/20 to-transparent rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10">
        <ClinicNavigation />

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-light mb-2">Randevu Yönetimi</h1>
            <p className="text-slate-400 font-light">
              Tüm randevuları görüntüleyin ve yönetin
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Hasta adı, telefon veya randevu no ile ara..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 border border-slate-600/50 hover:border-blue-400/50 hover:text-blue-400 rounded-lg transition font-light flex items-center gap-2"
              >
                <SlidersHorizontal size={16} />
                Filtrele
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 font-light mb-2">
                    <Filter size={14} className="inline mr-1" />
                    Durum
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white font-light focus:outline-none focus:border-blue-400/50 text-sm"
                  >
                    <option value="all">Tümü</option>
                    <option value="pending">Beklemede</option>
                    <option value="confirmed">Onaylandı</option>
                    <option value="completed">Tamamlandı</option>
                    <option value="cancelled">İptal Edildi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-light mb-2">
                    <Calendar size={14} className="inline mr-1" />
                    Tarih
                  </label>
                  <select
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value as any)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white font-light focus:outline-none focus:border-blue-400/50 text-sm"
                  >
                    <option value="all">Tümü</option>
                    <option value="today">Bugün</option>
                    <option value="upcoming">Yaklaşan</option>
                    <option value="past">Geçmiş</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Appointments List */}
          {appointments.length === 0 ? (
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-12 text-center">
              <Calendar className="mx-auto mb-4 text-slate-500" size={48} />
              <h2 className="text-xl font-light mb-2">Henüz randevu yok</h2>
              <p className="text-slate-400 font-light">
                Randevular burada görüntülenecek
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Appointment cards will be rendered here */}
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12">
          <Footer />
        </div>
      </div>
    </div>
  );
}

