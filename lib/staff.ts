// Staff management utility for clinics with real-time updates

import { dispatchEvent } from './events';

export interface Staff {
  id: string;
  clinicId: string;
  name: string;
  title: string; // e.g., "Diş Hekimi", "Hasta Kabul", "Asistan"
  specialty?: string; // For doctors
  phone?: string;
  email?: string;
  tcNumber?: string;
  licenseNumber?: string; // For doctors
  workingHours?: {
    day: string;
    open: string;
    close: string;
    closed: boolean;
  }[];
  services?: string[]; // Services this staff member can provide
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const STAFF_STORAGE_KEY = 'randevudent_staff';

// Get all staff for a clinic
export function getClinicStaff(clinicId: string): Staff[] {
  if (typeof window === 'undefined') return [];
  const staffJson = localStorage.getItem(STAFF_STORAGE_KEY);
  const allStaff: Staff[] = staffJson ? JSON.parse(staffJson) : [];
  return allStaff.filter(s => s.clinicId === clinicId && s.isActive);
}

// Get staff by ID
export function getStaffById(staffId: string): Staff | null {
  if (typeof window === 'undefined') return null;
  const staffJson = localStorage.getItem(STAFF_STORAGE_KEY);
  const allStaff: Staff[] = staffJson ? JSON.parse(staffJson) : [];
  return allStaff.find(s => s.id === staffId) || null;
}

// Create new staff member
export function createStaff(
  clinicId: string,
  staffData: Omit<Staff, 'id' | 'clinicId' | 'createdAt' | 'updatedAt' | 'isActive'>
): { success: boolean; staff?: Staff; error?: string } {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Window is not available' };
  }

  try {
    const staffJson = localStorage.getItem(STAFF_STORAGE_KEY);
    const allStaff: Staff[] = staffJson ? JSON.parse(staffJson) : [];

    const newStaff: Staff = {
      ...staffData,
      id: `staff-${clinicId}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      clinicId,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    allStaff.push(newStaff);
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(allStaff));

    dispatchEvent('staff:created', newStaff);

    return { success: true, staff: newStaff };
  } catch (error: any) {
    console.error('Error creating staff:', error);
    return { success: false, error: error.message || 'Failed to create staff' };
  }
}

// Update staff member
export function updateStaff(
  staffId: string,
  updates: Partial<Staff>
): { success: boolean; staff?: Staff; error?: string } {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Window is not available' };
  }

  try {
    const staffJson = localStorage.getItem(STAFF_STORAGE_KEY);
    const allStaff: Staff[] = staffJson ? JSON.parse(staffJson) : [];
    const index = allStaff.findIndex(s => s.id === staffId);

    if (index === -1) {
      return { success: false, error: 'Staff member not found' };
    }

    const updatedStaff: Staff = {
      ...allStaff[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    allStaff[index] = updatedStaff;
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(allStaff));

    dispatchEvent('staff:updated', updatedStaff);

    return { success: true, staff: updatedStaff };
  } catch (error: any) {
    console.error('Error updating staff:', error);
    return { success: false, error: error.message || 'Failed to update staff' };
  }
}

// Delete staff member (soft delete by setting isActive to false)
export function deleteStaff(staffId: string): { success: boolean; error?: string } {
  return updateStaff(staffId, { isActive: false });
}

// Hard delete staff member
export function hardDeleteStaff(staffId: string): { success: boolean; error?: string } {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Window is not available' };
  }

  try {
    const staffJson = localStorage.getItem(STAFF_STORAGE_KEY);
    const allStaff: Staff[] = staffJson ? JSON.parse(staffJson) : [];
    const index = allStaff.findIndex(s => s.id === staffId);

    if (index === -1) {
      return { success: false, error: 'Staff member not found' };
    }

    const deletedStaff = allStaff[index];
    allStaff.splice(index, 1);
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(allStaff));

    dispatchEvent('staff:deleted', { id: staffId, staff: deletedStaff });

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting staff:', error);
    return { success: false, error: error.message || 'Failed to delete staff' };
  }
}

