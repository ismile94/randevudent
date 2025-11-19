"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  TrendingUp,
  User,
  CalendarDays,
  Activity,
  Plus,
  Search,
} from 'lucide-react';

interface Appointment {
  id: string;
  userId: string;
  clinicId: string;
  clinicName: string;
  service: string;
  date: string;
  time: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

const APPOINTMENTS_STORAGE_KEY = 'randevudent_appointments';

function getAllAppointments(): Appointment[] {
  if (typeof window === 'undefined') return [];
  const appointmentsJson = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
  return appointmentsJson ? JSON.parse(appointmentsJson) : [];
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      
      // Get user's appointments
      const allAppointments = getAllAppointments();
      const userAppointments = allAppointments
        .filter(apt => apt.userId === currentUser.id)
        .sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateB.getTime() - dateA.getTime();
        });
      setAppointments(userAppointments);

      // Get upcoming appointments (not cancelled, future dates)
      const now = new Date();
      const upcoming = userAppointments
        .filter(apt => {
          const appointmentDate = new Date(`${apt.date}T${apt.time}`);
          return apt.status !== 'cancelled' && appointmentDate >= now;
        })
        .sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateA.getTime() - dateB.getTime();
        })
        .slice(0, 3);
      setUpcomingAppointments(upcoming);
    };
    checkAuth();
  }, [router]);

  const getStats = () => {
    const total = appointments.length;
    const confirmed = appointments.filter(apt => apt.status === 'confirmed').length;
    const pending = appointments.filter(apt => apt.status === 'pending').length;
    const cancelled = appointments.filter(apt => apt.status === 'cancelled').length;
    
    return { total, confirmed, pending, cancelled };
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

  const formatTime = (timeString: string) => {
    return timeString;
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

  if (!user) {
    return null; // Will redirect
  }

  const stats = getStats();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-cyan-500/20 to-transparent rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10">
        <Navigation />

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-light mb-2">Dashboard</h1>
            <p className="text-slate-400 font-light">
              Hoş geldiniz, {user.name}. Randevu durumunuzu buradan takip edebilirsiniz.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Link
              href="/clinics"
              className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 hover:border-blue-400/50 transition group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition">
                  <Search size={24} className="text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-light mb-1 group-hover:text-blue-400 transition">
                    Klinik Ara
                  </h3>
                  <p className="text-sm text-slate-400 font-light">
                    Yeni randevu için klinik bulun
                  </p>
                </div>
                <ArrowRight size={20} className="text-slate-400 group-hover:text-blue-400 transition" />
              </div>
            </Link>

            <Link
              href="/appointments"
              className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 hover:border-blue-400/50 transition group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition">
                  <CalendarDays size={24} className="text-cyan-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-light mb-1 group-hover:text-cyan-400 transition">
                    Tüm Randevularım
                  </h3>
                  <p className="text-sm text-slate-400 font-light">
                    Randevularınızı görüntüleyin ve yönetin
                  </p>
                </div>
                <ArrowRight size={20} className="text-slate-400 group-hover:text-cyan-400 transition" />
              </div>
            </Link>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Calendar size={20} className="text-blue-400" />
                </div>
                <TrendingUp size={16} className="text-green-400" />
              </div>
              <div className="text-2xl font-light mb-1">{stats.total}</div>
              <div className="text-xs text-slate-400 font-light">Toplam Randevu</div>
            </div>

            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle2 size={20} className="text-green-400" />
                </div>
                <TrendingUp size={16} className="text-green-400" />
              </div>
              <div className="text-2xl font-light mb-1">{stats.confirmed}</div>
              <div className="text-xs text-slate-400 font-light">Onaylanmış</div>
            </div>

            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Clock size={20} className="text-yellow-400" />
                </div>
                <Activity size={16} className="text-yellow-400" />
              </div>
              <div className="text-2xl font-light mb-1">{stats.pending}</div>
              <div className="text-xs text-slate-400 font-light">Beklemede</div>
            </div>

            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <X size={20} className="text-red-400" />
                </div>
                <Activity size={16} className="text-red-400" />
              </div>
              <div className="text-2xl font-light mb-1">{stats.cancelled}</div>
              <div className="text-xs text-slate-400 font-light">İptal Edilmiş</div>
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-light flex items-center gap-2">
                <Calendar size={24} className="text-blue-400" />
                Yaklaşan Randevular
              </h2>
              {upcomingAppointments.length > 0 && (
                <Link
                  href="/appointments"
                  className="text-sm text-blue-400 hover:text-blue-300 transition font-light flex items-center gap-1"
                >
                  Tümünü Gör
                  <ArrowRight size={16} />
                </Link>
              )}
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-12 text-center">
                <Calendar className="mx-auto mb-4 text-slate-500" size={48} />
                <h3 className="text-lg font-light mb-2">Yaklaşan randevunuz yok</h3>
                <p className="text-slate-400 font-light mb-6">
                  Yeni randevu oluşturmak için bir klinik seçin
                </p>
                <Link href="/clinics">
                  <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition">
                    Klinik Ara
                  </button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 hover:border-blue-400/50 transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-light">{appointment.clinicName}</h3>
                      {getStatusBadge(appointment.status)}
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Calendar size={16} className="text-slate-400" />
                        <span className="font-light">{formatDate(appointment.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Clock size={16} className="text-slate-400" />
                        <span className="font-light">{formatTime(appointment.time)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle2 size={16} className="text-slate-400" />
                        <span className="font-light">{appointment.service}</span>
                      </div>
                    </div>

                    <Link
                      href={`/clinics/${appointment.clinicId}`}
                      className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition font-light"
                    >
                      Detayları Gör
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-xl font-light mb-4 flex items-center gap-2">
              <Activity size={24} className="text-blue-400" />
              Son Aktiviteler
            </h2>
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
              {appointments.length === 0 ? (
                <p className="text-slate-400 font-light text-center py-4">
                  Henüz aktivite bulunmuyor
                </p>
              ) : (
                <div className="space-y-4">
                  {appointments.slice(0, 5).map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          appointment.status === 'confirmed' ? 'bg-green-500/20' :
                          appointment.status === 'cancelled' ? 'bg-red-500/20' :
                          'bg-yellow-500/20'
                        }`}>
                          {appointment.status === 'confirmed' ? (
                            <CheckCircle2 size={16} className="text-green-400" />
                          ) : appointment.status === 'cancelled' ? (
                            <X size={16} className="text-red-400" />
                          ) : (
                            <Clock size={16} className="text-yellow-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-light">
                            {appointment.clinicName} - {appointment.service}
                          </p>
                          <p className="text-xs text-slate-400 font-light">
                            {formatDate(appointment.date)} {formatTime(appointment.time)}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12">
          <Footer />
        </div>
      </div>
    </div>
  );
}

