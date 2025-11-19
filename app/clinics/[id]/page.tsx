"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import { isFavorited, toggleFavorite } from '@/lib/favorites';
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
  rating: 4.8,
  reviewCount: 127,
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
  doctors: [
    {
      id: '1',
      name: 'Dr. Ahmet Yılmaz',
      specialty: 'Ortodonti',
      services: ['Metal–Seramik Teller', 'Şeffaf Plak/Invisalign', 'Çocuk Ortodontisi'],
      rating: 4.9,
      reviewCount: 45,
    },
    {
      id: '2',
      name: 'Dr. Ayşe Demir',
      specialty: 'Estetik Diş Hekimliği / Gülüş Tasarımı',
      services: ['Hollywood Smile', 'Diş Beyazlatma (Ofis–Ev Tipi)', 'E-max Porselen / Laminate Veneer'],
      rating: 4.7,
      reviewCount: 38,
    },
    {
      id: '3',
      name: 'Dr. Mehmet Kaya',
      specialty: 'İmplantoloji',
      services: ['Tek İmplant', 'All-on-4 / All-on-6 Sabit Protez', 'Kemik Artırma (GBR – Greftleme)'],
      rating: 4.8,
      reviewCount: 52,
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

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      setIsAuthenticated(!!currentUser);
      if (currentUser) {
        setUser(currentUser);
        setFavorited(isFavorited(currentUser.id, mockClinic.id));
      }
    };
    checkAuth();
  }, []);

  const clinic = mockClinic; // Supabase'den gelecek

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
          {/* Back Button */}
          <Link
            href="/clinics"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition font-light mb-6"
          >
            <ArrowLeft size={16} />
            Kliniklere Dön
          </Link>

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

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Star size={20} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-lg font-light">{clinic.rating}</span>
                  </div>
                  <span className="text-slate-400 font-light">
                    ({clinic.reviewCount} yorum)
                  </span>
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

              <div className="flex-shrink-0 flex gap-3">
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

              {/* Doctors / Kadro */}
              {clinic.doctors && clinic.doctors.length > 0 && (
                <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                  <h2 className="text-xl font-light mb-4 flex items-center gap-2">
                    <User size={24} className="text-blue-400" />
                    Kadro
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {clinic.doctors.map((doctor) => (
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
                <h2 className="text-xl font-light mb-4">Yorumlar ({clinic.reviewCount})</h2>
                <div className="space-y-4">
                  {/* Mock reviews */}
                  {[
                    {
                      id: '1',
                      userName: 'Mehmet Y.',
                      rating: 5,
                      date: '2 hafta önce',
                      comment: 'Çok profesyonel bir klinik. Dr. Ahmet Yılmaz çok ilgili ve deneyimli. Ortodonti tedavim harika geçti.',
                    },
                    {
                      id: '2',
                      userName: 'Ayşe K.',
                      rating: 5,
                      date: '1 ay önce',
                      comment: 'Estetik diş hekimliği konusunda Dr. Ayşe Demir gerçekten çok başarılı. Hollywood Smile sonucu mükemmel oldu.',
                    },
                    {
                      id: '3',
                      userName: 'Ali M.',
                      rating: 4,
                      date: '2 ay önce',
                      comment: 'İmplant tedavim için Dr. Mehmet Kaya\'ya gittim. Çok memnun kaldım, süreç sorunsuz geçti.',
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
                  <ClockIcon size={20} className="text-blue-400" />
                  Çalışma Saatleri
                </h3>
                <div className="space-y-2">
                  {clinic.workingHours.map((schedule, index) => (
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

