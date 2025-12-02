"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ClinicNavigation from '@/components/ClinicNavigation';
import Footer from '@/components/Footer';
import { getCurrentClinic } from '@/lib/auth-clinic';
import { getClinicPatients } from '@/lib/patients';
import { subscribeToEvents } from '@/lib/events';
import {
  Users,
  Search,
  User,
  Phone,
  Mail,
  Calendar,
  ArrowRight,
  Filter,
  SlidersHorizontal,
} from 'lucide-react';

export default function ClinicPatientsPage() {
  const router = useRouter();
  const [clinic, setClinic] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterDate, setFilterDate] = useState<'all' | 'recent' | 'old'>('all');

  const loadData = () => {
    const currentClinic = getCurrentClinic();
    if (!currentClinic) {
      router.push('/clinic/login');
      return;
    }
    setClinic(currentClinic);
    
    const clinicPatients = getClinicPatients(currentClinic.id);
    setPatients(clinicPatients);
  };

  useEffect(() => {
    loadData();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToEvents((eventData) => {
      if (
        eventData.type === 'patient:created' ||
        eventData.type === 'patient:updated' ||
        eventData.type === 'appointment:created' ||
        eventData.type === 'appointment:updated'
      ) {
        loadData();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router]);

  const filteredPatients = patients.filter(patient => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        patient.name.toLowerCase().includes(query) ||
        patient.phone.includes(query) ||
        patient.email.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
            <h1 className="text-3xl md:text-4xl font-light mb-2">Hasta Yönetimi</h1>
            <p className="text-slate-400 font-light">
              Klinik randevu geçmişinizdeki tüm hastaları görüntüleyin ve yönetin
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
                  placeholder="Hasta adı, telefon veya e-posta ile ara..."
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
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <div>
                  <label className="block text-xs text-slate-400 font-light mb-2">
                    <Calendar size={14} className="inline mr-1" />
                    Son Randevu
                  </label>
                  <select
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value as any)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white font-light focus:outline-none focus:border-blue-400/50 text-sm"
                  >
                    <option value="all">Tümü</option>
                    <option value="recent">Son 30 Gün</option>
                    <option value="old">30 Günden Eski</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Patients List */}
          {filteredPatients.length === 0 ? (
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-12 text-center">
              <Users className="mx-auto mb-4 text-slate-500" size={48} />
              <h2 className="text-xl font-light mb-2">Henüz hasta kaydı yok</h2>
              <p className="text-slate-400 font-light">
                Randevu alan hastalar burada görüntülenecek
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPatients.map((patient) => (
                <Link
                  key={patient.id}
                  href={`/clinic/patients/${patient.id}`}
                  className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 hover:border-blue-400/50 transition group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <User size={24} className="text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-light group-hover:text-blue-400 transition">
                          {patient.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-light">
                          {patient.totalAppointments} randevu
                        </p>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-slate-400 group-hover:text-blue-400 transition" />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone size={14} className="text-slate-400" />
                      <span className="font-light">{patient.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail size={14} className="text-slate-400" />
                      <span className="font-light truncate">{patient.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar size={14} className="text-slate-400" />
                      <span className="font-light text-xs">
                        Son: {formatDate(patient.lastAppointmentDate)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
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

