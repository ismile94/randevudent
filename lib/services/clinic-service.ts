// Clinic Service - Klinik işlemleri için service katmanı
import { supabase } from '@/lib/supabase';

export interface Clinic {
  id: string;
  clinic_name: string;
  tax_number: string;
  trade_registry_number: string;
  phone: string;
  email: string;
  password_hash: string;
  website?: string;
  address: string;
  district: string;
  city: string;
  postal_code: string;
  authorized_person_name: string;
  authorized_person_tc: string;
  authorized_person_phone: string;
  authorized_person_email: string;
  authorized_person_title: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClinicStats {
  total_appointments: number;
  today_appointments: number;
  pending_appointments: number;
  confirmed_appointments: number;
  cancelled_appointments: number;
  completed_appointments: number;
  total_revenue: number;
  total_patients: number;
}

// Klinik ID'ye göre getir
export async function getClinicById(id: string): Promise<{ success: boolean; clinic?: Clinic; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching clinic:', error);
      return { success: false, error: error.message };
    }

    return { success: true, clinic: data as Clinic };
  } catch (error: any) {
    console.error('Error in getClinicById:', error);
    return { success: false, error: error.message || 'Klinik bilgisi alınamadı' };
  }
}

// Email'e göre klinik getir
export async function getClinicByEmail(email: string): Promise<{ success: boolean; clinic?: Clinic; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Klinik bulunamadı' };
      }
      console.error('Error fetching clinic:', error);
      return { success: false, error: error.message };
    }

    return { success: true, clinic: data as Clinic };
  } catch (error: any) {
    console.error('Error in getClinicByEmail:', error);
    return { success: false, error: error.message || 'Klinik bilgisi alınamadı' };
  }
}

// Tüm klinikleri getir
export async function getAllClinics(filters?: {
  city?: string;
  district?: string;
  status?: string;
}): Promise<{ success: boolean; clinics?: Clinic[]; error?: string }> {
  try {
    let query = supabase
      .from('clinics')
      .select('*');

    if (filters?.city) {
      query = query.eq('city', filters.city);
    }
    if (filters?.district) {
      query = query.eq('district', filters.district);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('clinic_name', { ascending: true });

    if (error) {
      console.error('Error fetching clinics:', error);
      return { success: false, error: error.message };
    }

    return { success: true, clinics: data as Clinic[] };
  } catch (error: any) {
    console.error('Error in getAllClinics:', error);
    return { success: false, error: error.message || 'Klinikler alınamadı' };
  }
}

// Klinik oluştur
export async function createClinic(clinicData: Omit<Clinic, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; clinic?: Clinic; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('clinics')
      .insert({
        ...clinicData,
        email: clinicData.email.toLowerCase(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating clinic:', error);
      if (error.code === '23505') {
        return { success: false, error: 'Bu e-posta veya vergi numarası zaten kullanılıyor' };
      }
      return { success: false, error: error.message };
    }

    return { success: true, clinic: data as Clinic };
  } catch (error: any) {
    console.error('Error in createClinic:', error);
    return { success: false, error: error.message || 'Klinik oluşturulamadı' };
  }
}

// Klinik güncelle
export async function updateClinic(
  id: string,
  updates: Partial<Omit<Clinic, 'id' | 'created_at' | 'updated_at' | 'password_hash'>>
): Promise<{ success: boolean; clinic?: Clinic; error?: string }> {
  try {
    const updateData: any = { ...updates };
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
    }

    const { data, error } = await supabase
      .from('clinics')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating clinic:', error);
      if (error.code === '23505') {
        return { success: false, error: 'Bu e-posta zaten kullanılıyor' };
      }
      return { success: false, error: error.message };
    }

    return { success: true, clinic: data as Clinic };
  } catch (error: any) {
    console.error('Error in updateClinic:', error);
    return { success: false, error: error.message || 'Klinik güncellenemedi' };
  }
}

// Klinik şifre güncelle
export async function updateClinicPassword(
  id: string,
  newPasswordHash: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('clinics')
      .update({ password_hash: newPasswordHash })
      .eq('id', id);

    if (error) {
      console.error('Error updating clinic password:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in updateClinicPassword:', error);
    return { success: false, error: error.message || 'Şifre güncellenemedi' };
  }
}

// Klinik durumu güncelle
export async function updateClinicStatus(
  id: string,
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('clinics')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating clinic status:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in updateClinicStatus:', error);
    return { success: false, error: error.message || 'Durum güncellenemedi' };
  }
}

// Klinik istatistikleri
export async function getClinicStats(clinicId: string): Promise<{ success: boolean; stats?: ClinicStats; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_clinic_stats', {
      p_clinic_id: clinicId
    });

    if (error) {
      console.error('Error fetching clinic stats:', error);
      return { success: false, error: error.message };
    }

    return { success: true, stats: data as ClinicStats };
  } catch (error: any) {
    console.error('Error in getClinicStats:', error);
    return { success: false, error: error.message || 'İstatistikler alınamadı' };
  }
}

