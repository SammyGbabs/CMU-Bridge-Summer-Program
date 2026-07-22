import { createClient } from '@/lib/supabase/client';
import { SeizureEvent, SeizureType, AlertSeverity } from '@/lib/types';

interface SeizureEventRow {
  id: string;
  patient_id: string;
  type: SeizureType;
  start_time: string;
  duration: number;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  severity: AlertSeverity;
  witnesses: string[] | null;
  notes: string | null;
  treatment_provided: string | null;
  created_at: string;
  updated_at: string;
  patients?: { name: string } | null;
}

export interface SeizureEventWithPatient extends SeizureEvent {
  patientName: string;
}

function mapSeizureEvent(row: SeizureEventRow): SeizureEventWithPatient {
  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: row.patients?.name ?? 'Unknown',
    type: row.type,
    startTime: new Date(row.start_time),
    duration: row.duration,
    location:
      row.latitude != null && row.longitude != null
        ? {
            latitude: row.latitude,
            longitude: row.longitude,
            address: row.address ?? undefined,
          }
        : undefined,
    severity: row.severity,
    witnesses: row.witnesses ?? undefined,
    notes: row.notes ?? undefined,
    treatmentProvided: row.treatment_provided ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function listSeizureEvents(): Promise<SeizureEventWithPatient[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('seizure_events')
    .select('*, patients(name)')
    .order('start_time', { ascending: false });

  if (error) throw error;
  return (data as SeizureEventRow[]).map(mapSeizureEvent);
}

export async function listSeizureEventsForPatient(
  patientId: string
): Promise<SeizureEventWithPatient[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('seizure_events')
    .select('*, patients(name)')
    .eq('patient_id', patientId)
    .order('start_time', { ascending: false });

  if (error) throw error;
  return (data as SeizureEventRow[]).map(mapSeizureEvent);
}
