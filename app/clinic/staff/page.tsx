"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ClinicNavigation from '@/components/ClinicNavigation';
import Footer from '@/components/Footer';
import { getCurrentClinicWithUUID } from '@/lib/utils/clinic-utils';
import { getClinicStaff, createStaff, updateStaff, deleteStaff } from '@/lib/services/staff-service';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  Plus,
} from 'lucide-react';
import ToastContainer, { showToast } from '@/components/Toast';

// Diş kliniğinde çalışabilecek meslek birimleri
// Not: Diş hekimliği uzmanlık alanları (Ortodontist, Periodontist vb.) burada değil, uzmanlık kısmında seçilir
const titleOptions = [
  'Diş Hekimi',
  'Diş Hekimi Asistanı',
  'Hemşire',
  'Sekreter',
  'Radyoloji Teknisyeni',
  'Sterilizasyon Sorumlusu',
  'Hasta Kabul Sorumlusu',
  'Muhasebeci',
  'Temizlik Personeli',
];

// Diş Hekimliği Uzmanlık Alanları
const specialtyOptions = [
  'Ağız, Diş ve Çene Cerrahisi',
  'Ortodonti',
  'Protetik Diş Tedavisi',
  'Endodonti (Kanal Tedavisi)',
  'Periodontoloji (Diş Eti Hastalıkları)',
  'Pedodonti (Çocuk Diş Hekimliği)',
  'Restoratif Diş Tedavisi',
  'Oral Diagnoz ve Radyoloji',
  'Estetik Diş Hekimliği / Gülüş Tasarımı',
  'İmplantoloji',
  'Dijital Diş Hekimliği – CAD/CAM',
  'Temporomandibular Eklem (TME) Tedavileri',
  'Bruksizm (Diş Sıkma ve Gıcırdatma) Tedavileri',
  'Uyku Apnesi ve Horlama Ağız Apareyleri',
  'Ağız Kokusu (Halitozis) Yönetimi',
];

// Diş Kliniği Hizmetleri
const serviceOptions = [
  // Koruyucu Tedaviler
  'Diş Taşı Temizliği (Detartraj)',
  'Subgingival Derin Temizlik (Küretaj)',
  'Flor & Fissür Örtücü',
  'Koruyucu Plaklar',
  // Dolgu ve Restorasyonlar
  'Kompozit Dolgu',
  'Seramik Inlay–Onlay',
  'Bonding Estetik Dolgu',
  'Kırık Diş Onarımı',
  // Kanal Tedavileri
  'Tek Kök / Çok Kök Kanal',
  'Kökte Kırık Yönetimi',
  'Kanal Yenileme (Retreatment)',
  'Mikroskop Destekli Kanal',
  // Cerrahi İşlemler
  'Basit / Komplike Diş Çekimi',
  'Gömülü 20\'lik Çekimi',
  'Çene Kist/Tümör Operasyonları',
  'Sinüs Lifting, Greft, Membran',
  // İmplant Tedavileri
  'Tek İmplant',
  'İmplant Üstü Kron/Bridge',
  'All-on-4 / All-on-6 Sabit Protez',
  'Kemik Artırma (GBR – Greftleme)',
  // Protez / Kaplama
  'Zirkonyum Kron/Bridge',
  'E-max Porselen / Laminate Veneer',
  'Tam/Parsiyel Protez',
  'İmplant Üstü Hibrit Protez',
  // Ortodonti
  'Metal–Seramik Teller',
  'Şeffaf Plak/Invisalign',
  'Çocuk Ortodontisi',
  'Çene Genişletme Apareyleri',
  // Estetik İşlemler
  'Hollywood Smile',
  'Diş Beyazlatma (Ofis–Ev Tipi)',
  'Diş Eti Şekillendirme (Gingivoplasti)',
  'Gummy Smile Botoks / Lazer',
  // Çocuk Tedavileri
  'Çocuk Dolguları',
  'Çocuk Kanal Tedavisi (Pulpotomi/Pulpektomi)',
  'Çocuk Protezleri',
  'Sedasyon / Genel Anestezi',
];

