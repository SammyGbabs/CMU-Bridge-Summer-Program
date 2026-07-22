import { createClient } from '@/lib/supabase/client';
import { geocodeAddress } from '@/lib/geocode';
import { Patient, Device, DeviceStatus, PatientStatus, RiskLevel } from '@/lib/types';

interface DeviceRow {
  id: string;
  patient_id: string;
  name: string;
  type: 'wearable' | 'implant' | 'mobile' | 'sensor';
  status: DeviceStatus;
  battery_level: number | null;
  last_sync_time: string | null;
  next_scheduled_check: string | null;
}

interface PatientRow {
  id: string;
  doctor_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string;
  gender: string | null;
  photo: string | null;
  status: PatientStatus;
  risk_level: RiskLevel;
  diagnoses: string[];
  medication_adherence: number;
  last_seizure_date: string | null;
  seizure_frequency: string | null;
  average_seizure_duration: number;
  location_enabled: boolean;
  current_latitude: number | null;
  current_longitude: number | null;
  current_address: string | null;
  address_country: string | null;
  address_city: string | null;
  address_state: string | null;
  address_house: string | null;
  address_zip: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relation: string | null;
  emergency_contact_email: string | null;
  emergency_contact_phone_code: string | null;
  emergency_contact_phone: string | null;
  created_at: string;
  updated_at: string;
  devices?: DeviceRow[];
}

function mapDevice(row: DeviceRow): Device {
  return {
    id: row.id,
    patientId: row.patient_id,
    name: row.name,
    type: row.type,
    status: row.status,
    batteryLevel: row.battery_level ?? undefined,
    lastSyncTime: row.last_sync_time ? new Date(row.last_sync_time) : new Date(),
    nextScheduledCheck: row.next_scheduled_check
      ? new Date(row.next_scheduled_check)
      : new Date(),
  };
}

function mapPatient(row: PatientRow): Patient {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    address: row.address_country
      ? {
          country: row.address_country,
          city: row.address_city ?? '',
          state: row.address_state ?? undefined,
          houseAddress: row.address_house ?? '',
          zipCode: row.address_zip ?? undefined,
        }
      : undefined,
    emergencyContact: row.emergency_contact_name
      ? {
          fullName: row.emergency_contact_name,
          relation: row.emergency_contact_relation ?? '',
          email: row.emergency_contact_email ?? undefined,
          phoneCountryCode: row.emergency_contact_phone_code ?? '+250',
          phone: row.emergency_contact_phone ?? '',
        }
      : undefined,
    dateOfBirth: new Date(row.date_of_birth),
    gender: row.gender ?? undefined,
    status: row.status,
    riskLevel: row.risk_level,
    photo: row.photo ?? undefined,
    diagnoses: row.diagnoses ?? [],
    medicationAdherence: row.medication_adherence,
    lastSeizureDate: row.last_seizure_date ? new Date(row.last_seizure_date) : undefined,
    seizureFrequency: row.seizure_frequency ?? '',
    averageSeizureDuration: row.average_seizure_duration,
    devices: (row.devices ?? []).map(mapDevice),
    locationEnabled: row.location_enabled,
    currentLocation:
      row.current_latitude != null && row.current_longitude != null
        ? {
            latitude: row.current_latitude,
            longitude: row.current_longitude,
            address: row.current_address ?? undefined,
          }
        : undefined,
    doctorId: row.doctor_id,
    caregiverIds: [],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function listPatients(): Promise<Patient[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('patients')
    .select('*, devices(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as PatientRow[]).map(mapPatient);
}

export interface CreatePatientInput {
  doctorId: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  gender?: string;
  status: PatientStatus;
  riskLevel: RiskLevel;
  diagnoses: string[];
  seizureFrequency?: string;
  locationEnabled: boolean;
  address: {
    country: string;
    city: string;
    state?: string;
    houseAddress: string;
    zipCode?: string;
  };
  emergencyContact: {
    fullName: string;
    relation: string;
    email?: string;
    phoneCountryCode: string;
    phone: string;
  };
}

export async function createPatient(input: CreatePatientInput): Promise<Patient> {
  const supabase = createClient();

  let geocoded: { latitude: number; longitude: number; displayName?: string } | null = null;
  if (input.locationEnabled) {
    const query = [
      input.address.houseAddress,
      input.address.city,
      input.address.state,
      input.address.country,
    ]
      .filter(Boolean)
      .join(', ');
    geocoded = await geocodeAddress(query);
  }

  const { data, error } = await supabase
    .from('patients')
    .insert({
      doctor_id: input.doctorId,
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      date_of_birth: input.dateOfBirth,
      gender: input.gender || null,
      status: input.status,
      risk_level: input.riskLevel,
      diagnoses: input.diagnoses,
      seizure_frequency: input.seizureFrequency || null,
      location_enabled: input.locationEnabled,
      current_latitude: geocoded?.latitude ?? null,
      current_longitude: geocoded?.longitude ?? null,
      current_address: geocoded?.displayName ?? null,
      address_country: input.address.country,
      address_city: input.address.city,
      address_state: input.address.state || null,
      address_house: input.address.houseAddress,
      address_zip: input.address.zipCode || null,
      emergency_contact_name: input.emergencyContact.fullName,
      emergency_contact_relation: input.emergencyContact.relation,
      emergency_contact_email: input.emergencyContact.email || null,
      emergency_contact_phone_code: input.emergencyContact.phoneCountryCode,
      emergency_contact_phone: input.emergencyContact.phone,
    })
    .select('*, devices(*)')
    .single();

  if (error) throw error;
  return mapPatient(data as PatientRow);
}

export async function updatePatientLocation(
  patientId: string,
  location: { latitude: number; longitude: number; address?: string }
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('patients')
    .update({
      current_latitude: location.latitude,
      current_longitude: location.longitude,
      current_address: location.address ?? null,
    })
    .eq('id', patientId);

  if (error) throw error;
}

export async function getPatientById(id: string): Promise<Patient | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('patients')
    .select('*, devices(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapPatient(data as PatientRow) : null;
}
