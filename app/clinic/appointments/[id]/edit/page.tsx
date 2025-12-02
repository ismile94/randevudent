"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ClinicNavigation from '@/components/ClinicNavigation';
import Footer from '@/components/Footer';
import { getCurrentClinic } from '@/lib/auth-clinic';
import { getAppointmentById } from '@/lib/services/appointment-service';
import { getClinicStaff } from '@/lib/services/staff-service';
import { createAppointmentChangeRequest } from '@/lib/services/appointment-change-request-service';
import {
  Calendar,
  Clock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  User,
} from 'lucide-react';
import ToastContainer, { showToast } from '@/components/Toast';

// Helper function to check if staff member is a doctor
function isDoctor(staff: any): boolean {
  const titleLower = staff.title?.toLowerCase() || '';
  const excludedTitles = ['asistan', 'sekreter', 'yönetici', 'müdür', 'teknisyen', 'temizlik', 'muhasebe', 'kabul'];
  if (excludedTitles.some(excluded => titleLower.includes(excluded))) {
    return false;
  }
  return (
    titleLower.includes('hekim') ||
    titleLower.includes('doktor') ||
    titleLower.includes('dr') ||
    titleLower.includes('diş hekimi') ||
    titleLower.includes('uzman') ||
    !!staff.specialty
  );
}

function getMonthNameInTurkish(month: number): string {
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  return months[month];
}

function getDaysInMonth(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];
  
  const startDay = (firstDay.getDay() + 6) % 7;
  
  for (let i = 0; i < startDay; i++) {
    const date = new Date(year, month, 1 - startDay + i);
    days.push(date);
  }
  
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }
  
  return days;
}

function getAllAvailableDates(workingHours: any[]): string[] {
  const dates: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 60);
  
  for (let d = new Date(today); d <= maxDate; d.setDate(d.getDate() + 1)) {
    const dayName = d.toLocaleDateString('tr-TR', { weekday: 'long' });
    const workingDay = workingHours.find(wh => wh.day === dayName);
    if (workingDay && !workingDay.closed) {
      dates.push(d.toISOString().split('T')[0]);
    }
  }
  
  return dates;
}

function getAvailableTimeSlots(date: string, workingHours: any[]): string[] {
  const dateObj = new Date(date);
  const dayName = dateObj.toLocaleDateString('tr-TR', { weekday: 'long' });
  const workingDay = workingHours.find(wh => wh.day === dayName);
  
  if (!workingDay || workingDay.closed) return [];
  
  const slots: string[] = [];
  const [openHour, openMin] = workingDay.open.split(':').map(Number);
  const [closeHour, closeMin] = workingDay.close.split(':').map(Number);
  
  let currentHour = openHour;
  let currentMin = openMin;
  
  while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
    slots.push(`${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`);
    currentMin += 30;
    if (currentMin >= 60) {
      currentMin = 0;
      currentHour++;
    }
  }
  
  return slots;
}

