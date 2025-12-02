// Appointment management utility with real-time updates

import { dispatchEvent } from './events';
import { createOrUpdatePatientFromAppointment } from './patients';

export interface Appointment {
  id: string;
  userId: string;
  clinicId: string;
  clinicName: string;
  clinicAddress?: string;
  clinicPhone?: string;
  clinicEmail?: string;
  doctorId?: string;
  doctorName?: string;
  service: string;
  date: string;
  time: string;
  notes?: string;
  complaint?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  price?: number;
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  cancellationReason?: string;
  isUrgent?: boolean;
  createdAt: string;
  updatedAt?: string;
}

const APPOINTMENTS_STORAGE_KEY = 'randevudent_appointments';

// Get all appointments
export function getAllAppointments(): Appointment[] {
  if (typeof window === 'undefined') return [];
  const appointmentsJson = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
  return appointmentsJson ? JSON.parse(appointmentsJson) : [];
}

// Get appointments by clinic ID
export function getAppointmentsByClinicId(clinicId: string): Appointment[] {
  const appointments = getAllAppointments();
  return appointments.filter(a => a.clinicId === clinicId);
}

// Get appointments by user ID
export function getAppointmentsByUserId(userId: string): Appointment[] {
  const appointments = getAllAppointments();
  return appointments.filter(a => a.userId === userId);
}

// Get appointment by ID
export function getAppointmentById(appointmentId: string): Appointment | null {
  const appointments = getAllAppointments();
  return appointments.find(a => a.id === appointmentId) || null;
}

// Create new appointment
export function createAppointment(appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): { success: boolean; appointment?: Appointment; error?: string } {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Window is not available' };
  }

  try {
    const appointments = getAllAppointments();
    
    const newAppointment: Appointment = {
      ...appointment,
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    appointments.push(newAppointment);
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));

    // Create or update patient record for clinic
    createOrUpdatePatientFromAppointment(
      appointment.clinicId,
      appointment.userId,
      {
        patientName: '', // Will be filled from user data
        patientPhone: '',
        patientEmail: '',
        appointmentDate: appointment.date,
      }
    );

    // Dispatch event for real-time updates
    dispatchEvent('appointment:created', newAppointment);

    return { success: true, appointment: newAppointment };
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    return { success: false, error: error.message || 'Failed to create appointment' };
  }
}

// Update appointment
export function updateAppointment(
  appointmentId: string,
  updates: Partial<Appointment>
): { success: boolean; appointment?: Appointment; error?: string } {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Window is not available' };
  }

  try {
    const appointments = getAllAppointments();
    const index = appointments.findIndex(a => a.id === appointmentId);

    if (index === -1) {
      return { success: false, error: 'Appointment not found' };
    }

    const updatedAppointment: Appointment = {
      ...appointments[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    appointments[index] = updatedAppointment;
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));

    // Dispatch event for real-time updates
    dispatchEvent('appointment:updated', updatedAppointment);

    return { success: true, appointment: updatedAppointment };
  } catch (error: any) {
    console.error('Error updating appointment:', error);
    return { success: false, error: error.message || 'Failed to update appointment' };
  }
}

// Update appointment status
export function updateAppointmentStatus(
  appointmentId: string,
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed',
  cancellationReason?: string
): { success: boolean; appointment?: Appointment; error?: string } {
  const updates: Partial<Appointment> = { status };
  if (cancellationReason) {
    updates.cancellationReason = cancellationReason;
  }
  return updateAppointment(appointmentId, updates);
}

// Delete appointment
export function deleteAppointment(appointmentId: string): { success: boolean; error?: string } {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Window is not available' };
  }

  try {
    const appointments = getAllAppointments();
    const index = appointments.findIndex(a => a.id === appointmentId);

    if (index === -1) {
      return { success: false, error: 'Appointment not found' };
    }

    const deletedAppointment = appointments[index];
    appointments.splice(index, 1);
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));

    // Dispatch event for real-time updates
    dispatchEvent('appointment:deleted', { id: appointmentId, appointment: deletedAppointment });

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting appointment:', error);
    return { success: false, error: error.message || 'Failed to delete appointment' };
  }
}

// Get appointments statistics for a clinic
export function getClinicAppointmentStats(clinicId: string): {
  total: number;
  today: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  totalRevenue: number;
} {
  const appointments = getAppointmentsByClinicId(clinicId);
  const today = new Date().toISOString().split('T')[0];

  return {
    total: appointments.length,
    today: appointments.filter(a => a.date === today).length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    totalRevenue: appointments
      .filter(a => a.status === 'completed' && a.price)
      .reduce((sum, a) => sum + (a.price || 0), 0),
  };
}

