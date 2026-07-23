'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import {
  listAvailableDevices,
  assignDeviceToPatient,
  registerDevice,
} from '@/lib/supabase/devices';
import { Device, DeviceInventoryItem } from '@/lib/types';
import { AlertCircle, Search, Plus, Cpu } from 'lucide-react';

interface AddDeviceModalProps {
  open: boolean;
  onClose: () => void;
  onAdded: (device: Device) => void;
  patientId: string;
}

type DeviceType = 'wearable' | 'implant' | 'mobile' | 'sensor';

export function AddDeviceModal({ open, onClose, onAdded, patientId }: AddDeviceModalProps) {
  const [available, setAvailable] = useState<DeviceInventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [newSerial, setNewSerial] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<DeviceType>('wearable');
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (!open) return;
    let isMounted = true;

    setIsLoading(true);
    listAvailableDevices()
      .then((data) => {
        if (isMounted) setAvailable(data);
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load device inventory.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open]);

  const resetAndClose = () => {
    onClose();
    setSearchQuery('');
    setError('');
    setIsRegisterMode(false);
    setNewSerial('');
    setNewName('');
    setNewType('wearable');
  };

  const filteredAvailable = available.filter(
    (d) =>
      d.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssign = async (item: DeviceInventoryItem) => {
    setAssigningId(item.id);
    setError('');

    try {
      const device = await assignDeviceToPatient(item.id, patientId);
      onAdded(device);
      resetAndClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign device.');
    } finally {
      setAssigningId(null);
    }
  };

  const handleRegisterAndAssign = async () => {
    if (!newSerial.trim() || !newName.trim()) {
      setError('Serial number and name are required');
      return;
    }

    setIsRegistering(true);
    setError('');

    try {
      const item = await registerDevice({
        serialNumber: newSerial.trim(),
        name: newName.trim(),
        type: newType,
      });
      const device = await assignDeviceToPatient(item.id, patientId);
      onAdded(device);
      resetAndClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register device.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Modal open={open} onClose={resetAndClose} title="Add Device" className="max-w-md">
      {isRegisterMode ? (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Register a device that isn&apos;t in inventory yet, then assign it to this patient.
          </p>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Serial Number <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={newSerial}
              onChange={(e) => setNewSerial(e.target.value)}
              placeholder="e.g. SS-2024-00123"
              className={inputClass()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Device Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. SmartBand Pro"
              className={inputClass()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Type</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as DeviceType)}
              className={inputClass()}
            >
              <option value="wearable">Wearable</option>
              <option value="implant">Implant</option>
              <option value="mobile">Mobile</option>
              <option value="sensor">Sensor</option>
            </select>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setError('');
              }}
              disabled={isRegistering}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
            >
              Back to inventory
            </button>
            <button
              type="button"
              onClick={handleRegisterAndAssign}
              disabled={isRegistering}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isRegistering ? 'Registering...' : 'Register & Assign'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by serial number or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputClass()} pl-9`}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="max-h-72 overflow-y-auto -mx-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Loading device inventory...
              </p>
            ) : filteredAvailable.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {available.length === 0
                  ? 'No available devices in inventory.'
                  : 'No matching devices found.'}
              </p>
            ) : (
              filteredAvailable.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAssign(item)}
                  disabled={assigningId !== null}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-secondary transition-colors text-left disabled:opacity-50"
                >
                  <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {item.serialNumber}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">{item.type}</span>
                  {assigningId === item.id && (
                    <span className="text-xs text-muted-foreground">Assigning...</span>
                  )}
                </button>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(true);
              setError('');
            }}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            Can&apos;t find it? Register a new device
          </button>
        </div>
      )}
    </Modal>
  );
}

function inputClass() {
  return 'w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm';
}
