"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getCurrentUser, getAllUsers, updateUserProfile, loginUser, User } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import {
  User as UserIcon,
  Mail,
  Phone,
  CreditCard,
  Lock,
  Save,
  Edit2,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    tc_number: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      setFormData({
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone,
        tc_number: currentUser.tc_number || '',
      });
    };
    checkAuth();
  }, [router]);

  const showToastMessage = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    // Validate
    if (!formData.name.trim()) {
      showToastMessage('Ad Soyad boş bırakılamaz', 'error');
      return;
    }
    if (!formData.email.trim()) {
      showToastMessage('E-posta boş bırakılamaz', 'error');
      return;
    }
    if (!formData.phone.trim()) {
      showToastMessage('Telefon boş bırakılamaz', 'error');
      return;
    }

    try {
      // Check if email is already taken by another user
      const users = await getAllUsers();
      const emailExists = users.some(
        u => u.email.toLowerCase() === formData.email.toLowerCase() && u.id !== user.id
      );
      if (emailExists) {
        showToastMessage('Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor', 'error');
        return;
      }

      // Update user in Supabase
      const result = await updateUserProfile(user.id, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        tc_number: formData.tc_number.trim() || undefined,
      });

      if (result.success && result.user) {
        setUser(result.user);
        setIsEditing(false);
        showToastMessage('Profil bilgileri başarıyla güncellendi', 'success');
      } else {
        showToastMessage(result.error || 'Profil güncellenemedi', 'error');
      }
    } catch (error: any) {
      showToastMessage(error.message || 'Profil güncellenemedi', 'error');
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    // Validate
    if (!passwordData.currentPassword) {
      showToastMessage('Mevcut şifre boş bırakılamaz', 'error');
      return;
    }
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      showToastMessage('Yeni şifre en az 6 karakter olmalıdır', 'error');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToastMessage('Yeni şifreler eşleşmiyor', 'error');
      return;
    }

    try {
      // Verify current password by attempting login
      const loginResult = await loginUser(user.email, passwordData.currentPassword);
      if (!loginResult.success) {
        showToastMessage('Mevcut şifre hatalı', 'error');
        return;
      }

      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) {
        console.error('Error updating password:', error);
        showToastMessage(error.message || 'Şifre güncellenemedi', 'error');
        return;
      }

      // Success
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsChangingPassword(false);
      showToastMessage('Şifre başarıyla güncellendi', 'success');
    } catch (error: any) {
      console.error('Error in password change:', error);
      showToastMessage(error.message || 'Şifre güncellenemedi', 'error');
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        tc_number: user.tc_number || '',
      });
    }
    setIsEditing(false);
  };

  if (!user) {
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
        <Navigation />

        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-light mb-2">Profil</h1>
            <p className="text-slate-400 font-light">
              Hesap bilgilerinizi buradan görüntüleyebilir ve düzenleyebilirsiniz
            </p>
          </div>

          {/* Profile Information */}
          <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 md:p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-light flex items-center gap-2">
                <UserIcon size={24} className="text-blue-400" />
                Kişisel Bilgiler
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
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                    placeholder="Ad Soyad"
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
                    placeholder="E-posta"
                  />
                </div>

                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                    placeholder="Telefon"
                  />
                </div>

                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    TC Kimlik No (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={formData.tc_number}
                    onChange={(e) => setFormData({ ...formData, tc_number: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                    placeholder="TC Kimlik No"
                    maxLength={11}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSaveProfile}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition flex items-center gap-2"
                  >
                    <Save size={16} />
                    Kaydet
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-6 py-2.5 border border-slate-600/50 hover:border-red-400/50 hover:text-red-400 rounded-lg transition font-light flex items-center gap-2"
                  >
                    <X size={16} />
                    İptal
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 py-3 border-b border-slate-700/50">
                  <UserIcon size={20} className="text-slate-400" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 font-light mb-1">Ad Soyad</p>
                    <p className="text-sm font-light">{user.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-3 border-b border-slate-700/50">
                  <Mail size={20} className="text-slate-400" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 font-light mb-1">E-posta</p>
                    <p className="text-sm font-light">{user.email}</p>
                    {user.email_verified && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs text-green-400">
                        <CheckCircle2 size={12} />
                        Doğrulanmış
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 py-3 border-b border-slate-700/50">
                  <Phone size={20} className="text-slate-400" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 font-light mb-1">Telefon</p>
                    <p className="text-sm font-light">{user.phone}</p>
                  </div>
                </div>

                {user.tc_number && (
                  <div className="flex items-center gap-3 py-3">
                    <CreditCard size={20} className="text-slate-400" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-400 font-light mb-1">TC Kimlik No</p>
                      <p className="text-sm font-light">{user.tc_number}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Password Change */}
          <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-light flex items-center gap-2">
                <Lock size={24} className="text-blue-400" />
                Şifre Değiştir
              </h2>
              {!isChangingPassword && (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="px-4 py-2 text-sm border border-slate-600/50 hover:border-blue-400/50 hover:text-blue-400 rounded-lg transition font-light flex items-center gap-2"
                >
                  <Edit2 size={16} />
                  Değiştir
                </button>
              )}
            </div>

            {isChangingPassword ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Mevcut Şifre
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                    placeholder="Mevcut şifrenizi girin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Yeni Şifre
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                    placeholder="Yeni şifrenizi girin (min. 6 karakter)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Yeni Şifre (Tekrar)
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                    placeholder="Yeni şifrenizi tekrar girin"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleChangePassword}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition flex items-center gap-2"
                  >
                    <Save size={16} />
                    Kaydet
                  </button>
                  <button
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                    }}
                    className="px-6 py-2.5 border border-slate-600/50 hover:border-red-400/50 hover:text-red-400 rounded-lg transition font-light flex items-center gap-2"
                  >
                    <X size={16} />
                    İptal
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 font-light text-sm">
                Güvenliğiniz için şifrenizi düzenli olarak değiştirmenizi öneririz.
              </p>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12">
          <Footer />
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
          <div
            className={`px-6 py-4 rounded-lg shadow-lg backdrop-blur border flex items-center gap-3 ${
              toastType === 'success'
                ? 'bg-green-500/20 border-green-500/50 text-green-400'
                : 'bg-red-500/20 border-red-500/50 text-red-400'
            }`}
          >
            {toastType === 'success' ? (
              <CheckCircle2 size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span className="font-light">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

