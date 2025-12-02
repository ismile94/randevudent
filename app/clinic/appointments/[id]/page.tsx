"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ClinicNavigation from '@/components/ClinicNavigation';
import Footer from '@/components/Footer';
import { getCurrentClinic } from '@/lib/auth-clinic';
import { getAppointmentById, updateAppointmentStatus } from '@/lib/services/appointment-service';
import { getPatientByUserId } from '@/lib/services/patient-service';
import { getPendingChangeRequests, approveChangeRequest, rejectChangeRequest } from '@/lib/services/appointment-change-request-service';
import { getStaffById } from '@/lib/services/staff-service';
import { supabase } from '@/lib/supabase';
import ToastContainer, { showToast } from '@/components/Toast';
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
  const [patient, setPatient] = useState<any>(null);
  const [pendingChangeRequest, setPendingChangeRequest] = useState<any>(null);
  const [newDoctorName, setNewDoctorName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [changeRequestNotification, setChangeRequestNotification] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      const currentClinic = getCurrentClinic();
      if (!currentClinic) {
        router.push('/clinic/login');
        return;
      }
      setClinic(currentClinic);

      const appointmentId = params?.id as string;
      if (appointmentId) {
        try {
          // Fetch appointment from Supabase
          const appointmentResult = await getAppointmentById(appointmentId);
          if (appointmentResult.success && appointmentResult.appointment) {
            const apt = appointmentResult.appointment;
            
            // Check if appointment belongs to this clinic
            if (apt.clinic_id !== currentClinic.id) {
              showToast('Bu randevu bu kliniğe ait değil', 'error');
              router.push('/clinic/appointments');
              return;
            }

            setAppointment(apt);

            // Fetch patient data
            const patientResult = await getPatientByUserId(apt.clinic_id, apt.user_id);
            if (patientResult.success && patientResult.patient) {
              setPatient(patientResult.patient);
            }

            // Fetch pending change requests (from user)
            const changeRequestsResult = await getPendingChangeRequests(appointmentId);
            if (changeRequestsResult.success && changeRequestsResult.changeRequests) {
              // Get the most recent pending request from user
              const userRequest = changeRequestsResult.changeRequests.find(
                (req: any) => req.requested_by_type === 'user'
              );
              if (userRequest) {
                setPendingChangeRequest(userRequest);
                
                // Fetch doctor name if new_doctor_id exists
                if (userRequest.new_doctor_id) {
                  const doctorResult = await getStaffById(userRequest.new_doctor_id);
                  if (doctorResult.success && doctorResult.staff) {
                    setNewDoctorName(doctorResult.staff.name);
                  }
                }
              }
            }
          } else {
            showToast('Randevu bulunamadı', 'error');
            router.push('/clinic/appointments');
          }
        } catch (error) {
          console.error('Error loading appointment:', error);
          showToast('Randevu yüklenirken bir hata oluştu', 'error');
          router.push('/clinic/appointments');
        } finally {
          setLoading(false);
        }
      } else {
        router.push('/clinic/appointments');
      }
    };

    loadData();
  }, [params, router]);

  // Play notification sound
  const playNotificationSound = () => {
    try {
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

  // Realtime subscription for appointment changes
  useEffect(() => {
    const appointmentId = params?.id as string;
    if (!appointmentId || !clinic) return;

    const channel = supabase
      .channel(`clinic-appointment-detail-${appointmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `id=eq.${appointmentId}`,
        },
        async (payload) => {
          console.log('Appointment change detected:', payload);
          // Reload appointment data
          const appointmentResult = await getAppointmentById(appointmentId);
          if (appointmentResult.success && appointmentResult.appointment) {
            const apt = appointmentResult.appointment;
            
            // Check if appointment belongs to this clinic
            if (apt.clinic_id !== clinic.id) {
              return;
            }

            setAppointment(apt);

            // Reload patient data
            const patientResult = await getPatientByUserId(apt.clinic_id, apt.user_id);
            if (patientResult.success && patientResult.patient) {
              setPatient(patientResult.patient);
            }

            // Reload change requests
            const changeRequestsResult = await getPendingChangeRequests(appointmentId);
            if (changeRequestsResult.success && changeRequestsResult.changeRequests) {
              const userRequest = changeRequestsResult.changeRequests.find(
                (req: any) => req.requested_by_type === 'user'
              );
              if (userRequest) {
                setPendingChangeRequest(userRequest);
                
                // Fetch doctor name if new_doctor_id exists
                if (userRequest.new_doctor_id) {
                  const doctorResult = await getStaffById(userRequest.new_doctor_id);
                  if (doctorResult.success && doctorResult.staff) {
                    setNewDoctorName(doctorResult.staff.name);
                  }
                }
              } else {
                setPendingChangeRequest(null);
                setNewDoctorName('');
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointment_change_requests',
          filter: `appointment_id=eq.${appointmentId}`,
        },
        async (payload) => {
          console.log('New change request detected:', payload);
          const changeRequest = payload.new as any;
          if (changeRequest.requested_by_type === 'user') {
            playNotificationSound();
            setChangeRequestNotification({
              message: 'Hasta değişiklik talebi gönderdi!',
              type: 'new_change_request',
              timestamp: Date.now(),
            });
            setTimeout(() => setChangeRequestNotification(null), 5000);
          }
          
          // Reload change requests
          const changeRequestsResult = await getPendingChangeRequests(appointmentId);
          if (changeRequestsResult.success && changeRequestsResult.changeRequests) {
            const userRequest = changeRequestsResult.changeRequests.find(
              (req: any) => req.requested_by_type === 'user'
            );
            if (userRequest) {
              setPendingChangeRequest(userRequest);
              
              // Fetch doctor name if new_doctor_id exists
              if (userRequest.new_doctor_id) {
                const doctorResult = await getStaffById(userRequest.new_doctor_id);
                if (doctorResult.success && doctorResult.staff) {
                  setNewDoctorName(doctorResult.staff.name);
                }
              }
            } else {
              setPendingChangeRequest(null);
              setNewDoctorName('');
            }
          } else {
            setPendingChangeRequest(null);
            setNewDoctorName('');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointment_change_requests',
          filter: `appointment_id=eq.${appointmentId}`,
        },
        async (payload) => {
          console.log('Change request updated:', payload);
          // Reload change requests
          const changeRequestsResult = await getPendingChangeRequests(appointmentId);
          if (changeRequestsResult.success && changeRequestsResult.changeRequests) {
            const userRequest = changeRequestsResult.changeRequests.find(
              (req: any) => req.requested_by_type === 'user'
            );
            if (userRequest) {
              setPendingChangeRequest(userRequest);
              
              // Fetch doctor name if new_doctor_id exists
              if (userRequest.new_doctor_id) {
                const doctorResult = await getStaffById(userRequest.new_doctor_id);
                if (doctorResult.success && doctorResult.staff) {
                  setNewDoctorName(doctorResult.staff.name);
                }
              }
            } else {
              setPendingChangeRequest(null);
              setNewDoctorName('');
            }
          } else {
            setPendingChangeRequest(null);
            setNewDoctorName('');
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params, clinic]);

  const handleApproveChangeRequest = async () => {
    if (!pendingChangeRequest) return;

    try {
      const result = await approveChangeRequest(pendingChangeRequest.id);
      if (result.success) {
        showToast('Değişiklik talebi onaylandı', 'success');
        // Reload data
        const appointmentId = params?.id as string;
        if (appointmentId) {
          const appointmentResult = await getAppointmentById(appointmentId);
          if (appointmentResult.success && appointmentResult.appointment) {
            setAppointment(appointmentResult.appointment);
            setPendingChangeRequest(null);
          }
        }
      } else {
        showToast(result.error || 'Değişiklik talebi onaylanamadı', 'error');
      }
    } catch (error) {
      console.error('Error approving change request:', error);
      showToast('Değişiklik talebi onaylanırken bir hata oluştu', 'error');
    }
  };

  const handleRejectChangeRequest = async () => {
    if (!pendingChangeRequest) return;

    if (!confirm('Değişiklik talebini reddetmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      const result = await rejectChangeRequest(pendingChangeRequest.id);
      if (result.success) {
        showToast('Değişiklik talebi reddedildi', 'success');
        setPendingChangeRequest(null);
      } else {
        showToast(result.error || 'Değişiklik talebi reddedilemedi', 'error');
      }
    } catch (error) {
      console.error('Error rejecting change request:', error);
      showToast('Değişiklik talebi reddedilirken bir hata oluştu', 'error');
    }
  };

  const handleAppointmentAction = async (action: 'confirm' | 'cancel' | 'complete') => {
    if (!appointment) return;

    let newStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed' = 'pending';
    if (action === 'confirm') newStatus = 'confirmed';
    else if (action === 'cancel') newStatus = 'cancelled';
    else if (action === 'complete') newStatus = 'completed';

    try {
      const result = await updateAppointmentStatus(appointment.id, newStatus);
      if (result.success && result.appointment) {
        setAppointment(result.appointment);
        showToast(
          action === 'confirm' ? 'Randevu onaylandı' :
          action === 'cancel' ? 'Randevu iptal edildi' :
          'Randevu tamamlandı olarak işaretlendi',
          'success'
        );
      } else {
        showToast(result.error || 'İşlem başarısız', 'error');
      }
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      showToast('İşlem sırasında bir hata oluştu', 'error');
    }
  };

  if (!clinic || loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!appointment) {
    return null; // Will redirect
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
              {getStatusBadge(appointment.status)}
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

                  {appointment.doctor_name && (
                    <div className="flex items-start gap-3 py-3 border-b border-slate-700/50">
                      <User size={20} className="text-slate-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-400 font-light mb-1">Hekim</p>
                        <p className="text-sm font-light">{appointment.doctor_name}</p>
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

              {/* Patient Info */}
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-light flex items-center gap-2">
                    <User size={24} className="text-blue-400" />
                    Hasta Bilgileri
                  </h2>
                  {patient && (
                    <Link
                      href={`/clinic/patients/${patient.id}`}
                      className="text-sm text-blue-400 hover:text-blue-300 transition font-light flex items-center gap-1"
                    >
                      <UserCircle size={16} />
                      Hasta Detayı
                    </Link>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 py-3 border-b border-slate-700/50">
                    <User size={16} className="text-slate-400" />
                    <span className="text-sm font-light">{patient?.name || 'Yükleniyor...'}</span>
                  </div>

                  {patient?.phone && (
                    <div className="flex items-center gap-3 py-3 border-b border-slate-700/50">
                      <Phone size={16} className="text-slate-400" />
                      <span className="text-sm font-light">{patient.phone}</span>
                    </div>
                  )}

                  {patient?.email && (
                    <div className="flex items-center gap-3 py-3">
                      <Mail size={16} className="text-slate-400" />
                      <span className="text-sm font-light">{patient.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pending Change Request from User */}
              {pendingChangeRequest && appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                <div className="bg-yellow-500/10 backdrop-blur border border-yellow-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-light mb-4 flex items-center gap-2 text-yellow-400">
                    <AlertCircle size={20} />
                    Bekleyen Değişiklik Talebi
                  </h3>
                  <p className="text-sm font-light text-slate-300 mb-4">
                    Hasta randevusunda değişiklik yapmak istiyor. Lütfen inceleyin ve onaylayın veya reddedin.
                  </p>
                  
                  <div className="bg-slate-800/50 rounded-lg p-4 mb-4 space-y-2">
                    {pendingChangeRequest.new_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400 font-light">Yeni Tarih:</span>
                        <span className="text-sm font-light">{new Date(pendingChangeRequest.new_date).toLocaleDateString('tr-TR')}</span>
                      </div>
                    )}
                    {pendingChangeRequest.new_time && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400 font-light">Yeni Saat:</span>
                        <span className="text-sm font-light">{pendingChangeRequest.new_time.substring(0, 5)}</span>
                      </div>
                    )}
                    {pendingChangeRequest.new_doctor_id && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400 font-light">Yeni Hekim:</span>
                        <span className="text-sm font-light">{newDoctorName || 'Yükleniyor...'}</span>
                      </div>
                    )}
                    {pendingChangeRequest.new_service && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400 font-light">Yeni Hizmet:</span>
                        <span className="text-sm font-light">{pendingChangeRequest.new_service}</span>
                      </div>
                    )}
                    {pendingChangeRequest.reason && (
                      <div className="mt-3 pt-3 border-t border-slate-700/50">
                        <span className="text-sm text-slate-400 font-light">Neden: </span>
                        <span className="text-sm font-light">{pendingChangeRequest.reason}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleApproveChangeRequest}
                      className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 hover:border-green-400/50 text-green-400 rounded-lg transition font-light flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={16} />
                      Onayla
                    </button>
                    <button
                      onClick={handleRejectChangeRequest}
                      className="flex-1 px-4 py-2 border border-slate-600/50 hover:border-red-400/50 hover:text-red-400 rounded-lg transition font-light flex items-center justify-center gap-2"
                    >
                      <X size={16} />
                      Reddet
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Price & Payment */}
              {appointment.price && (
                <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-light mb-4 flex items-center gap-2">
                    <DollarSign size={20} className="text-blue-400" />
                    Fiyat Bilgisi
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400 font-light">Tutar</span>
                      <span className="text-lg font-light">{Number(appointment.price).toFixed(2)} ₺</span>
                    </div>
                    {appointment.payment_status && (
                      <div className="px-3 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30 text-center">
                        {appointment.payment_status === 'paid' ? 'Ödendi' : 
                         appointment.payment_status === 'refunded' ? 'İade Edildi' : 'Beklemede'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-light mb-4">İşlemler</h3>
                <div className="space-y-3">
                  {appointment.status === 'pending' && (
                    <button
                      onClick={() => handleAppointmentAction('confirm')}
                      className="w-full px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 hover:border-green-400/50 text-green-400 rounded-lg transition font-light flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={16} />
                      Onayla
                    </button>
                  )}

                  {appointment.status === 'confirmed' && (
                    <button
                      onClick={() => handleAppointmentAction('complete')}
                      className="w-full px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 hover:border-blue-400/50 text-blue-400 rounded-lg transition font-light flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={16} />
                      Tamamlandı Olarak İşaretle
                    </button>
                  )}

                  {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                    <>
                      <Link
                        href={`/clinic/appointments/${appointment.id}/edit`}
                        className="w-full px-4 py-2 border border-slate-600/50 hover:border-blue-400/50 hover:text-blue-400 rounded-lg transition font-light flex items-center justify-center gap-2"
                      >
                        <MessageSquare size={16} />
                        Randevuyu Düzenle
                      </Link>
                      <button
                        onClick={() => handleAppointmentAction('cancel')}
                        className="w-full px-4 py-2 border border-slate-600/50 hover:border-red-400/50 hover:text-red-400 rounded-lg transition font-light flex items-center justify-center gap-2"
                      >
                        <X size={16} />
                        İptal Et
                      </button>
                    </>
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
      <ToastContainer />
    </div>
  );
}

