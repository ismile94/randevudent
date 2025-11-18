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
  X,
  AlertCircle,
  ArrowLeft,
  Filter,
  Repeat,
  SlidersHorizontal,
} from 'lucide-react';

interface Appointment {
  id: string;
  userId: string;
  clinicId: string;
  clinicName: string;
  doctorId?: string;
  service: string;
  date: string;
  time: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}

const APPOINTMENTS_STORAGE_KEY = 'randevudent_appointments';

function getAllAppointments(): Appointment[] {
  if (typeof window === 'undefined') return [];
  const appointmentsJson = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
  return appointmentsJson ? JSON.parse(appointmentsJson) : [];
}

function updateAppointmentStatus(appointmentId: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed'): void {
  if (typeof window === 'undefined') return;
  const appointments = getAllAppointments();
  const appointmentIndex = appointments.findIndex(apt => apt.id === appointmentId);
  if (appointmentIndex !== -1) {
    appointments[appointmentIndex].status = status;
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
  }
}

export default function AppointmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all');
  const [filterDate, setFilterDate] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    
    // Get user's appointments
    const allAppointments = getAllAppointments();
    let userAppointments = allAppointments
      .filter(apt => apt.userId === currentUser.id)
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateB.getTime() - dateA.getTime();
      });
    
    // Apply filters
    if (filterStatus !== 'all') {
      userAppointments = userAppointments.filter(apt => apt.status === filterStatus);
    }
    
    if (filterDate !== 'all') {
      const now = new Date();
      userAppointments = userAppointments.filter(apt => {
        const appointmentDate = new Date(`${apt.date}T${apt.time}`);
        return filterDate === 'upcoming' ? appointmentDate >= now : appointmentDate < now;
      });
    }
    
    setAppointments(userAppointments);
  }, [router, filterStatus, filterDate]);

  const handleCancelAppointment = (appointmentId: string) => {
    if (confirm('Randevuyu iptal etmek istediğinize emin misiniz?')) {
      updateAppointmentStatus(appointmentId, 'cancelled');
      const allAppointments = getAllAppointments();
      const userAppointments = allAppointments
        .filter(apt => apt.userId === user.id)
        .sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateB.getTime() - dateA.getTime();
        });
      setAppointments(userAppointments);
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

  if (!user) {
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
    </div>
  );
}

