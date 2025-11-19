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
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import ToastContainer, { showToast } from '@/components/Toast';

interface Appointment {
  id: string;
  userId: string;
  clinicId: string;
  clinicName: string;
  doctorId?: string;
  doctorName?: string;
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

function getAppointmentById(appointmentId: string): Appointment | null {
  const appointments = getAllAppointments();
  return appointments.find(apt => apt.id === appointmentId) || null;
}

function updateAppointment(appointmentId: string, updates: Partial<Appointment>): void {
  if (typeof window === 'undefined') return;
  const appointments = getAllAppointments();
  const appointmentIndex = appointments.findIndex(apt => apt.id === appointmentId);
  if (appointmentIndex !== -1) {
    appointments[appointmentIndex] = { ...appointments[appointmentIndex], ...updates };
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
  }
}

// Mock clinic data
const mockClinics: Record<string, any> = {
  '1': {
    id: '1',
    name: 'Ağız ve Diş Sağlığı Merkezi',
    workingHours: [
      { day: 'monday', open: '09:00', close: '21:00', closed: false },
      { day: 'tuesday', open: '09:00', close: '21:00', closed: false },
      { day: 'wednesday', open: '09:00', close: '21:00', closed: false },
      { day: 'thursday', open: '09:00', close: '21:00', closed: false },
      { day: 'friday', open: '09:00', close: '21:00', closed: false },
      { day: 'saturday', open: '09:00', close: '21:00', closed: false },
      { day: 'sunday', open: '09:00', close: '21:00', closed: false },
    ],
    doctors: [
      {
        id: '1',
        name: 'Dr. Ahmet Yılmaz',
        services: ['Diş Taşı Temizliği (Detartraj)', 'Kompozit Dolgu', 'Kanal Tedavisi'],
      },
    ],
  },
};

function getAvailableDates(workingHours: any[]): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const workingDay = workingHours.find(wh => wh.day === dayName);
    if (workingDay && !workingDay.closed) {
      dates.push(date.toISOString().split('T')[0]);
    }
  }
  return dates;
}

function getAvailableTimeSlots(date: string, workingHours: any[]): string[] {
  const dateObj = new Date(date);
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
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
  
  // Get first day of week (Monday = 0)
  const startDay = (firstDay.getDay() + 6) % 7;
  
  // Add empty days for alignment
  for (let i = 0; i < startDay; i++) {
    const date = new Date(year, month, 1 - startDay + i);
    days.push(date);
  }
  
  // Add all days of the month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }
  
  return days;
}

export default function EditAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [clinic, setClinic] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

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
      setSelectedDate(foundAppointment.date);
      setSelectedTime(foundAppointment.time);
      
      // Get clinic data
      const clinicData = mockClinics[foundAppointment.clinicId];
      if (clinicData) {
        setClinic(clinicData);
        const dates = getAvailableDates(clinicData.workingHours);
        setAvailableDates(dates);
      }
      }
    };
    checkAuth();
  }, [params, router]);

  useEffect(() => {
    if (selectedDate && clinic) {
      const times = getAvailableTimeSlots(selectedDate, clinic.workingHours);
      setAvailableTimes(times);
      if (!times.includes(selectedTime)) {
        setSelectedTime('');
      }
    }
  }, [selectedDate, clinic, selectedTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      showToast('Lütfen tarih ve saat seçiniz', 'error');
      return;
    }

    if (!appointment) return;

    updateAppointment(appointment.id, {
      date: selectedDate,
      time: selectedTime,
    });

    showToast('Randevu başarıyla güncellendi', 'success');
    setTimeout(() => {
      router.push(`/appointments/${appointment.id}`);
    }, 1000);
  };

  if (!user || !appointment || !clinic) {
    return null;
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
        <Navigation />

        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
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
            <h1 className="text-3xl md:text-4xl font-light mb-2">Randevu Değiştir</h1>
            <p className="text-slate-400 font-light">
              {clinic.name} için yeni tarih ve saat seçiniz
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={!selectedDate || !selectedTime}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} />
                Randevuyu Güncelle
              </button>
              <Link
                href={`/appointments/${appointment.id}`}
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

