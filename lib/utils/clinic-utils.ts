// Utility functions for clinic operations
import { getCurrentClinic } from '@/lib/auth-clinic';
import { getClinicByEmail } from '@/lib/services/clinic-service';

/**
 * Gets the current clinic and ensures it has a valid UUID
 * If the clinic ID is not a UUID (mock data), it fetches the real clinic from Supabase
 */
export async function getCurrentClinicWithUUID(): Promise<{ clinic: any; clinicId: string } | null> {
  const currentClinic = getCurrentClinic();
  if (!currentClinic) {
    return null;
  }

  // Check if clinic ID is a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (uuidRegex.test(currentClinic.id)) {
    // Already a valid UUID
    return { clinic: currentClinic, clinicId: currentClinic.id };
  }

  // Not a UUID, fetch from Supabase using email
  try {
    const clinicResult = await getClinicByEmail(currentClinic.email);
    if (clinicResult.success && clinicResult.clinic) {
      // Update localStorage with real clinic data
      const updatedClinic = {
        ...currentClinic,
        id: clinicResult.clinic.id,
        // Update other fields from Supabase if needed
        clinicName: clinicResult.clinic.clinic_name || currentClinic.clinicName,
        phone: clinicResult.clinic.phone || currentClinic.phone,
        email: clinicResult.clinic.email || currentClinic.email,
        address: clinicResult.clinic.address || currentClinic.address,
        district: clinicResult.clinic.district || currentClinic.district,
        city: clinicResult.clinic.city || currentClinic.city,
        postalCode: clinicResult.clinic.postal_code || currentClinic.postalCode,
        status: clinicResult.clinic.status || currentClinic.status,
        verified: clinicResult.clinic.verified || currentClinic.verified,
      };
      localStorage.setItem('randevudent_current_clinic', JSON.stringify(updatedClinic));
      return { clinic: updatedClinic, clinicId: clinicResult.clinic.id };
    } else {
      // Clinic not found in Supabase
      console.error('Clinic not found in Supabase:', clinicResult.error);
      return null;
    }
  } catch (error: any) {
    console.error('Error fetching clinic from Supabase:', error);
    return null;
  }
}

