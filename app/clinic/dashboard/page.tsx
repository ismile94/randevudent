"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ClinicNavigation from '@/components/ClinicNavigation';
import Footer from '@/components/Footer';
import { getCurrentClinic } from '@/lib/auth-clinic';
import { getClinicPatients } from '@/lib/patients';
import { getAppointmentsByClinicId, getClinicAppointmentStats, type Appointment } from '@/lib/appointments';
import { subscribeToEvents } from '@/lib/events';
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  X,
  Activity,
  ArrowRight,
  User,
} from 'lucide-react';

export default function ClinicDashboardPage() {
  const router = useRouter();
  const [clinic, setClinic] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
    totalRevenue: 0,
  });

  const loadData = () => {
    const currentClinic = getCurrentClinic();
    if (!currentClinic) {
      router.push('/clinic/login');
      return;
    }
    setClinic(currentClinic);
    
    const clinicPatients = getClinicPatients(currentClinic.id);
    setPatients(clinicPatients);
    
    const clinicAppointments = getAppointmentsByClinicId(currentClinic.id);
    setAppointments(clinicAppointments);
    
    const appointmentStats = getClinicAppointmentStats(currentClinic.id);
    setStats(appointmentStats);
  };

  useEffect(() => {
    loadData();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToEvents((eventData) => {
      if (
        eventData.type === 'appointment:created' ||
        eventData.type === 'appointment:updated' ||
        eventData.type === 'appointment:deleted' ||
        eventData.type === 'patient:created' ||
        eventData.type === 'patient:updated'
      ) {
        loadData();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router]);

  // Get today's appointments
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments
    .filter(a => a.date === today && (a.status === 'pending' || a.status === 'confirmed'))
    .sort((a, b) => {
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
    })
    .slice(0, 6);

  // Get recent activity (last 10 appointments sorted by date)
  const recentActivity = appointments
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 10)
    .map(apt => {
      const patient = patients.find(p => p.userId === apt.userId);
      return {
        id: apt.id,
        type: 'appointment',
        message: `${patient?.name || 'Hasta'} için randevu ${apt.status === 'confirmed' ? 'onaylandı' : apt.status === 'cancelled' ? 'iptal edildi' : apt.status === 'completed' ? 'tamamlandı' : 'beklemede'}`,
        date: apt.updatedAt || apt.createdAt,
        appointment: apt,
      };
    });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
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
            <h1 className="text-3xl md:text-4xl font-light mb-2">Dashboard</h1>
            <p className="text-slate-400 font-light">
              Hoş geldiniz, {clinic.clinicName}. Randevu durumunuzu buradan takip edebilirsiniz.
            </p>
          </div>

          {/* Quick Stats */}
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
                <Activity size={16} className="text-green-400" />
              </div>
              <div className="text-2xl font-light mb-1">{stats.today}</div>
              <div className="text-xs text-slate-400 font-light">Bugünkü Randevu</div>
            </div>

            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Clock size={20} className="text-yellow-400" />
                </div>
                <Activity size={16} className="text-yellow-400" />
              </div>
              <div className="text-2xl font-light mb-1">{stats.pending}</div>
              <div className="text-xs text-slate-400 font-light">Bekleyen</div>
            </div>

            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <DollarSign size={20} className="text-cyan-400" />
                </div>
                <TrendingUp size={16} className="text-cyan-400" />
              </div>
              <div className="text-2xl font-light mb-1">{stats.totalRevenue.toFixed(0)} ₺</div>
              <div className="text-xs text-slate-400 font-light">Toplam Gelir</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link
              href="/clinic/appointments"
              className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 hover:border-blue-400/50 transition group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition">
                  <Calendar size={24} className="text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-light mb-1 group-hover:text-blue-400 transition">
                    Randevu Yönetimi
                  </h3>
                  <p className="text-sm text-slate-400 font-light">
                    Randevuları görüntüle ve yönet
                  </p>
                </div>
                <ArrowRight size={20} className="text-slate-400 group-hover:text-blue-400 transition" />
              </div>
            </Link>

            <Link
              href="/clinic/patients"
              className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 hover:border-blue-400/50 transition group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition">
                  <User size={24} className="text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-light mb-1 group-hover:text-purple-400 transition">
                    Hasta Yönetimi
                  </h3>
                  <p className="text-sm text-slate-400 font-light">
                    Hastaları görüntüle ve yönet
                  </p>
                </div>
                <ArrowRight size={20} className="text-slate-400 group-hover:text-purple-400 transition" />
              </div>
            </Link>

            <Link
              href="/clinic/staff"
              className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 hover:border-blue-400/50 transition group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition">
                  <Users size={24} className="text-cyan-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-light mb-1 group-hover:text-cyan-400 transition">
                    Kadro Yönetimi
                  </h3>
                  <p className="text-sm text-slate-400 font-light">
                    Hekimleri ve personeli yönet
                  </p>
                </div>
                <ArrowRight size={20} className="text-slate-400 group-hover:text-cyan-400 transition" />
              </div>
            </Link>

            <Link
              href="/clinic/settings"
              className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 hover:border-blue-400/50 transition group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition">
                  <Activity size={24} className="text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-light mb-1 group-hover:text-green-400 transition">
                    Ayarlar
                  </h3>
                  <p className="text-sm text-slate-400 font-light">
                    Klinik bilgilerini düzenle
                  </p>
                </div>
                <ArrowRight size={20} className="text-slate-400 group-hover:text-green-400 transition" />
              </div>
            </Link>
          </div>

          {/* Today's Appointments */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-light flex items-center gap-2">
                <Clock size={24} className="text-blue-400" />
                Bugünkü Randevular
              </h2>
              <Link
                href="/clinic/appointments"
                className="text-sm text-blue-400 hover:text-blue-300 transition font-light flex items-center gap-1"
              >
                Tümünü Gör
                <ArrowRight size={16} />
              </Link>
            </div>

            {todayAppointments.length === 0 ? (
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-12 text-center">
                <Calendar className="mx-auto mb-4 text-slate-500" size={48} />
                <h3 className="text-lg font-light mb-2">Bugün randevu yok</h3>
                <p className="text-slate-400 font-light">
                  Bugün için planlanmış randevu bulunmamaktadır
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todayAppointments.map((appointment) => {
                  const patient = patients.find(p => p.userId === appointment.userId);
                  return (
                    <Link
                      key={appointment.id}
                      href={`/clinic/appointments/${appointment.id}`}
                      className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-4 hover:border-blue-400/50 transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-light mb-1">
                            {patient?.name || 'Hasta'}
                          </h3>
                          <p className="text-sm text-slate-400 font-light">{appointment.service}</p>
                        </div>
                        {appointment.status === 'pending' && (
                          <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                            Beklemede
                          </span>
                        )}
                        {appointment.status === 'confirmed' && (
                          <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
                            Onaylandı
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Clock size={14} className="text-slate-400" />
                        <span className="font-light">{appointment.time}</span>
                        {appointment.doctorName && (
                          <>
                            <span className="text-slate-500">•</span>
                            <span className="font-light">{appointment.doctorName}</span>
                          </>
                        )}
                      </div>
                    </Link>
                  );
                })}
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
              {recentActivity.length === 0 ? (
                <p className="text-slate-400 font-light text-center py-4">
                  Henüz aktivite bulunmuyor
                </p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 pb-4 border-b border-slate-700/50 last:border-0 last:pb-0"
                    >
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Activity size={16} className="text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-light text-slate-300">{activity.message}</p>
                        <p className="text-xs text-slate-500 font-light mt-1">
                          {new Date(activity.date).toLocaleString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
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