export default function ClinicEditAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const [clinic, setClinic] = useState<any>(null);
  const [appointment, setAppointment] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [reason, setReason] = useState('');
  
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const currentClinic = getCurrentClinic();
      if (!currentClinic) {
        router.push('/clinic/login');
        return;
      }
      setClinic(currentClinic);

      const appointmentId = params?.id as string;
      if (!appointmentId) {
        router.push('/clinic/appointments');
        return;
      }

      try {
        // Fetch appointment from Supabase
        const appointmentResult = await getAppointmentById(appointmentId);
        if (!appointmentResult.success || !appointmentResult.appointment) {
          showToast('Randevu bulunamadı', 'error');
          router.push('/clinic/appointments');
          return;
        }

        const apt = appointmentResult.appointment;
        
        // Check if appointment belongs to clinic
        if (apt.clinic_id !== currentClinic.id) {
          showToast('Bu randevu bu kliniğe ait değil', 'error');
          router.push('/clinic/appointments');
          return;
        }

        // Check if appointment can be edited
        if (apt.status === 'cancelled' || apt.status === 'completed') {
          showToast('İptal edilmiş veya tamamlanmış randevular düzenlenemez', 'error');
          router.push(`/clinic/appointments/${appointmentId}`);
          return;
        }

        setAppointment(apt);
        setSelectedDate(apt.date);
        setSelectedTime(apt.time);
        setSelectedDoctorId(apt.doctor_id || '');
        setSelectedService(apt.service);

        // Default working hours
        const workingHours = [
          { day: 'Pazartesi', open: '09:00', close: '18:00', closed: false },
          { day: 'Salı', open: '09:00', close: '18:00', closed: false },
          { day: 'Çarşamba', open: '09:00', close: '18:00', closed: false },
          { day: 'Perşembe', open: '09:00', close: '18:00', closed: false },
          { day: 'Cuma', open: '09:00', close: '18:00', closed: false },
          { day: 'Cumartesi', open: '09:00', close: '14:00', closed: false },
          { day: 'Pazar', open: '09:00', close: '18:00', closed: true },
        ];

        const dates = getAllAvailableDates(workingHours);
        setAvailableDates(dates);

        // Fetch staff/doctors
        const staffResult = await getClinicStaff(apt.clinic_id);
        if (staffResult.success && staffResult.staff) {
          const doctorsData = staffResult.staff
            .filter((s: any) => isDoctor(s))
            .map((s: any) => ({
              id: s.id,
              name: s.name,
              specialty: Array.isArray(s.specialty) ? s.specialty.join(', ') : s.specialty || s.title,
              services: s.services || [],
            }));
          
          setDoctors(doctorsData);

          // Collect all services
          const servicesSet = new Set<string>();
          staffResult.staff.forEach((s: any) => {
            if (s.services && Array.isArray(s.services)) {
              s.services.forEach((service: string) => servicesSet.add(service));
            }
          });
          setAllServices(Array.from(servicesSet));
        }
      } catch (error) {
        console.error('Error loading appointment data:', error);
        showToast('Randevu bilgileri yüklenirken bir hata oluştu', 'error');
        router.push('/clinic/appointments');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params, router]);

  useEffect(() => {
    if (selectedDate && clinic) {
      const workingHours = [
        { day: 'Pazartesi', open: '09:00', close: '18:00', closed: false },
        { day: 'Salı', open: '09:00', close: '18:00', closed: false },
        { day: 'Çarşamba', open: '09:00', close: '18:00', closed: false },
        { day: 'Perşembe', open: '09:00', close: '18:00', closed: false },
        { day: 'Cuma', open: '09:00', close: '18:00', closed: false },
        { day: 'Cumartesi', open: '09:00', close: '14:00', closed: false },
        { day: 'Pazar', open: '09:00', close: '18:00', closed: true },
      ];
      const times = getAvailableTimeSlots(selectedDate, workingHours);
      setAvailableTimes(times);
      if (!times.includes(selectedTime)) {
        setSelectedTime('');
      }
    }
  }, [selectedDate, clinic, selectedTime]);

  // Update available services when doctor changes
  useEffect(() => {
    if (selectedDoctorId) {
      const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);
      if (selectedDoctor && selectedDoctor.services && selectedDoctor.services.length > 0) {
        setAllServices(selectedDoctor.services);
        if (!selectedDoctor.services.includes(selectedService)) {
          setSelectedService('');
        }
      }
    } else {
      const allServicesSet = new Set<string>();
      doctors.forEach((d: any) => {
        if (d.services && Array.isArray(d.services)) {
          d.services.forEach((service: string) => allServicesSet.add(service));
        }
      });
      setAllServices(Array.from(allServicesSet));
    }
  }, [selectedDoctorId, doctors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appointment || !clinic) return;

    // Check if any changes were made
    const hasDateChange = selectedDate !== appointment.date;
    const hasTimeChange = selectedTime !== appointment.time;
    const hasDoctorChange = selectedDoctorId !== (appointment.doctor_id || '');
    const hasServiceChange = selectedService !== appointment.service;

    if (!hasDateChange && !hasTimeChange && !hasDoctorChange && !hasServiceChange) {
      showToast('Herhangi bir değişiklik yapmadınız', 'error');
      return;
    }

    if (!selectedDate || !selectedTime || !selectedService) {
      showToast('Lütfen tarih, saat ve hizmet seçiniz', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create change request
      const changeRequestData: any = {
        appointment_id: appointment.id,
        requested_by: clinic.id,
        requested_by_type: 'clinic',
      };

      if (hasDateChange) changeRequestData.new_date = selectedDate;
      if (hasTimeChange) changeRequestData.new_time = selectedTime;
      if (hasDoctorChange && selectedDoctorId) changeRequestData.new_doctor_id = selectedDoctorId;
      if (hasServiceChange) changeRequestData.new_service = selectedService;
      if (reason.trim()) changeRequestData.reason = reason.trim();

      const result = await createAppointmentChangeRequest(changeRequestData);

      if (result.success) {
        showToast('Değişiklik talebi hastaya gönderildi. Onay bekleniyor.', 'success');
        setTimeout(() => {
          router.push(`/clinic/appointments/${appointment.id}`);
        }, 1500);
      } else {
        showToast(result.error || 'Değişiklik talebi oluşturulamadı', 'error');
      }
    } catch (error: any) {
      console.error('Error creating change request:', error);
      showToast('Değişiklik talebi oluşturulurken bir hata oluştu', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !clinic || !appointment) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <ToastContainer />
      
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
            href={`/clinic/appointments/${appointment.id}`}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition font-light mb-6"
          >
            <ArrowLeft size={16} />
            Randevu Detayına Dön
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-light mb-2">Randevu Değişiklik Talebi</h1>
            <p className="text-slate-400 font-light">
              Randevu için değişiklik talebi gönderin. Hasta onayladıktan sonra değişiklikler uygulanacaktır.
            </p>
          </div>

          {/* Current Appointment Info */}
          <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-light mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-blue-400" />
              Mevcut Randevu Bilgileri
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400 font-light">Tarih: </span>
                <span className="font-light">{new Date(appointment.date).toLocaleDateString('tr-TR')}</span>
              </div>
              <div>
                <span className="text-slate-400 font-light">Saat: </span>
                <span className="font-light">{appointment.time}</span>
              </div>
              {appointment.doctor_name && (
                <div>
                  <span className="text-slate-400 font-light">Hekim: </span>
                  <span className="font-light">{appointment.doctor_name}</span>
                </div>
              )}
              <div>
                <span className="text-slate-400 font-light">Hizmet: </span>
                <span className="font-light">{appointment.service}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Doctor Selection */}
            {doctors.length > 0 && (
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                <label className="block text-sm font-light text-slate-300 mb-4">
                  <User className="inline mr-2" size={16} />
                  Hekim Seçin (Opsiyonel)
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white font-light focus:outline-none focus:border-blue-400/50"
                >
                  <option value="">Hekim seçilmedi</option>
                  {doctors.map((doctor: any) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} {doctor.specialty ? `- ${doctor.specialty}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Service Selection */}
            {allServices.length > 0 && (
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                <label className="block text-sm font-light text-slate-300 mb-4">
                  <CheckCircle2 className="inline mr-2" size={16} />
                  Hizmet Seçin
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white font-light focus:outline-none focus:border-blue-400/50"
                >
                  <option value="">Hizmet seçin</option>
                  {allServices.map((service: string) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Calendar */}
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => {
                    if (currentMonth === 0) {
                      setCurrentMonth(11);
                      setCurrentYear(currentYear - 1);
                    } else {
                      setCurrentMonth(currentMonth - 1);
                    }
                  }}
                  className="p-2 hover:bg-slate-700/50 rounded-lg transition"
                >
                  <ChevronLeft size={20} className="text-slate-400" />
                </button>
                <h3 className="text-lg font-light text-slate-300">
                  {getMonthNameInTurkish(currentMonth)} {currentYear}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    if (currentMonth === 11) {
                      setCurrentMonth(0);
                      setCurrentYear(currentYear + 1);
                    } else {
                      setCurrentMonth(currentMonth + 1);
                    }
                  }}
                  className="p-2 hover:bg-slate-700/50 rounded-lg transition"
                >
                  <ChevronRight size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-light text-slate-400 py-2"
                  >
                    {day}
                  </div>
                ))}

                {getDaysInMonth(currentYear, currentMonth).map((date, index) => {
                  const dateString = date.toISOString().split('T')[0];
                  const isCurrentMonth = date.getMonth() === currentMonth;
                  const isAvailable = availableDates.includes(dateString);
                  const isSelected = selectedDate === dateString;
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isPast = date < today;
                  const isToday = dateString === today.toISOString().split('T')[0];

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        if (isAvailable && isCurrentMonth && !isPast) {
                          setSelectedDate(dateString);
                        }
                      }}
                      disabled={!isAvailable || !isCurrentMonth || isPast}
                      className={`
                        aspect-square p-2 rounded-lg border transition font-light text-sm
                        ${
                          !isCurrentMonth
                            ? 'opacity-0 cursor-default'
                            : isPast
                            ? 'opacity-30 cursor-not-allowed border-slate-700/30 text-slate-600'
                            : !isAvailable
                            ? 'opacity-30 cursor-not-allowed border-slate-700/30 text-slate-600 bg-slate-800/20'
                            : isSelected
                            ? 'bg-blue-500/20 border-blue-400/50 text-blue-300 hover:bg-blue-500/30'
                            : isToday
                            ? 'bg-slate-700/50 border-blue-400/30 text-blue-300 hover:border-blue-400/50'
                            : 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:border-blue-400/50 hover:bg-slate-800/70'
                        }
                      `}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                <label className="block text-sm font-light text-slate-300 mb-4">
                  <Clock className="inline mr-2" size={16} />
                  Saat Seçin
                </label>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-64 overflow-y-auto">
                  {availableTimes.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`
                        px-4 py-2 rounded-lg border transition font-light text-sm
                        ${
                          selectedTime === time
                            ? 'bg-blue-500/20 border-blue-400/50 text-blue-300'
                            : 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:border-blue-400/50'
                        }
                      `}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reason */}
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
              <label className="block text-sm font-light text-slate-300 mb-4">
                <AlertCircle className="inline mr-2" size={16} />
                Değişiklik Nedeni (Opsiyonel)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Değişiklik yapmak istediğiniz nedeni belirtin..."
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white font-light focus:outline-none focus:border-blue-400/50 resize-none"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={!selectedDate || !selectedTime || !selectedService || isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} />
                {isSubmitting ? 'Gönderiliyor...' : 'Değişiklik Talebi Gönder'}
              </button>
              <Link
                href={`/clinic/appointments/${appointment.id}`}
                className="px-6 py-3 border border-slate-600/50 hover:border-red-400/50 hover:text-red-400 rounded-lg transition font-light"
              >
                İptal
              </Link>
            </div>
          </form>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12">
          <Footer />
        </div>
      </div>
    </div>
  );
}

