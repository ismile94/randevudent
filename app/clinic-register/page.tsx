"use client";
import { useState } from 'react';
import { 
  Building2, 
  User, 
  FileText, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Shield,
  Clock,
  Info
} from 'lucide-react';

interface FormData {
  // Adım 1: Temel Bilgiler
  clinicName: string;
  taxNumber: string;
  tradeRegistryNumber: string;
  phone: string;
  email: string;
  website: string;
  
  // Adım 2: Adres Bilgileri
  address: string;
  district: string;
  city: string;
  postalCode: string;
  
  // Adım 3: Yetkili Kişi
  authorizedPersonName: string;
  authorizedPersonTC: string;
  authorizedPersonPhone: string;
  authorizedPersonEmail: string;
  authorizedPersonTitle: string;
  
  // Adım 4: Yasal Belgeler
  tradeRegistryDocument: File | null;
  taxPlateDocument: File | null;
  businessLicenseDocument: File | null;
  healthMinistryLicenseDocument: File | null;
  sgkDocument: File | null;
  chamberRegistrationDocument: File | null;
  addressProofDocument: File | null;
  identityDocument: File | null;
  
  // Adım 5: Çalışma Bilgileri
  workingHours: {
    day: string;
    open: string;
    close: string;
    closed: boolean;
  }[];
  services: string[];
  specialties: string[];
  description: string;
}

const initialFormData: FormData = {
  clinicName: '',
  taxNumber: '',
  tradeRegistryNumber: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  district: '',
  city: '',
  postalCode: '',
  authorizedPersonName: '',
  authorizedPersonTC: '',
  authorizedPersonPhone: '',
  authorizedPersonEmail: '',
  authorizedPersonTitle: '',
  tradeRegistryDocument: null,
  taxPlateDocument: null,
  businessLicenseDocument: null,
  healthMinistryLicenseDocument: null,
  sgkDocument: null,
  chamberRegistrationDocument: null,
  addressProofDocument: null,
  identityDocument: null,
  workingHours: [
    { day: 'Pazartesi', open: '09:00', close: '18:00', closed: false },
    { day: 'Salı', open: '09:00', close: '18:00', closed: false },
    { day: 'Çarşamba', open: '09:00', close: '18:00', closed: false },
    { day: 'Perşembe', open: '09:00', close: '18:00', closed: false },
    { day: 'Cuma', open: '09:00', close: '18:00', closed: false },
    { day: 'Cumartesi', open: '09:00', close: '18:00', closed: false },
    { day: 'Pazar', open: '09:00', close: '18:00', closed: true },
  ],
  services: [],
  specialties: [],
  description: '',
};

// Resmi Diş Hekimliği Uzmanlık Alanları (Sağlık Bakanlığı)
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

