"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import {
  X,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import ToastContainer, { showToast } from '@/components/Toast';

interface Appointment {
  id: string;
  userId: string;
  clinicId: string;
  clinicName: string;
  service: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  cancellationReason?: string;
  createdAt: string;
}

const APPOINTMENTS_STORAGE_KEY = 'randevudent_appointments';

function getAllAppointments(): Appointment[] {
  if (typeof window === 'undefined') return [];
  const appointmentsJson = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
  return appointmentsJson ? JSON.parse(appointmentsJson) : [];
}

function getAppointmentById(appointmentId: string): Appointment | null {
  const appointments = getAllAppointments();
  return appointments.find(apt => apt.id === appointmentId) || null;
}

function cancelAppointment(appointmentId: string, reason: string): void {
  if (typeof window === 'undefined') return;
  const appointments = getAllAppointments();
  const appointmentIndex = appointments.findIndex(apt => apt.id === appointmentId);
  if (appointmentIndex !== -1) {
    appointments[appointmentIndex].status = 'cancelled';
    appointments[appointmentIndex].cancellationReason = reason;
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
  }
}

const cancellationReasons = [
  'Plan değişikliği',
  'Başka bir klinik seçtim',
  'Maliyet',
  'Ulaşım sorunu',
  'Sağlık durumu',
  'Diğer',
];

export default function CancelAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      const appointmentId = params?.id as string;
      if (appointmentId) {
        const foundAppointment = getAppointmentById(appointmentId);
        if (!foundAppointment || foundAppointment.userId !== currentUser.id) {
        router.push('/appointments');
        return;
      }
      if (foundAppointment.status === 'cancelled' || foundAppointment.status === 'completed') {
        router.push(`/appointments/${appointmentId}`);
        return;
      }
      setAppointment(foundAppointment);
      }
    };
    checkAuth();
  }, [params, router]);

  const handleCancel = () => {
    if (!selectedReason) {
      showToast('Lütfen bir iptal nedeni seçiniz', 'error');
      return;
    }

    if (selectedReason === 'Diğer' && !customReason.trim()) {
      showToast('Lütfen iptal nedeninizi belirtiniz', 'error');
      return;
    }

    const reason = selectedReason === 'Diğer' ? customReason : selectedReason;

    if (appointment) {
      cancelAppointment(appointment.id, reason);
      showToast('Randevu başarıyla iptal edildi', 'success');
      setTimeout(() => {
        router.push(`/appointments/${appointment.id}`);
      }, 1000);
    }
  };

  if (!user || !appointment) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <ToastContainer />
      
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-cyan-500/20 to-transparent rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10">
        <Navigation />

        <div className="max-w-2xl mx-auto px-4 md:px-6 py-8">
          {/* Back Button */}
          <Link
            href={`/appointments/${appointment.id}`}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition font-light mb-6"
          >
            <ArrowLeft size={16} />
            Randevu Detayına Dön
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-light mb-2">Randevu İptal</h1>
            <p className="text-slate-400 font-light">
              Randevunuzu iptal etmek istediğinize emin misiniz?
            </p>
          </div>

          {/* Appointment Info */}
          <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-light mb-4">Randevu Bilgileri</h2>
            <div className="space-y-2 text-sm">
              <p className="text-slate-300 font-light">
                <span className="text-slate-400">Klinik: </span>
                {appointment.clinicName}
              </p>
              <p className="text-slate-300 font-light">
                <span className="text-slate-400">Hizmet: </span>
                {appointment.service}
              </p>
              <p className="text-slate-300 font-light">
                <span className="text-slate-400">Tarih: </span>
                {formatDate(appointment.date)}
              </p>
              <p className="text-slate-300 font-light">
                <span className="text-slate-400">Saat: </span>
                {appointment.time}
              </p>
            </div>
          </div>

          {/* Cancellation Reason */}
          <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-light mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-red-400" />
              İptal Nedeni
            </h2>
            <div className="space-y-3">
              {cancellationReasons.map((reason) => (
                <label
                  key={reason}
                  className="flex items-center gap-3 p-3 border border-slate-700/50 rounded-lg hover:border-blue-400/50 cursor-pointer transition"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm font-light text-slate-300">{reason}</span>
                </label>
              ))}

              {selectedReason === 'Diğer' && (
                <div className="mt-4">
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Lütfen nedeninizi belirtiniz
                  </label>
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                    placeholder="İptal nedeninizi yazınız..."
                    rows={3}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleCancel}
              disabled={!selectedReason || (selectedReason === 'Diğer' && !customReason.trim())}
              className="flex-1 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 hover:border-red-400/50 text-red-400 rounded-lg font-light transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <X size={18} />
              Randevuyu İptal Et
            </button>
            <Link
              href={`/appointments/${appointment.id}`}
              className="px-6 py-3 border border-slate-600/50 hover:border-blue-400/50 hover:text-blue-400 rounded-lg transition font-light text-center"
            >
              Vazgeç
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12">
          <Footer />
        </div>
      </div>
    </div>
  );
}

