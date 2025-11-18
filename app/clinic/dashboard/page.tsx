"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ClinicNavigation from '@/components/ClinicNavigation';
import Footer from '@/components/Footer';
import { getCurrentClinic } from '@/lib/auth-clinic';
import { getClinicPatients } from '@/lib/patients';
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

  useEffect(() => {
    const currentClinic = getCurrentClinic();
    if (!currentClinic) {
      router.push('/clinic/login');
      return;
    }
    setClinic(currentClinic);
    const clinicPatients = getClinicPatients(currentClinic.id);
    setPatients(clinicPatients);
  }, [router]);

  // Mock data - will be replaced with real data
  const stats = {
    totalAppointments: 22,
    todayAppointments: 3,
    pendingAppointments: 5,
    confirmedAppointments: 12,
    cancelledAppointments: 2,
    totalRevenue: 45000,
    averageRating: 4.8,
    totalReviews: 15,
    totalPatients: patients.length,
  };

  const upcomingAppointments: any[] = [
    {
      id: '1',
      patientName: 'Mehmet Yılmaz',
      service: 'Diş Taşı Temizliği',
      date: new Date().toISOString().split('T')[0],
      time: '14:00',
      status: 'confirmed',
    },
    {
      id: '2',
      patientName: 'Ayşe Demir',
      service: 'Kontrol',
      date: new Date().toISOString().split('T')[0],
      time: '15:30',
      status: 'confirmed',
    },
    {
      id: '3',
      patientName: 'Zeynep Şahin',
      service: 'Ortodonti Kontrolü',
      date: new Date().toISOString().split('T')[0],
      time: '16:00',
      status: 'pending',
    },
  ];

  const recentActivity: any[] = [
    {
      id: '1',
      type: 'appointment',
      message: 'Mehmet Yılmaz için randevu onaylandı',
      date: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'patient',
      message: 'Yeni hasta kaydı: Can Özkan',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

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
              <div className="text-2xl font-light mb-1">{stats.totalAppointments}</div>
              <div className="text-xs text-slate-400 font-light">Toplam Randevu</div>
            </div>

            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle2 size={20} className="text-green-400" />
                </div>
                <Activity size={16} className="text-green-400" />
              </div>
              <div className="text-2xl font-light mb-1">{stats.todayAppointments}</div>
              <div className="text-xs text-slate-400 font-light">Bugünkü Randevu</div>
            </div>

            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Clock size={20} className="text-yellow-400" />
                </div>
                <Activity size={16} className="text-yellow-400" />
              </div>
              <div className="text-2xl font-light mb-1">{stats.pendingAppointments}</div>
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

            {upcomingAppointments.length === 0 ? (
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-12 text-center">
                <Calendar className="mx-auto mb-4 text-slate-500" size={48} />
                <h3 className="text-lg font-light mb-2">Bugün randevu yok</h3>
                <p className="text-slate-400 font-light">
                  Bugün için planlanmış randevu bulunmamaktadır
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Appointment cards will be rendered here */}
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
                  {/* Activity items will be rendered here */}
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

