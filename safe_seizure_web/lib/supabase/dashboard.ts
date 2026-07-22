import { createClient } from '@/lib/supabase/client';
import { DashboardStats } from '@/lib/types';
import { getActiveAlertCount } from '@/lib/supabase/alerts';
import { getUnreadMessageCount } from '@/lib/supabase/messages';

async function safeCount(
  run: () => PromiseLike<{ count: number | null; error: unknown }>
) {
  try {
    const { count, error } = await run();
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getDashboardStats(doctorId: string): Promise<DashboardStats> {
  const supabase = createClient();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [
    totalPatients,
    activeAlerts,
    onlineDevices,
    appointmentsToday,
    pendingMessages,
    seizuresToday,
    deviceIssues,
  ] = await Promise.all([
    safeCount(() =>
      supabase.from('patients').select('id', { count: 'exact', head: true })
    ),
    getActiveAlertCount(),
    safeCount(() =>
      supabase.from('devices').select('id', { count: 'exact', head: true }).eq('status', 'online')
    ),
    safeCount(() =>
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('doctor_id', doctorId)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
    ),
    getUnreadMessageCount(doctorId),
    safeCount(() =>
      supabase
        .from('seizure_events')
        .select('id', { count: 'exact', head: true })
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
    ),
    safeCount(() =>
      supabase
        .from('devices')
        .select('id', { count: 'exact', head: true })
        .in('status', ['offline', 'low-battery', 'error'])
    ),
  ]);

  return {
    totalPatients,
    activeAlerts,
    onlineDevices,
    appointmentsToday,
    pendingMessages,
    seizuresToday,
    deviceIssues,
  };
}
