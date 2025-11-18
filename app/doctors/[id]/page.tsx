"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import {
  MapPin,
  Phone,
  Mail,
  Star,
  Calendar,
  ArrowLeft,
  Building2,
  User,
  Clock,
} from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  services: string[];
  rating: number;
  reviewCount: number;
  clinic: {
    id: string;
    name: string;
    address: string;
    city: string;
    district: string;
    phone: string;
    email: string;
  };
  workingHours: {
    day: string;
    open: string;
    close: string;
    closed: boolean;
  }[];
  description?: string;
}

// Mock data - Supabase'den gelecek
const mockDoctors: Record<string, Doctor> = {
  '1': {
    id: '1',
    name: 'Dr. Ahmet Yılmaz',
    specialty: 'Ortodonti',
    services: ['Metal–Seramik Teller', 'Şeffaf Plak/Invisalign', 'Çocuk Ortodontisi'],
    rating: 4.9,
    reviewCount: 45,
    clinic: {
      id: '1',
      name: 'Ağız ve Diş Sağlığı Merkezi',
      address: 'Atatürk Cad. No:123 Daire:5',
      city: 'İstanbul',
      district: 'Kadıköy',
      phone: '0216 123 45 67',
      email: 'info@agizdis.com',
    },
    workingHours: [
      { day: 'Pazartesi', open: '09:00', close: '18:00', closed: false },
      { day: 'Salı', open: '09:00', close: '18:00', closed: false },
      { day: 'Çarşamba', open: '09:00', close: '18:00', closed: false },
      { day: 'Perşembe', open: '09:00', close: '18:00', closed: false },
      { day: 'Cuma', open: '09:00', close: '18:00', closed: false },
      { day: 'Cumartesi', open: '09:00', close: '14:00', closed: false },
      { day: 'Pazar', open: '09:00', close: '18:00', closed: true },
    ],
    description: '15 yıllık deneyime sahip ortodonti uzmanı. Çocuk ve yetişkin ortodonti tedavilerinde uzmanlaşmıştır.',
  },
  '2': {
    id: '2',
    name: 'Dr. Ayşe Demir',
    specialty: 'Estetik Diş Hekimliği / Gülüş Tasarımı',
    services: ['Hollywood Smile', 'Diş Beyazlatma (Ofis–Ev Tipi)', 'E-max Porselen / Laminate Veneer'],
    rating: 4.7,
    reviewCount: 38,
    clinic: {
      id: '1',
      name: 'Ağız ve Diş Sağlığı Merkezi',
      address: 'Atatürk Cad. No:123 Daire:5',
      city: 'İstanbul',
      district: 'Kadıköy',
      phone: '0216 123 45 67',
      email: 'info@agizdis.com',
    },
    workingHours: [
      { day: 'Pazartesi', open: '09:00', close: '18:00', closed: false },
      { day: 'Salı', open: '09:00', close: '18:00', closed: false },
      { day: 'Çarşamba', open: '09:00', close: '18:00', closed: false },
      { day: 'Perşembe', open: '09:00', close: '18:00', closed: false },
      { day: 'Cuma', open: '09:00', close: '18:00', closed: false },
      { day: 'Cumartesi', open: '09:00', close: '14:00', closed: false },
      { day: 'Pazar', open: '09:00', close: '18:00', closed: true },
    ],
    description: 'Estetik diş hekimliği ve gülüş tasarımı konusunda uzman. Hollywood Smile ve dijital gülüş tasarımı alanlarında deneyimlidir.',
  },
  '3': {
    id: '3',
    name: 'Dr. Mehmet Kaya',
    specialty: 'İmplantoloji',
    services: ['Tek İmplant', 'All-on-4 / All-on-6 Sabit Protez', 'Kemik Artırma (GBR – Greftleme)'],
    rating: 4.8,
    reviewCount: 52,
    clinic: {
      id: '1',
      name: 'Ağız ve Diş Sağlığı Merkezi',
      address: 'Atatürk Cad. No:123 Daire:5',
      city: 'İstanbul',
      district: 'Kadıköy',
      phone: '0216 123 45 67',
      email: 'info@agizdis.com',
    },
    workingHours: [
      { day: 'Pazartesi', open: '09:00', close: '18:00', closed: false },
      { day: 'Salı', open: '09:00', close: '18:00', closed: false },
      { day: 'Çarşamba', open: '09:00', close: '18:00', closed: false },
      { day: 'Perşembe', open: '09:00', close: '18:00', closed: false },
      { day: 'Cuma', open: '09:00', close: '18:00', closed: false },
      { day: 'Cumartesi', open: '09:00', close: '14:00', closed: false },
      { day: 'Pazar', open: '09:00', close: '18:00', closed: true },
    ],
    description: 'İmplantoloji alanında 12 yıllık deneyime sahip. All-on-4/6 ve kemik greftleme işlemlerinde uzmanlaşmıştır.',
  },
  '4': {
    id: '4',
    name: 'Dr. Zeynep Şahin',
    specialty: 'Endodonti (Kanal Tedavisi)',
    services: ['Tek Kök / Çok Kök Kanal', 'Mikroskop Destekli Kanal', 'Kanal Yenileme (Retreatment)'],
    rating: 4.6,
    reviewCount: 31,
    clinic: {
      id: '2',
      name: 'Modern Diş Kliniği',
      address: 'Bağdat Cad. No:456',
      city: 'İstanbul',
      district: 'Bostancı',
      phone: '0216 234 56 78',
      email: 'info@moderndis.com',
    },
    workingHours: [
      { day: 'Pazartesi', open: '09:00', close: '18:00', closed: false },
      { day: 'Salı', open: '09:00', close: '18:00', closed: false },
      { day: 'Çarşamba', open: '09:00', close: '18:00', closed: false },
      { day: 'Perşembe', open: '09:00', close: '18:00', closed: false },
      { day: 'Cuma', open: '09:00', close: '18:00', closed: false },
      { day: 'Cumartesi', open: '09:00', close: '14:00', closed: false },
      { day: 'Pazar', open: '09:00', close: '18:00', closed: true },
    ],
    description: 'Endodonti uzmanı. Mikroskop destekli kanal tedavisi ve retreatment işlemlerinde deneyimlidir.',
  },
  '5': {
    id: '5',
    name: 'Dr. Can Özkan',
    specialty: 'Restoratif Diş Tedavisi',
    services: ['Kompozit Dolgu', 'Diş Taşı Temizliği (Detartraj)', 'Kırık Diş Onarımı'],
    rating: 4.5,
    reviewCount: 28,
    clinic: {
      id: '3',
      name: 'Gülümseme Diş Kliniği',
      address: 'Tunalı Hilmi Cad. No:789',
      city: 'Ankara',
      district: 'Çankaya',
      phone: '0312 345 67 89',
      email: 'info@gulumseme.com',
    },
    workingHours: [
      { day: 'Pazartesi', open: '09:00', close: '18:00', closed: false },
      { day: 'Salı', open: '09:00', close: '18:00', closed: false },
      { day: 'Çarşamba', open: '09:00', close: '18:00', closed: false },
      { day: 'Perşembe', open: '09:00', close: '18:00', closed: false },
      { day: 'Cuma', open: '09:00', close: '18:00', closed: false },
      { day: 'Cumartesi', open: '09:00', close: '14:00', closed: false },
      { day: 'Pazar', open: '09:00', close: '18:00', closed: true },
    ],
    description: 'Restoratif diş tedavisi alanında uzman. Estetik dolgular ve diş onarım işlemlerinde deneyimlidir.',
  },
};

