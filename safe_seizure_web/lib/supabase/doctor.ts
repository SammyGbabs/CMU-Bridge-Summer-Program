import { createClient } from '@/lib/supabase/client';
import { DoctorAvailability } from '@/lib/supabase/use-doctor';

export interface UpdateDoctorProfileInput {
  name: string;
  licenseNumber?: string;
  specialization?: string;
  facility?: string;
  isAvailable: boolean;
  availability?: DoctorAvailability;
}

export async function updateDoctorProfile(
  doctorId: string,
  input: UpdateDoctorProfileInput
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('doctors')
    .update({
      name: input.name,
      license_number: input.licenseNumber || null,
      specialization: input.specialization || null,
      facility: input.facility || null,
      is_available: input.isAvailable,
      availability: input.availability ?? null,
    })
    .eq('id', doctorId);

  if (error) throw error;
}

export async function updatePassword(newPassword: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
