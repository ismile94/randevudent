// Mock data for clinic testing (Structure only)

import { Patient } from './patients';

// Create mock patients for testing
export function createMockPatients(clinicId: string): Patient[] {
  const now = new Date();
  const patients: Patient[] = [
    {
      id: 'patient-1',
      clinicId,
      userId: 'user-1',
      name: 'Mehmet Yılmaz',
      phone: '0555 111 22 33',
      email: 'mehmet@example.com',
      tcNumber: '12345678901',
      address: 'Kadıköy, İstanbul',
      birthDate: '1985-05-15',
      gender: 'male',
      bloodType: 'A+',
      allergies: ['Penisilin'],
      chronicDiseases: [],
      medications: ['Aspirin'],
      notes: 'Düzenli hasta. Diş taşı temizliği yapıldı.',
      firstAppointmentDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lastAppointmentDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalAppointments: 5,
      createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'patient-2',
      clinicId,
      userId: 'user-2',
      name: 'Ayşe Demir',
      phone: '0555 222 33 44',
      email: 'ayse@example.com',
      tcNumber: '23456789012',
      address: 'Bostancı, İstanbul',
      birthDate: '1990-08-20',
      gender: 'female',
      bloodType: 'B+',
      allergies: [],
      chronicDiseases: ['Hipertansiyon'],
      medications: ['Lisinopril'],
      notes: 'Hollywood Smile tedavisi tamamlandı. Çok memnun.',
      firstAppointmentDate: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lastAppointmentDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalAppointments: 8,
      createdAt: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'patient-3',
      clinicId,
      userId: 'user-3',
      name: 'Ali Kaya',
      phone: '0555 333 44 55',
      email: 'ali@example.com',
      tcNumber: '34567890123',
      address: 'Üsküdar, İstanbul',
      birthDate: '1978-12-10',
      gender: 'male',
      bloodType: '0+',
      allergies: ['Lateks'],
      chronicDiseases: ['Diyabet'],
      medications: ['Metformin'],
      notes: 'İmplant tedavisi devam ediyor. Kontrol randevusu gerekli.',
      firstAppointmentDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lastAppointmentDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalAppointments: 3,
      createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'patient-4',
      clinicId,
      userId: 'user-4',
      name: 'Zeynep Şahin',
      phone: '0555 444 55 66',
      email: 'zeynep@example.com',
      address: 'Beşiktaş, İstanbul',
      birthDate: '1995-03-25',
      gender: 'female',
      bloodType: 'AB+',
      allergies: [],
      chronicDiseases: [],
      medications: [],
      notes: 'Ortodonti tedavisi başladı. Düzenli takip gerekli.',
      firstAppointmentDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lastAppointmentDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalAppointments: 2,
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'patient-5',
      clinicId,
      userId: 'user-5',
      name: 'Can Özkan',
      phone: '0555 555 66 77',
      email: 'can@example.com',
      address: 'Şişli, İstanbul',
      birthDate: '1988-07-12',
      gender: 'male',
      bloodType: 'A-',
      allergies: ['İyot'],
      chronicDiseases: [],
      medications: [],
      notes: 'Kanal tedavisi yapıldı. Kontrol randevusu verildi.',
      firstAppointmentDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lastAppointmentDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalAppointments: 4,
      createdAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  return patients;
}

// Initialize mock data for clinic
export function initializeMockClinicData(clinicId: string): void {
  if (typeof window === 'undefined') return;
  
  // Save mock patients
  const patients = createMockPatients(clinicId);
  const existingPatientsJson = localStorage.getItem('randevudent_patients');
  const existingPatients: Patient[] = existingPatientsJson ? JSON.parse(existingPatientsJson) : [];
  
  // Merge with existing (avoid duplicates)
  const allPatients = [...existingPatients];
  patients.forEach(patient => {
    const exists = allPatients.find(p => p.id === patient.id);
    if (!exists) {
      allPatients.push(patient);
    }
  });
  
  localStorage.setItem('randevudent_patients', JSON.stringify(allPatients));
}

