"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ClinicNavigation from '@/components/ClinicNavigation';
import Footer from '@/components/Footer';
import { getCurrentClinic } from '@/lib/auth-clinic';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  Plus,
} from 'lucide-react';

export default function ClinicStaffPage() {
  const router = useRouter();
  const [clinic, setClinic] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const currentClinic = getCurrentClinic();
    if (!currentClinic) {
      router.push('/clinic/login');
      return;
    }
    setClinic(currentClinic);
    
    // TODO: Fetch staff from API
    setStaff([]);
  }, [router]);

  const handleAddStaff = () => {
    // TODO: Implement add staff
    console.log('Add staff');
  };

  const handleEditStaff = (staffId: string) => {
    // TODO: Implement edit staff
    console.log('Edit staff:', staffId);
  };

  const handleDeleteStaff = (staffId: string) => {
    // TODO: Implement delete staff
    console.log('Delete staff:', staffId);
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
          {staff.length === 0 ? (
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-12 text-center">
              <Users className="mx-auto mb-4 text-slate-500" size={48} />
              <h2 className="text-xl font-light mb-2">Henüz kadro üyesi yok</h2>
              <p className="text-slate-400 font-light mb-6">
                İlk hekim veya personeli ekleyin
              </p>
              <button
                onClick={handleAddStaff}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition"
              >
                Yeni Ekle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Staff cards will be rendered here */}
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

