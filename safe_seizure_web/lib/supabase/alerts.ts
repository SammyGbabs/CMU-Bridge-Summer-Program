import { createClient } from '@/lib/supabase/client';
import { Alert, AlertSeverity, AlertStatus } from '@/lib/types';

interface AlertRow {
  id: string;
  patient_id: string;
  type: 'seizure' | 'device' | 'medication' | 'appointment' | 'manual';
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  timestamp: string;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  metadata: Record<string, unknown> | null;
}

function mapAlert(row: AlertRow): Alert {
  return {
    id: row.id,
    patientId: row.patient_id,
    type: row.type,
    title: row.title,
    description: row.description,
    severity: row.severity,
    status: row.status,
    timestamp: new Date(row.timestamp),
    acknowledgedBy: row.acknowledged_by ?? undefined,
    acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at) : undefined,
    resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
    metadata: row.metadata ?? undefined,
  };
}

export async function getActiveAlertCount(): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('alerts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');

  if (error) return 0;
  return count ?? 0;
}

export async function listAlerts(): Promise<Alert[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return (data as AlertRow[]).map(mapAlert);
}

export async function listAlertsForPatient(patientId: string): Promise<Alert[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('patient_id', patientId)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return (data as AlertRow[]).map(mapAlert);
}

export async function acknowledgeAlert(alertId: string, doctorId: string): Promise<Alert> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('alerts')
    .update({
      status: 'acknowledged',
      acknowledged_by: doctorId,
      acknowledged_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .select('*')
    .single();

  if (error) throw error;
  return mapAlert(data as AlertRow);
}

export async function resolveAlert(alertId: string): Promise<Alert> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('alerts')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .select('*')
    .single();

  if (error) throw error;
  return mapAlert(data as AlertRow);
}
