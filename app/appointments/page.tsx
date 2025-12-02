"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import { getAppointmentsByUser, updateAppointmentStatus as updateAppointmentStatusService } from '@/lib/services/appointment-service';
import { supabase } from '@/lib/supabase';
import ToastContainer, { showToast } from '@/components/Toast';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  X,
  AlertCircle,
  ArrowLeft,
  Filter,
  Repeat,
  SlidersHorizontal,
} from 'lucide-react';

export default function AppointmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all');
  const [filterDate, setFilterDate] = useState<'all' | 'upcoming' | 'past'>('all');
  const [newChangeRequestNotification, setNewChangeRequestNotification] = useState<any>(null);
  const [statusUpdateNotification, setStatusUpdateNotification] = useState<any>(null);

  const loadAppointments = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    
    try {
      // Get user's appointments from Supabase
      const filters: any = {};
      if (filterStatus !== 'all') {
        filters.status = filterStatus;
      }
      if (filterDate !== 'all') {
        filters.date = filterDate === 'upcoming' ? 'upcoming' : 'past';
      }

      const result = await getAppointmentsByUser(currentUser.id, filters);
      if (result.success && result.appointments) {
        // Transform appointments to match the expected format
        const transformedAppointments = result.appointments.map((apt: any) => ({
          id: apt.id,
          userId: apt.user_id,
          clinicId: apt.clinic_id,
          clinicName: apt.clinic_name,
          doctorId: apt.doctor_id,
          doctorName: apt.doctor_name,
          service: apt.service,
          date: apt.date,
          time: apt.time,
          notes: apt.notes,
          status: apt.status,
          createdAt: apt.created_at,
        }));

        // Apply date filter if needed (since Supabase filter might not handle this correctly)
        let filteredAppointments = transformedAppointments;
        if (filterDate !== 'all') {
          const now = new Date();
          filteredAppointments = transformedAppointments.filter((apt: any) => {
            const appointmentDate = new Date(`${apt.date}T${apt.time}`);
            return filterDate === 'upcoming' ? appointmentDate >= now : appointmentDate < now;
          });
        }

        // Sort by date (upcoming first - yakın tarihten uzak tarihe)
        filteredAppointments.sort((a: any, b: any) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateA.getTime() - dateB.getTime();
        });

        setAppointments(filteredAppointments);
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      showToast('Randevular yüklenirken bir hata oluştu', 'error');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [router, filterStatus, filterDate]);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 600;
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
    if (!user) return;

    const channel = supabase
      .channel(`user-appointments-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Appointment updated:', payload);
          const oldData = payload.old as any;
          const newData = payload.new as any;
          
          // Check if status changed
          if (oldData.status !== newData.status) {
            playNotificationSound();
            let message = '';
            if (newData.status === 'confirmed') {
              message = 'Randevunuz onaylandı!';
            } else if (newData.status === 'cancelled') {
              message = 'Randevunuz iptal edildi';
            } else if (newData.status === 'completed') {
              message = 'Randevunuz tamamlandı';
            }
            if (message) {
              setStatusUpdateNotification({
                message,
                type: 'status_update',
                timestamp: Date.now(),
              });
              setTimeout(() => setStatusUpdateNotification(null), 5000);
            }
          }
          
          // Check if appointment was updated (date, time, doctor, service)
          if (oldData.date !== newData.date || 
              oldData.time !== newData.time || 
              oldData.doctor_id !== newData.doctor_id ||
              oldData.service !== newData.service) {
            playNotificationSound();
            setStatusUpdateNotification({
              message: 'Randevunuz güncellendi!',
              type: 'appointment_updated',
              timestamp: Date.now(),
            });
            setTimeout(() => setStatusUpdateNotification(null), 5000);
          }
          
          // Reload appointments
          loadAppointments();
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
          // Check if this change request is for one of our appointments
          const { data: appointmentData } = await supabase
            .from('appointments')
            .select('id, user_id')
            .eq('id', changeRequest.appointment_id)
            .single();
          
          if (appointmentData && appointmentData.user_id === user.id) {
            console.log('New change request detected:', payload);
            playNotificationSound();
            setNewChangeRequestNotification({
              message: 'Klinik randevunuzda değişiklik yapmak istiyor!',
              type: 'change_request',
              timestamp: Date.now(),
            });
            loadAppointments();
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
          // Check if this change request is for one of our appointments
          const { data: appointmentData } = await supabase
            .from('appointments')
            .select('id, user_id')
            .eq('id', changeRequest.appointment_id)
            .single();
          
          if (appointmentData && appointmentData.user_id === user.id) {
            console.log('Change request updated:', payload);
            const oldData = payload.old as any;
            // If change request was approved, the appointment was already updated
            if (oldData.status === 'pending' && changeRequest.status === 'approved') {
              playNotificationSound();
              setStatusUpdateNotification({
                message: 'Değişiklik talebiniz onaylandı!',
                type: 'change_approved',
                timestamp: Date.now(),
              });
              setTimeout(() => setStatusUpdateNotification(null), 5000);
            }
            loadAppointments();
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleCancelAppointment = async (appointmentId: string) => {
    if (confirm('Randevuyu iptal etmek istediğinize emin misiniz?')) {
      try {
        const result = await updateAppointmentStatusService(appointmentId, 'cancelled');
        if (result.success) {
          showToast('Randevu iptal edildi', 'success');
          // Reload appointments
          await loadAppointments();
        } else {
          showToast(result.error || 'Randevu iptal edilemedi', 'error');
        }
      } catch (error) {
        console.error('Error cancelling appointment:', error);
        showToast('Randevu iptal edilirken bir hata oluştu', 'error');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
            Onaylandı
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
            İptal Edildi
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30">
            Beklemede
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-cyan-500/20 to-transparent rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10">
        <Navigation />

        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition font-light mb-6"
          >
            <ArrowLeft size={16} />
            Ana Sayfaya Dön
          </Link>

          {/* Notifications */}
          {statusUpdateNotification && (
            <div className="mb-4 animate-pulse bg-blue-500/20 border border-blue-500/50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                <span className="text-blue-400 font-light">{statusUpdateNotification.message}</span>
              </div>
              <button
                onClick={() => setStatusUpdateNotification(null)}
                className="text-blue-400 hover:text-blue-300"
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
            <h1 className="text-3xl md:text-4xl font-light mb-2">Randevularım</h1>
            <p className="text-slate-400 font-light">
              Tüm randevularınızı buradan görüntüleyebilir ve yönetebilirsiniz
            </p>
          </div>

          {/* Filters */}
          <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
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
              <div className="flex-1">
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
                  <option value="upcoming">Yaklaşan</option>
                  <option value="past">Geçmiş</option>
                </select>
              </div>
            </div>
          </div>

          {/* Appointments List */}
          {appointments.length === 0 ? (
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-12 text-center">
              <Calendar className="mx-auto mb-4 text-slate-500" size={48} />
              <h2 className="text-xl font-light mb-2">Henüz randevunuz yok</h2>
              <p className="text-slate-400 font-light mb-6">
                İlk randevunuzu oluşturmak için bir klinik seçin
              </p>
              <Link href="/clinics">
                <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition">
                  Klinik Ara
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-light">{appointment.clinicName}</h3>
                        {getStatusBadge(appointment.status)}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Calendar size={16} className="text-slate-400" />
                          <span className="font-light">{formatDate(appointment.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Clock size={16} className="text-slate-400" />
                          <span className="font-light">{appointment.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <CheckCircle2 size={16} className="text-slate-400" />
                          <span className="font-light">{appointment.service}</span>
                        </div>
                        {appointment.notes && (
                          <div className="mt-3 pt-3 border-t border-slate-700/50">
                            <p className="text-slate-400 font-light text-xs">
                              <span className="text-slate-500">Not: </span>
                              {appointment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {appointment.status !== 'cancelled' && (
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/appointments/${appointment.id}`}
                          className="px-4 py-2 text-sm border border-slate-600/50 hover:border-blue-400/50 hover:text-blue-400 rounded-lg transition font-light"
                        >
                          Detayları Gör
                        </Link>
                        <Link
                          href={`/clinics/${appointment.clinicId}`}
                          className="px-4 py-2 text-sm border border-slate-600/50 hover:border-blue-400/50 hover:text-blue-400 rounded-lg transition font-light"
                        >
                          Klinik Detayı
                        </Link>
                        {appointment.status === 'completed' && (
                          <Link
                            href={`/appointments/book?clinicId=${appointment.clinicId}&service=${encodeURIComponent(appointment.service)}${appointment.doctorId ? `&doctorId=${appointment.doctorId}` : ''}`}
                            className="px-4 py-2 text-sm border border-slate-600/50 hover:border-green-400/50 hover:text-green-400 rounded-lg transition font-light flex items-center gap-2"
                          >
                            <Repeat size={16} />
                            Tekrarla
                          </Link>
                        )}
                        <button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="px-4 py-2 text-sm border border-slate-600/50 hover:border-red-400/50 hover:text-red-400 rounded-lg transition font-light flex items-center gap-2"
                        >
                          <X size={16} />
                          İptal Et
                        </button>
                      </div>
                    )}
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

