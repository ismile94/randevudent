// Clinic authentication utility with real-time updates

import { dispatchEvent } from './events';

export interface Clinic {
  id: string;
  clinicName: string;
  taxNumber: string;
  tradeRegistryNumber: string;
  phone: string;
  email: string;
  password: string; // In production, this should be hashed
  website?: string;
  address: string;
  district: string;
  city: string;
  postalCode: string;
  authorizedPersonName: string;
  authorizedPersonTC: string;
  authorizedPersonPhone: string;
  authorizedPersonEmail: string;
  authorizedPersonTitle: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  createdAt: string;
  verified: boolean;
  // Extended fields
  description?: string;
  workingHours?: {
    day: string;
    open: string;
    close: string;
    closed: boolean;
  }[];
  services?: string[];
  specialties?: string[];
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
  };
  paymentMethods?: string[]; // ['nakit', 'kredi-karti', 'taksit', 'havale']
  acceptedInsurances?: string[]; // ['SGK', 'Özel Sigorta', 'Bağkur']
  parkingInfo?: string;
  accessibility?: {
    wheelchairAccessible?: boolean;
    elevator?: boolean;
    parking?: boolean;
    wifi?: boolean;
    waitingArea?: boolean;
  };
  emergencyContact?: string;
  emergencyPhone?: string;
  whatsappNumber?: string;
  certificates?: {
    name: string;
    issuer: string;
    date: string;
    imageUrl?: string;
  }[];
  awards?: {
    name: string;
    year: string;
    description?: string;
  }[];
  videos?: {
    title: string;
    url: string;
    type: 'youtube' | 'vimeo' | 'direct';
    thumbnail?: string;
  }[];
  latitude?: number;
  longitude?: number;
}

const CLINICS_STORAGE_KEY = 'randevudent_clinics';
const CURRENT_CLINIC_KEY = 'randevudent_current_clinic';

// Get all clinics from localStorage (includes current clinic if logged in)
export function getAllClinics(): Clinic[] {
  if (typeof window === 'undefined') return [];
  const clinicsJson = localStorage.getItem(CLINICS_STORAGE_KEY);
  const clinics: Clinic[] = clinicsJson ? JSON.parse(clinicsJson) : [];
  
  // Also include current clinic if logged in (for test clinic support)
  const currentClinic = getCurrentClinic();
  if (currentClinic) {
    const exists = clinics.find(c => c.id === currentClinic.id);
    if (!exists) {
      clinics.push(currentClinic);
    }
  }
  
  return clinics;
}

// Register a new clinic (Structure only)
export function registerClinic(clinicData: Omit<Clinic, 'id' | 'status' | 'createdAt' | 'verified'>): { success: boolean; error?: string; clinic?: Clinic } {
  // TODO: Implementation will be added later
  return { success: false, error: 'Not implemented yet' };
}

// Login clinic
export function loginClinic(email: string, password: string): { success: boolean; clinic?: Clinic; error?: string } {
  // TODO: Implementation will be added later
  return { success: false, error: 'Not implemented yet' };
}

// Get current logged in clinic
export function getCurrentClinic(): Clinic | null {
  if (typeof window === 'undefined') return null;
  const clinicJson = localStorage.getItem(CURRENT_CLINIC_KEY);
  return clinicJson ? JSON.parse(clinicJson) : null;
}

// Logout clinic
export function logoutClinic(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CURRENT_CLINIC_KEY);
}

// Check if clinic is authenticated
export function isClinicAuthenticated(): boolean {
  return getCurrentClinic() !== null;
}

// Update clinic status
export function updateClinicStatus(clinicId: string, status: 'pending' | 'approved' | 'rejected' | 'suspended'): { success: boolean; error?: string } {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Window is not available' };
  }

  try {
    const clinics = getAllClinics();
    const index = clinics.findIndex(c => c.id === clinicId);

    if (index === -1) {
      return { success: false, error: 'Clinic not found' };
    }

    clinics[index].status = status;
    localStorage.setItem(CLINICS_STORAGE_KEY, JSON.stringify(clinics));

    // If this is the current clinic, update it
    const currentClinic = getCurrentClinic();
    if (currentClinic && currentClinic.id === clinicId) {
      currentClinic.status = status;
      localStorage.setItem(CURRENT_CLINIC_KEY, JSON.stringify(currentClinic));
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating clinic status:', error);
    return { success: false, error: error.message || 'Failed to update clinic status' };
  }
}

// Update clinic settings
export function updateClinicSettings(
  clinicId: string,
  updates: Partial<Omit<Clinic, 'id' | 'status' | 'createdAt' | 'verified' | 'password'>>
): { success: boolean; clinic?: Clinic; error?: string } {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Window is not available' };
  }

  try {
    const clinics = getAllClinics();
    const index = clinics.findIndex(c => c.id === clinicId);

    if (index === -1) {
      return { success: false, error: 'Clinic not found' };
    }

    const updatedClinic: Clinic = {
      ...clinics[index],
      ...updates,
    };

    clinics[index] = updatedClinic;
    localStorage.setItem(CLINICS_STORAGE_KEY, JSON.stringify(clinics));

    // If this is the current clinic, update it
    const currentClinic = getCurrentClinic();
    if (currentClinic && currentClinic.id === clinicId) {
      Object.assign(currentClinic, updates);
      localStorage.setItem(CURRENT_CLINIC_KEY, JSON.stringify(currentClinic));
    }

    // Dispatch event for real-time updates
    dispatchEvent('clinic:settings:updated', updatedClinic);

    return { success: true, clinic: updatedClinic };
  } catch (error: any) {
    console.error('Error updating clinic settings:', error);
    return { success: false, error: error.message || 'Failed to update clinic settings' };
  }
}

