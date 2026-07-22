import { createClient } from '@/lib/supabase/client';
import { Device, DeviceStatus, DeviceInventoryItem } from '@/lib/types';

interface DeviceRow {
  id: string;
  patient_id: string;
  serial_number: string | null;
  name: string;
  type: 'wearable' | 'implant' | 'mobile' | 'sensor';
  status: DeviceStatus;
  battery_level: number | null;
  last_sync_time: string | null;
  next_scheduled_check: string | null;
}

interface DeviceInventoryRow {
  id: string;
  serial_number: string;
  name: string;
  type: 'wearable' | 'implant' | 'mobile' | 'sensor';
  status: 'available' | 'assigned';
  created_at: string;
}

function mapDevice(row: DeviceRow): Device {
  return {
    id: row.id,
    patientId: row.patient_id,
    serialNumber: row.serial_number ?? undefined,
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

function mapInventoryItem(row: DeviceInventoryRow): DeviceInventoryItem {
  return {
    id: row.id,
    serialNumber: row.serial_number,
    name: row.name,
    type: row.type,
    status: row.status,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Lists devices in stock that haven't been assigned to a patient yet.
 * This is a stand-in for the hardware team's provisioning feed — once
 * that endpoint exists, this table becomes its sync target instead of
 * being written to by hand via `registerDevice`.
 */
export async function listAvailableDevices(): Promise<DeviceInventoryItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('device_inventory')
    .select('*')
    .eq('status', 'available')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as DeviceInventoryRow[]).map(mapInventoryItem);
}

export interface RegisterDeviceInput {
  serialNumber: string;
  name: string;
  type: 'wearable' | 'implant' | 'mobile' | 'sensor';
}

/** Manually registers a device into inventory (fallback until the real provisioning feed exists). */
export async function registerDevice(input: RegisterDeviceInput): Promise<DeviceInventoryItem> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('device_inventory')
    .insert({
      serial_number: input.serialNumber.trim(),
      name: input.name.trim(),
      type: input.type,
      status: 'available',
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapInventoryItem(data as DeviceInventoryRow);
}

/** Assigns an in-stock device (by inventory id) to a patient. */
export async function assignDeviceToPatient(
  inventoryId: string,
  patientId: string
): Promise<Device> {
  const supabase = createClient();

  const { data: inventoryItem, error: fetchError } = await supabase
    .from('device_inventory')
    .select('*')
    .eq('id', inventoryId)
    .single();

  if (fetchError) throw fetchError;

  const { data: device, error: insertError } = await supabase
    .from('devices')
    .insert({
      patient_id: patientId,
      serial_number: inventoryItem.serial_number,
      name: inventoryItem.name,
      type: inventoryItem.type,
      status: 'online',
      last_sync_time: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (insertError) throw insertError;

  const { error: updateError } = await supabase
    .from('device_inventory')
    .update({ status: 'assigned' })
    .eq('id', inventoryId);

  if (updateError) throw updateError;

  return mapDevice(device as DeviceRow);
}
