"use client";
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  ArrowLeft,
  ArrowRight,
  Search,
  Filter,
  Building2,
  X,
} from 'lucide-react';
import ToastContainer, { showToast } from '@/components/Toast';

interface Clinic {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  email: string;
  services: string[];
  doctors?: {
    id: string;
    name: string;
    specialty: string;
    services: string[];
  }[];
  workingHours: {
    day: string;
    open: string;
    close: string;
    closed: boolean;
  }[];
  rating: number;
  reviewCount: number;
}

// Mock data - Supabase'den gelecek
const mockClinics: Clinic[] = [
  {
    id: '1',
    name: 'Ağız ve Diş Sağlığı Merkezi',
    address: 'Atatürk Cad. No:123 Daire:5',
    city: 'İstanbul',
    district: 'Kadıköy',
    phone: '0216 123 45 67',
    email: 'info@agizdis.com',
    services: [
      'Diş Taşı Temizliği (Detartraj)',
      'Kompozit Dolgu',
      'Tek Kök / Çok Kök Kanal',
      'Tek İmplant',
      'Metal–Seramik Teller',
      'Zirkonyum Kron/Bridge',
      'Hollywood Smile',
    ],
    doctors: [
      {
        id: '1',
        name: 'Dr. Ahmet Yılmaz',
        specialty: 'Ortodonti',
        services: ['Metal–Seramik Teller', 'Şeffaf Plak/Invisalign', 'Çocuk Ortodontisi'],
      },
      {
        id: '2',
        name: 'Dr. Ayşe Demir',
        specialty: 'Estetik Diş Hekimliği / Gülüş Tasarımı',
        services: ['Hollywood Smile', 'Diş Beyazlatma (Ofis–Ev Tipi)', 'E-max Porselen / Laminate Veneer'],
      },
      {
        id: '3',
        name: 'Dr. Mehmet Kaya',
        specialty: 'İmplantoloji',
        services: ['Tek İmplant', 'All-on-4 / All-on-6 Sabit Protez', 'Kemik Artırma (GBR – Greftleme)'],
      },
    ],
    workingHours: [
      { day: 'Pazartesi', open: '09:00', close: '18:00', closed: false },
      { day: 'Salı', open: '09:00', close: '18:00', closed: false },
      { day: 'Çarşamba', open: '09:00', close: '18:00', closed: false },
      { day: 'Perşembe', open: '09:00', close: '18:00', closed: false },
      { day: 'Cuma', open: '09:00', close: '18:00', closed: false },
      { day: 'Cumartesi', open: '09:00', close: '14:00', closed: false },
      { day: 'Pazar', open: '09:00', close: '18:00', closed: true },
    ],
    rating: 4.8,
    reviewCount: 127,
  },
  {
    id: '2',
    name: 'Modern Diş Kliniği',
    address: 'Bağdat Cad. No:456',
    city: 'İstanbul',
    district: 'Bostancı',
    phone: '0216 234 56 78',
    email: 'info@moderndis.com',
    services: ['Kompozit Dolgu', 'Tek Kök / Çok Kök Kanal', 'Tek İmplant'],
    doctors: [
      {
        id: '4',
        name: 'Dr. Zeynep Şahin',
        specialty: 'Endodonti (Kanal Tedavisi)',
        services: ['Tek Kök / Çok Kök Kanal', 'Mikroskop Destekli Kanal', 'Kanal Yenileme (Retreatment)'],
      },
    ],
    workingHours: [
      { day: 'Pazartesi', open: '09:00', close: '18:00', closed: false },
      { day: 'Salı', open: '09:00', close: '18:00', closed: false },
      { day: 'Çarşamba', open: '09:00', close: '18:00', closed: false },
      { day: 'Perşembe', open: '09:00', close: '18:00', closed: false },
      { day: 'Cuma', open: '09:00', close: '18:00', closed: false },
      { day: 'Cumartesi', open: '09:00', close: '14:00', closed: false },
      { day: 'Pazar', open: '09:00', close: '18:00', closed: true },
    ],
    rating: 4.6,
    reviewCount: 89,
  },
  {
    id: '3',
    name: 'Gülümseme Diş Kliniği',
    address: 'Tunalı Hilmi Cad. No:789',
    city: 'Ankara',
    district: 'Çankaya',
    phone: '0312 345 67 89',
    email: 'info@gulumseme.com',
    services: ['Tek İmplant', 'Zirkonyum Kron/Bridge', 'Hollywood Smile'],
    doctors: [
      {
        id: '5',
        name: 'Dr. Can Özkan',
        specialty: 'Restoratif Diş Tedavisi',
        services: ['Kompozit Dolgu', 'Diş Taşı Temizliği (Detartraj)', 'Kırık Diş Onarımı'],
      },
    ],
    workingHours: [
      { day: 'Pazartesi', open: '09:00', close: '18:00', closed: false },
      { day: 'Salı', open: '09:00', close: '18:00', closed: false },
      { day: 'Çarşamba', open: '09:00', close: '18:00', closed: false },
      { day: 'Perşembe', open: '09:00', close: '18:00', closed: false },
      { day: 'Cuma', open: '09:00', close: '18:00', closed: false },
      { day: 'Cumartesi', open: '09:00', close: '14:00', closed: false },
      { day: 'Pazar', open: '09:00', close: '18:00', closed: true },
    ],
    rating: 4.9,
    reviewCount: 203,
  },
];

