"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ClinicNavigation from '@/components/ClinicNavigation';
import Footer from '@/components/Footer';
import { getCurrentClinic } from '@/lib/auth-clinic';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle2,
  X,
  AlertCircle,
  ArrowLeft,
  MessageSquare,
  DollarSign,
  UserCircle,
} from 'lucide-react';

export default function ClinicAppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [clinic, setClinic] = useState<any>(null);
  const [appointment, setAppointment] = useState<any>(null);

  useEffect(() => {
    const currentClinic = getCurrentClinic();
    if (!currentClinic) {
      router.push('/clinic/login');
      return;
    }
    setClinic(currentClinic);

    const appointmentId = params?.id as string;
    if (appointmentId) {
      // TODO: Fetch appointment from API
      // For now, set to null
      setAppointment(null);
    }
  }, [params, router]);

  const handleAppointmentAction = (action: 'confirm' | 'cancel' | 'complete') => {
    // TODO: Implement appointment actions
    console.log(`Action: ${action} for appointment: ${appointment?.id}`);
  };

  if (!clinic) {
    return null; // Will redirect
  }

  // Mock appointment data for structure
  const mockAppointment = {
    id: params?.id,
    patientId: '1', // TODO: Get from actual appointment data
    patientName: 'Hasta Adı',
    patientPhone: '0555 123 45 67',
    patientEmail: 'hasta@example.com',
    service: 'Diş Taşı Temizliği',
    date: '2025-01-15',
    time: '14:00',
    doctorName: 'Dr. Ahmet Yılmaz',
    status: 'pending',
    notes: '',
    complaint: '',
    price: 500,
    paymentStatus: 'pending',
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
      case 'completed':
        return (
          <span className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
            Tamamlandı
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

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-cyan-500/20 to-transparent rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10">
        <ClinicNavigation />

        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
          {/* Back Button */}
          <Link
            href="/clinic/appointments"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition font-light mb-6"
          >
            <ArrowLeft size={16} />
            Randevulara Dön
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl md:text-4xl font-light">Randevu Detayı</h1>
              {getStatusBadge(mockAppointment.status)}
            </div>
            <p className="text-slate-400 font-light">
              Randevu bilgilerini buradan görüntüleyebilir ve yönetebilirsiniz
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* Appointment Info */}
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-xl font-light mb-6 flex items-center gap-2">
                  <Calendar size={24} className="text-blue-400" />
                  Randevu Bilgileri
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 py-3 border-b border-slate-700/50">
                    <CheckCircle2 size={20} className="text-slate-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-400 font-light mb-1">Hizmet</p>
                      <p className="text-sm font-light">{mockAppointment.service}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 py-3 border-b border-slate-700/50">
                    <Calendar size={20} className="text-slate-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-400 font-light mb-1">Tarih</p>
                      <p className="text-sm font-light">{formatDate(mockAppointment.date)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 py-3 border-b border-slate-700/50">
                    <Clock size={20} className="text-slate-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-400 font-light mb-1">Saat</p>
                      <p className="text-sm font-light">{mockAppointment.time}</p>
                    </div>
                  </div>

                  {mockAppointment.doctorName && (
                    <div className="flex items-start gap-3 py-3 border-b border-slate-700/50">
                      <User size={20} className="text-slate-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-400 font-light mb-1">Hekim</p>
                        <p className="text-sm font-light">{mockAppointment.doctorName}</p>
                      </div>
                    </div>
                  )}

                  {mockAppointment.complaint && (
                    <div className="flex items-start gap-3 py-3 border-b border-slate-700/50">
                      <AlertCircle size={20} className="text-slate-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-400 font-light mb-1">Şikayet</p>
                        <p className="text-sm font-light">{mockAppointment.complaint}</p>
                      </div>
                    </div>
                  )}

                  {mockAppointment.notes && (
                    <div className="flex items-start gap-3 py-3">
                      <MessageSquare size={20} className="text-slate-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-400 font-light mb-1">Notlar</p>
                        <p className="text-sm font-light">{mockAppointment.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Patient Info */}
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-light flex items-center gap-2">
                    <User size={24} className="text-blue-400" />
                    Hasta Bilgileri
                  </h2>
                  {/* TODO: Get patient ID from appointment and link to patient detail */}
                  <Link
                    href={`/clinic/patients/${mockAppointment.patientId || '1'}`}
                    className="text-sm text-blue-400 hover:text-blue-300 transition font-light flex items-center gap-1"
                  >
                    <UserCircle size={16} />
                    Hasta Detayı
                  </Link>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 py-3 border-b border-slate-700/50">
                    <User size={16} className="text-slate-400" />
                    <span className="text-sm font-light">{mockAppointment.patientName}</span>
                  </div>

                  <div className="flex items-center gap-3 py-3 border-b border-slate-700/50">
                    <Phone size={16} className="text-slate-400" />
                    <span className="text-sm font-light">{mockAppointment.patientPhone}</span>
                  </div>

                  <div className="flex items-center gap-3 py-3">
                    <Mail size={16} className="text-slate-400" />
                    <span className="text-sm font-light">{mockAppointment.patientEmail}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Price & Payment */}
              {mockAppointment.price && (
                <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-light mb-4 flex items-center gap-2">
                    <DollarSign size={20} className="text-blue-400" />
                    Fiyat Bilgisi
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400 font-light">Tutar</span>
                      <span className="text-lg font-light">{mockAppointment.price.toFixed(2)} ₺</span>
                    </div>
                    <div className="px-3 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30 text-center">
                      {mockAppointment.paymentStatus === 'paid' ? 'Ödendi' : 'Beklemede'}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-light mb-4">İşlemler</h3>
                <div className="space-y-3">
                  {mockAppointment.status === 'pending' && (
                    <button
                      onClick={() => handleAppointmentAction('confirm')}
                      className="w-full px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 hover:border-green-400/50 text-green-400 rounded-lg transition font-light flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={16} />
                      Onayla
                    </button>
                  )}

                  {mockAppointment.status === 'confirmed' && (
                    <button
                      onClick={() => handleAppointmentAction('complete')}
                      className="w-full px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 hover:border-blue-400/50 text-blue-400 rounded-lg transition font-light flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={16} />
                      Tamamlandı Olarak İşaretle
                    </button>
                  )}

                  {mockAppointment.status !== 'cancelled' && mockAppointment.status !== 'completed' && (
                    <button
                      onClick={() => handleAppointmentAction('cancel')}
                      className="w-full px-4 py-2 border border-slate-600/50 hover:border-red-400/50 hover:text-red-400 rounded-lg transition font-light flex items-center justify-center gap-2"
                    >
                      <X size={16} />
                      İptal Et
                    </button>
                  )}
                </div>
              </div>
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

