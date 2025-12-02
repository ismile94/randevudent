"use client";
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import { isFavorited, toggleFavorite } from '@/lib/favorites';
import { getAllClinics, getCurrentClinic } from '@/lib/auth-clinic';
import { getClinicStaff } from '@/lib/staff';
import { subscribeToEvents } from '@/lib/events';
import { getClinicReviews, calculateAverageRating, type Review } from '@/lib/reviews';
import { getAppointmentsByClinicId, getClinicAppointmentStats } from '@/lib/appointments';
import {
  MapPin,
  Phone,
  Mail,
  Star,
  Clock,
  Calendar,
  ArrowLeft,
  CheckCircle2,
  Shield,
  Clock as ClockIcon,
  Info,
  User,
  Heart,
  Share2,
  Printer,
  MessageCircle,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  CreditCard,
  Car,
  Wifi,
  Award,
  Video,
  FileText,
  AlertCircle,
  Navigation as NavigationIcon,
  Copy,
  Check,
  Filter,
  ExternalLink,
  TrendingUp,
  Users,
  DollarSign,
} from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  services: string[];
  rating?: number;
  reviewCount?: number;
}

interface Clinic {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  email: string;
  website?: string;
  rating: number;
  reviewCount: number;
  services: string[];
  specialties: string[];
  doctors?: Doctor[];
  workingHours: {
    day: string;
    open: string;
    close: string;
    closed: boolean;
  }[];
  description: string;
  verified: boolean;
  // Extended fields
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
  };
  paymentMethods?: string[];
  acceptedInsurances?: string[];
  parkingInfo?: string;
  accessibility?: {
    wheelchairAccessible?: boolean;
    elevator?: boolean;
    parking?: boolean;
    wifi?: boolean;
    waitingArea?: boolean;
  };
  emergencyContact?: string;
  emergencyPhone?: string;
  whatsappNumber?: string;
  certificates?: {
    name: string;
    issuer: string;
    date: string;
    imageUrl?: string;
  }[];
  awards?: {
    name: string;
    year: string;
    description?: string;
  }[];
  videos?: {
    title: string;
    url: string;
    type: 'youtube' | 'vimeo' | 'direct';
    thumbnail?: string;
  }[];
  latitude?: number;
  longitude?: number;
}

const specialtyOptions = [
  {
    name: 'Ağız, Diş ve Çene Cerrahisi',
    description: 'Gömülü 20\'lik dişler, implant cerrahisi, çene kırıkları, kist–tümör operasyonları, ileri kemik grefti (sinüs lifting vb.).'
  },
  {
    name: 'Ortodonti',
    description: 'Diş ve çene eğrilikleri, metal/seramik teller, şeffaf plak (Invisalign), çene genişletme, çocuk ve erişkin ortodontisi.'
  },
  {
    name: 'Protetik Diş Tedavisi',
    description: 'Zirkonyum–porselen kaplamalar, laminate veneer, tam/parsiyel protezler, implant üstü protezler, dijital gülüş tasarımı.'
  },
  {
    name: 'Endodonti (Kanal Tedavisi)',
    description: 'İleri kanal tedavisi, kanal yenileme (retreatment), mikroskop destekli işlemler, kök kırığı yönetimi.'
  },
  {
    name: 'Periodontoloji (Diş Eti Hastalıkları)',
    description: 'Diş eti çekilmesi, kanama–iltihap tedavileri, küretaj, flep operasyonları, kemik grefti, diş eti estetiği (pembe estetik).'
  },
  {
    name: 'Pedodonti (Çocuk Diş Hekimliği)',
    description: 'Süt dişi dolguları, fissür örtücü, flor uygulaması, çocuk kanal tedavisi, sedasyon ve genel anestezi altında tedaviler.'
  },
  {
    name: 'Restoratif Diş Tedavisi',
    description: 'Dolgu, estetik kompozit bondings, kırık diş restorasyonları, diş beyazlatma, travma sonrası restorasyonlar.'
  },
  {
    name: 'Oral Diagnoz ve Radyoloji',
    description: 'Panoramik, periapikal ve konik ışınlı tomografi (CBCT) değerlendirmesi, hastalık teşhisi, yönlendirme.'
  },
  {
    name: 'Estetik Diş Hekimliği / Gülüş Tasarımı',
    description: 'Hollywood Smile, porselen laminate veneer, dijital ölçü, dudak–diş estetik uyumu.'
  },
  {
    name: 'İmplantoloji',
    description: 'Tekli implant, tam çene implant (All-on-4/6), kemik artırma, sinüs lifting, hızlı sabit diş konseptleri.'
  },
  {
    name: 'Dijital Diş Hekimliği – CAD/CAM',
    description: 'Ağız içi tarayıcı, 3D yazıcı ile geçici diş, tek seansta kaplama/kuron.'
  },
  {
    name: 'Temporomandibular Eklem (TME) Tedavileri',
    description: 'Çene eklem ağrısı, çene kilitlenmesi, klik sesleri, gece plakları, eklem enjeksiyonları.'
  },
  {
    name: 'Bruksizm (Diş Sıkma ve Gıcırdatma) Tedavileri',
    description: 'Gece plağı, kas gevşetici botoks, kas maseter güçlenmesi kontrolü.'
  },
  {
    name: 'Uyku Apnesi ve Horlama Ağız Apareyleri',
    description: 'Alt çene öne alma cihazları, kişiye özel uyku apareyleri.'
  },
  {
    name: 'Ağız Kokusu (Halitozis) Yönetimi',
    description: 'Diş eti, dil ve sindirim kaynaklı ağız kokusu analiz ve tedavisi.'
  },
];

