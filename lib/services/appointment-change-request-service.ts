// Appointment Change Request Service - Randevu değişiklik talepleri için service katmanı
import { supabase } from '@/lib/supabase';

export interface AppointmentChangeRequest {
  id: string;
  appointment_id: string;
  requested_by: string; // user_id veya clinic_id
  requested_by_type: 'user' | 'clinic';
  new_date?: string;
  new_time?: string;
  new_doctor_id?: string;
  new_service?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface CreateChangeRequestData {
  appointment_id: string;
  requested_by: string;
  requested_by_type: 'user' | 'clinic';
  new_date?: string;
  new_time?: string;
  new_doctor_id?: string;
  new_service?: string;
  reason?: string;
}

// Randevu değişiklik talebi oluştur
export async function createAppointmentChangeRequest(
  data: CreateChangeRequestData
): Promise<{ success: boolean; changeRequest?: AppointmentChangeRequest; error?: string }> {
  try {
    // En az bir değişiklik olmalı
    if (!data.new_date && !data.new_time && !data.new_doctor_id && !data.new_service) {
      return { success: false, error: 'En az bir değişiklik belirtmelisiniz' };
    }

    // Aynı randevu için bekleyen bir talep var mı kontrol et
    const { data: existingRequests, error: checkError } = await supabase
      .from('appointment_change_requests')
      .select('id')
      .eq('appointment_id', data.appointment_id)
      .eq('status', 'pending');

    if (checkError) {
      console.error('Error checking existing requests:', checkError);
      return { success: false, error: checkError.message };
    }

    if (existingRequests && existingRequests.length > 0) {
      return { success: false, error: 'Bu randevu için zaten bekleyen bir değişiklik talebi var' };
    }

    const { data: insertedData, error } = await supabase
      .from('appointment_change_requests')
      .insert({
        appointment_id: data.appointment_id,
        requested_by: data.requested_by,
        requested_by_type: data.requested_by_type,
        new_date: data.new_date,
        new_time: data.new_time,
        new_doctor_id: data.new_doctor_id,
        new_service: data.new_service,
        reason: data.reason,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating change request:', error);
      return { success: false, error: error.message };
    }

    return { success: true, changeRequest: insertedData as AppointmentChangeRequest };
  } catch (error: any) {
    console.error('Error in createAppointmentChangeRequest:', error);
    return { success: false, error: error.message || 'Değişiklik talebi oluşturulamadı' };
  }
}

// Randevu için bekleyen değişiklik taleplerini getir
export async function getPendingChangeRequests(
  appointmentId: string
): Promise<{ success: boolean; changeRequests?: AppointmentChangeRequest[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('appointment_change_requests')
      .select('*')
      .eq('appointment_id', appointmentId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching change requests:', error);
      return { success: false, error: error.message };
    }

    return { success: true, changeRequests: data as AppointmentChangeRequest[] };
  } catch (error: any) {
    console.error('Error in getPendingChangeRequests:', error);
    return { success: false, error: error.message || 'Değişiklik talepleri alınamadı' };
  }
}

// Değişiklik talebini onayla
export async function approveChangeRequest(
  changeRequestId: string
): Promise<{ success: boolean; appointment?: any; error?: string }> {
  try {
    // Önce değişiklik talebini getir
    const { data: changeRequest, error: fetchError } = await supabase
      .from('appointment_change_requests')
      .select('*')
      .eq('id', changeRequestId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !changeRequest) {
      return { success: false, error: 'Değişiklik talebi bulunamadı' };
    }

    // Randevuyu güncelle
    const updateData: any = {};
    if (changeRequest.new_date) updateData.date = changeRequest.new_date;
    if (changeRequest.new_time) updateData.time = changeRequest.new_time;
    if (changeRequest.new_doctor_id) {
      updateData.doctor_id = changeRequest.new_doctor_id;
      // Doktor adını da güncelle
      const { data: doctor } = await supabase
        .from('staff')
        .select('name')
        .eq('id', changeRequest.new_doctor_id)
        .single();
      if (doctor) {
        updateData.doctor_name = doctor.name;
      }
    }
    if (changeRequest.new_service) updateData.service = changeRequest.new_service;

    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', changeRequest.appointment_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating appointment:', updateError);
      return { success: false, error: updateError.message };
    }

    // Değişiklik talebini onaylandı olarak işaretle
    const { error: statusError } = await supabase
      .from('appointment_change_requests')
      .update({ status: 'approved' })
      .eq('id', changeRequestId);

    if (statusError) {
      console.error('Error updating change request status:', statusError);
      return { success: false, error: statusError.message };
    }

    return { success: true, appointment: updatedAppointment };
  } catch (error: any) {
    console.error('Error in approveChangeRequest:', error);
    return { success: false, error: error.message || 'Değişiklik talebi onaylanamadı' };
  }
}

// Değişiklik talebini reddet
export async function rejectChangeRequest(
  changeRequestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('appointment_change_requests')
      .update({ status: 'rejected' })
      .eq('id', changeRequestId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error rejecting change request:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in rejectChangeRequest:', error);
    return { success: false, error: error.message || 'Değişiklik talebi reddedilemedi' };
  }
}

// Kullanıcının veya kliniğin değişiklik taleplerini getir
export async function getChangeRequestsByRequester(
  requesterId: string,
  requesterType: 'user' | 'clinic'
): Promise<{ success: boolean; changeRequests?: AppointmentChangeRequest[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('appointment_change_requests')
      .select('*')
      .eq('requested_by', requesterId)
      .eq('requested_by_type', requesterType)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching change requests:', error);
      return { success: false, error: error.message };
    }

    return { success: true, changeRequests: data as AppointmentChangeRequest[] };
  } catch (error: any) {
    console.error('Error in getChangeRequestsByRequester:', error);
    return { success: false, error: error.message || 'Değişiklik talepleri alınamadı' };
  }
}

