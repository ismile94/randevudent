// Staff Service - Kadro işlemleri için service katmanı
import { supabase } from '@/lib/supabase';

export interface Staff {
  id: string;
  clinic_id: string;
  name: string;
  title: string;
  specialty?: string[]; // Changed to array to match database
  phone?: string;
  email?: string;
  services?: string[];
  working_hours?: any; // JSONB
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Klinik kadrosunu getir
export async function getClinicStaff(
  clinicId: string,
  filters?: {
    search?: string;
    isActive?: boolean;
  }
): Promise<{ success: boolean; staff?: Staff[]; error?: string }> {
  try {
    let query = supabase
      .from('staff')
      .select('*')
      .eq('clinic_id', clinicId);

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      query = query.or(`name.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%,specialty.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (error) {
      console.error('Error fetching staff:', error);
      return { success: false, error: error.message };
    }

    return { success: true, staff: data as Staff[] };
  } catch (error: any) {
    console.error('Error in getClinicStaff:', error);
    return { success: false, error: error.message || 'Kadro alınamadı' };
  }
}

// Staff ID'ye göre getir
export async function getStaffById(id: string): Promise<{ success: boolean; staff?: Staff; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Kadro üyesi bulunamadı' };
      }
      console.error('Error fetching staff:', error);
      return { success: false, error: error.message };
    }

    return { success: true, staff: data as Staff };
  } catch (error: any) {
    console.error('Error in getStaffById:', error);
    return { success: false, error: error.message || 'Kadro bilgisi alınamadı' };
  }
}

// Kadro üyesi oluştur
export async function createStaff(
  clinicId: string,
  staffData: Omit<Staff, 'id' | 'clinic_id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; staff?: Staff; error?: string }> {
  try {
    // Explicitly map fields to avoid any issues with spread operator
    const insertData: any = {
      clinic_id: clinicId,
      name: staffData.name,
      title: staffData.title,
      is_active: staffData.is_active,
    };

    // Only include optional fields if they have values
    // Specialty: only include if array has items, otherwise don't include the field at all
    if (staffData.specialty && Array.isArray(staffData.specialty) && staffData.specialty.length > 0) {
      insertData.specialty = staffData.specialty;
    }
    if (staffData.phone) {
      insertData.phone = staffData.phone;
    }
    if (staffData.email) {
      insertData.email = staffData.email;
    }
    // Services: only include if array has items, otherwise don't include the field at all
    // Supabase will use default (NULL) for empty arrays
    if (staffData.services && Array.isArray(staffData.services) && staffData.services.length > 0) {
      insertData.services = staffData.services;
    }
    if (staffData.working_hours) {
      insertData.working_hours = staffData.working_hours;
    }

    // Debug: Log what we're sending
    console.log('Creating staff with data:', JSON.stringify(insertData, null, 2));
    console.log('Services type:', Array.isArray(insertData.services) ? 'array' : typeof insertData.services);
    console.log('Specialty type:', typeof insertData.specialty);

    const { data, error } = await supabase
      .from('staff')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating staff:', error);
      return { success: false, error: error.message };
    }

    return { success: true, staff: data as Staff };
  } catch (error: any) {
    console.error('Error in createStaff:', error);
    return { success: false, error: error.message || 'Kadro üyesi oluşturulamadı' };
  }
}

// Kadro üyesi güncelle
export async function updateStaff(
  id: string,
  updates: Partial<Omit<Staff, 'id' | 'clinic_id' | 'created_at' | 'updated_at'>>
): Promise<{ success: boolean; staff?: Staff; error?: string }> {
  try {
    // Build update object explicitly to avoid issues
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.title !== undefined) updateData.title = updates.title;
    // Specialty: only include if array has items, otherwise don't include the field
    if (updates.specialty !== undefined) {
      if (Array.isArray(updates.specialty) && updates.specialty.length > 0) {
        updateData.specialty = updates.specialty;
      } else {
        updateData.specialty = null; // Clear specialty if empty
      }
    }
    if (updates.phone !== undefined) updateData.phone = updates.phone || null;
    if (updates.email !== undefined) updateData.email = updates.email || null;
    // Only include services if it's an array with items
    // Don't send empty arrays - let Supabase use NULL/default
    if (updates.services !== undefined && Array.isArray(updates.services) && updates.services.length > 0) {
      updateData.services = updates.services;
    }
    if (updates.working_hours !== undefined) updateData.working_hours = updates.working_hours;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

    const { data, error } = await supabase
      .from('staff')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating staff:', error);
      return { success: false, error: error.message };
    }

    return { success: true, staff: data as Staff };
  } catch (error: any) {
    console.error('Error in updateStaff:', error);
    return { success: false, error: error.message || 'Kadro üyesi güncellenemedi' };
  }
}

// Kadro üyesi sil (soft delete)
export async function deleteStaff(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Soft delete - is_active = false
    const { error } = await supabase
      .from('staff')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting staff:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in deleteStaff:', error);
    return { success: false, error: error.message || 'Kadro üyesi silinemedi' };
  }
}

// Kadro üyesini geri getir (is_active = true)
export async function restoreStaff(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('staff')
      .update({ is_active: true })
      .eq('id', id);

    if (error) {
      console.error('Error restoring staff:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in restoreStaff:', error);
    return { success: false, error: error.message || 'Kadro üyesi geri getirilemedi' };
  }
}