const SpecialtyTooltip = ({ 
  specialty, 
  description 
}: { 
  specialty: string; 
  description: string;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleMouseEnter = () => {
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const handleClick = () => {
    setShowTooltip(!showTooltip);
  };

  return (
    <div className="relative">
      <div
        className="group relative px-4 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30 text-blue-300 font-light cursor-pointer hover:from-blue-500/30 hover:to-cyan-500/30 transition"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {specialty}
        <Info size={12} className="inline-block ml-2 opacity-70 group-hover:opacity-100" />
      </div>
      {showTooltip && description && (
        <div className="absolute left-full top-0 ml-3 z-[9999] px-3 py-2 bg-slate-800/95 backdrop-blur border border-blue-500/50 rounded-lg shadow-lg w-64 pointer-events-none">
          <p className="text-xs font-light text-slate-300 leading-relaxed">
            {description}
          </p>
          <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-blue-500/50"></div>
        </div>
      )}
    </div>
  );
};

const serviceOptions = [
  // Koruyucu Tedaviler
  { 
    name: 'Diş Taşı Temizliği (Detartraj)', 
    description: 'Diş yüzeylerinde biriken plak ve diş taşlarının profesyonel olarak temizlenmesi işlemidir. Düzenli yapıldığında diş eti hastalıklarını önler ve ağız sağlığını korur.'
  },
  { 
    name: 'Subgingival Derin Temizlik (Küretaj)', 
    description: 'Diş eti çizgisinin altındaki plak ve diş taşlarının temizlenmesi işlemidir. Periodontal hastalıkların tedavisinde kullanılır ve diş eti sağlığının korunmasını sağlar.'
  },
  { 
    name: 'Flor & Fissür Örtücü', 
    description: 'Çocuklarda ve yetişkinlerde diş çürüklerini önlemek için uygulanan koruyucu tedavilerdir. Flor uygulaması diş minesini güçlendirir, fissür örtücü ise çürüğe yatkın olukları kapatır.'
  },
  { 
    name: 'Koruyucu Plaklar', 
    description: 'Diş sıkma, gıcırdatma veya spor aktivitelerinde dişleri korumak için kullanılan kişiye özel hazırlanan plaklardır. Dişlerin aşınmasını ve travmaları önler.'
  },
  // Dolgu ve Restorasyonlar
  { 
    name: 'Kompozit Dolgu', 
    description: 'Diş renginde estetik dolgu malzemesi ile yapılan restorasyonlardır. Çürük temizlendikten sonra dişin doğal görünümüne uygun şekilde doldurulur.'
  },
  { 
    name: 'Seramik Inlay–Onlay', 
    description: 'Diş renginde seramik malzemeden laboratuvarda hazırlanan, dişe yapıştırılan estetik restorasyonlardır. Daha büyük çürüklerde ve aşınmış dişlerde kullanılır.'
  },
  { 
    name: 'Bonding Estetik Dolgu', 
    description: 'Diş renginde kompozit malzeme kullanılarak yapılan estetik dolgu işlemidir. Kırık, çatlak veya şekil bozukluklarını düzeltmek için kullanılır.'
  },
  { 
    name: 'Kırık Diş Onarımı', 
    description: 'Travma veya kaza sonucu kırılan dişlerin estetik ve fonksiyonel olarak onarılması işlemidir. Kompozit veya seramik restorasyonlarla yapılır.'
  },
  // Kanal Tedavileri
  { 
    name: 'Tek Kök / Çok Kök Kanal', 
    description: 'Dişin pulpa (sinir) dokusunun iltihaplanması veya enfeksiyon durumunda uygulanan tedavidir. Dişin kurtarılması ve ağrının giderilmesi için yapılır.'
  },
  { 
    name: 'Kökte Kırık Yönetimi', 
    description: 'Diş kökünde oluşan kırıkların teşhisi ve tedavi seçeneklerinin değerlendirilmesidir. Erken teşhis ile dişin kurtarılması mümkün olabilir.'
  },
  { 
    name: 'Kanal Yenileme (Retreatment)', 
    description: 'Daha önce yapılmış kanal tedavisinin başarısız olması durumunda, kök kanallarının yeniden temizlenip doldurulması işlemidir.'
  },
  { 
    name: 'Mikroskop Destekli Kanal', 
    description: 'Mikroskop kullanılarak yapılan ileri düzey kanal tedavisidir. Komplike vakalarda daha yüksek başarı oranı sağlar ve dişin kurtarılma şansını artırır.'
  },
  // Cerrahi İşlemler
  { 
    name: 'Basit / Komplike Diş Çekimi', 
    description: 'Çürük, enfeksiyon veya travma nedeniyle kurtarılamayan dişlerin çıkarılması işlemidir. Basit çekimler normal dişlerde, komplike çekimler ise gömülü veya kırık dişlerde uygulanır.'
  },
  { 
    name: 'Gömülü 20\'lik Çekimi', 
    description: 'Ağızda yer bulamayan veya yanlış pozisyonda olan yirmi yaş dişlerinin cerrahi olarak çıkarılması işlemidir. Ağrı, enfeksiyon ve komşu dişlere zarar vermeyi önler.'
  },
  { 
    name: 'Çene Kist/Tümör Operasyonları', 
    description: 'Çene kemiğinde oluşan kist veya tümörlerin cerrahi olarak çıkarılması işlemidir. Erken teşhis ve tedavi önemlidir.'
  },
  { 
    name: 'Sinüs Lifting, Greft, Membran', 
    description: 'İmplant yerleştirilmeden önce üst çene sinüs bölgesinde kemik yetersizliği durumunda uygulanan kemik artırma işlemleridir. İmplant başarısını artırır.'
  },
  // İmplant Tedavileri
  { 
    name: 'Tek İmplant', 
    description: 'Tek diş eksikliğinde uygulanan, titanyum vida ile yapılan diş kökü replasmanıdır. Komşu dişlere zarar vermeden doğal görünümlü diş restorasyonu sağlar.'
  },
  { 
    name: 'İmplant Üstü Kron/Bridge', 
    description: 'İmplant üzerine yerleştirilen sabit diş protezleridir. Tek veya birden fazla diş eksikliğinde kullanılır ve doğal diş görünümü sağlar.'
  },
  { 
    name: 'All-on-4 / All-on-6 Sabit Protez', 
    description: 'Tüm dişsiz çenelerde 4 veya 6 implant ile sabit protez yapılması işlemidir. Hızlı ve etkili bir çözüm sunar, takıp çıkarılan protezlere alternatiftir.'
  },
  { 
    name: 'Kemik Artırma (GBR – Greftleme)', 
    description: 'İmplant yerleştirilmeden önce yetersiz kemik dokusunun artırılması işlemidir. Kemik grefti ve membran kullanılarak yeni kemik oluşumu sağlanır.'
  },
  // Protez / Kaplama
  { 
    name: 'Zirkonyum Kron/Bridge', 
    description: 'Dayanıklı ve estetik zirkonyum seramik malzemeden yapılan diş kaplamalarıdır. Metal desteksiz, doğal diş renginde ve uzun ömürlü restorasyonlardır.'
  },
  { 
    name: 'E-max Porselen / Laminate Veneer', 
    description: 'Ön dişlerde estetik amaçlı kullanılan ince porselen yapraklardır. Diş rengini açma, şekil düzeltme ve gülüş tasarımı için idealdir.'
  },
  { 
    name: 'Tam/Parsiyel Protez', 
    description: 'Tüm dişlerin veya bir kısmının eksik olduğu durumlarda kullanılan takıp çıkarılabilir protezlerdir. Fonksiyon ve estetik sağlar.'
  },
  { 
    name: 'İmplant Üstü Hibrit Protez', 
    description: 'İmplantlar üzerine yerleştirilen sabit veya çıkarılabilir hibrit protezlerdir. Tam dişsizlik durumlarında güvenli ve konforlu çözüm sunar.'
  },
  // Ortodonti
  { 
    name: 'Metal–Seramik Teller', 
    description: 'Diş ve çene düzensizliklerini düzeltmek için kullanılan geleneksel ortodontik tedavi yöntemidir. Hem çocuklarda hem yetişkinlerde etkili sonuçlar verir.'
  },
  { 
    name: 'Şeffaf Plak/Invisalign', 
    description: 'Görünmez, çıkarılabilir şeffaf plaklarla yapılan ortodontik tedavidir. Estetik ve konforlu bir alternatif sunar, yemek yerken çıkarılabilir.'
  },
  { 
    name: 'Çocuk Ortodontisi', 
    description: 'Çocuklarda erken yaşta başlayan ortodontik tedavilerdir. Çene gelişimini yönlendirir ve ileride oluşabilecek problemleri önler.'
  },
  { 
    name: 'Çene Genişletme Apareyleri', 
    description: 'Dar çeneleri genişletmek için kullanılan özel apareylerdir. Çocuklarda büyüme döneminde uygulanır ve dişlerin düzgün sıralanmasını sağlar.'
  },
  // Estetik İşlemler
  { 
    name: 'Hollywood Smile', 
    description: 'Tüm ön dişlerin porselen laminate veneer veya kronlarla estetik olarak yeniden tasarlandığı kapsamlı gülüş tasarımı işlemidir.'
  },
  { 
    name: 'Diş Beyazlatma (Ofis–Ev Tipi)', 
    description: 'Dişlerin rengini açmak için uygulanan profesyonel beyazlatma işlemleridir. Ofiste tek seanslık veya evde kullanılan plaklarla yapılabilir.'
  },
  { 
    name: 'Diş Eti Şekillendirme (Gingivoplasti)', 
    description: 'Diş eti konturlarının düzenlenmesi ve estetik görünümün iyileştirilmesi işlemidir. Gummy smile ve düzensiz diş eti çizgilerini düzeltir.'
  },
  { 
    name: 'Gummy Smile Botoks / Lazer', 
    description: 'Gülümseme sırasında fazla diş eti görünmesini azaltmak için uygulanan botoks veya lazer işlemleridir. Estetik gülüş elde edilmesini sağlar.'
  },
  // Çocuk Tedavileri
  { 
    name: 'Çocuk Dolguları', 
    description: 'Süt dişlerinde oluşan çürüklerin tedavisi için yapılan özel dolgulardır. Çocuklara uygun malzeme ve tekniklerle yapılır.'
  },
  { 
    name: 'Çocuk Kanal Tedavisi (Pulpotomi/Pulpektomi)', 
    description: 'Süt dişlerinde ilerlemiş çürüklerde uygulanan kanal tedavisi işlemleridir. Dişin korunması ve erken kaybının önlenmesi için yapılır.'
  },
  { 
    name: 'Çocuk Protezleri', 
    description: 'Erken diş kaybı durumunda çocuklara uygulanan özel protezlerdir. Çene gelişimini korur ve estetik sağlar.'
  },
  { 
    name: 'Sedasyon / Genel Anestezi', 
    description: 'Tedavi korkusu olan veya çok sayıda işlem gereken çocuklarda uygulanan sedasyon veya genel anestezi altında tedavi yöntemleridir.'
  },
];

const ServiceTooltip = ({ 
  service 
}: { 
  service: string;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const serviceInfo = serviceOptions.find(s => s.name === service);

  const handleMouseEnter = () => {
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <div className="relative">
      <span
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="px-4 py-2 bg-slate-800/30 rounded-lg border border-slate-700/30 text-slate-300 font-light cursor-help hover:border-blue-400/50 transition"
      >
        {service}
      </span>
      {showTooltip && serviceInfo?.description && (
        <div className="absolute left-full top-0 ml-3 z-[9999] px-3 py-2 bg-slate-800/95 backdrop-blur border border-blue-500/50 rounded-lg shadow-lg w-64 pointer-events-none">
          <p className="text-xs font-light text-slate-300 leading-relaxed">
            {serviceInfo.description}
          </p>
          <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-blue-500/50"></div>
        </div>
      )}
    </div>
  );
};

// Mock data - Supabase'den gelecek
const mockClinic: Clinic = {
  id: '1',
  name: 'Ağız ve Diş Sağlığı Merkezi',
  address: 'Atatürk Cad. No:123 Daire:5',
  city: 'İstanbul',
  district: 'Kadıköy',
  phone: '0216 123 45 67',
  email: 'info@agizdis.com',
  website: 'https://www.agizdis.com',
  rating: 0,
  reviewCount: 0,
  services: [
    'Diş Taşı Temizliği (Detartraj)',
    'Kompozit Dolgu',
    'Tek Kök / Çok Kök Kanal',
    'Tek İmplant',
    'Metal–Seramik Teller',
    'Zirkonyum Kron/Bridge',
    'Hollywood Smile',
  ],
  specialties: [
    'Ağız, Diş ve Çene Cerrahisi',
    'Ortodonti',
    'Protetik Diş Tedavisi',
    'Endodonti (Kanal Tedavisi)',
    'Periodontoloji (Diş Eti Hastalıkları)',
    'Pedodonti (Çocuk Diş Hekimliği)',
    'Restoratif Diş Tedavisi',
    'Estetik Diş Hekimliği / Gülüş Tasarımı',
    'İmplantoloji',
  ],
  doctors: [], // Mock doctors removed - only real staff data will be shown
  workingHours: [
    { day: 'Pazartesi', open: '09:00', close: '18:00', closed: false },
    { day: 'Salı', open: '09:00', close: '18:00', closed: false },
    { day: 'Çarşamba', open: '09:00', close: '18:00', closed: false },
    { day: 'Perşembe', open: '09:00', close: '18:00', closed: false },
    { day: 'Cuma', open: '09:00', close: '18:00', closed: false },
    { day: 'Cumartesi', open: '09:00', close: '14:00', closed: false },
    { day: 'Pazar', open: '09:00', close: '18:00', closed: true },
  ],
  description:
    'Modern teknoloji ve deneyimli ekibimizle ağız ve diş sağlığı hizmetleri sunuyoruz. 15 yıllık tecrübemizle hastalarımıza en iyi hizmeti vermek için çalışıyoruz.',
  verified: true,
};

export default function ClinicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [favorited, setFavorited] = useState(false);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'all' | 5 | 4 | 3 | 2 | 1>('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  const [nearbyClinics, setNearbyClinics] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadClinicData = useCallback(() => {
    const clinicId = params.id as string;
    setLoading(true);
    
    // Get clinic data - check both getAllClinics and getCurrentClinic (for test clinic)
    const clinics = getAllClinics();
    let foundClinic = clinics.find(c => c.id === clinicId);
    
    // If not found in clinics array, check current clinic (for test clinic login)
    if (!foundClinic) {
      const currentClinic = getCurrentClinic();
      if (currentClinic && currentClinic.id === clinicId) {
        foundClinic = currentClinic;
      }
    }
    
    // Get real reviews
    const clinicReviews = getClinicReviews(clinicId);
    setReviews(clinicReviews);
    
    // Get statistics
    const stats = getClinicAppointmentStats(clinicId);
    setStatistics(stats);
    
    // Get nearby clinics (same city)
    if (foundClinic) {
      const nearby = clinics
        .filter(c => c.id !== clinicId && c.city === foundClinic!.city && c.status === 'approved')
        .slice(0, 3);
      setNearbyClinics(nearby);
    }
    
    // Always get real staff data for the clinic
    const staff = getClinicStaff(clinicId);
    
    if (foundClinic) {
      // Calculate real rating from reviews
      const avgRating = clinicReviews.length > 0 ? calculateAverageRating(clinicReviews) : 0;
      
      // Collect services and specialties from staff
      const allServices = new Set<string>();
      const allSpecialties = new Set<string>();
      
      staff.forEach(s => {
        if (s.services) {
          s.services.forEach(service => allServices.add(service));
        }
        if (s.specialty) {
          allSpecialties.add(s.specialty);
        }
      });
      
      // Use real clinic data
      const clinicData: Clinic = {
        id: foundClinic.id,
        name: foundClinic.clinicName,
        address: foundClinic.address,
        city: foundClinic.city,
        district: foundClinic.district,
        phone: foundClinic.phone,
        email: foundClinic.email,
        website: foundClinic.website,
        rating: avgRating || 0,
        reviewCount: clinicReviews.length,
        services: Array.from(allServices),
        specialties: Array.from(allSpecialties),
        workingHours: foundClinic.workingHours || mockClinic.workingHours,
        description: foundClinic.description || 'Klinik hakkında bilgi eklenmemiş.',
        verified: foundClinic.verified,
        socialMedia: foundClinic.socialMedia,
        paymentMethods: foundClinic.paymentMethods,
        acceptedInsurances: foundClinic.acceptedInsurances,
        parkingInfo: foundClinic.parkingInfo,
        accessibility: foundClinic.accessibility,
        emergencyContact: foundClinic.emergencyContact,
        emergencyPhone: foundClinic.emergencyPhone,
        whatsappNumber: foundClinic.whatsappNumber,
        certificates: foundClinic.certificates,
        awards: foundClinic.awards,
        videos: foundClinic.videos,
        latitude: foundClinic.latitude,
        longitude: foundClinic.longitude,
      };
      setClinic(clinicData);
      
      // Get staff/doctors - show all staff with medical titles
      const doctorsData: Doctor[] = staff
        .filter(s => {
          const titleLower = s.title.toLowerCase();
          return (
            titleLower.includes('hekim') ||
            titleLower.includes('doktor') ||
            titleLower.includes('dr') ||
            titleLower.includes('diş hekimi') ||
            s.specialty // If has specialty, likely a doctor
          );
        })
        .map(s => {
          const doctorReviews = clinicReviews.filter(r => r.doctorId === s.id);
          const doctorRating = doctorReviews.length > 0 ? calculateAverageRating(doctorReviews) : 0;
          return {
            id: s.id,
            name: s.name,
            specialty: s.specialty || s.title,
            services: s.services || [],
            rating: doctorRating || 0,
            reviewCount: doctorReviews.length,
          };
        });
      setDoctors(doctorsData);
    } else {
      // Clinic not found - use mock data for display but ALWAYS use real staff
      // Get real doctors from staff - never use mock doctors
      const doctorsData: Doctor[] = staff
        .filter(s => {
          const titleLower = s.title.toLowerCase();
          return (
            titleLower.includes('hekim') ||
            titleLower.includes('doktor') ||
            titleLower.includes('dr') ||
            titleLower.includes('diş hekimi') ||
            s.specialty
          );
        })
        .map(s => {
          const doctorReviews = clinicReviews.filter(r => r.doctorId === s.id);
          const doctorRating = doctorReviews.length > 0 ? calculateAverageRating(doctorReviews) : 0;
          return {
            id: s.id,
            name: s.name,
            specialty: s.specialty || s.title,
            services: s.services || [],
            rating: doctorRating || 0,
            reviewCount: doctorReviews.length,
          };
        });
      setDoctors(doctorsData); // Always use real staff, never mock
      
      const avgRating = clinicReviews.length > 0 ? calculateAverageRating(clinicReviews) : 0;
      setClinic({
        ...mockClinic,
        rating: avgRating,
        reviewCount: clinicReviews.length,
        doctors: [], // Never use mock doctors - always empty
      });
    }
    
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    loadClinicData();
  }, [loadClinicData]);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      setIsAuthenticated(!!currentUser);
      if (currentUser && clinic) {
        setUser(currentUser);
        setFavorited(isFavorited(currentUser.id, clinic.id));
      }
    };
    if (clinic) {
      checkAuth();
    }
  }, [clinic]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToEvents((eventData) => {
      const clinicId = params.id as string;
      
      if (
        eventData.type === 'staff:created' ||
        eventData.type === 'staff:updated' ||
        eventData.type === 'staff:deleted' ||
        eventData.type === 'appointment:created' ||
        eventData.type === 'appointment:updated' ||
        eventData.type === 'appointment:deleted'
      ) {
        // Reload clinic data to get updated staff/statistics
        loadClinicData();
      }
      
      if (eventData.type === 'clinic:settings:updated' && eventData.payload.id === clinicId) {
        // Reload clinic data to get updated settings
        loadClinicData();
      }

      if (
        eventData.type === 'review:created' ||
        eventData.type === 'review:updated' ||
        eventData.type === 'review:deleted'
      ) {
        // Reload reviews if they belong to this clinic
        if (eventData.payload.clinicId === clinicId) {
          loadClinicData();
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [params.id, loadClinicData]);

  // Helper functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Bugün';
    if (diffDays === 1) return 'Dün';
    if (diffDays < 7) return `${diffDays} gün önce`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} ay önce`;
    return `${Math.floor(diffDays / 365)} yıl önce`;
  };

  const isCurrentlyOpen = (workingHours: any[]) => {
    if (!workingHours || workingHours.length === 0) return false;
    const now = new Date();
    const dayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1; // Monday = 0
    const today = workingHours[dayIndex];
    
    if (!today || today.closed) return false;
    
    const [openHour, openMin] = today.open.split(':').map(Number);
    const [closeHour, closeMin] = today.close.split(':').map(Number);
    const nowHour = now.getHours();
    const nowMin = now.getMinutes();
    
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;
    const currentTime = nowHour * 60 + nowMin;
    
    return currentTime >= openTime && currentTime <= closeTime;
  };

  const getTodaySchedule = (workingHours: any[]) => {
    if (!workingHours || workingHours.length === 0) return null;
    const now = new Date();
    const dayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
    return workingHours[dayIndex];
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: clinic?.name || 'Klinik',
          text: `${clinic?.name} - Randevu almak için tıklayın`,
          url: url,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const phone = clinic?.whatsappNumber || clinic?.phone;
    const message = `Merhaba, ${clinic?.name} hakkında bilgi almak istiyorum.`;
    const url = `https://wa.me/${phone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const getGoogleMapsUrl = () => {
    if (clinic?.latitude && clinic?.longitude) {
      return `https://www.google.com/maps?q=${clinic.latitude},${clinic.longitude}`;
    }
    const address = `${clinic?.address}, ${clinic?.district}, ${clinic?.city}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  const filteredReviews = reviews.filter(r => {
    if (reviewFilter === 'all') return true;
    return r.rating === reviewFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-light mb-2">Klinik bulunamadı</h2>
          <p className="text-slate-400 mb-6">Aradığınız klinik mevcut değil veya kaldırılmış olabilir.</p>
          <Link
            href="/clinics"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition"
          >
            <ArrowLeft size={18} />
            Kliniklere Dön
          </Link>
        </div>
      </div>
    );
  }

  const handleBookAppointment = () => {
    if (isAuthenticated) {
      router.push(`/appointments/book?clinicId=${clinic.id}`);
    } else {
      router.push(`/login?redirect=/appointments/book?clinicId=${clinic.id}`);
    }
  };

  const handleToggleFavorite = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    const result = toggleFavorite(user.id, clinic.id);
    if (result.success) {
      setFavorited(result.isFavorited);
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
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6 font-light">
            <Link href="/" className="hover:text-blue-400 transition">Ana Sayfa</Link>
            <span>/</span>
            <Link href="/clinics" className="hover:text-blue-400 transition">Klinikler</Link>
            <span>/</span>
            <span className="text-slate-300">{clinic.name}</span>
          </nav>

          {/* Header */}
          <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 md:p-8 mb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-3xl md:text-4xl font-light">{clinic.name}</h1>
                  {clinic.verified && (
                    <div className="flex items-center gap-1 text-sm bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/30">
                      <Shield size={14} />
                      <span>Doğrulanmış</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Star size={20} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-lg font-light">{clinic.rating > 0 ? clinic.rating.toFixed(1) : 'Yeni'}</span>
                  </div>
                  <span className="text-slate-400 font-light">
                    ({clinic.reviewCount} {clinic.reviewCount === 1 ? 'yorum' : 'yorum'})
                  </span>
                  {clinic.workingHours && (
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-light ${
                      isCurrentlyOpen(clinic.workingHours)
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${isCurrentlyOpen(clinic.workingHours) ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      {isCurrentlyOpen(clinic.workingHours) ? 'Şu anda açık' : 'Şu anda kapalı'}
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-slate-300 font-light">
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-slate-400" />
                    <span>
                      {clinic.address}, {clinic.district}, {clinic.city}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={18} className="text-slate-400" />
                    <span>{clinic.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={18} className="text-slate-400" />
                    <span>{clinic.email}</span>
                  </div>
                  {clinic.website && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Web:</span>
                      <a
                        href={clinic.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition"
                      >
                        {clinic.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 flex gap-3 flex-wrap">
                <div className="flex gap-2">
                  <button
                    onClick={handleShare}
                    className="px-3 py-3 border border-slate-600/50 hover:border-blue-400/50 hover:text-blue-400 rounded-lg transition flex items-center gap-2"
                    title="Paylaş"
                  >
                    {copied ? <Check size={18} /> : <Share2 size={18} />}
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-3 py-3 border border-slate-600/50 hover:border-blue-400/50 hover:text-blue-400 rounded-lg transition flex items-center gap-2"
                    title="Yazdır"
                  >
                    <Printer size={18} />
                  </button>
                </div>
                {isAuthenticated && (
                  <button
                    onClick={handleToggleFavorite}
                    className={`px-4 py-3 border rounded-lg font-light transition flex items-center gap-2 whitespace-nowrap ${
                      favorited
                        ? 'border-red-500/50 bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'border-slate-600/50 hover:border-red-400/50 hover:text-red-400'
                    }`}
                  >
                    <Heart size={18} className={favorited ? 'fill-red-400' : ''} />
                    {favorited ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                  </button>
                )}
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
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-xl font-light mb-4">Hakkında</h2>
                <p className="text-slate-300 font-light leading-relaxed">
                  {clinic.description}
                </p>
              </div>

              {/* Specialties */}
              {clinic.specialties && clinic.specialties.length > 0 && (
                <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                  <h2 className="text-xl font-light mb-4">Uzmanlık Alanları</h2>
                  <div className="flex flex-wrap gap-3">
                    {clinic.specialties.map((specialty, index) => {
                      const specialtyInfo = specialtyOptions.find(s => s.name === specialty);
                      return (
                        <SpecialtyTooltip
                          key={index}
                          specialty={specialty}
                          description={specialtyInfo?.description || ''}
                        />
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-500 font-light mt-4">
                    Bu klinikte yukarıdaki uzmanlık alanlarında hizmet verilmektedir.
                  </p>
                </div>
              )}

              {/* Services */}
              {clinic.services && clinic.services.length > 0 && (
                <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                  <h2 className="text-xl font-light mb-4">Sunulan Hizmetler</h2>
                  <div className="flex flex-wrap gap-3">
                    {clinic.services.map((service, index) => (
                      <ServiceTooltip key={index} service={service} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 font-light mt-4">
                    * Fiyat bilgisi için lütfen klinikle iletişime geçin.
                  </p>
                </div>
              )}

              {/* Online Calendar Preview */}
              {clinic.workingHours && clinic.workingHours.length > 0 && (
                <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-light flex items-center gap-2">
                      <Calendar size={24} className="text-blue-400" />
                      Müsait Tarihler
                    </h2>
                    <Link
                      href={`/appointments/book?clinicId=${clinic.id}`}
                      className="text-sm text-blue-400 hover:text-blue-300 transition font-light flex items-center gap-1"
                    >
                      Tümünü Gör
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                  {(() => {
                    const getDayNameInTurkish = (dateString: string) => {
                      const date = new Date(dateString);
                      const dayIndex = date.getDay();
                      const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
                      return days[dayIndex];
                    };

                    const getAllAvailableDates = (workingHours: any[]) => {
                      const dates: string[] = [];
                      const today = new Date();
                      const maxDate = new Date();
                      maxDate.setMonth(maxDate.getMonth() + 1); // Show next month
                      
                      for (let d = new Date(today); d <= maxDate; d.setDate(d.getDate() + 1)) {
                        const dayName = getDayNameInTurkish(d.toISOString().split('T')[0]);
                        const daySchedule = workingHours.find(wh => wh.day === dayName);
                        if (daySchedule && !daySchedule.closed) {
                          dates.push(d.toISOString().split('T')[0]);
                        }
                      }
                      return dates;
                    };

                    const getAvailableTimeSlots = (date: string, workingHours: any[], existingAppointments: any[]) => {
                      const dayName = getDayNameInTurkish(date);
                      const daySchedule = workingHours.find(wh => wh.day === dayName);
                      if (!daySchedule || daySchedule.closed) return [];

                      const slots: string[] = [];
                      const [openHour, openMin] = daySchedule.open.split(':').map(Number);
                      const [closeHour, closeMin] = daySchedule.close.split(':').map(Number);
                      
                      let currentHour = openHour;
                      let currentMin = openMin;

                      while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
                        const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
                        
                        const isBooked = existingAppointments.some(apt => 
                          apt.date === date && 
                          apt.time === timeString && 
                          apt.status !== 'cancelled' &&
                          apt.clinicId === clinic.id
                        );
                        
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
                    };

                    const availableDates = getAllAvailableDates(clinic.workingHours);
                    const appointments = getAppointmentsByClinicId(clinic.id);
                    const upcomingDates = availableDates
                      .slice(0, 7)
                      .map(date => ({
                        date,
                        availableSlots: getAvailableTimeSlots(date, clinic.workingHours, appointments),
                      }))
                      .filter(d => d.availableSlots.length > 0);

                    if (upcomingDates.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <Calendar size={48} className="text-slate-600 mx-auto mb-4" />
                          <p className="text-slate-400 font-light">Yakın zamanda müsait tarih bulunmuyor</p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {upcomingDates.map((item) => {
                          const dateObj = new Date(item.date);
                          const dayName = getDayNameInTurkish(item.date);
                          const isToday = dateObj.toDateString() === new Date().toDateString();
                          
                          return (
                            <Link
                              key={item.date}
                              href={`/appointments/book?clinicId=${clinic.id}&date=${item.date}`}
                              className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-blue-400/50 rounded-lg transition"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <div className="text-sm font-light text-slate-400">{dayName}</div>
                                  <div className="text-lg font-light text-slate-300">
                                    {dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                                    {isToday && <span className="ml-2 text-xs text-blue-400">(Bugün)</span>}
                                  </div>
                                </div>
                                <div className="text-sm text-green-400 font-light">
                                  {item.availableSlots.length} saat
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.availableSlots.slice(0, 3).map((time) => (
                                  <span
                                    key={time}
                                    className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-light"
                                  >
                                    {time}
                                  </span>
                                ))}
                                {item.availableSlots.length > 3 && (
                                  <span className="px-2 py-1 bg-slate-700/50 text-slate-400 rounded text-xs font-light">
                                    +{item.availableSlots.length - 3}
                                  </span>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Doctors / Kadro */}
              {doctors && doctors.length > 0 && (
                <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                  <h2 className="text-xl font-light mb-4 flex items-center gap-2">
                    <User size={24} className="text-blue-400" />
                    Kadro
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {doctors.map((doctor) => (
                      <Link
                        key={doctor.id}
                        href={`/doctors/${doctor.id}`}
                        className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:border-blue-400/50 transition group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-light mb-1 group-hover:text-blue-400 transition">
                              {doctor.name}
                            </h3>
                            <p className="text-sm text-slate-400 font-light">{doctor.specialty}</p>
                          </div>
                          {doctor.rating && (
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-yellow-400">
                                <Star size={16} className="fill-yellow-400" />
                                <span className="text-sm font-light">{doctor.rating}</span>
                              </div>
                              {doctor.reviewCount && (
                                <span className="text-xs text-slate-400">
                                  {doctor.reviewCount} yorum
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {doctor.services.slice(0, 2).map((service, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-300 font-light"
                            >
                              {service}
                            </span>
                          ))}
                          {doctor.services.length > 2 && (
                            <span className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-400 font-light">
                              +{doctor.services.length - 2} daha
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-light">Yorumlar ({clinic.reviewCount})</h2>
                  {isAuthenticated && (
                    <Link
                      href={`/clinics/${params.id}/review`}
                      className="px-4 py-2 text-sm bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition font-light flex items-center gap-2"
                    >
                      <Star size={16} />
                      Yorum Yap
                    </Link>
                  )}
                </div>

                {filteredReviews.length > 0 && (
                  <div className="mb-4 flex gap-2 flex-wrap">
                    <button
                      onClick={() => setReviewFilter('all')}
                      className={`px-3 py-1 text-sm rounded-lg transition font-light ${
                        reviewFilter === 'all'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      Tümü
                    </button>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setReviewFilter(rating as any)}
                        className={`px-3 py-1 text-sm rounded-lg transition font-light flex items-center gap-1 ${
                          reviewFilter === rating
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        {rating}
                      </button>
                    ))}
                  </div>
                )}

                {filteredReviews.length === 0 ? (
                  <div className="text-center py-8">
                    <Star size={48} className="text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 font-light mb-2">
                      {reviews.length === 0 ? 'Henüz yorum yapılmamış' : 'Bu filtreye uygun yorum bulunamadı'}
                    </p>
                    {isAuthenticated && reviews.length === 0 && (
                      <Link
                        href={`/clinics/${params.id}/review`}
                        className="inline-block mt-4 px-4 py-2 text-sm bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition font-light"
                      >
                        İlk Yorumu Siz Yapın
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredReviews
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((review) => (
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
                            <span className="text-xs text-slate-500 font-light">{formatDate(review.createdAt)}</span>
                          </div>
                          <p className="text-sm text-slate-400 font-light mt-2">{review.comment}</p>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Certificates & Awards */}
              {((clinic.certificates && clinic.certificates.length > 0) || (clinic.awards && clinic.awards.length > 0)) && (
                <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                  <h2 className="text-xl font-light mb-4 flex items-center gap-2">
                    <Award size={24} className="text-blue-400" />
                    Sertifikalar ve Ödüller
                  </h2>
                  <div className="space-y-4">
                    {clinic.certificates && clinic.certificates.length > 0 && (
                      <div>
                        <h3 className="text-sm font-light text-slate-400 mb-3">Sertifikalar</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {clinic.certificates.map((cert: any, index: number) => (
                            <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                              <div className="font-light text-slate-300 mb-1">{cert.name}</div>
                              <div className="text-xs text-slate-400 font-light mb-1">{cert.issuer}</div>
                              <div className="text-xs text-slate-500 font-light">{cert.date}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {clinic.awards && clinic.awards.length > 0 && (
                      <div>
                        <h3 className="text-sm font-light text-slate-400 mb-3">Ödüller</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {clinic.awards.map((award: any, index: number) => (
                            <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                              <div className="font-light text-slate-300 mb-1">{award.name}</div>
                              <div className="text-xs text-slate-400 font-light mb-1">{award.year}</div>
                              {award.description && (
                                <div className="text-xs text-slate-500 font-light">{award.description}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Videos */}
              {clinic.videos && clinic.videos.length > 0 && (
                <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                  <h2 className="text-xl font-light mb-4 flex items-center gap-2">
                    <Video size={24} className="text-blue-400" />
                    Videolar
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clinic.videos.map((video: any, index: number) => {
                      let embedUrl = '';
                      if (video.type === 'youtube') {
                        const videoId = video.url.includes('youtu.be/') 
                          ? video.url.split('youtu.be/')[1]?.split('?')[0]
                          : video.url.split('v=')[1]?.split('&')[0];
                        embedUrl = `https://www.youtube.com/embed/${videoId}`;
                      } else if (video.type === 'vimeo') {
                        const videoId = video.url.split('vimeo.com/')[1]?.split('?')[0];
                        embedUrl = `https://player.vimeo.com/video/${videoId}`;
                      } else {
                        embedUrl = video.url;
                      }

                      return (
                        <div key={index} className="aspect-video bg-slate-800/50 rounded-lg overflow-hidden">
                          <iframe
                            width="100%"
                            height="100%"
                            src={embedUrl}
                            title={video.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Blog/Articles - Placeholder for future implementation */}
              {/* This would require a blog system to be implemented */}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Statistics */}
              {statistics && (
                <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-light mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-400" />
                    İstatistikler
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-light text-sm">Toplam Randevu</span>
                      <span className="text-slate-300 font-light">{statistics.total}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-light text-sm">Bugünkü Randevu</span>
                      <span className="text-slate-300 font-light">{statistics.today}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-light text-sm">Bekleyen</span>
                      <span className="text-yellow-400 font-light">{statistics.pending}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-light text-sm">Onaylanan</span>
                      <span className="text-green-400 font-light">{statistics.confirmed}</span>
                    </div>
                    {statistics.totalRevenue > 0 && (
                      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                        <span className="text-slate-400 font-light text-sm">Toplam Gelir</span>
                        <span className="text-cyan-400 font-light">{statistics.totalRevenue.toFixed(0)} ₺</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Working Hours */}
              {clinic.workingHours && clinic.workingHours.length > 0 && (
                <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-light mb-4 flex items-center gap-2">
                    <ClockIcon size={20} className="text-blue-400" />
                    Çalışma Saatleri
                  </h3>
                  {getTodaySchedule(clinic.workingHours) && (
                    <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="text-xs text-slate-400 font-light mb-1">Bugün</div>
                      {getTodaySchedule(clinic.workingHours)!.closed ? (
                        <div className="text-red-400 font-light">Kapalı</div>
                      ) : (
                        <div className="text-green-400 font-light">
                          {getTodaySchedule(clinic.workingHours)!.open} - {getTodaySchedule(clinic.workingHours)!.close}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="space-y-2">
                    {clinic.workingHours.map((schedule, index) => {
                      const now = new Date();
                      const dayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
                      const isToday = index === dayIndex;
                      
                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between text-sm ${
                            isToday ? 'text-blue-400 font-medium' : 'text-slate-300 font-light'
                          }`}
                        >
                          <span>{schedule.day}{isToday && ' (Bugün)'}</span>
                          {schedule.closed ? (
                            <span className="text-slate-500 font-light">Kapalı</span>
                          ) : (
                            <span className="text-slate-400 font-light">
                              {schedule.open} - {schedule.close}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Map */}
              <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-light mb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-blue-400" />
                  Konum
                </h3>
                <div className="aspect-video bg-slate-800/50 rounded-lg mb-3 overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBFw0Qbyq9zTFTd-tUY6d-s6V4pcZaLjys'}&q=${encodeURIComponent(`${clinic.address}, ${clinic.district}, ${clinic.city}`)}`}
                  ></iframe>
                </div>
                <div className="flex gap-2">
                  <a
                    href={getGoogleMapsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2.5 border border-slate-600/50 hover:border-blue-400/50 hover:text-blue-400 rounded-lg font-light transition text-center text-sm flex items-center justify-center gap-2"
                  >
                    <NavigationIcon size={16} />
                    Yol Tarifi
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${clinic.address}, ${clinic.district}, ${clinic.city}`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="px-4 py-2.5 border border-slate-600/50 hover:border-blue-400/50 hover:text-blue-400 rounded-lg font-light transition text-sm"
                    title="Adresi Kopyala"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
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
                  {clinic.whatsappNumber && (
                    <button
                      onClick={handleWhatsApp}
                      className="w-full px-4 py-2.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg font-light transition text-center flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={18} />
                      WhatsApp
                    </button>
                  )}
                  <a
                    href={`tel:${clinic.phone}`}
                    className="block w-full px-4 py-2.5 border border-slate-600/50 hover:border-blue-400/50 hover:text-blue-400 rounded-lg font-light transition text-center"
                  >
                    Ara
                  </a>
                  <a
                    href={`mailto:${clinic.email}`}
                    className="block w-full px-4 py-2.5 border border-slate-600/50 hover:border-blue-400/50 hover:text-blue-400 rounded-lg font-light transition text-center"
                  >
                    E-posta Gönder
                  </a>
                </div>
              </div>

              {/* Social Media */}
              {clinic.socialMedia && (clinic.socialMedia.instagram || clinic.socialMedia.facebook || clinic.socialMedia.linkedin || clinic.socialMedia.twitter) && (
                <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-light mb-4">Sosyal Medya</h3>
                  <div className="flex gap-3">
                    {clinic.socialMedia.instagram && (
                      <a
                        href={clinic.socialMedia.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 rounded-lg transition"
                        title="Instagram"
                      >
                        <Instagram size={20} className="text-purple-400" />
                      </a>
                    )}
                    {clinic.socialMedia.facebook && (
                      <a
                        href={clinic.socialMedia.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition"
                        title="Facebook"
                      >
                        <Facebook size={20} className="text-blue-400" />
                      </a>
                    )}
                    {clinic.socialMedia.linkedin && (
                      <a
                        href={clinic.socialMedia.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 rounded-lg transition"
                        title="LinkedIn"
                      >
                        <Linkedin size={20} className="text-blue-500" />
                      </a>
                    )}
                    {clinic.socialMedia.twitter && (
                      <a
                        href={clinic.socialMedia.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 rounded-lg transition"
                        title="Twitter"
                      >
                        <Twitter size={20} className="text-sky-400" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Methods */}
              {clinic.paymentMethods && clinic.paymentMethods.length > 0 && (
                <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-light mb-4 flex items-center gap-2">
                    <CreditCard size={20} className="text-blue-400" />
                    Ödeme Yöntemleri
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {clinic.paymentMethods.map((method: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-slate-700/50 rounded-lg text-sm text-slate-300 font-light"
                      >
                        {method === 'nakit' ? 'Nakit' : method === 'kredi-karti' ? 'Kredi Kartı' : method === 'taksit' ? 'Taksit' : method === 'havale' ? 'Havale' : method}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Accepted Insurances */}
              {clinic.acceptedInsurances && clinic.acceptedInsurances.length > 0 && (
                <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-light mb-4">Kabul Edilen Sigortalar</h3>
                  <div className="flex flex-wrap gap-2">
                    {clinic.acceptedInsurances.map((insurance: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm font-light"
                      >
                        {insurance}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              {(clinic.parkingInfo || clinic.accessibility) && (
                <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-light mb-4">Ek Bilgiler</h3>
                  <div className="space-y-3">
                    {clinic.parkingInfo && (
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Car size={16} className="text-slate-400" />
                        <span className="font-light">{clinic.parkingInfo}</span>
                      </div>
                    )}
                    {clinic.accessibility && (
                      <div className="space-y-2">
                        {clinic.accessibility.wheelchairAccessible && (
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <User size={16} className="text-slate-400" />
                            <span className="font-light">Tekerlekli sandalye erişimi</span>
                          </div>
                        )}
                        {clinic.accessibility.elevator && (
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Info size={16} className="text-slate-400" />
                            <span className="font-light">Asansör mevcut</span>
                          </div>
                        )}
                        {clinic.accessibility.wifi && (
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Wifi size={16} className="text-slate-400" />
                            <span className="font-light">Ücretsiz Wi-Fi</span>
                          </div>
                        )}
                        {clinic.accessibility.waitingArea && (
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Users size={16} className="text-slate-400" />
                            <span className="font-light">Bekleme alanı</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              {clinic.emergencyPhone && (
                <div className="bg-slate-800/30 backdrop-blur border border-red-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-light mb-2 flex items-center gap-2 text-red-400">
                    <AlertCircle size={20} />
                    Acil Durum
                  </h3>
                  <p className="text-sm text-slate-400 font-light mb-3">
                    {clinic.emergencyContact || 'Acil durumlar için'}
                  </p>
                  <a
                    href={`tel:${clinic.emergencyPhone}`}
                    className="block w-full px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg font-light transition text-center"
                  >
                    {clinic.emergencyPhone}
                  </a>
                </div>
              )}

              {/* Nearby Clinics */}
              {nearbyClinics.length > 0 && (
                <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-light mb-4">Yakındaki Klinikler</h3>
                  <div className="space-y-3">
                    {nearbyClinics.map((nearbyClinic) => (
                      <Link
                        key={nearbyClinic.id}
                        href={`/clinics/${nearbyClinic.id}`}
                        className="block p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition border border-slate-700/50 hover:border-blue-400/50"
                      >
                        <div className="font-light text-slate-300 mb-1">{nearbyClinic.clinicName}</div>
                        <div className="text-xs text-slate-400 font-light">{nearbyClinic.district}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 mt-12">
          <Footer />
        </div>
      </div>

      {/* Mobile Sticky Button */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 p-4 bg-slate-950/95 backdrop-blur border-t border-slate-700/50">
        <button
          onClick={handleBookAppointment}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition flex items-center justify-center gap-2"
        >
          <Calendar size={20} />
          Randevu Al
        </button>
      </div>
    </div>
  );
}

