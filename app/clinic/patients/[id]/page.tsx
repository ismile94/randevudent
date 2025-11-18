"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ClinicNavigation from '@/components/ClinicNavigation';
import Footer from '@/components/Footer';
import { getCurrentClinic } from '@/lib/auth-clinic';
import { getPatientById, getPatientAppointmentHistory } from '@/lib/patients';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  ArrowLeft,
  Edit2,
  FileText,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Plus,
} from 'lucide-react';

export default function ClinicPatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [clinic, setClinic] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const currentClinic = getCurrentClinic();
    if (!currentClinic) {
      router.push('/clinic/login');
      return;
    }
    setClinic(currentClinic);

    const patientId = params?.id as string;
    if (patientId) {
      // TODO: Fetch patient from API
      const foundPatient = getPatientById(patientId);
      if (foundPatient && foundPatient.clinicId === currentClinic.id) {
        setPatient(foundPatient);
        // TODO: Fetch appointment history
        const history = getPatientAppointmentHistory(patientId);
        setAppointments(history);
      } else {
        router.push('/clinic/patients');
      }
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

  if (!clinic || !patient) {
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
          {/* Back Button */}
          <Link
            href="/clinic/patients"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition font-light mb-6"
          >
            <ArrowLeft size={16} />
            Hastalara Dön
          </Link>

          {/* Header */}
          <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 md:p-8 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <User size={32} className="text-blue-400" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-light mb-2">{patient.name}</h1>
                  <div className="flex items-center gap-4 text-sm text-slate-400 font-light">
                    <span>{patient.totalAppointments} randevu</span>
                    <span>•</span>
                    <span>İlk: {formatDate(patient.firstAppointmentDate)}</span>
                    <span>•</span>
                    <span>Son: {formatDate(patient.lastAppointmentDate)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 text-sm border border-slate-600/50 hover:border-blue-400/50 hover:text-blue-400 rounded-lg transition font-light flex items-center gap-2"
              >
                <Edit2 size={16} />
                Düzenle
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* Patient Information */}
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-xl font-light mb-6 flex items-center gap-2">
                  <User size={24} className="text-blue-400" />
                  Hasta Bilgileri
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 py-3 border-b border-slate-700/50">
                    <Phone size={20} className="text-slate-400" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-400 font-light mb-1">Telefon</p>
                      <p className="text-sm font-light">{patient.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 py-3 border-b border-slate-700/50">
                    <Mail size={20} className="text-slate-400" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-400 font-light mb-1">E-posta</p>
                      <p className="text-sm font-light">{patient.email}</p>
                    </div>
                  </div>

                  {patient.tcNumber && (
                    <div className="flex items-center gap-3 py-3 border-b border-slate-700/50">
                      <FileText size={20} className="text-slate-400" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-400 font-light mb-1">TC Kimlik No</p>
                        <p className="text-sm font-light">{patient.tcNumber}</p>
                      </div>
                    </div>
                  )}

                  {patient.address && (
                    <div className="flex items-center gap-3 py-3">
                      <span className="text-slate-400">Adres:</span>
                      <span className="text-sm font-light">{patient.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Medical Information */}
              {(patient.allergies?.length > 0 || patient.chronicDiseases?.length > 0 || patient.medications?.length > 0) && (
                <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                  <h2 className="text-xl font-light mb-6 flex items-center gap-2">
                    <AlertCircle size={24} className="text-blue-400" />
                    Tıbbi Bilgiler
                  </h2>
                  <div className="space-y-4">
                    {patient.allergies && patient.allergies.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 font-light mb-2">Alerjiler</p>
                        <div className="flex flex-wrap gap-2">
                          {patient.allergies.map((allergy: string, index: number) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full border border-red-500/30 text-xs font-light"
                            >
                              {allergy}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {patient.chronicDiseases && patient.chronicDiseases.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 font-light mb-2">Kronik Hastalıklar</p>
                        <div className="flex flex-wrap gap-2">
                          {patient.chronicDiseases.map((disease: string, index: number) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full border border-orange-500/30 text-xs font-light"
                            >
                              {disease}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {patient.medications && patient.medications.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 font-light mb-2">Kullandığı İlaçlar</p>
                        <div className="flex flex-wrap gap-2">
                          {patient.medications.map((medication: string, index: number) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30 text-xs font-light"
                            >
                              {medication}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-light flex items-center gap-2">
                    <MessageSquare size={24} className="text-blue-400" />
                    Notlar
                  </h2>
                  <button className="px-3 py-1 text-sm border border-slate-600/50 hover:border-blue-400/50 hover:text-blue-400 rounded-lg transition font-light flex items-center gap-2">
                    <Plus size={14} />
                    Not Ekle
                  </button>
                </div>
                {patient.notes ? (
                  <p className="text-sm font-light text-slate-300">{patient.notes}</p>
                ) : (
                  <p className="text-sm font-light text-slate-400">Henüz not eklenmemiş</p>
                )}
              </div>

              {/* Appointment History */}
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-xl font-light mb-6 flex items-center gap-2">
                  <Calendar size={24} className="text-blue-400" />
                  Randevu Geçmişi
                </h2>
                {appointments.length === 0 ? (
                  <p className="text-sm font-light text-slate-400 text-center py-4">
                    Henüz randevu geçmişi yok
                  </p>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment: any) => (
                      <Link
                        key={appointment.id}
                        href={`/clinic/appointments/${appointment.id}`}
                        className="block p-4 border border-slate-700/50 rounded-lg hover:border-blue-400/50 transition"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-light">{appointment.service}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-light">
                              <span>{formatDate(appointment.date)}</span>
                              <span>•</span>
                              <span>{appointment.time}</span>
                            </div>
                          </div>
                          {getStatusBadge(appointment.status)}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-light mb-4">İstatistikler</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400 font-light">Toplam Randevu</span>
                    <span className="text-lg font-light">{patient.totalAppointments}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400 font-light">İlk Randevu</span>
                    <span className="text-sm font-light">{formatDate(patient.firstAppointmentDate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400 font-light">Son Randevu</span>
                    <span className="text-sm font-light">{formatDate(patient.lastAppointmentDate)}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-light mb-4">Hızlı İşlemler</h3>
                <div className="space-y-3">
                  <Link
                    href={`/clinic/appointments?patientId=${patient.id}`}
                    className="block w-full px-4 py-2 border border-slate-600/50 hover:border-blue-400/50 hover:text-blue-400 rounded-lg transition font-light text-center"
                  >
                    Yeni Randevu Oluştur
                  </Link>
                  <button className="w-full px-4 py-2 border border-slate-600/50 hover:border-green-400/50 hover:text-green-400 rounded-lg transition font-light">
                    Not Ekle
                  </button>
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