export default function ClinicStaffPage() {
  const router = useRouter();
  const [clinic, setClinic] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    specialties: [] as string[],
    phone: '',
    email: '',
    services: [] as string[],
  });

  useEffect(() => {
    const loadClinic = async () => {
      const clinicData = await getCurrentClinicWithUUID();
      if (!clinicData) {
        router.push('/clinic/login');
        return;
      }
      setClinic(clinicData.clinic);
      loadStaff(clinicData.clinicId);
    };
    loadClinic();
  }, [router]);

  const loadStaff = async (clinicId: string) => {
    try {
      setLoading(true);
      const result = await getClinicStaff(clinicId, {
        search: searchQuery || undefined,
        isActive: true,
      });

      if (result.success && result.staff) {
        setStaff(result.staff);
      }
    } catch (error: any) {
      console.error('Error loading staff:', error);
      showToast('Kadro yüklenirken bir hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    if (!clinic || !formData.name || !formData.title) {
      showToast('Lütfen tüm gerekli alanları doldurun', 'error');
      return;
    }

    try {
      // specialties array'ini specialty string'ine dönüştür ve specialties field'ını çıkar
      const { specialties, ...restFormData } = formData;
      // Prepare data - don't send empty services array
      const staffData: any = {
        name: restFormData.name,
        title: restFormData.title,
        is_active: true,
      };

      // Send specialty as array to match database schema
      if (specialties.length > 0) {
        staffData.specialty = specialties;
      }
      if (restFormData.phone.trim()) {
        staffData.phone = restFormData.phone.trim();
      }
      if (restFormData.email.trim()) {
        staffData.email = restFormData.email.trim();
      }
      if (restFormData.services.length > 0) {
        staffData.services = restFormData.services;
      }

      const result = await createStaff(clinic.id, staffData);

      if (result.success) {
        showToast('Kadro üyesi eklendi', 'success');
        setShowAddModal(false);
        setFormData({ name: '', title: '', specialties: [], phone: '', email: '', services: [] });
        loadStaff(clinic.id);
      } else {
        showToast(result.error || 'Kadro üyesi eklenemedi', 'error');
      }
    } catch (error: any) {
      console.error('Error adding staff:', error);
      showToast('Kadro üyesi eklenirken bir hata oluştu', 'error');
    }
  };

  const handleEditStaff = (staffMember: any) => {
    setEditingStaff(staffMember);
    // Parse specialty - could be string or array
    let specialties: string[] = [];
    if (staffMember.specialty) {
      if (Array.isArray(staffMember.specialty)) {
        specialties = staffMember.specialty;
      } else if (typeof staffMember.specialty === 'string') {
        // If it's a comma-separated string, split it
        specialties = staffMember.specialty.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
      }
    }
    
    setFormData({
      name: staffMember.name,
      title: staffMember.title,
      specialties: specialties,
      phone: staffMember.phone || '',
      email: staffMember.email || '',
      services: staffMember.services || [],
    });
    setShowAddModal(true);
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff || !formData.name || !formData.title) {
      showToast('Lütfen tüm gerekli alanları doldurun', 'error');
      return;
    }

    try {
      // Prepare update data - don't send empty services array
      const { specialties, ...restFormData } = formData;
      const updateData: any = {
        name: restFormData.name,
        title: restFormData.title,
      };

      // Send specialty as array to match database schema
      if (specialties.length > 0) {
        updateData.specialty = specialties;
      } else {
        updateData.specialty = null; // Clear specialty if empty
      }
      if (restFormData.phone.trim()) {
        updateData.phone = restFormData.phone.trim();
      } else {
        updateData.phone = null; // Clear phone if empty
      }
      if (restFormData.email.trim()) {
        updateData.email = restFormData.email.trim();
      } else {
        updateData.email = null; // Clear email if empty
      }
      // Only include services if it has items, otherwise don't include the field
      if (restFormData.services.length > 0) {
        updateData.services = restFormData.services;
      }
      // Don't send empty array - let Supabase use NULL/default

      const result = await updateStaff(editingStaff.id, updateData);
      if (result.success) {
        showToast('Kadro üyesi güncellendi', 'success');
        setShowAddModal(false);
        setEditingStaff(null);
        setFormData({ name: '', title: '', specialties: [], phone: '', email: '', services: [] });
        if (clinic) loadStaff(clinic.id);
      } else {
        showToast(result.error || 'Kadro üyesi güncellenemedi', 'error');
      }
    } catch (error: any) {
      console.error('Error updating staff:', error);
      showToast('Kadro üyesi güncellenirken bir hata oluştu', 'error');
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Bu kadro üyesini silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const result = await deleteStaff(staffId);
      if (result.success) {
        showToast('Kadro üyesi silindi', 'success');
        if (clinic) loadStaff(clinic.id);
      } else {
        showToast(result.error || 'Kadro üyesi silinemedi', 'error');
      }
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      showToast('Kadro üyesi silinirken bir hata oluştu', 'error');
    }
  };

  if (!clinic) {
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
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-light mb-2">Kadro Yönetimi</h1>
              <p className="text-slate-400 font-light">
                Hekimleri ve personeli yönetin
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition flex items-center gap-2"
            >
              <UserPlus size={18} />
              Yeni Ekle
            </button>
          </div>

          {/* Search */}
          <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Hekim veya personel ara..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
              />
            </div>
          </div>

          {/* Staff List */}
          {loading ? (
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-12 text-center">
              <p className="text-slate-400 font-light">Yükleniyor...</p>
            </div>
          ) : staff.length === 0 ? (
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-12 text-center">
              <Users className="mx-auto mb-4 text-slate-500" size={48} />
              <h2 className="text-xl font-light mb-2">Henüz kadro üyesi yok</h2>
              <p className="text-slate-400 font-light mb-6">
                İlk hekim veya personeli ekleyin
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition"
              >
                Yeni Ekle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staff.map((staffMember) => (
                <div
                  key={staffMember.id}
                  className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-light mb-1">{staffMember.name}</h3>
                      <p className="text-sm text-slate-400 font-light">{staffMember.title}</p>
                      {staffMember.specialty && (
                        <p className="text-xs text-slate-500 font-light mt-1">
                          {Array.isArray(staffMember.specialty) ? staffMember.specialty.join(', ') : staffMember.specialty}
                        </p>
                      )}
                      {staffMember.services && staffMember.services.length > 0 && (
                        <p className="text-xs text-slate-500 font-light mt-1">
                          {staffMember.services.length} hizmet
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditStaff(staffMember)}
                        className="p-2 hover:bg-slate-700/50 rounded transition"
                      >
                        <Edit2 size={16} className="text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(staffMember.id)}
                        className="p-2 hover:bg-slate-700/50 rounded transition"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                  {staffMember.phone && (
                    <p className="text-xs text-slate-400 font-light mb-1">Tel: {staffMember.phone}</p>
                  )}
                  {staffMember.email && (
                    <p className="text-xs text-slate-400 font-light">Email: {staffMember.email}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add/Edit Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full">
                <h2 className="text-xl font-light mb-4">
                  {editingStaff ? 'Kadro Üyesi Düzenle' : 'Yeni Kadro Üyesi Ekle'}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Ad Soyad *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Ünvan *</label>
                    <select
                      value={formData.title}
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        // Eğer Diş Hekimi dışında bir ünvan seçilirse, uzmanlık ve hizmetleri temizle
                        if (newTitle !== 'Diş Hekimi') {
                          setFormData({ ...formData, title: newTitle, specialties: [], services: [] });
                        } else {
                          setFormData({ ...formData, title: newTitle });
                        }
                      }}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-400/50"
                    >
                      <option value="">Ünvan Seçiniz</option>
                      {titleOptions.map((title) => (
                        <option key={title} value={title}>
                          {title}
                        </option>
                      ))}
                    </select>
                  </div>
                  {formData.title === 'Diş Hekimi' && (
                    <>
                      <div>
                        <label className="block text-sm text-slate-300 mb-2">Uzmanlık (Çoklu Seçim)</label>
                        <div className="max-h-40 overflow-y-auto border border-slate-600 rounded-lg p-2 bg-slate-700/50">
                          {specialtyOptions.map((specialty) => (
                            <label key={specialty} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-slate-600/30 rounded px-2">
                              <input
                                type="checkbox"
                                checked={formData.specialties.includes(specialty)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({ ...formData, specialties: [...formData.specialties, specialty] });
                                  } else {
                                    setFormData({ ...formData, specialties: formData.specialties.filter(s => s !== specialty) });
                                  }
                                }}
                                className="w-4 h-4 rounded border-slate-500 bg-slate-700 text-blue-500 focus:ring-blue-400"
                              />
                              <span className="text-sm text-slate-300">{specialty}</span>
                            </label>
                          ))}
                        </div>
                        {formData.specialties.length > 0 && (
                          <p className="text-xs text-slate-400 mt-1">
                            Seçilen: {formData.specialties.length} uzmanlık
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm text-slate-300 mb-2">Hizmetler (Çoklu Seçim)</label>
                        <div className="max-h-60 overflow-y-auto border border-slate-600 rounded-lg p-2 bg-slate-700/50">
                          {serviceOptions.map((service) => (
                            <label key={service} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-slate-600/30 rounded px-2">
                              <input
                                type="checkbox"
                                checked={formData.services.includes(service)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({ ...formData, services: [...formData.services, service] });
                                  } else {
                                    setFormData({ ...formData, services: formData.services.filter(s => s !== service) });
                                  }
                                }}
                                className="w-4 h-4 rounded border-slate-500 bg-slate-700 text-blue-500 focus:ring-blue-400"
                              />
                              <span className="text-sm text-slate-300">{service}</span>
                            </label>
                          ))}
                        </div>
                        {formData.services.length > 0 && (
                          <p className="text-xs text-slate-400 mt-1">
                            Seçilen: {formData.services.length} hizmet
                          </p>
                        )}
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Telefon</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={editingStaff ? handleUpdateStaff : handleAddStaff}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition"
                    >
                      {editingStaff ? 'Güncelle' : 'Ekle'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingStaff(null);
                        setFormData({ name: '', title: '', specialties: [], phone: '', email: '', services: [] });
                      }}
                      className="px-4 py-2 border border-slate-600 hover:border-red-400 hover:text-red-400 rounded-lg font-light transition"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12">
          <Footer />
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

