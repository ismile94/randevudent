"use client";
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import { getAllClinics, getCurrentClinic } from '@/lib/auth-clinic';
import { getClinicStaff } from '@/lib/staff';
import { getAllAppointments } from '@/lib/appointments';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import ToastContainer, { showToast } from '@/components/Toast';

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
  isUrgent?: boolean;
  createdAt: string;
}

// Helper function to check if staff member is a doctor
function isDoctor(staff: any): boolean {
  const titleLower = staff.title?.toLowerCase() || '';
  return (
    titleLower.includes('hekim') ||
    titleLower.includes('doktor') ||
    titleLower.includes('dr') ||
    titleLower.includes('diş hekimi') ||
    !!staff.specialty
  );
}


// This function is kept for backward compatibility but should use createAppointment from lib/appointments.ts
function saveAppointment(appointment: Appointment): void {
  if (typeof window === 'undefined') return;
  const appointments = getAllAppointments();
  appointments.push(appointment);
  localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
}

function getDayNameInTurkish(dateString: string): string {
  const date = new Date(dateString);
  const dayIndex = date.getDay();
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  return days[dayIndex];
}

function getMonthNameInTurkish(monthIndex: number): string {
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  return months[monthIndex];
}

function getDaysInMonth(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];
  
  // JavaScript'te Pazar = 0, Pazartesi = 1, ... Cumartesi = 6
  // Türkçe takvimde Pazartesi ilk gün, bu yüzden 1 gün kaydırıyoruz
  let startDayOfWeek = firstDay.getDay() - 1; // Pazartesi = 0, Pazar = 6
  if (startDayOfWeek < 0) startDayOfWeek = 6; // Pazar günü için 6 yap
  
  // Önceki ayın son günlerini ekle
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek; i > 0; i--) {
    days.push(new Date(year, month - 1, prevMonthLastDay - i + 1));
  }
  
  // Ayın tüm günlerini ekle
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }
  
  // Sonraki ayın ilk günlerini ekle (takvimi tamamlamak için)
  const totalCells = 42; // 6 hafta x 7 gün
  const remainingCells = totalCells - days.length;
  for (let day = 1; day <= remainingCells; day++) {
    days.push(new Date(year, month + 1, day));
  }
  
  return days;
}

function getAllAvailableDates(workingHours: any[]): string[] {
  const dates: string[] = [];
  const today = new Date();
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);

  for (let d = new Date(today); d <= maxDate; d.setDate(d.getDate() + 1)) {
    const dayName = getDayNameInTurkish(d.toISOString().split('T')[0]);
    const daySchedule = workingHours.find(wh => wh.day === dayName);
    if (daySchedule && !daySchedule.closed) {
      dates.push(d.toISOString().split('T')[0]);
    }
  }

  return dates;
}

function getAvailableTimeSlots(day: string, workingHours: any[], existingAppointments: Appointment[], selectedDate: string, selectedDoctorId?: string): string[] {
  const daySchedule = workingHours.find(wh => wh.day === day);
  if (!daySchedule || daySchedule.closed) return [];

  const slots: string[] = [];
  const [openHour, openMin] = daySchedule.open.split(':').map(Number);
  const [closeHour, closeMin] = daySchedule.close.split(':').map(Number);
  
  let currentHour = openHour;
  let currentMin = openMin;

  while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
    const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
    
    // Check if this time slot is already booked
    const isBooked = existingAppointments.some(apt => {
      if (apt.date !== selectedDate || apt.time !== timeString || apt.status === 'cancelled') {
        return false;
      }
      // If doctor is selected, check if that doctor is booked
      if (selectedDoctorId) {
        return apt.doctorId === selectedDoctorId;
      }
      return true;
    });
    
    if (!isBooked) {
      slots.push(timeString);
    }

    currentMin += 30;
    if (currentMin >= 60) {
      currentMin = 0;
      currentHour += 1;
    }
  }

  return slots;
}

function BookAppointmentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clinicId = searchParams?.get('clinicId') || '1';
  const doctorIdParam = searchParams?.get('doctorId') || '';
  const serviceParam = searchParams?.get('service') || '';
  const timeParam = searchParams?.get('time') || '';
  
  const [user, setUser] = useState<any>(null);
  const [clinic, setClinic] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    doctorId: doctorIdParam,
    service: serviceParam,
    date: '',
    time: timeParam,
    notes: '',
    complaint: '',
    isUrgent: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const loadClinicData = () => {
      // Get clinic data
      const clinics = getAllClinics();
      let foundClinic = clinics.find(c => c.id === clinicId);
      
      // If not found, check current clinic (for test clinic)
      if (!foundClinic) {
        const currentClinic = getCurrentClinic();
        if (currentClinic && currentClinic.id === clinicId) {
          foundClinic = currentClinic;
        }
      }
      
      if (foundClinic) {
        // Get real staff and filter for doctors only
        const staff = getClinicStaff(clinicId);
        const doctorsData = staff
          .filter(isDoctor)
          .map(s => ({
            id: s.id,
            name: s.name,
            specialty: s.specialty || s.title,
            services: s.services || [],
          }));
        
        setDoctors(doctorsData);
        
        // Collect all services from staff
        const allServices = new Set<string>();
        staff.forEach(s => {
          if (s.services) {
            s.services.forEach((service: string) => allServices.add(service));
          }
        });
        
        setClinic({
          id: foundClinic.id,
          name: foundClinic.clinicName,
          address: foundClinic.address,
          city: foundClinic.city,
          district: foundClinic.district,
          phone: foundClinic.phone,
          email: foundClinic.email,
          services: Array.from(allServices),
          doctors: doctorsData,
          workingHours: foundClinic.workingHours || [
            { day: 'Pazartesi', open: '09:00', close: '18:00', closed: false },
            { day: 'Salı', open: '09:00', close: '18:00', closed: false },
            { day: 'Çarşamba', open: '09:00', close: '18:00', closed: false },
            { day: 'Perşembe', open: '09:00', close: '18:00', closed: false },
            { day: 'Cuma', open: '09:00', close: '18:00', closed: false },
            { day: 'Cumartesi', open: '09:00', close: '14:00', closed: false },
            { day: 'Pazar', open: '09:00', close: '18:00', closed: true },
          ],
        });
      }
      setLoading(false);
    };
    
    loadClinicData();
  }, [clinicId]);
  
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push(`/login?redirect=/appointments/book?clinicId=${clinicId}${doctorIdParam ? `&doctorId=${doctorIdParam}` : ''}${serviceParam ? `&service=${serviceParam}` : ''}${timeParam ? `&time=${timeParam}` : ''}`);
        return;
      }
      setUser(currentUser);
    };
    checkAuth();
  }, [router, clinicId, doctorIdParam, serviceParam, timeParam]);

  // Get available dates
  useEffect(() => {
    if (clinic?.workingHours) {
      const dates = getAllAvailableDates(clinic.workingHours);
      setAvailableDates(dates);
    }
  }, [clinic?.workingHours]);

  // Get available times based on selected date
  useEffect(() => {
    if (formData.date && clinic?.workingHours) {
      const dayName = getDayNameInTurkish(formData.date);
      const existingAppointments = getAllAppointments();
      
      const slots = getAvailableTimeSlots(
        dayName, 
        clinic.workingHours, 
        existingAppointments, 
        formData.date,
        formData.doctorId || undefined
      );
      setAvailableTimes(slots);
      
      // If pre-selected time is not available, clear it
      if (formData.time && !slots.includes(formData.time)) {
        setFormData(prev => ({ ...prev, time: '' }));
      }
    } else {
      setAvailableTimes([]);
    }
  }, [formData.date, formData.doctorId, clinic?.workingHours, formData.time]);

  if (!user || loading || !clinic) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-400 font-light">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.service.trim()) {
      newErrors.service = 'Hizmet seçimi zorunludur';
    }

    if (!formData.date.trim()) {
      newErrors.date = 'Tarih seçimi zorunludur';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.date = 'Geçmiş bir tarih seçemezsiniz';
      }
    }

    if (!formData.time.trim()) {
      newErrors.time = 'Saat seçimi zorunludur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    const selectedDoctor = doctors.find((d: any) => d.id === formData.doctorId);
    
    const price = calculatePrice();
    
    const newAppointment: Appointment = {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      userId: user.id,
      clinicId: clinic.id,
      clinicName: clinic.name,
      clinicAddress: `${clinic.address}, ${clinic.district}, ${clinic.city}`,
      clinicPhone: clinic.phone,
      clinicEmail: clinic.email,
      doctorId: formData.doctorId || undefined,
      doctorName: selectedDoctor?.name || undefined,
      service: formData.service,
      date: formData.date,
      time: formData.time,
      notes: formData.notes.trim() || undefined,
      complaint: formData.complaint.trim() || undefined,
      status: 'pending',
      price: price > 0 ? price : undefined,
      paymentStatus: price > 0 ? 'pending' : undefined,
      isUrgent: formData.isUrgent,
      createdAt: new Date().toISOString(),
    };

    setTimeout(async () => {
      // Use the new appointment management system
      const { createAppointment } = await import('@/lib/appointments');
      const { createOrUpdatePatientFromAppointment } = await import('@/lib/patients');
      
      const result = createAppointment(newAppointment);
      
      if (result.success) {
        // Create or update patient record for clinic
        createOrUpdatePatientFromAppointment(clinic.id, user.id, {
          patientName: user.name,
          patientPhone: user.phone,
          patientEmail: user.email,
          appointmentDate: formData.date,
        });
        
        setIsSubmitting(false);
        showToast('Randevunuz başarıyla oluşturuldu!', 'success');
        setTimeout(() => {
          router.push('/appointments');
        }, 1500);
      } else {
        setIsSubmitting(false);
        showToast(result.error || 'Randevu oluşturulamadı', 'error');
      }
    }, 500);
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Service prices (mock data - should come from database)
  const servicePrices: Record<string, number> = {
    'Diş Taşı Temizliği (Detartraj)': 500,
    'Kompozit Dolgu': 800,
    'Tek Kök / Çok Kök Kanal': 1500,
    'Tek İmplant': 8000,
    'Metal–Seramik Teller': 15000,
    'Zirkonyum Kron/Bridge': 3000,
    'Hollywood Smile': 25000,
    'Şeffaf Plak/Invisalign': 20000,
    'Çocuk Ortodontisi': 12000,
    'Diş Beyazlatma (Ofis–Ev Tipi)': 2000,
    'E-max Porselen / Laminate Veneer': 4000,
    'All-on-4 / All-on-6 Sabit Protez': 60000,
    'Kemik Artırma (GBR – Greftleme)': 5000,
    'Mikroskop Destekli Kanal': 2000,
    'Kanal Yenileme (Retreatment)': 1800,
    'Kırık Diş Onarımı': 1000,
  };

  const calculatePrice = (): number => {
    if (!formData.service) return 0;
    const basePrice = servicePrices[formData.service] || 0;
    return formData.isUrgent ? basePrice * 1.2 : basePrice; // 20% extra for urgent
  };

  // Get available services based on selected doctor
  const availableServices = formData.doctorId
    ? doctors.find((d: any) => d.id === formData.doctorId)?.services || []
    : clinic.services || [];

  const selectedDoctor = doctors.find((d: any) => d.id === formData.doctorId);

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

        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
          {/* Back Button */}
          <Link
            href={doctorIdParam ? `/doctors/${doctorIdParam}` : `/clinics/${clinicId}`}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition font-light mb-6"
          >
            <ArrowLeft size={16} />
            {doctorIdParam ? 'Doktor Detayına Dön' : 'Klinik Detayına Dön'}
          </Link>

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center">
                <Calendar className="text-slate-950" size={24} />
              </div>
              <h1 className="text-3xl md:text-4xl font-light">Randevu Al</h1>
            </div>
            <p className="text-slate-400 font-light">
              {clinic.name} için randevu oluşturun
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Clinic Info */}
            <div className="md:col-span-1">
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 sticky top-6">
                <h2 className="text-lg font-light mb-4">Klinik Bilgileri</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300 font-light">
                      {clinic.address}, {clinic.district}, {clinic.city}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-slate-400 flex-shrink-0" />
                    <span className="text-slate-300 font-light">{clinic.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-slate-400 flex-shrink-0" />
                    <span className="text-slate-300 font-light">{clinic.email}</span>
                  </div>
                </div>
                {selectedDoctor && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <h3 className="text-sm font-light text-slate-300 mb-2">Seçili Hekim</h3>
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-blue-400" />
                      <span className="text-slate-300 font-light">{selectedDoctor.name}</span>
                    </div>
                    <p className="text-xs text-slate-400 font-light mt-1">{selectedDoctor.specialty}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Appointment Form */}
            <div className="md:col-span-2">
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Doctor Selection (if not pre-selected) */}
                  {!doctorIdParam && (
                    <div>
                      <label className="block text-sm font-light text-slate-300 mb-2">
                        <User className="inline mr-2" size={16} />
                        Hekim Seçin (Opsiyonel)
                      </label>
                      <select
                        value={formData.doctorId}
                        onChange={(e) => {
                          updateFormData('doctorId', e.target.value);
                          // Clear service if doctor changes
                          if (e.target.value) {
                            const selectedDoc = doctors.find((d: any) => d.id === e.target.value);
                            if (selectedDoc?.services?.length > 0) {
                              updateFormData('service', '');
                            }
                          } else {
                            updateFormData('service', '');
                          }
                        }}
                        className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                      >
                        <option value="">Hekim seçmeyebilirsiniz</option>
                        {doctors.map((doctor: any) => (
                          <option key={doctor.id} value={doctor.id}>
                            {doctor.name} - {doctor.specialty}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Service Selection */}
                  <div>
                    <label className="block text-sm font-light text-slate-300 mb-2">
                      Hizmet <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.service}
                      onChange={(e) => updateFormData('service', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                    >
                      <option value="">Hizmet seçiniz</option>
                      {availableServices.map((service: string, index: number) => (
                        <option key={index} value={service}>
                          {service}
                        </option>
                      ))}
                    </select>
                    {errors.service && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.service}
                      </p>
                    )}
                  </div>

                  {/* Date Selection - Monthly Calendar */}
                  <div>
                    <label className="block text-sm font-light text-slate-300 mb-2">
                      <Calendar className="inline mr-2" size={16} />
                      Tarih Seçin <span className="text-red-400">*</span>
                    </label>
                    <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-4">
                      {/* Calendar Header */}
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

                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {/* Day Headers */}
                        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
                          <div
                            key={day}
                            className="text-center text-xs font-light text-slate-400 py-2"
                          >
                            {day}
                          </div>
                        ))}

                        {/* Calendar Days */}
                        {getDaysInMonth(currentYear, currentMonth).map((date, index) => {
                          const dateString = date.toISOString().split('T')[0];
                          const isCurrentMonth = date.getMonth() === currentMonth;
                          const isAvailable = availableDates.includes(dateString);
                          const isSelected = formData.date === dateString;
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
                                  updateFormData('date', dateString);
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
                    {errors.date && (
                      <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.date}
                      </p>
                    )}
                  </div>

                  {/* Time Selection */}
                  {formData.date && (
                    <div>
                      <label className="block text-sm font-light text-slate-300 mb-2">
                        <Clock className="inline mr-2" size={16} />
                        Saat Seçin <span className="text-red-400">*</span>
                      </label>
                      {availableTimes.length > 0 ? (
                        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-64 overflow-y-auto p-2 bg-slate-800/30 rounded-lg border border-slate-700/50">
                          {availableTimes.map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => updateFormData('time', time)}
                              className={`px-3 py-2 rounded-lg border transition font-light text-sm ${
                                formData.time === time
                                  ? 'bg-blue-500/20 border-blue-400/50 text-blue-300'
                                  : 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:border-blue-400/50'
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 font-light">
                          Bu tarih için müsait saat bulunmamaktadır. Lütfen başka bir tarih seçin.
                        </p>
                      )}
                      {errors.time && (
                        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {errors.time}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Urgent Appointment */}
                  <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isUrgent}
                        onChange={(e) => updateFormData('isUrgent', e.target.checked)}
                        className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <AlertCircle size={18} className="text-red-400" />
                          <span className="text-sm font-light text-slate-300">Acil Randevu Talebi</span>
                        </div>
                        <p className="text-xs text-slate-400 font-light mt-1">
                          Acil durumlar için öncelikli randevu talebi (Ek ücret uygulanabilir)
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Complaint Form */}
                  <div>
                    <label className="block text-sm font-light text-slate-300 mb-2">
                      <AlertCircle className="inline mr-2" size={16} />
                      Şikayet / Belirtiler (Opsiyonel)
                    </label>
                    <textarea
                      value={formData.complaint}
                      onChange={(e) => updateFormData('complaint', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light resize-none"
                      placeholder="Diş ağrısı, şişlik, kanama gibi şikayetlerinizi belirtiniz..."
                    />
                    <p className="text-xs text-slate-500 font-light mt-1">
                      Bu bilgiler hekiminizin size daha iyi hizmet verebilmesi için kullanılacaktır.
                    </p>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-light text-slate-300 mb-2">
                      Notlar (Opsiyonel)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => updateFormData('notes', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light resize-none"
                      placeholder="Randevu ile ilgili özel notlarınızı buraya yazabilirsiniz..."
                    />
                  </div>

                  {/* Price Display */}
                  {formData.service && calculatePrice() > 0 && (
                    <div className="bg-blue-500/10 backdrop-blur border border-blue-500/30 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-light text-slate-300 mb-1">Tahmini Fiyat</p>
                          {formData.isUrgent && (
                            <p className="text-xs text-blue-400 font-light">Acil randevu ücreti dahil</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-light text-blue-400">
                            {calculatePrice().toFixed(2)} ₺
                          </p>
                          {formData.isUrgent && (
                            <p className="text-xs text-slate-400 font-light line-through">
                              {servicePrices[formData.service]?.toFixed(2)} ₺
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 font-light mt-2">
                        * Fiyat bilgisi tahminidir. Kesin fiyat klinik tarafından belirlenir.
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  {formData.date && formData.time && formData.service && (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Randevu oluşturuluyor...
                        </>
                      ) : (
                        <>
                          Randevu Oluştur
                          <CheckCircle2 size={18} />
                        </>
                      )}
                    </button>
                  )}
                </form>
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

export default function BookAppointmentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
      </div>
    }>
      <BookAppointmentPageContent />
    </Suspense>
  );
}
