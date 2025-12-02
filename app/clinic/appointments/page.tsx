"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ClinicNavigation from '@/components/ClinicNavigation';
import Footer from '@/components/Footer';
import { getCurrentClinicWithUUID } from '@/lib/utils/clinic-utils';
import { getAppointmentsByClinic, updateAppointmentStatus } from '@/lib/services/appointment-service';
import { supabase } from '@/lib/supabase';
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
import ToastContainer, { showToast } from '@/components/Toast';

export default function ClinicAppointmentsPage() {
  const router = useRouter();
  const [clinic, setClinic] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all');
  const [filterDate, setFilterDate] = useState<'all' | 'today' | 'upcoming' | 'past'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newAppointmentNotification, setNewAppointmentNotification] = useState<any>(null);
  const [newChangeRequestNotification, setNewChangeRequestNotification] = useState<any>(null);

  useEffect(() => {
    const loadClinic = async () => {
      const clinicData = await getCurrentClinicWithUUID();
      if (!clinicData) {
        router.push('/clinic/login');
        return;
      }
      setClinic(clinicData.clinic);
      loadAppointments(clinicData.clinicId);
    };
    loadClinic();
  }, [router, filterStatus, filterDate]);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  };

  // Realtime subscription for appointments
  useEffect(() => {
    if (!clinic) return;

    const channel = supabase
      .channel(`clinic-appointments-${clinic.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          filter: `clinic_id=eq.${clinic.id}`,
        },
        (payload) => {
          console.log('New appointment detected:', payload);
          playNotificationSound();
          setNewAppointmentNotification({
            message: 'Yeni randevu oluşturuldu!',
            type: 'new',
            timestamp: Date.now(),
          });
          // Reload appointments
          loadAppointments(clinic.id);
          // Clear notification after 5 seconds
          setTimeout(() => setNewAppointmentNotification(null), 5000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `clinic_id=eq.${clinic.id}`,
        },
        (payload) => {
          console.log('Appointment updated:', payload);
          // Reload appointments when any update occurs
          loadAppointments(clinic.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointment_change_requests',
        },
        async (payload) => {
          const changeRequest = payload.new as any;
          // Check if this change request is for one of our clinic's appointments
          const { data: appointmentData } = await supabase
            .from('appointments')
            .select('id, clinic_id')
            .eq('id', changeRequest.appointment_id)
            .single();
          
          if (appointmentData && appointmentData.clinic_id === clinic.id) {
            console.log('New change request detected:', payload);
            playNotificationSound();
            setNewChangeRequestNotification({
              message: 'Yeni değişiklik talebi!',
              type: 'change_request',
              timestamp: Date.now(),
            });
            loadAppointments(clinic.id);
            setTimeout(() => setNewChangeRequestNotification(null), 5000);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointment_change_requests',
        },
        async (payload) => {
          const changeRequest = payload.new as any;
          // Check if this change request is for one of our clinic's appointments
          const { data: appointmentData } = await supabase
            .from('appointments')
            .select('id, clinic_id')
            .eq('id', changeRequest.appointment_id)
            .single();
          
          if (appointmentData && appointmentData.clinic_id === clinic.id) {
            console.log('Change request updated:', payload);
            loadAppointments(clinic.id);
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clinic]);

  const loadAppointments = async (clinicId: string) => {
    try {
      setLoading(true);
      const result = await getAppointmentsByClinic(clinicId, {
        status: filterStatus === 'all' ? undefined : filterStatus,
        date: filterDate === 'all' ? undefined : filterDate,
        search: searchQuery || undefined,
      });

      if (result.success && result.appointments) {
        // Hasta bilgilerini ekle
        const appointmentsWithPatients = await Promise.all(
          result.appointments.map(async (apt) => {
            const { data: patientData } = await supabase
              .from('patients')
              .select('name, phone, email')
              .eq('clinic_id', clinicId)
              .eq('user_id', apt.user_id)
              .single();

            return {
              ...apt,
              patientName: patientData?.name || 'Bilinmeyen Hasta',
              patientPhone: patientData?.phone || '',
              patientEmail: patientData?.email || '',
            };
          })
        );
        setAppointments(appointmentsWithPatients);
      }
    } catch (error: any) {
      console.error('Error loading appointments:', error);
      showToast('Randevular yüklenirken bir hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentAction = async (appointmentId: string, action: 'confirm' | 'cancel' | 'complete') => {
    try {
      let newStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed' = 'pending';
      if (action === 'confirm') newStatus = 'confirmed';
      else if (action === 'cancel') newStatus = 'cancelled';
      else if (action === 'complete') newStatus = 'completed';

      const result = await updateAppointmentStatus(appointmentId, newStatus);
      if (result.success) {
        showToast(
          action === 'confirm' ? 'Randevu onaylandı' :
          action === 'cancel' ? 'Randevu iptal edildi' :
          'Randevu tamamlandı olarak işaretlendi',
          'success'
        );
        if (clinic) {
          loadAppointments(clinic.id);
        }
      } else {
        showToast(result.error || 'İşlem başarısız', 'error');
      }
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      showToast('Randevu güncellenirken bir hata oluştu', 'error');
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
          {/* Notifications */}
          {newAppointmentNotification && (
            <div className="mb-4 animate-pulse bg-green-500/20 border border-green-500/50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
                <span className="text-green-400 font-light">{newAppointmentNotification.message}</span>
              </div>
              <button
                onClick={() => setNewAppointmentNotification(null)}
                className="text-green-400 hover:text-green-300"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {newChangeRequestNotification && (
            <div className="mb-4 animate-pulse bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
                <span className="text-yellow-400 font-light">{newChangeRequestNotification.message}</span>
              </div>
              <button
                onClick={() => setNewChangeRequestNotification(null)}
                className="text-yellow-400 hover:text-yellow-300"
              >
                <X size={16} />
              </button>
            </div>
          )}

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
          {loading ? (
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-12 text-center">
              <p className="text-slate-400 font-light">Yükleniyor...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-12 text-center">
              <Calendar className="mx-auto mb-4 text-slate-500" size={48} />
              <h2 className="text-xl font-light mb-2">Henüz randevu yok</h2>
              <p className="text-slate-400 font-light">
                Randevular burada görüntülenecek
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User size={20} className="text-blue-400" />
                        <h3 className="text-lg font-light">{appointment.patientName}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-light ${
                          appointment.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                          appointment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          appointment.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {appointment.status === 'confirmed' ? 'Onaylandı' :
                           appointment.status === 'pending' ? 'Beklemede' :
                           appointment.status === 'cancelled' ? 'İptal' :
                           'Tamamlandı'}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span>{new Date(appointment.date).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          <span>{appointment.time}</span>
                        </div>
                        <p className="text-slate-300">{appointment.service}</p>
                        {appointment.doctor_name && (
                          <p className="text-xs">Doktor: {appointment.doctor_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {appointment.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAppointmentAction(appointment.id, 'confirm')}
                            className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition font-light flex items-center gap-2"
                          >
                            <CheckCircle2 size={16} />
                            Onayla
                          </button>
                          <button
                            onClick={() => handleAppointmentAction(appointment.id, 'cancel')}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition font-light flex items-center gap-2"
                          >
                            <X size={16} />
                            İptal
                          </button>
                        </>
                      )}
                      {appointment.status === 'confirmed' && (
                        <button
                          onClick={() => handleAppointmentAction(appointment.id, 'complete')}
                          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition font-light flex items-center gap-2"
                        >
                          <CheckCircle2 size={16} />
                          Tamamlandı
                        </button>
                      )}
                      <Link
                        href={`/clinic/appointments/${appointment.id}`}
                        className="px-4 py-2 border border-slate-600/50 hover:border-blue-400/50 hover:text-blue-400 rounded-lg transition font-light"
                      >
                        Detay
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12">
          <Footer />
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

