import { createClient } from '@/lib/supabase/client';
import { Appointment, AppointmentStatus, Patient } from '@/lib/types';

interface PatientRow {
  id: string;
  name: string;
  photo: string | null;
  status: Patient['status'];
  diagnoses: string[];
}

interface AppointmentRow {
  id: string;
  patient_id: string;
  doctor_id: string;
  type: 'consultation' | 'follow-up' | 'medication-review' | 'emergency';
  status: AppointmentStatus;
  start_time: string;
  end_time: string;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  patients?: PatientRow | null;
}

export interface AppointmentWithPatient extends Appointment {
  patientName: string;
  patient?: {
    name: string;
    photo?: string;
    status: Patient['status'];
    diagnoses: string[];
  };
}

function mapAppointment(row: AppointmentRow): AppointmentWithPatient {
  return {
    id: row.id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    type: row.type,
    status: row.status,
    startTime: new Date(row.start_time),
    endTime: new Date(row.end_time),
    location: row.location ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    patientName: row.patients?.name ?? 'Unknown',
    patient: row.patients
      ? {
          name: row.patients.name,
          photo: row.patients.photo ?? undefined,
          status: row.patients.status,
          diagnoses: row.patients.diagnoses ?? [],
        }
      : undefined,
  };
}

export async function listAppointments(doctorId: string): Promise<AppointmentWithPatient[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('appointments')
    .select('*, patients(id, name, photo, status, diagnoses)')
    .eq('doctor_id', doctorId)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return (data as AppointmentRow[]).map(mapAppointment);
}

export interface CreateAppointmentInput {
  doctorId: string;
  patientId: string;
  type: 'consultation' | 'follow-up' | 'medication-review' | 'emergency';
  startTime: string;
  endTime: string;
  location?: string;
  notes?: string;
}

export async function createAppointment(
  input: CreateAppointmentInput
): Promise<AppointmentWithPatient> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      doctor_id: input.doctorId,
      patient_id: input.patientId,
      type: input.type,
      status: 'scheduled',
      start_time: input.startTime,
      end_time: input.endTime,
      location: input.location || null,
      notes: input.notes || null,
    })
    .select('*, patients(id, name, photo, status, diagnoses)')
    .single();

  if (error) throw error;
  return mapAppointment(data as AppointmentRow);
}
