"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ClinicNavigation from '@/components/ClinicNavigation';
import Footer from '@/components/Footer';
import { getCurrentClinic } from '@/lib/auth-clinic';
import { getAppointmentsByClinicId, updateAppointmentStatus, type Appointment } from '@/lib/appointments';
import { getClinicPatients } from '@/lib/patients';
import { subscribeToEvents } from '@/lib/events';
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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all');
  const [filterDate, setFilterDate] = useState<'all' | 'today' | 'upcoming' | 'past'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadData = () => {
    const currentClinic = getCurrentClinic();
    if (!currentClinic) {
      router.push('/clinic/login');
      return;
    }
    setClinic(currentClinic);
    
    const clinicAppointments = getAppointmentsByClinicId(currentClinic.id);
    setAppointments(clinicAppointments);
    
    const clinicPatients = getClinicPatients(currentClinic.id);
    setPatients(clinicPatients);
  };

  useEffect(() => {
    loadData();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToEvents((eventData) => {
      if (
        eventData.type === 'appointment:created' ||
        eventData.type === 'appointment:updated' ||
        eventData.type === 'appointment:deleted'
      ) {
        loadData();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router]);

  const handleAppointmentAction = async (
    appointmentId: string,
    action: 'confirm' | 'cancel' | 'complete'
  ) => {
    setLoading(true);
    try {
      let status: 'pending' | 'confirmed' | 'cancelled' | 'completed' = 'pending';
      if (action === 'confirm') status = 'confirmed';
      else if (action === 'cancel') status = 'cancelled';
      else if (action === 'complete') status = 'completed';

      const result = updateAppointmentStatus(appointmentId, status);
      if (result.success) {
        loadData();
      } else {
        alert(result.error || 'İşlem başarısız oldu');
      }
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      alert('Bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
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
          {(() => {
            // Filter appointments
            let filtered = [...appointments];

            // Filter by status
            if (filterStatus !== 'all') {
              filtered = filtered.filter(a => a.status === filterStatus);
            }

            // Filter by date
            const today = new Date().toISOString().split('T')[0];
            if (filterDate === 'today') {
              filtered = filtered.filter(a => a.date === today);
            } else if (filterDate === 'upcoming') {
              filtered = filtered.filter(a => a.date >= today);
            } else if (filterDate === 'past') {
              filtered = filtered.filter(a => a.date < today);
            }

            // Filter by search query
            if (searchQuery) {
              const query = searchQuery.toLowerCase();
              filtered = filtered.filter(a => {
                const patient = patients.find(p => p.userId === a.userId);
                return (
                  patient?.name.toLowerCase().includes(query) ||
                  patient?.phone.includes(query) ||
                  a.service.toLowerCase().includes(query) ||
                  a.id.toLowerCase().includes(query)
                );
              });
            }

            // Sort by date and time
            filtered.sort((a, b) => {
              const dateA = new Date(`${a.date}T${a.time}`);
              const dateB = new Date(`${b.date}T${b.time}`);
              return dateB.getTime() - dateA.getTime();
            });

            if (filtered.length === 0) {
              return (
                <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-12 text-center">
                  <Calendar className="mx-auto mb-4 text-slate-500" size={48} />
                  <h2 className="text-xl font-light mb-2">Randevu bulunamadı</h2>
                  <p className="text-slate-400 font-light">
                    {appointments.length === 0
                      ? 'Henüz randevu yok'
                      : 'Filtre kriterlerinize uygun randevu bulunamadı'}
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {filtered.map((appointment) => {
                  const patient = patients.find(p => p.userId === appointment.userId);
                  const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
                  const isPast = appointmentDate < new Date();

                  return (
                    <div
                      key={appointment.id}
                      className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 hover:border-blue-400/50 transition"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-light mb-1">
                                {patient?.name || 'Hasta'}
                              </h3>
                              <p className="text-sm text-slate-400 font-light">
                                {appointment.service}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 text-xs rounded ${
                                appointment.status === 'pending'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : appointment.status === 'confirmed'
                                  ? 'bg-green-500/20 text-green-400'
                                  : appointment.status === 'cancelled'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}
                            >
                              {appointment.status === 'pending'
                                ? 'Beklemede'
                                : appointment.status === 'confirmed'
                                ? 'Onaylandı'
                                : appointment.status === 'cancelled'
                                ? 'İptal Edildi'
                                : 'Tamamlandı'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-slate-400" />
                              <span className="font-light">
                                {new Date(appointment.date).toLocaleDateString('tr-TR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-slate-400" />
                              <span className="font-light">{appointment.time}</span>
                            </div>
                            {appointment.doctorName && (
                              <div className="flex items-center gap-2">
                                <User size={14} className="text-slate-400" />
                                <span className="font-light">{appointment.doctorName}</span>
                              </div>
                            )}
                            {patient && (
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400">Tel:</span>
                                <span className="font-light">{patient.phone}</span>
                              </div>
                            )}
                          </div>

                          {appointment.notes && (
                            <div className="mt-3 p-3 bg-slate-800/50 rounded-lg">
                              <p className="text-xs text-slate-400 font-light mb-1">Notlar:</p>
                              <p className="text-sm text-slate-300 font-light">{appointment.notes}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 md:min-w-[200px]">
                          {appointment.status === 'pending' && !isPast && (
                            <>
                              <button
                                onClick={() => handleAppointmentAction(appointment.id, 'confirm')}
                                disabled={loading}
                                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition font-light text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                <CheckCircle2 size={16} />
                                Onayla
                              </button>
                              <button
                                onClick={() => handleAppointmentAction(appointment.id, 'cancel')}
                                disabled={loading}
                                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition font-light text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                <X size={16} />
                                İptal Et
                              </button>
                            </>
                          )}
                          {appointment.status === 'confirmed' && !isPast && (
                            <button
                              onClick={() => handleAppointmentAction(appointment.id, 'complete')}
                              disabled={loading}
                              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition font-light text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              <CheckCircle2 size={16} />
                              Tamamla
                            </button>
                          )}
                          <Link
                            href={`/clinic/appointments/${appointment.id}`}
                            className="px-4 py-2 border border-slate-600/50 hover:border-blue-400/50 hover:text-blue-400 rounded-lg transition font-light text-sm text-center"
                          >
                            Detaylar
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12">
          <Footer />
        </div>
      </div>
    </div>
  );
}

