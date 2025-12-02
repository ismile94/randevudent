// Appointment Service - Randevu işlemleri için service katmanı
import { supabase } from '@/lib/supabase';

export interface Appointment {
  id: string;
  user_id: string;
  clinic_id: string;
  clinic_name: string;
  clinic_address?: string;
  clinic_phone?: string;
  clinic_email?: string;
  doctor_id?: string;
  doctor_name?: string;
  service: string;
  date: string;
  time: string;
  notes?: string;
  complaint?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  price?: number;
  payment_status?: 'pending' | 'paid' | 'refunded';
  is_urgent?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppointmentFilters {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'all';
  date?: 'all' | 'today' | 'upcoming' | 'past';
  search?: string;
  startDate?: string;
  endDate?: string;
}

// Randevu oluştur
export async function createAppointment(
  appointmentData: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
  try {
    // Build insert data explicitly, only including fields that exist
    const insertData: any = {
      user_id: appointmentData.user_id,
      clinic_id: appointmentData.clinic_id,
      clinic_name: appointmentData.clinic_name,
      service: appointmentData.service,
      date: appointmentData.date,
      time: appointmentData.time,
      status: appointmentData.status,
    };

    // Only include optional fields if they have values
    if (appointmentData.clinic_address) {
      insertData.clinic_address = appointmentData.clinic_address;
    }
    if (appointmentData.clinic_phone) {
      insertData.clinic_phone = appointmentData.clinic_phone;
    }
    if (appointmentData.clinic_email) {
      insertData.clinic_email = appointmentData.clinic_email;
    }
    if (appointmentData.doctor_id) {
      insertData.doctor_id = appointmentData.doctor_id;
    }
    if (appointmentData.doctor_name) {
      insertData.doctor_name = appointmentData.doctor_name;
    }
    if (appointmentData.notes) {
      insertData.notes = appointmentData.notes;
    }
    if (appointmentData.complaint) {
      insertData.complaint = appointmentData.complaint;
    }
    if (appointmentData.price !== undefined) {
      insertData.price = appointmentData.price;
    }
    if (appointmentData.payment_status) {
      insertData.payment_status = appointmentData.payment_status;
    }
    if (appointmentData.is_urgent !== undefined) {
      insertData.is_urgent = appointmentData.is_urgent;
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating appointment:', error);
      return { success: false, error: error.message };
    }

    // Patient kaydını oluştur veya güncelle
    const { data: userData } = await supabase
      .from('users')
      .select('name, phone, email')
      .eq('id', appointmentData.user_id)
      .single();

    if (userData) {
      await supabase.rpc('get_or_create_patient', {
        p_clinic_id: appointmentData.clinic_id,
        p_user_id: appointmentData.user_id,
        p_name: userData.name,
        p_phone: userData.phone,
        p_email: userData.email,
        p_appointment_date: appointmentData.date
      });
    }

    return { success: true, appointment: data as Appointment };
  } catch (error: any) {
    console.error('Error in createAppointment:', error);
    return { success: false, error: error.message || 'Randevu oluşturulamadı' };
  }
}

// Randevu ID'ye göre getir
export async function getAppointmentById(id: string): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Randevu bulunamadı' };
      }
      console.error('Error fetching appointment:', error);
      return { success: false, error: error.message };
    }

    return { success: true, appointment: data as Appointment };
  } catch (error: any) {
    console.error('Error in getAppointmentById:', error);
    return { success: false, error: error.message || 'Randevu bilgisi alınamadı' };
  }
}

// Kullanıcının randevularını getir
export async function getAppointmentsByUser(
  userId: string,
  filters?: AppointmentFilters
): Promise<{ success: boolean; appointments?: Appointment[]; error?: string }> {
  try {
    let query = supabase
      .from('appointments')
      .select('*')
      .eq('user_id', userId);

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.date) {
      const today = new Date().toISOString().split('T')[0];
      if (filters.date === 'today') {
        query = query.eq('date', today);
      } else if (filters.date === 'upcoming') {
        query = query.gte('date', today);
      } else if (filters.date === 'past') {
        query = query.lt('date', today);
      }
    }

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }

    if (filters?.search) {
      query = query.or(`clinic_name.ilike.%${filters.search}%,service.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('date', { ascending: true }).order('time', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
      return { success: false, error: error.message };
    }

    return { success: true, appointments: data as Appointment[] };
  } catch (error: any) {
    console.error('Error in getAppointmentsByUser:', error);
    return { success: false, error: error.message || 'Randevular alınamadı' };
  }
}

// Klinik randevularını getir
export async function getAppointmentsByClinic(
  clinicId: string,
  filters?: AppointmentFilters
): Promise<{ success: boolean; appointments?: Appointment[]; error?: string }> {
  try {
    let query = supabase
      .from('appointments')
      .select('*')
      .eq('clinic_id', clinicId);

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.date) {
      const today = new Date().toISOString().split('T')[0];
      if (filters.date === 'today') {
        query = query.eq('date', today);
      } else if (filters.date === 'upcoming') {
        query = query.gte('date', today);
      } else if (filters.date === 'past') {
        query = query.lt('date', today);
      }
    }

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }

    if (filters?.search) {
      // Hasta adını users tablosundan almak için join gerekebilir
      // Şimdilik clinic_name ve service'de arama yapıyoruz
      query = query.or(`clinic_name.ilike.%${filters.search}%,service.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('date', { ascending: true }).order('time', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
      return { success: false, error: error.message };
    }

    return { success: true, appointments: data as Appointment[] };
  } catch (error: any) {
    console.error('Error in getAppointmentsByClinic:', error);
    return { success: false, error: error.message || 'Randevular alınamadı' };
  }
}

// Randevu durumu güncelle
export async function updateAppointmentStatus(
  id: string,
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating appointment status:', error);
      return { success: false, error: error.message };
    }

    return { success: true, appointment: data as Appointment };
  } catch (error: any) {
    console.error('Error in updateAppointmentStatus:', error);
    return { success: false, error: error.message || 'Randevu durumu güncellenemedi' };
  }
}

// Randevu güncelle
export async function updateAppointment(
  id: string,
  updates: Partial<Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'clinic_id'>>
): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating appointment:', error);
      return { success: false, error: error.message };
    }

    return { success: true, appointment: data as Appointment };
  } catch (error: any) {
    console.error('Error in updateAppointment:', error);
    return { success: false, error: error.message || 'Randevu güncellenemedi' };
  }
}

// Randevu sil
export async function deleteAppointment(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting appointment:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in deleteAppointment:', error);
    return { success: false, error: error.message || 'Randevu silinemedi' };
  }
}

// Bugünkü randevuları getir
export async function getTodayAppointments(clinicId: string): Promise<{ success: boolean; appointments?: Appointment[]; error?: string }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('date', today)
      .order('time', { ascending: true });

    if (error) {
      console.error('Error fetching today appointments:', error);
      return { success: false, error: error.message };
    }

    return { success: true, appointments: data as Appointment[] };
  } catch (error: any) {
    console.error('Error in getTodayAppointments:', error);
    return { success: false, error: error.message || 'Bugünkü randevular alınamadı' };
  }
}

