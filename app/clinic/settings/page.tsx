"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ClinicNavigation from '@/components/ClinicNavigation';
import Footer from '@/components/Footer';
import { getCurrentClinicWithUUID } from '@/lib/utils/clinic-utils';
import { getCurrentClinic } from '@/lib/auth-clinic';
import { getClinicById, updateClinic } from '@/lib/services/clinic-service';
import {
  Settings,
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Save,
  Edit2,
  Lock,
  Shield,
} from 'lucide-react';

export default function ClinicSettingsPage() {
  const router = useRouter();
  const [clinic, setClinic] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    clinicName: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    district: '',
    city: '',
    postalCode: '',
  });

  useEffect(() => {
    const loadClinic = async () => {
      const clinicData = await getCurrentClinicWithUUID();
      if (!clinicData) {
        router.push('/clinic/login');
        return;
      }
      setClinic(clinicData.clinic);
      loadClinicData(clinicData.clinicId);
    };
    loadClinic();
  }, [router]);

  const loadClinicData = async (clinicId: string) => {
    try {
      const result = await getClinicById(clinicId);
      if (result.success && result.clinic) {
        const clinicData = result.clinic;
        setClinic(clinicData);
        setFormData({
          clinicName: clinicData.clinic_name || '',
          phone: clinicData.phone || '',
          email: clinicData.email || '',
          website: clinicData.website || '',
          address: clinicData.address || '',
          district: clinicData.district || '',
          city: clinicData.city || '',
          postalCode: clinicData.postal_code || '',
        });
      }
    } catch (error: any) {
      console.error('Error loading clinic data:', error);
    }
  };

  const handleSave = async () => {
    if (!clinic) return;

    try {
      const result = await updateClinic(clinic.id, {
        clinic_name: formData.clinicName,
        phone: formData.phone,
        email: formData.email,
        website: formData.website || undefined,
        address: formData.address,
        district: formData.district,
        city: formData.city,
        postal_code: formData.postalCode,
      });

      if (result.success) {
        setIsEditing(false);
        // localStorage'daki clinic bilgisini de güncelle
        const currentClinic = getCurrentClinic();
        if (currentClinic && result.clinic) {
          const updatedClinic = {
            ...currentClinic,
            clinicName: result.clinic.clinic_name,
            phone: result.clinic.phone,
            email: result.clinic.email,
            website: result.clinic.website,
            address: result.clinic.address,
            district: result.clinic.district,
            city: result.clinic.city,
            postalCode: result.clinic.postal_code,
          };
          localStorage.setItem('randevudent_current_clinic', JSON.stringify(updatedClinic));
        }
        alert('Ayarlar başarıyla kaydedildi');
      } else {
        alert(result.error || 'Ayarlar kaydedilemedi');
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      alert('Ayarlar kaydedilirken bir hata oluştu');
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

        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-light mb-2">Ayarlar</h1>
            <p className="text-slate-400 font-light">
              Klinik bilgilerinizi buradan görüntüleyebilir ve düzenleyebilirsiniz
            </p>
          </div>

          {/* Basic Information */}
          <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 md:p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-light flex items-center gap-2">
                <Building2 size={24} className="text-blue-400" />
                Temel Bilgiler
              </h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm border border-slate-600/50 hover:border-blue-400/50 hover:text-blue-400 rounded-lg transition font-light flex items-center gap-2"
                >
                  <Edit2 size={16} />
                  Düzenle
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Klinik Adı
                  </label>
                  <input
                    type="text"
                    value={formData.clinicName}
                    onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-light text-slate-300 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
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
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition flex items-center gap-2"
                  >
                    <Save size={16} />
                    Kaydet
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2.5 border border-slate-600/50 hover:border-red-400/50 hover:text-red-400 rounded-lg transition font-light"
                  >
                    İptal
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 py-3 border-b border-slate-700/50">
                  <Building2 size={20} className="text-slate-400" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 font-light mb-1">Klinik Adı</p>
                    <p className="text-sm font-light">{clinic.clinic_name || clinic.clinicName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-3 border-b border-slate-700/50">
                  <Phone size={20} className="text-slate-400" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 font-light mb-1">Telefon</p>
                    <p className="text-sm font-light">{clinic.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-3 border-b border-slate-700/50">
                  <Mail size={20} className="text-slate-400" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 font-light mb-1">E-posta</p>
                    <p className="text-sm font-light">{clinic.email}</p>
                  </div>
                </div>

                {(clinic.website || clinic.clinicName) && (
                  <div className="flex items-center gap-3 py-3">
                    <span className="text-slate-400">Web:</span>
                    <a
                      href={clinic.website || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition text-sm font-light"
                    >
                      {clinic.website || 'Website eklenmemiş'}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Address Information */}
          <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 md:p-8 mb-6">
            <h2 className="text-xl font-light mb-6 flex items-center gap-2">
              <MapPin size={24} className="text-blue-400" />
              Adres Bilgileri
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 py-3 border-b border-slate-700/50">
                <MapPin size={20} className="text-slate-400" />
                <div className="flex-1">
                  <p className="text-xs text-slate-400 font-light mb-1">Adres</p>
                  <p className="text-sm font-light">
                    {clinic.address || formData.address}, {clinic.district || formData.district}, {clinic.city || formData.city}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 md:p-8">
            <h2 className="text-xl font-light mb-6 flex items-center gap-2">
              <Shield size={24} className="text-blue-400" />
              Güvenlik
            </h2>
            <div className="space-y-4">
              <Link
                href="/clinic/settings/password"
                className="flex items-center justify-between p-4 border border-slate-700/50 rounded-lg hover:border-blue-400/50 transition"
              >
                <div className="flex items-center gap-3">
                  <Lock size={20} className="text-slate-400" />
                  <span className="text-sm font-light">Şifre Değiştir</span>
                </div>
                <span className="text-xs text-slate-400">→</span>
              </Link>
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