// Tedavi / İşlem Alt Alanları (Hizmetler)
const serviceOptions = [
  // Koruyucu Tedaviler
  { 
    name: 'Diş Taşı Temizliği (Detartraj)', 
    category: 'Koruyucu Tedaviler',
    description: 'Diş yüzeylerinde biriken plak ve diş taşlarının profesyonel olarak temizlenmesi işlemidir. Düzenli yapıldığında diş eti hastalıklarını önler ve ağız sağlığını korur.'
  },
  { 
    name: 'Subgingival Derin Temizlik (Küretaj)', 
    category: 'Koruyucu Tedaviler',
    description: 'Diş eti çizgisinin altındaki plak ve diş taşlarının temizlenmesi işlemidir. Periodontal hastalıkların tedavisinde kullanılır ve diş eti sağlığının korunmasını sağlar.'
  },
  { 
    name: 'Flor & Fissür Örtücü', 
    category: 'Koruyucu Tedaviler',
    description: 'Çocuklarda ve yetişkinlerde diş çürüklerini önlemek için uygulanan koruyucu tedavilerdir. Flor uygulaması diş minesini güçlendirir, fissür örtücü ise çürüğe yatkın olukları kapatır.'
  },
  { 
    name: 'Koruyucu Plaklar', 
    category: 'Koruyucu Tedaviler',
    description: 'Diş sıkma, gıcırdatma veya spor aktivitelerinde dişleri korumak için kullanılan kişiye özel hazırlanan plaklardır. Dişlerin aşınmasını ve travmaları önler.'
  },
  // Dolgu ve Restorasyonlar
  { 
    name: 'Kompozit Dolgu', 
    category: 'Dolgu ve Restorasyonlar',
    description: 'Diş renginde estetik dolgu malzemesi ile yapılan restorasyonlardır. Çürük temizlendikten sonra dişin doğal görünümüne uygun şekilde doldurulur.'
  },
  { 
    name: 'Seramik Inlay–Onlay', 
    category: 'Dolgu ve Restorasyonlar',
    description: 'Diş renginde seramik malzemeden laboratuvarda hazırlanan, dişe yapıştırılan estetik restorasyonlardır. Daha büyük çürüklerde ve aşınmış dişlerde kullanılır.'
  },
  { 
    name: 'Bonding Estetik Dolgu', 
    category: 'Dolgu ve Restorasyonlar',
    description: 'Diş renginde kompozit malzeme kullanılarak yapılan estetik dolgu işlemidir. Kırık, çatlak veya şekil bozukluklarını düzeltmek için kullanılır.'
  },
  { 
    name: 'Kırık Diş Onarımı', 
    category: 'Dolgu ve Restorasyonlar',
    description: 'Travma veya kaza sonucu kırılan dişlerin estetik ve fonksiyonel olarak onarılması işlemidir. Kompozit veya seramik restorasyonlarla yapılır.'
  },
  // Kanal Tedavileri
  { 
    name: 'Tek Kök / Çok Kök Kanal', 
    category: 'Kanal Tedavileri',
    description: 'Dişin pulpa (sinir) dokusunun iltihaplanması veya enfeksiyon durumunda uygulanan tedavidir. Dişin kurtarılması ve ağrının giderilmesi için yapılır.'
  },
  { 
    name: 'Kökte Kırık Yönetimi', 
    category: 'Kanal Tedavileri',
    description: 'Diş kökünde oluşan kırıkların teşhisi ve tedavi seçeneklerinin değerlendirilmesidir. Erken teşhis ile dişin kurtarılması mümkün olabilir.'
  },
  { 
    name: 'Kanal Yenileme (Retreatment)', 
    category: 'Kanal Tedavileri',
    description: 'Daha önce yapılmış kanal tedavisinin başarısız olması durumunda, kök kanallarının yeniden temizlenip doldurulması işlemidir.'
  },
  { 
    name: 'Mikroskop Destekli Kanal', 
    category: 'Kanal Tedavileri',
    description: 'Mikroskop kullanılarak yapılan ileri düzey kanal tedavisidir. Komplike vakalarda daha yüksek başarı oranı sağlar ve dişin kurtarılma şansını artırır.'
  },
  // Cerrahi İşlemler
  { 
    name: 'Basit / Komplike Diş Çekimi', 
    category: 'Cerrahi İşlemler',
    description: 'Çürük, enfeksiyon veya travma nedeniyle kurtarılamayan dişlerin çıkarılması işlemidir. Basit çekimler normal dişlerde, komplike çekimler ise gömülü veya kırık dişlerde uygulanır.'
  },
  { 
    name: 'Gömülü 20\'lik Çekimi', 
    category: 'Cerrahi İşlemler',
    description: 'Ağızda yer bulamayan veya yanlış pozisyonda olan yirmi yaş dişlerinin cerrahi olarak çıkarılması işlemidir. Ağrı, enfeksiyon ve komşu dişlere zarar vermeyi önler.'
  },
  { 
    name: 'Çene Kist/Tümör Operasyonları', 
    category: 'Cerrahi İşlemler',
    description: 'Çene kemiğinde oluşan kist veya tümörlerin cerrahi olarak çıkarılması işlemidir. Erken teşhis ve tedavi önemlidir.'
  },
  { 
    name: 'Sinüs Lifting, Greft, Membran', 
    category: 'Cerrahi İşlemler',
    description: 'İmplant yerleştirilmeden önce üst çene sinüs bölgesinde kemik yetersizliği durumunda uygulanan kemik artırma işlemleridir. İmplant başarısını artırır.'
  },
  // İmplant Tedavileri
  { 
    name: 'Tek İmplant', 
    category: 'İmplant Tedavileri',
    description: 'Tek diş eksikliğinde uygulanan, titanyum vida ile yapılan diş kökü replasmanıdır. Komşu dişlere zarar vermeden doğal görünümlü diş restorasyonu sağlar.'
  },
  { 
    name: 'İmplant Üstü Kron/Bridge', 
    category: 'İmplant Tedavileri',
    description: 'İmplant üzerine yerleştirilen sabit diş protezleridir. Tek veya birden fazla diş eksikliğinde kullanılır ve doğal diş görünümü sağlar.'
  },
  { 
    name: 'All-on-4 / All-on-6 Sabit Protez', 
    category: 'İmplant Tedavileri',
    description: 'Tüm dişsiz çenelerde 4 veya 6 implant ile sabit protez yapılması işlemidir. Hızlı ve etkili bir çözüm sunar, takıp çıkarılan protezlere alternatiftir.'
  },
  { 
    name: 'Kemik Artırma (GBR – Greftleme)', 
    category: 'İmplant Tedavileri',
    description: 'İmplant yerleştirilmeden önce yetersiz kemik dokusunun artırılması işlemidir. Kemik grefti ve membran kullanılarak yeni kemik oluşumu sağlanır.'
  },
  // Protez / Kaplama
  { 
    name: 'Zirkonyum Kron/Bridge', 
    category: 'Protez / Kaplama',
    description: 'Dayanıklı ve estetik zirkonyum seramik malzemeden yapılan diş kaplamalarıdır. Metal desteksiz, doğal diş renginde ve uzun ömürlü restorasyonlardır.'
  },
  { 
    name: 'E-max Porselen / Laminate Veneer', 
    category: 'Protez / Kaplama',
    description: 'Ön dişlerde estetik amaçlı kullanılan ince porselen yapraklardır. Diş rengini açma, şekil düzeltme ve gülüş tasarımı için idealdir.'
  },
  { 
    name: 'Tam/Parsiyel Protez', 
    category: 'Protez / Kaplama',
    description: 'Tüm dişlerin veya bir kısmının eksik olduğu durumlarda kullanılan takıp çıkarılabilir protezlerdir. Fonksiyon ve estetik sağlar.'
  },
  { 
    name: 'İmplant Üstü Hibrit Protez', 
    category: 'Protez / Kaplama',
    description: 'İmplantlar üzerine yerleştirilen sabit veya çıkarılabilir hibrit protezlerdir. Tam dişsizlik durumlarında güvenli ve konforlu çözüm sunar.'
  },
  // Ortodonti
  { 
    name: 'Metal–Seramik Teller', 
    category: 'Ortodonti',
    description: 'Diş ve çene düzensizliklerini düzeltmek için kullanılan geleneksel ortodontik tedavi yöntemidir. Hem çocuklarda hem yetişkinlerde etkili sonuçlar verir.'
  },
  { 
    name: 'Şeffaf Plak/Invisalign', 
    category: 'Ortodonti',
    description: 'Görünmez, çıkarılabilir şeffaf plaklarla yapılan ortodontik tedavidir. Estetik ve konforlu bir alternatif sunar, yemek yerken çıkarılabilir.'
  },
  { 
    name: 'Çocuk Ortodontisi', 
    category: 'Ortodonti',
    description: 'Çocuklarda erken yaşta başlayan ortodontik tedavilerdir. Çene gelişimini yönlendirir ve ileride oluşabilecek problemleri önler.'
  },
  { 
    name: 'Çene Genişletme Apareyleri', 
    category: 'Ortodonti',
    description: 'Dar çeneleri genişletmek için kullanılan özel apareylerdir. Çocuklarda büyüme döneminde uygulanır ve dişlerin düzgün sıralanmasını sağlar.'
  },
  // Estetik İşlemler
  { 
    name: 'Hollywood Smile', 
    category: 'Estetik İşlemler',
    description: 'Tüm ön dişlerin porselen laminate veneer veya kronlarla estetik olarak yeniden tasarlandığı kapsamlı gülüş tasarımı işlemidir.'
  },
  { 
    name: 'Diş Beyazlatma (Ofis–Ev Tipi)', 
    category: 'Estetik İşlemler',
    description: 'Dişlerin rengini açmak için uygulanan profesyonel beyazlatma işlemleridir. Ofiste tek seanslık veya evde kullanılan plaklarla yapılabilir.'
  },
  { 
    name: 'Diş Eti Şekillendirme (Gingivoplasti)', 
    category: 'Estetik İşlemler',
    description: 'Diş eti konturlarının düzenlenmesi ve estetik görünümün iyileştirilmesi işlemidir. Gummy smile ve düzensiz diş eti çizgilerini düzeltir.'
  },
  { 
    name: 'Gummy Smile Botoks / Lazer', 
    category: 'Estetik İşlemler',
    description: 'Gülümseme sırasında fazla diş eti görünmesini azaltmak için uygulanan botoks veya lazer işlemleridir. Estetik gülüş elde edilmesini sağlar.'
  },
  // Çocuk Tedavileri
  { 
    name: 'Çocuk Dolguları', 
    category: 'Çocuk Tedavileri',
    description: 'Süt dişlerinde oluşan çürüklerin tedavisi için yapılan özel dolgulardır. Çocuklara uygun malzeme ve tekniklerle yapılır.'
  },
  { 
    name: 'Çocuk Kanal Tedavisi (Pulpotomi/Pulpektomi)', 
    category: 'Çocuk Tedavileri',
    description: 'Süt dişlerinde ilerlemiş çürüklerde uygulanan kanal tedavisi işlemleridir. Dişin korunması ve erken kaybının önlenmesi için yapılır.'
  },
  { 
    name: 'Çocuk Protezleri', 
    category: 'Çocuk Tedavileri',
    description: 'Erken diş kaybı durumunda çocuklara uygulanan özel protezlerdir. Çene gelişimini korur ve estetik sağlar.'
  },
  { 
    name: 'Sedasyon / Genel Anestezi', 
    category: 'Çocuk Tedavileri',
    description: 'Tedavi korkusu olan veya çok sayıda işlem gereken çocuklarda uygulanan sedasyon veya genel anestezi altında tedavi yöntemleridir.'
  },
];

