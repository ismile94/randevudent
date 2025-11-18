"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  X,
  AlertCircle,
  ArrowLeft,
  User,
  Edit2,
  QrCode,
  Download,
  Star,
  MessageSquare,
  DollarSign,
  CreditCard,
} from 'lucide-react';
// QR Code will be generated using an API or library

interface Appointment {
  id: string;
  userId: string;
  clinicId: string;
  clinicName: string;
  clinicAddress?: string;
  clinicPhone?: string;
  clinicEmail?: string;
  doctorId?: string;
  doctorName?: string;
  service: string;
  date: string;
  time: string;
  notes?: string;
  complaint?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  price?: number;
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  cancellationReason?: string;
  createdAt: string;
  isUrgent?: boolean;
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

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
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
      setAppointment(foundAppointment);
    }
  }, [params, router]);

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

  const getPaymentStatusBadge = (status?: string) => {
    if (!status) return null;
    switch (status) {
      case 'paid':
        return (
          <span className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
            Ödendi
          </span>
        );
      case 'refunded':
        return (
          <span className="px-3 py-1 text-xs bg-orange-500/20 text-orange-400 rounded-full border border-orange-500/30">
            İade Edildi
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

  if (!user || !appointment) {
    return null; // Will redirect
  }

  const qrData = JSON.stringify({
    appointmentId: appointment.id,
    clinicName: appointment.clinicName,
    date: appointment.date,
    time: appointment.time,
    service: appointment.service,
  });

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
            href="/appointments"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition font-light mb-6"
          >
            <ArrowLeft size={16} />
            Randevularıma Dön
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl md:text-4xl font-light">Randevu Detayı</h1>
              <div className="flex items-center gap-2">
                {getStatusBadge(appointment.status)}
                {appointment.isUrgent && (
                  <span className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
                    Acil
                  </span>
                )}
              </div>
            </div>
            <p className="text-slate-400 font-light">
              Randevu bilgilerinizi buradan görüntüleyebilirsiniz
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
                      <p className="text-sm font-light">{appointment.service}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 py-3 border-b border-slate-700/50">
                    <Calendar size={20} className="text-slate-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-400 font-light mb-1">Tarih</p>
                      <p className="text-sm font-light">{formatDate(appointment.date)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 py-3 border-b border-slate-700/50">
                    <Clock size={20} className="text-slate-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-400 font-light mb-1">Saat</p>
                      <p className="text-sm font-light">{appointment.time}</p>
                    </div>
                  </div>

                  {appointment.doctorName && (
                    <div className="flex items-start gap-3 py-3 border-b border-slate-700/50">
                      <User size={20} className="text-slate-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-400 font-light mb-1">Hekim</p>
                        <p className="text-sm font-light">{appointment.doctorName}</p>
                      </div>
                    </div>
                  )}

                  {appointment.complaint && (
                    <div className="flex items-start gap-3 py-3 border-b border-slate-700/50">
                      <AlertCircle size={20} className="text-slate-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-400 font-light mb-1">Şikayet</p>
                        <p className="text-sm font-light">{appointment.complaint}</p>
                      </div>
                    </div>
                  )}

                  {appointment.notes && (
                    <div className="flex items-start gap-3 py-3">
                      <MessageSquare size={20} className="text-slate-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-400 font-light mb-1">Notlar</p>
                        <p className="text-sm font-light">{appointment.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Clinic Info */}
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-xl font-light mb-6 flex items-center gap-2">
                  <MapPin size={24} className="text-blue-400" />
                  Klinik Bilgileri
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 py-3 border-b border-slate-700/50">
                    <div className="flex-1">
                      <p className="text-sm font-light mb-2">{appointment.clinicName}</p>
                      {appointment.clinicAddress && (
                        <p className="text-xs text-slate-400 font-light">{appointment.clinicAddress}</p>
                      )}
                    </div>
                  </div>

                  {appointment.clinicPhone && (
                    <div className="flex items-center gap-3 py-3 border-b border-slate-700/50">
                      <Phone size={16} className="text-slate-400" />
                      <span className="text-sm font-light">{appointment.clinicPhone}</span>
                    </div>
                  )}

                  {appointment.clinicEmail && (
                    <div className="flex items-center gap-3 py-3">
                      <Mail size={16} className="text-slate-400" />
                      <span className="text-sm font-light">{appointment.clinicEmail}</span>
                    </div>
                  )}

                  <Link
                    href={`/clinics/${appointment.clinicId}`}
                    className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition font-light mt-4"
                  >
                    Klinik Detayını Gör
                    <ArrowLeft size={16} className="rotate-180" />
                  </Link>
                </div>
              </div>

              {/* Preparation Checklist */}
              {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-light mb-4 flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-blue-400" />
                    Randevu Öncesi Hazırlık
                  </h3>
                  <div className="space-y-3">
                    {[
                      'Randevu saatinden 15 dakika önce klinikte olun',
                      'Kimlik belgenizi yanınıza alın',
                      'Varsa önceki röntgen ve raporlarınızı getirin',
                      'Aç karnına gelmeniz gerekiyorsa, randevu öncesi yemek yemeyin',
                      'Kullandığınız ilaçların listesini hazırlayın',
                      'Alerji bilgilerinizi paylaşın',
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle2 size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm font-light text-slate-300">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cancellation Reason */}
              {appointment.status === 'cancelled' && appointment.cancellationReason && (
                <div className="bg-red-500/10 backdrop-blur border border-red-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-light mb-2 flex items-center gap-2 text-red-400">
                    <X size={20} />
                    İptal Nedeni
                  </h3>
                  <p className="text-sm font-light text-slate-300">{appointment.cancellationReason}</p>
                </div>
              )}

              {/* Post-Appointment Follow-up */}
              {appointment.status === 'completed' && (
                <div className="bg-green-500/10 backdrop-blur border border-green-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-light mb-4 flex items-center gap-2 text-green-400">
                    <CheckCircle2 size={20} />
                    Randevu Sonrası Takip
                  </h3>
                  <div className="space-y-3">
                    <p className="text-sm font-light text-slate-300">
                      Randevunuz tamamlandı. Deneyiminizi paylaşmak ister misiniz?
                    </p>
                    <Link
                      href={`/clinics/${appointment.clinicId}/review?appointmentId=${appointment.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg transition font-light text-green-400"
                    >
                      <Star size={16} />
                      Yorum Yap ve Değerlendir
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Price & Payment */}
              {appointment.price !== undefined && (
                <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-light mb-4 flex items-center gap-2">
                    <DollarSign size={20} className="text-blue-400" />
                    Fiyat Bilgisi
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400 font-light">Tutar</span>
                      <span className="text-lg font-light">{appointment.price.toFixed(2)} ₺</span>
                    </div>
                    {getPaymentStatusBadge(appointment.paymentStatus)}
                  </div>
                </div>
              )}

              {/* QR Code */}
              {appointment.status !== 'cancelled' && (
                <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-light mb-4 flex items-center gap-2">
                    <QrCode size={20} className="text-blue-400" />
                    QR Kod
                  </h3>
                  <div className="flex flex-col items-center gap-4">
                    {showQR ? (
                      <>
                        <div className="bg-white p-4 rounded-lg flex items-center justify-center">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`}
                            alt="QR Code"
                            className="w-full max-w-[150px]"
                          />
                        </div>
                        <button
                          onClick={() => setShowQR(false)}
                          className="text-sm text-slate-400 hover:text-slate-300 transition font-light"
                        >
                          Gizle
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setShowQR(true)}
                        className="w-full px-4 py-2 border border-slate-600/50 hover:border-blue-400/50 hover:text-blue-400 rounded-lg transition font-light flex items-center justify-center gap-2"
                      >
                        <QrCode size={16} />
                        QR Kodu Göster
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-light mb-4">İşlemler</h3>
                <div className="space-y-3">
                  {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                    <Link
                      href={`/appointments/${appointment.id}/edit`}
                      className="w-full px-4 py-2 border border-slate-600/50 hover:border-blue-400/50 hover:text-blue-400 rounded-lg transition font-light flex items-center justify-center gap-2"
                    >
                      <Edit2 size={16} />
                      Randevu Değiştir
                    </Link>
                  )}

                  {appointment.status === 'completed' && (
                    <Link
                      href={`/clinics/${appointment.clinicId}/review?appointmentId=${appointment.id}`}
                      className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition flex items-center justify-center gap-2"
                    >
                      <Star size={16} />
                      Yorum Yap
                    </Link>
                  )}

                  {appointment.status !== 'cancelled' && (
                    <Link
                      href={`/appointments/${appointment.id}/cancel`}
                      className="w-full px-4 py-2 border border-slate-600/50 hover:border-red-400/50 hover:text-red-400 rounded-lg transition font-light flex items-center justify-center gap-2"
                    >
                      <X size={16} />
                      İptal Et
                    </Link>
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

