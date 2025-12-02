"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ClinicNavigation from '@/components/ClinicNavigation';
import Footer from '@/components/Footer';
import { getCurrentClinic } from '@/lib/auth-clinic';
import { getClinicStaff, createStaff, updateStaff, deleteStaff, type Staff } from '@/lib/staff';
import { subscribeToEvents } from '@/lib/events';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  Plus,
  X,
  Save,
  Phone,
  Mail,
  Briefcase,
} from 'lucide-react';

export default function ClinicStaffPage() {
  const router = useRouter();
  const [clinic, setClinic] = useState<any>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    specialty: '',
    phone: '',
    email: '',
    tcNumber: '',
    licenseNumber: '',
    notes: '',
    services: [] as string[],
  });

  const loadData = () => {
    const currentClinic = getCurrentClinic();
    if (!currentClinic) {
      router.push('/clinic/login');
      return;
    }
    setClinic(currentClinic);
    
    const clinicStaff = getClinicStaff(currentClinic.id);
    setStaff(clinicStaff);
  };

  useEffect(() => {
    loadData();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToEvents((eventData) => {
      if (
        eventData.type === 'staff:created' ||
        eventData.type === 'staff:updated' ||
        eventData.type === 'staff:deleted'
      ) {
        loadData();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router]);

  const handleAddStaff = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      title: '',
      specialty: '',
      phone: '',
      email: '',
      tcNumber: '',
      licenseNumber: '',
      notes: '',
      services: [],
    });
    setShowAddModal(true);
  };

  const handleEditStaff = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      title: staffMember.title,
      specialty: staffMember.specialty || '',
      phone: staffMember.phone || '',
      email: staffMember.email || '',
      tcNumber: staffMember.tcNumber || '',
      licenseNumber: staffMember.licenseNumber || '',
      notes: staffMember.notes || '',
      services: staffMember.services || [],
    });
    setShowAddModal(true);
  };

  const handleDeleteStaff = (staffId: string) => {
    if (confirm('Bu personeli silmek istediğinize emin misiniz?')) {
      const result = deleteStaff(staffId);
      if (!result.success) {
        alert(result.error || 'Silme işlemi başarısız oldu');
      }
    }
  };

  const handleSaveStaff = () => {
    if (!clinic) return;

    if (!formData.name || !formData.title) {
      alert('Lütfen ad ve unvan alanlarını doldurun');
      return;
    }

    if (editingStaff) {
      const result = updateStaff(editingStaff.id, formData);
      if (result.success) {
        setShowAddModal(false);
        setEditingStaff(null);
      } else {
        alert(result.error || 'Güncelleme başarısız oldu');
      }
    } else {
      const result = createStaff(clinic.id, formData);
      if (result.success) {
        setShowAddModal(false);
        setFormData({
          name: '',
          title: '',
          specialty: '',
          phone: '',
          email: '',
          tcNumber: '',
          licenseNumber: '',
          notes: '',
          services: [],
        });
      } else {
        alert(result.error || 'Ekleme başarısız oldu');
      }
    }
  };

  const filteredStaff = staff.filter(s => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(query) ||
        s.title.toLowerCase().includes(query) ||
        (s.specialty && s.specialty.toLowerCase().includes(query))
      );
    }
    return true;
  });

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
              onClick={handleAddStaff}
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
          {filteredStaff.length === 0 ? (
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-12 text-center">
              <Users className="mx-auto mb-4 text-slate-500" size={48} />
              <h2 className="text-xl font-light mb-2">
                {staff.length === 0 ? 'Henüz kadro üyesi yok' : 'Personel bulunamadı'}
              </h2>
              <p className="text-slate-400 font-light mb-6">
                {staff.length === 0
                  ? 'İlk hekim veya personeli ekleyin'
                  : 'Arama kriterlerinize uygun personel bulunamadı'}
              </p>
              {staff.length === 0 && (
                <button
                  onClick={handleAddStaff}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition"
                >
                  Yeni Ekle
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStaff.map((staffMember) => (
                <div
                  key={staffMember.id}
                  className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 hover:border-blue-400/50 transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <Users size={24} className="text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-light">{staffMember.name}</h3>
                        <p className="text-sm text-slate-400 font-light">{staffMember.title}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditStaff(staffMember)}
                        className="p-2 hover:bg-blue-500/20 rounded-lg transition"
                      >
                        <Edit2 size={16} className="text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(staffMember.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {staffMember.specialty && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Briefcase size={14} className="text-slate-400" />
                        <span className="font-light">{staffMember.specialty}</span>
                      </div>
                    )}
                    {staffMember.phone && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone size={14} className="text-slate-400" />
                        <span className="font-light">{staffMember.phone}</span>
                      </div>
                    )}
                    {staffMember.email && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Mail size={14} className="text-slate-400" />
                        <span className="font-light truncate">{staffMember.email}</span>
                      </div>
                    )}
                    {staffMember.licenseNumber && (
                      <div className="text-xs text-slate-400 font-light">
                        Lisans: {staffMember.licenseNumber}
                      </div>
                    )}
                    {staffMember.services && staffMember.services.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-700/50">
                        <p className="text-xs text-slate-400 font-light mb-2">Hizmetler:</p>
                        <div className="flex flex-wrap gap-1">
                          {staffMember.services.slice(0, 3).map((service) => (
                            <span
                              key={service}
                              className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded font-light"
                            >
                              {service}
                            </span>
                          ))}
                          {staffMember.services.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-slate-700/50 text-slate-400 rounded font-light">
                              +{staffMember.services.length - 3} daha
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add/Edit Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-light">
                    {editingStaff ? 'Personel Düzenle' : 'Yeni Personel Ekle'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingStaff(null);
                    }}
                    className="p-2 hover:bg-slate-700 rounded-lg transition"
                  >
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-light text-slate-300 mb-2">
                      Ad Soyad *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                      placeholder="Örn: Dr. Ahmet Yılmaz"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-light text-slate-300 mb-2">
                      Unvan *
                    </label>
                    <select
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                    >
                      <option value="">Unvan seçiniz</option>
                      <optgroup label="Hekimler">
                        <option value="Diş Hekimi">Diş Hekimi</option>
                        <option value="Uzman Diş Hekimi">Uzman Diş Hekimi</option>
                        <option value="Ortodonti Uzmanı">Ortodonti Uzmanı</option>
                        <option value="Oral ve Maxillofacial Cerrah">Oral ve Maxillofacial Cerrah</option>
                        <option value="Periodontoloji Uzmanı">Periodontoloji Uzmanı</option>
                        <option value="Endodonti Uzmanı">Endodonti Uzmanı</option>
                        <option value="Prostodonti Uzmanı">Prostodonti Uzmanı</option>
                        <option value="Pedodonti Uzmanı">Pedodonti Uzmanı</option>
                        <option value="Estetik Diş Hekimi">Estetik Diş Hekimi</option>
                        <option value="İmplantoloji Uzmanı">İmplantoloji Uzmanı</option>
                      </optgroup>
                      <optgroup label="Teknik Personel">
                        <option value="Diş Teknisyeni">Diş Teknisyeni</option>
                        <option value="Ortodonti Teknisyeni">Ortodonti Teknisyeni</option>
                        <option value="Protez Teknisyeni">Protez Teknisyeni</option>
                      </optgroup>
                      <optgroup label="Yardımcı Personel">
                        <option value="Diş Hekimi Asistanı">Diş Hekimi Asistanı</option>
                        <option value="Sterilizasyon Sorumlusu">Sterilizasyon Sorumlusu</option>
                        <option value="Hasta Kabul Sorumlusu">Hasta Kabul Sorumlusu</option>
                        <option value="Sekreter">Sekreter</option>
                        <option value="Muhasebe Sorumlusu">Muhasebe Sorumlusu</option>
                        <option value="Yönetici">Yönetici</option>
                        <option value="Klinik Müdürü">Klinik Müdürü</option>
                        <option value="Temizlik Personeli">Temizlik Personeli</option>
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-light text-slate-300 mb-2">
                      Uzmanlık Alanı
                    </label>
                    <input
                      type="text"
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                      placeholder="Örn: Ortodonti, Endodonti"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-light text-slate-300 mb-2">
                        Telefon
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                        placeholder="0555 123 45 67"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-light text-slate-300 mb-2">
                        E-posta
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                        placeholder="ornek@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-light text-slate-300 mb-2">
                      Lisans Numarası
                    </label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                      placeholder="Hekimler için"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-light text-slate-300 mb-2">
                      Sunduğu Hizmetler (Hekimler için)
                    </label>
                    <div className="max-h-64 overflow-y-auto border border-slate-600/50 rounded-lg p-3 bg-slate-800/30">
                      {[
                        'Diş Taşı Temizliği (Detartraj)',
                        'Kompozit Dolgu',
                        'Tek Kök / Çok Kök Kanal',
                        'Tek İmplant',
                        'Metal–Seramik Teller',
                        'Zirkonyum Kron/Bridge',
                        'Hollywood Smile',
                        'Şeffaf Plak/Invisalign',
                        'Çocuk Ortodontisi',
                        'Diş Beyazlatma (Ofis–Ev Tipi)',
                        'E-max Porselen / Laminate Veneer',
                        'All-on-4 / All-on-6 Sabit Protez',
                        'Kemik Artırma (GBR – Greftleme)',
                        'Mikroskop Destekli Kanal',
                        'Kanal Yenileme (Retreatment)',
                        'Kırık Diş Onarımı',
                        'Basit / Komplike Diş Çekimi',
                        'Gömülü 20\'lik Çekimi',
                        'Çocuk Dolguları',
                        'Çocuk Kanal Tedavisi (Pulpotomi/Pulpektomi)',
                        'Tam/Parsiyel Protez',
                        'Diş Eti Şekillendirme (Gingivoplasti)',
                      ].map((service) => (
                        <label
                          key={service}
                          className="flex items-center gap-2 p-2 hover:bg-slate-700/30 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.services.includes(service)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  services: [...formData.services, service],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  services: formData.services.filter((s) => s !== service),
                                });
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-sm font-light text-slate-300">{service}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 font-light mt-2">
                      Bu hekimin sunduğu hizmetleri seçin. Bu hizmetler klinik sayfasında ve randevu alma sayfasında görünecektir.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-light text-slate-300 mb-2">
                      Notlar
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light resize-none"
                      placeholder="Ek notlar..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveStaff}
                      className="flex-1 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition flex items-center justify-center gap-2"
                    >
                      <Save size={16} />
                      {editingStaff ? 'Güncelle' : 'Ekle'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingStaff(null);
                      }}
                      className="px-6 py-2.5 border border-slate-600/50 hover:border-red-400/50 hover:text-red-400 rounded-lg transition font-light"
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
    </div>
  );
}