// Türkiye şehirleri ve ilçeleri
const cities = ['İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa', 'Adana'];
const districts: Record<string, string[]> = {
  'İstanbul': ['Kadıköy', 'Bostancı', 'Beşiktaş', 'Şişli', 'Beyoğlu', 'Üsküdar'],
  'Ankara': ['Çankaya', 'Keçiören', 'Yenimahalle', 'Mamak', 'Sincan'],
  'İzmir': ['Konak', 'Karşıyaka', 'Bornova', 'Buca', 'Alsancak'],
  'Antalya': ['Muratpaşa', 'Kepez', 'Konyaaltı', 'Alanya'],
  'Bursa': ['Osmangazi', 'Nilüfer', 'Yıldırım'],
  'Adana': ['Seyhan', 'Yüreğir', 'Çukurova'],
};

// Tüm hizmetler listesi
const allServices = [
  'Diş Taşı Temizliği (Detartraj)',
  'Kompozit Dolgu',
  'Tek Kök / Çok Kök Kanal',
  'Tek İmplant',
  'Metal–Seramik Teller',
  'Zirkonyum Kron/Bridge',
  'Hollywood Smile',
  'Diş Beyazlatma (Ofis–Ev Tipi)',
  'Şeffaf Plak/Invisalign',
  'All-on-4 / All-on-6 Sabit Protez',
];

// Saat seçenekleri
const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

