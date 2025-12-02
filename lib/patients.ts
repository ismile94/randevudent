// Patient management utility for clinics with real-time updates

import { dispatchEvent } from './events';
import { getAppointmentsByUserId } from './appointments';

export interface Patient {
  id: string;
  clinicId: string;
  userId: string; // User ID from patient system
  name: string;
  phone: string;
  email: string;
  tcNumber?: string;
  address?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  bloodType?: string;
  allergies?: string[];
  chronicDiseases?: string[];
  medications?: string[];
  notes?: string;
  firstAppointmentDate: string;
  lastAppointmentDate: string;
  totalAppointments: number;
  createdAt: string;
  updatedAt: string;
}

const PATIENTS_STORAGE_KEY = 'randevudent_patients';

// Get all patients for a clinic
export function getClinicPatients(clinicId: string): Patient[] {
  if (typeof window === 'undefined') return [];
  const patientsJson = localStorage.getItem(PATIENTS_STORAGE_KEY);
  const allPatients: Patient[] = patientsJson ? JSON.parse(patientsJson) : [];
  return allPatients.filter(p => p.clinicId === clinicId);
}

// Get patient by ID
export function getPatientById(patientId: string): Patient | null {
  if (typeof window === 'undefined') return null;
  const patientsJson = localStorage.getItem(PATIENTS_STORAGE_KEY);
  const allPatients: Patient[] = patientsJson ? JSON.parse(patientsJson) : [];
  return allPatients.find(p => p.id === patientId) || null;
}

// Get patient by user ID and clinic ID
export function getPatientByUserId(clinicId: string, userId: string): Patient | null {
  if (typeof window === 'undefined') return null;
  const patientsJson = localStorage.getItem(PATIENTS_STORAGE_KEY);
  const allPatients: Patient[] = patientsJson ? JSON.parse(patientsJson) : [];
  return allPatients.find(p => p.clinicId === clinicId && p.userId === userId) || null;
}

// Create or update patient from appointment
export function createOrUpdatePatientFromAppointment(
  clinicId: string,
  userId: string,
  appointmentData: {
    patientName: string;
    patientPhone: string;
    patientEmail: string;
    appointmentDate: string;
  }
): { success: boolean; patient?: Patient; error?: string } {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Window is not available' };
  }

  try {
    const patientsJson = localStorage.getItem(PATIENTS_STORAGE_KEY);
    const allPatients: Patient[] = patientsJson ? JSON.parse(patientsJson) : [];
    
    const patientName = appointmentData.patientName || 'Bilinmeyen';
    const patientPhone = appointmentData.patientPhone || '';
    const patientEmail = appointmentData.patientEmail || '';

    // Check if patient exists
    let existingPatient = allPatients.find(p => p.clinicId === clinicId && p.userId === userId);

    if (existingPatient) {
      // Update existing patient
      const index = allPatients.findIndex(p => p.id === existingPatient!.id);
      const appointments = getAppointmentsByUserId(userId).filter(a => a.clinicId === clinicId);
      
      allPatients[index] = {
        ...existingPatient,
        name: patientName,
        phone: patientPhone,
        email: patientEmail,
        lastAppointmentDate: appointmentData.appointmentDate,
        totalAppointments: appointments.length,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(allPatients));
      
      dispatchEvent('patient:updated', allPatients[index]);
      
      return { success: true, patient: allPatients[index] };
    } else {
      // Create new patient
      const appointments = getAppointmentsByUserId(userId).filter(a => a.clinicId === clinicId);
      
      const newPatient: Patient = {
        id: `patient-${clinicId}-${userId}-${Date.now()}`,
        clinicId,
        userId,
        name: patientName,
        phone: patientPhone,
        email: patientEmail,
        firstAppointmentDate: appointmentData.appointmentDate,
        lastAppointmentDate: appointmentData.appointmentDate,
        totalAppointments: appointments.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      allPatients.push(newPatient);
      localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(allPatients));
      
      dispatchEvent('patient:created', newPatient);
      
      return { success: true, patient: newPatient };
    }
  } catch (error: any) {
    console.error('Error creating/updating patient:', error);
    return { success: false, error: error.message || 'Failed to create/update patient' };
  }
}

// Update patient information
export function updatePatient(patientId: string, updates: Partial<Patient>): { success: boolean; patient?: Patient; error?: string } {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Window is not available' };
  }

  try {
    const patientsJson = localStorage.getItem(PATIENTS_STORAGE_KEY);
    const allPatients: Patient[] = patientsJson ? JSON.parse(patientsJson) : [];
    const index = allPatients.findIndex(p => p.id === patientId);

    if (index === -1) {
      return { success: false, error: 'Patient not found' };
    }

    const updatedPatient: Patient = {
      ...allPatients[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    allPatients[index] = updatedPatient;
    localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(allPatients));

    dispatchEvent('patient:updated', updatedPatient);

    return { success: true, patient: updatedPatient };
  } catch (error: any) {
    console.error('Error updating patient:', error);
    return { success: false, error: error.message || 'Failed to update patient' };
  }
}

// Add patient note
export function addPatientNote(patientId: string, note: string): { success: boolean; error?: string } {
  const patient = getPatientById(patientId);
  if (!patient) {
    return { success: false, error: 'Patient not found' };
  }

  const existingNotes = patient.notes || '';
  const newNote = existingNotes 
    ? `${existingNotes}\n[${new Date().toLocaleString('tr-TR')}] ${note}`
    : `[${new Date().toLocaleString('tr-TR')}] ${note}`;

  return updatePatient(patientId, { notes: newNote });
}

// Get patient appointment history
export function getPatientAppointmentHistory(patientId: string): any[] {
  const patient = getPatientById(patientId);
  if (!patient) return [];

  const appointments = getAppointmentsByUserId(patient.userId);
  return appointments
    .filter(a => a.clinicId === patient.clinicId)
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime();
    });
}

