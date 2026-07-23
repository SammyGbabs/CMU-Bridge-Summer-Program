'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export interface DoctorAvailability {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface DoctorProfile {
  id: string;
  email: string;
  name: string;
  licenseNumber: string | null;
  specialization: string | null;
  facility: string | null;
  isAvailable: boolean;
  availability: DoctorAvailability | null;
  createdAt: string;
}

async function fetchDoctorProfile(): Promise<DoctorProfile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('doctors')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    licenseNumber: profile.license_number,
    specialization: profile.specialization,
    facility: profile.facility,
    isAvailable: profile.is_available,
    availability: profile.availability,
    createdAt: profile.created_at,
  };
}

export function useDoctor() {
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    fetchDoctorProfile().then((profile) => {
      if (isMounted) {
        setDoctor(profile);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const profile = await fetchDoctorProfile();
    setDoctor(profile);
    return profile;
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return { doctor, loading, signOut, refresh };
}
