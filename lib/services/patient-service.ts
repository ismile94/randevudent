// Patient Service - Hasta kayıt işlemleri için service katmanı
import { supabase } from '@/lib/supabase';

export interface Patient {
  id: string;
  clinic_id: string;
  user_id: string;
  name: string;
  phone: string;
  email: string;
  tc_number?: string;
  address?: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  blood_type?: string;
  allergies?: string[];
  chronic_diseases?: string[];
  medications?: string[];
  notes?: string;
  first_appointment_date: string;
  last_appointment_date: string;
  total_appointments: number;
  created_at: string;
  updated_at: string;
}

// Klinik hastalarını getir
export async function getClinicPatients(
  clinicId: string,
  filters?: {
    search?: string;
    dateFilter?: 'all' | 'recent' | 'old';
  }
): Promise<{ success: boolean; patients?: Patient[]; error?: string }> {
  try {
    let query = supabase
      .from('patients')
      .select('*')
      .eq('clinic_id', clinicId);

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }

    if (filters?.dateFilter === 'recent') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = query.gte('last_appointment_date', thirtyDaysAgo.toISOString().split('T')[0]);
    } else if (filters?.dateFilter === 'old') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = query.lt('last_appointment_date', thirtyDaysAgo.toISOString().split('T')[0]);
    }

    const { data, error } = await query.order('last_appointment_date', { ascending: false });

    if (error) {
      console.error('Error fetching patients:', error);
      return { success: false, error: error.message };
    }

    return { success: true, patients: data as Patient[] };
  } catch (error: any) {
    console.error('Error in getClinicPatients:', error);
    return { success: false, error: error.message || 'Hastalar alınamadı' };
  }
}

// Hasta ID'ye göre getir
export async function getPatientById(id: string): Promise<{ success: boolean; patient?: Patient; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Hasta bulunamadı' };
      }
      console.error('Error fetching patient:', error);
      return { success: false, error: error.message };
    }

    return { success: true, patient: data as Patient };
  } catch (error: any) {
    console.error('Error in getPatientById:', error);
    return { success: false, error: error.message || 'Hasta bilgisi alınamadı' };
  }
}

// User ID ve Clinic ID'ye göre hasta getir
export async function getPatientByUserId(
  clinicId: string,
  userId: string
): Promise<{ success: boolean; patient?: Patient; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Hasta bulunamadı' };
      }
      console.error('Error fetching patient:', error);
      return { success: false, error: error.message };
    }

    return { success: true, patient: data as Patient };
  } catch (error: any) {
    console.error('Error in getPatientByUserId:', error);
    return { success: false, error: error.message || 'Hasta bilgisi alınamadı' };
  }
}

// Hasta oluştur veya güncelle (randevu oluşturulduğunda)
export async function getOrCreatePatient(
  clinicId: string,
  userId: string,
  appointmentData: {
    patientName: string;
    patientPhone: string;
    patientEmail: string;
    appointmentDate: string;
  }
): Promise<{ success: boolean; patient?: Patient; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_or_create_patient', {
      p_clinic_id: clinicId,
      p_user_id: userId,
      p_name: appointmentData.patientName,
      p_phone: appointmentData.patientPhone,
      p_email: appointmentData.patientEmail,
      p_appointment_date: appointmentData.appointmentDate
    });

    if (error) {
      console.error('Error in get_or_create_patient:', error);
      return { success: false, error: error.message };
    }

    // Oluşturulan/güncellenen hasta kaydını getir
    const patientResult = await getPatientByUserId(clinicId, userId);
    return patientResult;
  } catch (error: any) {
    console.error('Error in getOrCreatePatient:', error);
    return { success: false, error: error.message || 'Hasta kaydı oluşturulamadı' };
  }
}

// Hasta güncelle
export async function updatePatient(
  id: string,
  updates: Partial<Omit<Patient, 'id' | 'created_at' | 'updated_at' | 'clinic_id' | 'user_id' | 'first_appointment_date' | 'total_appointments'>>
): Promise<{ success: boolean; patient?: Patient; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('patients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating patient:', error);
      return { success: false, error: error.message };
    }

    return { success: true, patient: data as Patient };
  } catch (error: any) {
    console.error('Error in updatePatient:', error);
    return { success: false, error: error.message || 'Hasta güncellenemedi' };
  }
}

// Hasta notu ekle
export async function addPatientNote(
  id: string,
  note: string
): Promise<{ success: boolean; patient?: Patient; error?: string }> {
  try {
    // Mevcut notları al
    const { data: currentPatient, error: fetchError } = await supabase
      .from('patients')
      .select('notes')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching patient:', fetchError);
      return { success: false, error: fetchError.message };
    }

    const currentNotes = currentPatient.notes || '';
    const newNote = `[${new Date().toLocaleString('tr-TR')}] ${note}`;
    const updatedNotes = currentNotes ? `${currentNotes}\n${newNote}` : newNote;

    const { data, error } = await supabase
      .from('patients')
      .update({ notes: updatedNotes })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error adding patient note:', error);
      return { success: false, error: error.message };
    }

    return { success: true, patient: data as Patient };
  } catch (error: any) {
    console.error('Error in addPatientNote:', error);
    return { success: false, error: error.message || 'Not eklenemedi' };
  }
}

// Hasta randevu geçmişi
export async function getPatientAppointmentHistory(
  patientId: string
): Promise<{ success: boolean; appointments?: any[]; error?: string }> {
  try {
    // Önce patient bilgisini al
    const patientResult = await getPatientById(patientId);
    if (!patientResult.success || !patientResult.patient) {
      return { success: false, error: 'Hasta bulunamadı' };
    }

    const patient = patientResult.patient;

    // Bu hastanın randevularını getir
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('clinic_id', patient.clinic_id)
      .eq('user_id', patient.user_id)
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (error) {
      console.error('Error fetching appointment history:', error);
      return { success: false, error: error.message };
    }

    return { success: true, appointments: data };
  } catch (error: any) {
    console.error('Error in getPatientAppointmentHistory:', error);
    return { success: false, error: error.message || 'Randevu geçmişi alınamadı' };
  }
}