export default function FindAppointmentPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  // Filtreler (hepsi opsiyonel)
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [timeRangeStart, setTimeRangeStart] = useState('');
  const [timeRangeEnd, setTimeRangeEnd] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  
  // Görünüm modu: 'clinic' veya 'doctor'
  const [viewMode, setViewMode] = useState<'clinic' | 'doctor'>('clinic');

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      showToast('Randevu almak için giriş yapmanız gerekiyor', 'error');
      setTimeout(() => {
        router.push(`/login?redirect=/appointments/find`);
      }, 1500);
      return;
    }
    setUser(currentUser);
  }, [router]);

  // Kademeli filtreleme: Her filtre bir sonraki filtreyi daraltır
  const availableDistricts = useMemo(() => {
    if (!selectedCity) return [];
    return districts[selectedCity] || [];
  }, [selectedCity]);

  const availableServices = useMemo(() => {
    let clinics = mockClinics;
    
    // Şehir filtresi
    if (selectedCity) {
      clinics = clinics.filter(c => c.city === selectedCity);
    }
    
    // İlçe filtresi
    if (selectedDistricts.length > 0) {
      clinics = clinics.filter(c => selectedDistricts.includes(c.district));
    }
    
    // Tüm hizmetleri topla
    const services = new Set<string>();
    clinics.forEach(clinic => {
      clinic.services.forEach(service => services.add(service));
    });
    
    return Array.from(services).sort();
  }, [selectedCity, selectedDistricts]);

  const availableDoctors = useMemo(() => {
    let clinics = mockClinics;
    
    // Şehir filtresi
    if (selectedCity) {
      clinics = clinics.filter(c => c.city === selectedCity);
    }
    
    // İlçe filtresi
    if (selectedDistricts.length > 0) {
      clinics = clinics.filter(c => selectedDistricts.includes(c.district));
    }
    
    // Hizmet filtresi
    if (selectedService) {
      clinics = clinics.filter(c => c.services.includes(selectedService));
    }
    
    // Doktorları topla
    const doctorsMap = new Map<string, { id: string; name: string; specialty: string; clinicName: string }>();
    clinics.forEach(clinic => {
      clinic.doctors?.forEach(doctor => {
        if (!doctorsMap.has(doctor.id)) {
          doctorsMap.set(doctor.id, {
            id: doctor.id,
            name: doctor.name,
            specialty: doctor.specialty,
            clinicName: clinic.name,
          });
        }
      });
    });
    
    return Array.from(doctorsMap.values());
  }, [selectedCity, selectedDistricts, selectedService]);

  // Filtrelenmiş klinikler
  const filteredClinics = useMemo(() => {
    let clinics = [...mockClinics];
    
    // Şehir filtresi
    if (selectedCity) {
      clinics = clinics.filter(c => c.city === selectedCity);
    }
    
    // İlçe filtresi (çoklu seçim)
    if (selectedDistricts.length > 0) {
      clinics = clinics.filter(c => selectedDistricts.includes(c.district));
    }
    
    // Hizmet filtresi
    if (selectedService) {
      clinics = clinics.filter(c => c.services.includes(selectedService));
    }
    
    // Saat filtresi
    if (selectedTime) {
      clinics = clinics.filter(clinic => {
        const [timeHour, timeMin] = selectedTime.split(':').map(Number);
        return clinic.workingHours.some(wh => {
          if (wh.closed) return false;
          const [openHour, openMin] = wh.open.split(':').map(Number);
          const [closeHour, closeMin] = wh.close.split(':').map(Number);
          const timeInMinutes = timeHour * 60 + timeMin;
          const openInMinutes = openHour * 60 + openMin;
          const closeInMinutes = closeHour * 60 + closeMin;
          return timeInMinutes >= openInMinutes && timeInMinutes < closeInMinutes;
        });
      });
    }
    
    // Saat aralığı filtresi
    if (timeRangeStart && timeRangeEnd) {
      const [startHour, startMin] = timeRangeStart.split(':').map(Number);
      const [endHour, endMin] = timeRangeEnd.split(':').map(Number);
      const startInMinutes = startHour * 60 + startMin;
      const endInMinutes = endHour * 60 + endMin;
      
      clinics = clinics.filter(clinic => {
        return clinic.workingHours.some(wh => {
          if (wh.closed) return false;
          const [openHour, openMin] = wh.open.split(':').map(Number);
          const [closeHour, closeMin] = wh.close.split(':').map(Number);
          const openInMinutes = openHour * 60 + openMin;
          const closeInMinutes = closeHour * 60 + closeMin;
          
          // Çalışma saatleri seçilen aralığı kapsamalı
          return startInMinutes >= openInMinutes && endInMinutes <= closeInMinutes;
        });
      });
    }
    
    // Doktor filtresi
    if (selectedDoctor) {
      clinics = clinics.filter(c => 
        c.doctors?.some(d => d.id === selectedDoctor)
      );
    }
    
    return clinics;
  }, [selectedCity, selectedDistricts, selectedService, selectedTime, timeRangeStart, timeRangeEnd, selectedDoctor]);

  // Filtrelenmiş doktorlar
  const filteredDoctors = useMemo(() => {
    if (viewMode !== 'doctor') return [];
    
    const doctorsMap = new Map<string, {
      id: string;
      name: string;
      specialty: string;
      clinic: Clinic;
    }>();
    
    filteredClinics.forEach(clinic => {
      clinic.doctors?.forEach(doctor => {
        if (!doctorsMap.has(doctor.id)) {
          doctorsMap.set(doctor.id, {
            id: doctor.id,
            name: doctor.name,
            specialty: doctor.specialty,
            clinic: clinic,
          });
        }
      });
    });
    
    return Array.from(doctorsMap.values());
  }, [filteredClinics, viewMode]);

  const toggleDistrict = (district: string) => {
    setSelectedDistricts(prev =>
      prev.includes(district)
        ? prev.filter(d => d !== district)
        : [...prev, district]
    );
  };

  const clearFilter = (filterType: string) => {
    switch (filterType) {
      case 'city':
        setSelectedCity('');
        setSelectedDistricts([]);
        break;
      case 'districts':
        setSelectedDistricts([]);
        break;
      case 'service':
        setSelectedService('');
        break;
      case 'time':
        setSelectedTime('');
        break;
      case 'timeRange':
        setTimeRangeStart('');
        setTimeRangeEnd('');
        break;
      case 'doctor':
        setSelectedDoctor('');
        break;
    }
  };

  const handleViewDetails = (clinicId: string, doctorId?: string) => {
    if (doctorId) {
      router.push(`/doctors/${doctorId}`);
    } else {
      router.push(`/clinics/${clinicId}`);
    }
  };

  if (!user) {
    return null; // Will redirect
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

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
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
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center">
                <Calendar className="text-slate-950" size={24} />
              </div>
              <h1 className="text-3xl md:text-4xl font-light">Randevu Bul</h1>
            </div>
            <p className="text-slate-400 font-light">
              Filtreleri kullanarak uygun klinik veya doktor bulun
            </p>
          </div>

          {/* Main Content: Sidebar + Results */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sol Sidebar - Filtreler */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 sticky top-6">
                <div className="flex items-center gap-2 mb-6">
                  <Filter className="text-blue-400" size={20} />
                  <h2 className="text-lg font-light">Filtreler</h2>
                </div>

                <div className="space-y-6">
                  {/* Görünüm Modu Toggle */}
                  <div>
                    <label className="block text-sm font-light text-slate-300 mb-2">
                      Görünüm
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setViewMode('clinic');
                          setSelectedDoctor('');
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg border transition font-light text-sm flex items-center justify-center gap-2 ${
                          viewMode === 'clinic'
                            ? 'bg-blue-500/20 border-blue-400/50 text-blue-300'
                            : 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:border-blue-400/50'
                        }`}
                      >
                        <Building2 size={16} />
                        Klinik
                      </button>
                      <button
                        onClick={() => {
                          setViewMode('doctor');
                          setSelectedDoctor('');
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg border transition font-light text-sm flex items-center justify-center gap-2 ${
                          viewMode === 'doctor'
                            ? 'bg-blue-500/20 border-blue-400/50 text-blue-300'
                            : 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:border-blue-400/50'
                        }`}
                      >
                        <User size={16} />
                        Doktor
                      </button>
                    </div>
                  </div>

                  {/* Şehir */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-light text-slate-300">
                        <MapPin className="inline mr-1" size={14} />
                        Şehir
                      </label>
                      {selectedCity && (
                        <button
                          onClick={() => clearFilter('city')}
                          className="text-xs text-slate-400 hover:text-red-400"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <select
                      value={selectedCity}
                      onChange={(e) => {
                        setSelectedCity(e.target.value);
                        setSelectedDistricts([]);
                      }}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                    >
                      <option value="">Tüm Şehirler</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* İlçe (Çoklu Seçim) */}
                  {selectedCity && availableDistricts.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-light text-slate-300">
                          İlçe (Çoklu)
                        </label>
                        {selectedDistricts.length > 0 && (
                          <button
                            onClick={() => clearFilter('districts')}
                            className="text-xs text-slate-400 hover:text-red-400"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-2 p-2 bg-slate-800/30 rounded-lg border border-slate-700/50">
                        {availableDistricts.map((district) => (
                          <button
                            key={district}
                            type="button"
                            onClick={() => toggleDistrict(district)}
                            className={`w-full px-3 py-2 rounded-lg border transition font-light text-sm text-left ${
                              selectedDistricts.includes(district)
                                ? 'bg-blue-500/20 border-blue-400/50 text-blue-300'
                                : 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:border-blue-400/50'
                            }`}
                          >
                            {district}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hizmet */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-light text-slate-300">
                        Hizmet
                      </label>
                      {selectedService && (
                        <button
                          onClick={() => clearFilter('service')}
                          className="text-xs text-slate-400 hover:text-red-400"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                    >
                      <option value="">Tüm Hizmetler</option>
                      {availableServices.map((service) => (
                        <option key={service} value={service}>
                          {service}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Saat */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-light text-slate-300">
                        <Clock className="inline mr-1" size={14} />
                        Saat
                      </label>
                      {selectedTime && (
                        <button
                          onClick={() => clearFilter('time')}
                          className="text-xs text-slate-400 hover:text-red-400"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                    >
                      <option value="">Saat Seçin</option>
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Saat Aralığı */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-light text-slate-300">
                        <Clock className="inline mr-1" size={14} />
                        Müsait Saat Aralığı
                      </label>
                      {(timeRangeStart || timeRangeEnd) && (
                        <button
                          onClick={() => clearFilter('timeRange')}
                          className="text-xs text-slate-400 hover:text-red-400"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={timeRangeStart}
                        onChange={(e) => setTimeRangeStart(e.target.value)}
                        className="px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light text-sm"
                      >
                        <option value="">Başlangıç</option>
                        {timeSlots.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                      <select
                        value={timeRangeEnd}
                        onChange={(e) => setTimeRangeEnd(e.target.value)}
                        className="px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light text-sm"
                      >
                        <option value="">Bitiş</option>
                        {timeSlots
                          .filter(time => !timeRangeStart || time > timeRangeStart)
                          .map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Doktor (Sadece doktor görünümünde) */}
                  {viewMode === 'doctor' && availableDoctors.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-light text-slate-300">
                          <User className="inline mr-1" size={14} />
                          Doktor
                        </label>
                        {selectedDoctor && (
                          <button
                            onClick={() => clearFilter('doctor')}
                            className="text-xs text-slate-400 hover:text-red-400"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <select
                        value={selectedDoctor}
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                      >
                        <option value="">Tüm Doktorlar</option>
                        {availableDoctors.map((doctor) => (
                          <option key={doctor.id} value={doctor.id}>
                            {doctor.name} - {doctor.specialty}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sağ Taraf - Sonuçlar */}
            <div className="flex-1">
              {/* Sonuç Başlığı */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-light flex items-center gap-2">
                    <Search className="text-blue-400" size={24} />
                    {viewMode === 'clinic' 
                      ? `Klinikler (${filteredClinics.length})`
                      : `Doktorlar (${filteredDoctors.length})`
                    }
                  </h2>
                </div>

                {/* Aktif Filtreler */}
                {(selectedCity || selectedDistricts.length > 0 || selectedService || selectedTime || timeRangeStart || selectedDoctor) && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedCity && (
                      <span className="px-3 py-1 bg-slate-700/50 rounded text-sm text-slate-300 font-light flex items-center gap-2">
                        {selectedCity}
                        <button onClick={() => clearFilter('city')} className="hover:text-red-400">
                          <X size={14} />
                        </button>
                      </span>
                    )}
                    {selectedDistricts.map(district => (
                      <span key={district} className="px-3 py-1 bg-slate-700/50 rounded text-sm text-slate-300 font-light flex items-center gap-2">
                        {district}
                        <button onClick={() => toggleDistrict(district)} className="hover:text-red-400">
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                    {selectedService && (
                      <span className="px-3 py-1 bg-blue-500/20 border border-blue-400/50 rounded text-sm text-blue-300 font-light flex items-center gap-2">
                        {selectedService}
                        <button onClick={() => clearFilter('service')} className="hover:text-red-400">
                          <X size={14} />
                        </button>
                      </span>
                    )}
                    {selectedTime && (
                      <span className="px-3 py-1 bg-slate-700/50 rounded text-sm text-slate-300 font-light flex items-center gap-2">
                        {selectedTime}
                        <button onClick={() => clearFilter('time')} className="hover:text-red-400">
                          <X size={14} />
                        </button>
                      </span>
                    )}
                    {timeRangeStart && timeRangeEnd && (
                      <span className="px-3 py-1 bg-slate-700/50 rounded text-sm text-slate-300 font-light flex items-center gap-2">
                        {timeRangeStart} - {timeRangeEnd}
                        <button onClick={() => clearFilter('timeRange')} className="hover:text-red-400">
                          <X size={14} />
                        </button>
                      </span>
                    )}
                    {selectedDoctor && (
                      <span className="px-3 py-1 bg-slate-700/50 rounded text-sm text-slate-300 font-light flex items-center gap-2">
                        Doktor seçildi
                        <button onClick={() => clearFilter('doctor')} className="hover:text-red-400">
                          <X size={14} />
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Klinik Sonuçları */}
              {viewMode === 'clinic' && (
                <>
                  {filteredClinics.length === 0 ? (
                    <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-8 text-center">
                      <p className="text-slate-400 font-light">
                        Seçtiğiniz kriterlere uygun klinik bulunamadı.
                      </p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {filteredClinics.map((clinic) => (
                        <div
                          key={clinic.id}
                          className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 hover:border-blue-400/50 transition"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-light mb-1">{clinic.name}</h3>
                              <div className="flex items-center gap-2 text-sm text-slate-400">
                                <MapPin size={14} />
                                <span>{clinic.district}, {clinic.city}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-yellow-400 mb-1">
                                <span className="text-sm font-light">{clinic.rating}</span>
                              </div>
                              <span className="text-xs text-slate-400">
                                {clinic.reviewCount} değerlendirme
                              </span>
                            </div>
                          </div>

                          <div className="mb-4">
                            <p className="text-sm text-slate-300 font-light mb-2">Hizmetler:</p>
                            <div className="flex flex-wrap gap-2">
                              {clinic.services.slice(0, 3).map((service, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-300 font-light"
                                >
                                  {service}
                                </span>
                              ))}
                              {clinic.services.length > 3 && (
                                <span className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-400 font-light">
                                  +{clinic.services.length - 3} daha
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleViewDetails(clinic.id)}
                            className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition flex items-center justify-center gap-2"
                          >
                            Detayları Gör
                            <ArrowRight size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Doktor Sonuçları */}
              {viewMode === 'doctor' && (
                <>
                  {filteredDoctors.length === 0 ? (
                    <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-8 text-center">
                      <p className="text-slate-400 font-light">
                        Seçtiğiniz kriterlere uygun doktor bulunamadı.
                      </p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {filteredDoctors.map((doctor) => (
                        <div
                          key={doctor.id}
                          className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 hover:border-blue-400/50 transition"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-light mb-1">{doctor.name}</h3>
                              <p className="text-sm text-slate-400 font-light mb-2">{doctor.specialty}</p>
                              <div className="flex items-center gap-2 text-sm text-slate-400">
                                <Building2 size={14} />
                                <span>{doctor.clinic.name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                                <MapPin size={14} />
                                <span>{doctor.clinic.district}, {doctor.clinic.city}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-yellow-400 mb-1">
                                <span className="text-sm font-light">{doctor.clinic.rating}</span>
                              </div>
                              <span className="text-xs text-slate-400">
                                {doctor.clinic.reviewCount} değerlendirme
                              </span>
                            </div>
                          </div>

                          <div className="mb-4">
                            <p className="text-sm text-slate-300 font-light mb-2">Hizmetler:</p>
                            <div className="flex flex-wrap gap-2">
                              {doctor.clinic.services.slice(0, 3).map((service, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-300 font-light"
                                >
                                  {service}
                                </span>
                              ))}
                              {doctor.clinic.services.length > 3 && (
                                <span className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-400 font-light">
                                  +{doctor.clinic.services.length - 3} daha
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleViewDetails(doctor.clinic.id, doctor.id)}
                            className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition flex items-center justify-center gap-2"
                          >
                            Detayları Gör
                            <ArrowRight size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
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