export default function ClinicRegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 5;

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.clinicName.trim()) newErrors.clinicName = 'Klinik adı zorunludur';
      if (!formData.taxNumber.trim()) newErrors.taxNumber = 'Vergi numarası zorunludur';
      if (!/^\d{10}$/.test(formData.taxNumber)) newErrors.taxNumber = 'Vergi numarası 10 haneli olmalıdır';
      if (!formData.tradeRegistryNumber.trim()) newErrors.tradeRegistryNumber = 'Ticaret sicil numarası zorunludur';
      if (!formData.phone.trim()) newErrors.phone = 'Telefon zorunludur';
      if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) newErrors.phone = 'Geçerli bir telefon numarası giriniz';
      if (!formData.email.trim()) newErrors.email = 'E-posta zorunludur';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    if (step === 2) {
      if (!formData.address.trim()) newErrors.address = 'Adres zorunludur';
      if (!formData.district.trim()) newErrors.district = 'İlçe zorunludur';
      if (!formData.city.trim()) newErrors.city = 'Şehir zorunludur';
      if (!formData.postalCode.trim()) newErrors.postalCode = 'Posta kodu zorunludur';
    }

    if (step === 3) {
      if (!formData.authorizedPersonName.trim()) newErrors.authorizedPersonName = 'Yetkili kişi adı zorunludur';
      if (!formData.authorizedPersonTC.trim()) newErrors.authorizedPersonTC = 'T.C. Kimlik No zorunludur';
      if (!/^\d{11}$/.test(formData.authorizedPersonTC)) newErrors.authorizedPersonTC = 'T.C. Kimlik No 11 haneli olmalıdır';
      if (!formData.authorizedPersonPhone.trim()) newErrors.authorizedPersonPhone = 'Telefon zorunludur';
      if (!formData.authorizedPersonEmail.trim()) newErrors.authorizedPersonEmail = 'E-posta zorunludur';
      if (!formData.authorizedPersonTitle.trim()) newErrors.authorizedPersonTitle = 'Ünvan zorunludur';
    }

    if (step === 4) {
      if (!formData.tradeRegistryDocument) newErrors.tradeRegistryDocument = 'Ticaret sicil belgesi zorunludur';
      if (!formData.taxPlateDocument) newErrors.taxPlateDocument = 'Vergi levhası zorunludur';
      if (!formData.businessLicenseDocument) newErrors.businessLicenseDocument = 'İşyeri ruhsatı zorunludur';
      if (!formData.healthMinistryLicenseDocument) newErrors.healthMinistryLicenseDocument = 'Sağlık Bakanlığı ruhsatı zorunludur';
      if (!formData.identityDocument) newErrors.identityDocument = 'Kimlik belgesi zorunludur';
      if (!formData.addressProofDocument) newErrors.addressProofDocument = 'Adres belgesi zorunludur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileChange = (field: keyof FormData, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    // TODO: API call to submit form
    console.log('Form submitted:', formData);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Başvurunuz alındı! Belgeleriniz incelendikten sonra size dönüş yapılacaktır.');
    }, 2000);
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const SpecialtyTooltip = ({ 
    specialty, 
    checked, 
    onChange 
  }: { 
    specialty: { name: string; description: string }; 
    checked: boolean; 
    onChange: (checked: boolean) => void;
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
        <label 
          className="flex items-center gap-2 cursor-pointer p-3 border border-slate-600/50 rounded-lg hover:border-blue-400/50 transition bg-slate-800/30 group"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm font-light text-slate-300 flex-1">{specialty.name}</span>
          <Info size={14} className="text-slate-500 group-hover:text-blue-400 transition" />
        </label>
        {showTooltip && (
          <div className="absolute left-full top-0 ml-3 z-[9999] px-3 py-2 bg-slate-800/95 backdrop-blur border border-blue-500/50 rounded-lg shadow-lg w-64 pointer-events-none">
            <p className="text-xs font-light text-slate-300 leading-relaxed">
              {specialty.description}
            </p>
            <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-blue-500/50"></div>
          </div>
        )}
      </div>
    );
  };

  const ServiceTooltip = ({ 
    service, 
    checked, 
    onChange 
  }: { 
    service: string; 
    checked: boolean; 
    onChange: (checked: boolean) => void;
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
        <label 
          className="flex items-center gap-2 cursor-pointer p-3 border border-slate-600/50 rounded-lg hover:border-blue-400/50 transition bg-slate-800/30 group"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm font-light text-slate-300 flex-1">{service}</span>
          <Info size={14} className="text-slate-500 group-hover:text-blue-400 transition" />
        </label>
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

  const FileUploadField = ({ 
    field, 
    label, 
    required, 
    description 
  }: { 
    field: keyof FormData; 
    label: string; 
    required?: boolean;
    description?: string;
  }) => {
    const file = formData[field] as File | null;
    return (
      <div className="space-y-2">
        <label className="block text-sm font-light text-slate-300">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        {description && (
          <p className="text-xs text-slate-400 font-light">{description}</p>
        )}
        <div className="relative">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFileChange(field, e.target.files?.[0] || null)}
            className="hidden"
            id={field}
          />
          <label
            htmlFor={field}
            className="flex items-center gap-3 p-4 border border-slate-600/50 rounded-lg cursor-pointer hover:border-blue-400/50 transition bg-slate-800/30"
          >
            <Upload size={20} className="text-slate-400" />
            <div className="flex-1">
              {file ? (
                <span className="text-sm text-blue-400">{file.name}</span>
              ) : (
                <span className="text-sm text-slate-400">Dosya seçin (PDF, JPG, PNG)</span>
              )}
            </div>
            {file && <CheckCircle2 size={18} className="text-green-400" />}
          </label>
        </div>
        {errors[field] && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <AlertCircle size={12} />
            {errors[field]}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <Shield className="text-blue-400" size={32} />
            <h1 className="text-3xl md:text-4xl font-light">Klinik Kayıt Formu</h1>
          </div>
          <p className="text-slate-400 font-light">
            Güvenli ve doğrulanmış klinik kaydı için lütfen tüm bilgileri eksiksiz doldurun
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 text-center">
          <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 md:p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 md:gap-4">
              {[...Array(totalSteps)].map((_, i) => (
                <div key={i} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-light transition ${
                      i + 1 < currentStep
                        ? 'bg-blue-500 text-white'
                        : i + 1 === currentStep
                        ? 'bg-blue-500/50 text-blue-300 border-2 border-blue-400'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {i + 1 < currentStep ? <CheckCircle2 size={16} /> : i + 1}
                  </div>
                  {i < totalSteps - 1 && (
                    <div
                      className={`h-0.5 w-12 md:w-16 mx-2 transition ${
                        i + 1 < currentStep ? 'bg-blue-500' : 'bg-slate-700'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 md:p-8">
          {/* Step 1: Temel Bilgiler */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <Building2 className="text-blue-400" size={24} />
                <h2 className="text-xl font-light">Temel Bilgiler</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Klinik Adı <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.clinicName}
                    onChange={(e) => updateFormData('clinicName', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                    placeholder="Örn: Ağız ve Diş Sağlığı Merkezi"
                  />
                  {errors.clinicName && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.clinicName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Vergi Numarası (VKN) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.taxNumber}
                    onChange={(e) => updateFormData('taxNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                    placeholder="10 haneli vergi numarası"
                    maxLength={10}
                  />
                  {errors.taxNumber && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.taxNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Ticaret Sicil Numarası <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.tradeRegistryNumber}
                    onChange={(e) => updateFormData('tradeRegistryNumber', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                    placeholder="Ticaret sicil numarası"
                  />
                  {errors.tradeRegistryNumber && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.tradeRegistryNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Telefon <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                    placeholder="0XXX XXX XX XX"
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    E-posta <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                    placeholder="klinik@example.com"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Web Sitesi (Opsiyonel)
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => updateFormData('website', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                    placeholder="https://www.example.com"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Adres Bilgileri */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="text-blue-400" size={24} />
                <h2 className="text-xl font-light">Adres Bilgileri</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Adres <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => updateFormData('address', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light resize-none"
                    placeholder="Mahalle, sokak, bina no, daire no"
                  />
                  {errors.address && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.address}
                    </p>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-light text-slate-300 mb-2">
                      İlçe <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.district}
                      onChange={(e) => updateFormData('district', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                      placeholder="İlçe"
                    />
                    {errors.district && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.district}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-light text-slate-300 mb-2">
                      Şehir <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => updateFormData('city', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                      placeholder="Şehir"
                    />
                    {errors.city && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.city}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-light text-slate-300 mb-2">
                      Posta Kodu <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => updateFormData('postalCode', e.target.value.replace(/\D/g, '').slice(0, 5))}
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                      placeholder="34000"
                      maxLength={5}
                    />
                    {errors.postalCode && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.postalCode}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Yetkili Kişi */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="text-blue-400" size={24} />
                <h2 className="text-xl font-light">Yetkili Kişi Bilgileri</h2>
              </div>

              <div className="bg-slate-800/20 border border-slate-700/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-slate-400 font-light">
                  Klinik adına işlem yapabilecek yetkili kişinin bilgilerini giriniz. Bu kişi T.C. Kimlik No ile doğrulanacaktır.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Ad Soyad <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.authorizedPersonName}
                    onChange={(e) => updateFormData('authorizedPersonName', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                    placeholder="Ad Soyad"
                  />
                  {errors.authorizedPersonName && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.authorizedPersonName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    T.C. Kimlik No <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.authorizedPersonTC}
                    onChange={(e) => updateFormData('authorizedPersonTC', e.target.value.replace(/\D/g, '').slice(0, 11))}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                    placeholder="11 haneli T.C. Kimlik No"
                    maxLength={11}
                  />
                  {errors.authorizedPersonTC && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.authorizedPersonTC}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Ünvan <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.authorizedPersonTitle}
                    onChange={(e) => updateFormData('authorizedPersonTitle', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                    placeholder="Örn: Klinik Müdürü, Sahibi"
                  />
                  {errors.authorizedPersonTitle && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.authorizedPersonTitle}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Telefon <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.authorizedPersonPhone}
                    onChange={(e) => updateFormData('authorizedPersonPhone', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                    placeholder="0XXX XXX XX XX"
                  />
                  {errors.authorizedPersonPhone && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.authorizedPersonPhone}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    E-posta <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.authorizedPersonEmail}
                    onChange={(e) => updateFormData('authorizedPersonEmail', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                    placeholder="yetkili@example.com"
                  />
                  {errors.authorizedPersonEmail && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.authorizedPersonEmail}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Yasal Belgeler */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="text-blue-400" size={24} />
                <h2 className="text-xl font-light">Yasal Belgeler</h2>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-300 font-light flex items-start gap-2">
                  <Shield size={16} className="mt-0.5 flex-shrink-0" />
                  <span>
                    Tüm belgeler PDF, JPG veya PNG formatında olmalıdır. Belgeleriniz güvenli bir şekilde saklanacak ve sadece doğrulama amaçlı kullanılacaktır.
                  </span>
                </p>
              </div>

              <div className="space-y-6">
                <FileUploadField
                  field="tradeRegistryDocument"
                  label="Ticaret Sicil Gazetesi / Ticaret Sicil Kaydı"
                  required
                  description="Ticaret Sicil Müdürlüğü'nden alınan belge"
                />

                <FileUploadField
                  field="taxPlateDocument"
                  label="Vergi Levhası"
                  required
                  description="Vergi Dairesi'nden alınan vergi levhası"
                />

                <FileUploadField
                  field="businessLicenseDocument"
                  label="İşyeri Açma ve Çalışma Ruhsatı"
                  required
                  description="Belediye'den alınan işyeri ruhsatı"
                />

                <FileUploadField
                  field="healthMinistryLicenseDocument"
                  label="Sağlık Bakanlığı İşletme Ruhsatı"
                  required
                  description="Sağlık Bakanlığı'ndan alınan işletme ruhsatı"
                />

                <FileUploadField
                  field="sgkDocument"
                  label="SGK İşyeri Sicil Belgesi (Opsiyonel)"
                  description="SGK'dan alınan işyeri sicil belgesi"
                />

                <FileUploadField
                  field="chamberRegistrationDocument"
                  label="Diş Hekimleri Odası Sicil Belgesi (Opsiyonel)"
                  description="İlgili Diş Hekimleri Odası'ndan alınan sicil belgesi"
                />

                <FileUploadField
                  field="addressProofDocument"
                  label="Adres Belgesi"
                  required
                  description="Elektrik, su, doğalgaz faturası veya kira kontratı"
                />

                <FileUploadField
                  field="identityDocument"
                  label="Yetkili Kişi Kimlik Belgesi"
                  required
                  description="Yetkili kişinin T.C. Kimlik kartı veya pasaport fotokopisi"
                />
              </div>
            </div>
          )}

          {/* Step 5: Çalışma Bilgileri */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="text-blue-400" size={24} />
                <h2 className="text-xl font-light">Çalışma Bilgileri</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-light text-slate-300 mb-4">
                    Çalışma Saatleri
                  </label>
                  <div className="space-y-3">
                    {formData.workingHours.map((day, index) => (
                      <div key={day.day} className="flex items-center gap-4">
                        <div className="w-24 text-sm font-light text-slate-300">{day.day}</div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!day.closed}
                            onChange={(e) => {
                              const newHours = [...formData.workingHours];
                              newHours[index].closed = !e.target.checked;
                              updateFormData('workingHours', newHours);
                            }}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-400">Açık</span>
                        </label>
                        {!day.closed && (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="time"
                              value={day.open}
                              onChange={(e) => {
                                const newHours = [...formData.workingHours];
                                newHours[index].open = e.target.value;
                                updateFormData('workingHours', newHours);
                              }}
                              className="px-3 py-1.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                              type="time"
                              value={day.close}
                              onChange={(e) => {
                                const newHours = [...formData.workingHours];
                                newHours[index].close = e.target.value;
                                updateFormData('workingHours', newHours);
                              }}
                              className="px-3 py-1.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                            />
                          </div>
                        )}
                        {day.closed && (
                          <span className="text-sm text-slate-500">Kapalı</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-light text-slate-300 mb-4">
                    Uzmanlık Alanları
                  </label>
                  <p className="text-xs text-slate-400 font-light mb-4">
                    Klinikte hizmet verilen diş hekimliği uzmanlık alanlarını seçin
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {specialtyOptions.map((specialty, index) => (
                      <SpecialtyTooltip
                        key={index}
                        specialty={specialty}
                        checked={formData.specialties.includes(specialty.name)}
                        onChange={(checked) => {
                          if (checked) {
                            updateFormData('specialties', [...formData.specialties, specialty.name]);
                          } else {
                            updateFormData('specialties', formData.specialties.filter(s => s !== specialty.name));
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-light text-slate-300 mb-4">
                    Sunulan Hizmetler
                  </label>
                  <div className="space-y-6">
                    {['Koruyucu Tedaviler', 'Dolgu ve Restorasyonlar', 'Kanal Tedavileri', 'Cerrahi İşlemler', 'İmplant Tedavileri', 'Protez / Kaplama', 'Ortodonti', 'Estetik İşlemler', 'Çocuk Tedavileri'].map((category) => {
                      const categoryServices = serviceOptions.filter(s => s.category === category);
                      if (categoryServices.length === 0) return null;
                      
                      return (
                        <div key={category}>
                          <h4 className="text-sm font-light text-blue-400 mb-3">{category}</h4>
                          <div className="grid md:grid-cols-2 gap-3">
                            {categoryServices.map((service, index) => (
                              <ServiceTooltip
                                key={index}
                                service={service.name}
                                checked={formData.services.includes(service.name)}
                                onChange={(checked: boolean) => {
                                  if (checked) {
                                    updateFormData('services', [...formData.services, service.name]);
                                  } else {
                                    updateFormData('services', formData.services.filter(s => s !== service.name));
                                  }
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Klinik Açıklaması (Opsiyonel)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light resize-none"
                    placeholder="Klinik hakkında kısa bir açıklama..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-700/50">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-2 border border-slate-600/50 rounded-lg font-light transition disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-400/50"
            >
              <ArrowLeft size={18} />
              Geri
            </button>

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition"
              >
                İleri
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Clock size={18} className="animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    Başvuruyu Gönder
                    <CheckCircle2 size={18} />
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-8 bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-light mb-4 flex items-center gap-2">
            <Shield className="text-blue-400" size={20} />
            Doğrulama Süreci
          </h3>
          <div className="space-y-3 text-sm text-slate-400 font-light">
            <p>• Belgeleriniz alındıktan sonra 2-5 iş günü içinde incelenecektir.</p>
            <p>• Tüm belgeler resmi kurumlardan doğrulanacaktır.</p>
            <p>• Doğrulama sonucu e-posta ile bildirilecektir.</p>
            <p>• Sahte belge tespit edilmesi durumunda başvuru reddedilecek ve yasal işlem başlatılacaktır.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