export default function DoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const doctorId = params?.id as string;
  const doctor = mockDoctors[doctorId];

  useEffect(() => {
    const user = getCurrentUser();
    setIsAuthenticated(!!user);
  }, []);

  if (!doctor) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 font-light">Doktor bulunamadı</p>
          <Link href="/appointments/find" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
            Geri Dön
          </Link>
        </div>
      </div>
    );
  }

  const handleBookAppointment = () => {
    if (isAuthenticated) {
      router.push(`/appointments/book?clinicId=${doctor.clinic.id}&doctorId=${doctor.id}`);
    } else {
      router.push(`/login?redirect=/appointments/book?clinicId=${doctor.clinic.id}&doctorId=${doctor.id}`);
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
        <Navigation isAuthenticated={isAuthenticated} />

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {/* Back Button */}
          <Link
            href="/appointments/find"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition font-light mb-6"
          >
            <ArrowLeft size={16} />
            Filtreleme Sayfasına Dön
          </Link>

          {/* Header */}
          <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 md:p-8 mb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center">
                    <User className="text-slate-950" size={32} />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-light">{doctor.name}</h1>
                    <p className="text-lg text-slate-400 font-light mt-1">{doctor.specialty}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Star size={20} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-lg font-light">{doctor.rating}</span>
                  </div>
                  <span className="text-slate-400 font-light">
                    ({doctor.reviewCount} yorum)
                  </span>
                </div>

                <div className="space-y-2 text-slate-300 font-light">
                  <div className="flex items-center gap-2">
                    <Building2 size={18} className="text-slate-400" />
                    <Link
                      href={`/clinics/${doctor.clinic.id}`}
                      className="text-blue-400 hover:text-blue-300 transition"
                    >
                      {doctor.clinic.name}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-slate-400" />
                    <span>
                      {doctor.clinic.address}, {doctor.clinic.district}, {doctor.clinic.city}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={18} className="text-slate-400" />
                    <span>{doctor.clinic.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={18} className="text-slate-400" />
                    <span>{doctor.clinic.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0">
                <button
                  onClick={handleBookAppointment}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition flex items-center gap-2 whitespace-nowrap"
                >
                  <Calendar size={18} />
                  Randevu Al
                </button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* Description */}
              {doctor.description && (
                <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                  <h2 className="text-xl font-light mb-4">Hakkında</h2>
                  <p className="text-slate-300 font-light leading-relaxed">
                    {doctor.description}
                  </p>
                </div>
              )}

              {/* Services */}
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-xl font-light mb-4">Uzmanlık Alanları ve Hizmetler</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-400 font-light mb-2">Uzmanlık Alanı:</p>
                    <p className="text-slate-300 font-light">{doctor.specialty}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 font-light mb-2">Verdiği Hizmetler:</p>
                    <div className="flex flex-wrap gap-2">
                      {doctor.services.map((service, index) => (
                        <span
                          key={index}
                          className="px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50 text-slate-300 font-light"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reviews */}
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-xl font-light mb-4">Yorumlar ({doctor.reviewCount})</h2>
                <div className="space-y-4">
                  {/* Mock reviews */}
                  {[
                    {
                      id: '1',
                      userName: 'Mehmet Y.',
                      rating: 5,
                      date: '2 hafta önce',
                      comment: 'Dr. Ahmet Yılmaz çok ilgili ve deneyimli. Ortodonti tedavim harika geçti, çok memnun kaldım.',
                    },
                    {
                      id: '2',
                      userName: 'Ayşe K.',
                      rating: 5,
                      date: '1 ay önce',
                      comment: 'Çok profesyonel bir hekim. Tedavi sürecinde her şeyi detaylıca açıkladı, kendimi çok rahat hissettim.',
                    },
                    {
                      id: '3',
                      userName: 'Ali M.',
                      rating: 4,
                      date: '2 ay önce',
                      comment: 'İyi bir hekim, randevu saatlerine uyuyor. Tedavi sonuçlarından memnunum.',
                    },
                  ].map((review) => (
                    <div key={review.id} className="border-b border-slate-700/50 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-light text-slate-300">{review.userName}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-slate-500 font-light">{review.date}</span>
                      </div>
                      <p className="text-sm text-slate-400 font-light mt-2">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Working Hours */}
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-light mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-blue-400" />
                  Çalışma Saatleri
                </h3>
                <div className="space-y-2">
                  {doctor.workingHours.map((schedule, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-slate-300 font-light">{schedule.day}</span>
                      {schedule.closed ? (
                        <span className="text-slate-500 font-light">Kapalı</span>
                      ) : (
                        <span className="text-slate-400 font-light">
                          {schedule.open} - {schedule.close}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Clinic Info */}
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-light mb-4 flex items-center gap-2">
                  <Building2 size={20} className="text-blue-400" />
                  Klinik Bilgileri
                </h3>
                <div className="space-y-3 text-sm">
                  <Link
                    href={`/clinics/${doctor.clinic.id}`}
                    className="block text-blue-400 hover:text-blue-300 transition font-light"
                  >
                    {doctor.clinic.name}
                  </Link>
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300 font-light">
                      {doctor.clinic.address}, {doctor.clinic.district}, {doctor.clinic.city}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-slate-400 flex-shrink-0" />
                    <span className="text-slate-300 font-light">{doctor.clinic.phone}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-light mb-4">Hızlı İşlemler</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleBookAppointment}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition text-center"
                  >
                    Randevu Al
                  </button>
                  <Link
                    href={`/clinics/${doctor.clinic.id}`}
                    className="block w-full px-4 py-2.5 border border-slate-600/50 hover:border-blue-400/50 hover:text-blue-400 rounded-lg font-light transition text-center"
                  >
                    Klinik Detayı
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 mt-12">
          <Footer />
        </div>
      </div>
    </div>
  );
}

