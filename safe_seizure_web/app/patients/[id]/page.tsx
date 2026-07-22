'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Sidebar, defaultSidebarItems } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { PatientAvatar } from '@/components/patient-avatar';
import { StatusBadge } from '@/components/status-badge';
import { Modal } from '@/components/ui/modal';
import { AddDeviceModal } from '@/components/patients/add-device-modal';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Cake,
  Users2,
  Activity,
  Pill,
  Clock,
  Plus,
  Wifi,
  WifiOff,
  BatteryWarning,
  MapPinned,
  AlertTriangle,
  Heart,
} from 'lucide-react';
import { getPatientById, updatePatientLocation } from '@/lib/supabase/patients';
import { listSeizureEventsForPatient, SeizureEventWithPatient } from '@/lib/supabase/seizures';
import { listAlertsForPatient, getActiveAlertCount } from '@/lib/supabase/alerts';
import { getUnreadMessageCount } from '@/lib/supabase/messages';
import { geocodeAddress } from '@/lib/geocode';
import { useDoctor } from '@/lib/supabase/use-doctor';
import { Patient, Alert, Device } from '@/lib/types';

const PatientMap = dynamic(
  () => import('@/components/dashboard/patient-map').then((m) => m.PatientMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full min-h-[420px] rounded-lg border border-border bg-secondary/30 animate-pulse" />
    ),
  }
);

function calculateAge(dateOfBirth: Date) {
  const diff = Date.now() - dateOfBirth.getTime();
  return Math.max(0, Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)));
}

const deviceStatusMeta: Record<
  Device['status'],
  { icon: React.ReactNode; className: string; label: string }
> = {
  online: { icon: <Wifi className="w-4 h-4" />, className: 'text-green-600', label: 'Online' },
  offline: { icon: <WifiOff className="w-4 h-4" />, className: 'text-gray-500', label: 'Offline' },
  'low-battery': {
    icon: <BatteryWarning className="w-4 h-4" />,
    className: 'text-amber-600',
    label: 'Low Battery',
  },
  error: { icon: <AlertTriangle className="w-4 h-4" />, className: 'text-red-600', label: 'Error' },
};

export default function PatientDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { doctor, signOut } = useDoctor();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [seizures, setSeizures] = useState<SeizureEventWithPatient[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notFound, setNotFound] = useState(false);

  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState('');

  const patientId = params.id;

  const loadPatient = useCallback(async () => {
    if (!doctor || !patientId) return;

    try {
      const [patientData, seizureData, alertData, alertCount, messageCount] = await Promise.all([
        getPatientById(patientId),
        listSeizureEventsForPatient(patientId),
        listAlertsForPatient(patientId),
        getActiveAlertCount(),
        getUnreadMessageCount(doctor.id),
      ]);

      if (!patientData) {
        setNotFound(true);
        return;
      }

      setPatient(patientData);
      setSeizures(seizureData);
      setAlerts(alertData);
      setActiveAlertCount(alertCount);
      setUnreadMessageCount(messageCount);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load patient.');
    } finally {
      setIsLoading(false);
    }
  }, [doctor, patientId]);

  useEffect(() => {
    loadPatient();
  }, [loadPatient]);

  const handleLocateOnMap = async () => {
    if (!patient?.address) return;
    setIsLocating(true);
    setLocateError('');

    try {
      const query = [
        patient.address.houseAddress,
        patient.address.city,
        patient.address.state,
        patient.address.country,
      ]
        .filter(Boolean)
        .join(', ');

      const result = await geocodeAddress(query);
      if (!result) {
        setLocateError('Could not find this address on the map. Try adding more detail.');
        return;
      }

      await updatePatientLocation(patient.id, result);
      setPatient((prev) =>
        prev
          ? {
              ...prev,
              currentLocation: {
                latitude: result.latitude,
                longitude: result.longitude,
                address: result.displayName,
              },
            }
          : prev
      );
    } catch (err) {
      setLocateError(err instanceof Error ? err.message : 'Failed to locate address.');
    } finally {
      setIsLocating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-background items-center justify-center">
        <p className="text-muted-foreground">Loading patient...</p>
      </div>
    );
  }

  if (notFound || loadError || !patient) {
    return (
      <div className="flex h-screen overflow-hidden bg-background items-center justify-center">
        <div className="text-center">
          <p className="text-foreground font-medium mb-2">
            {loadError || 'Patient not found.'}
          </p>
          <button
            onClick={() => router.push('/patients')}
            className="text-sm text-primary hover:underline"
          >
            Back to Patient Roster
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        items={defaultSidebarItems}
        onLogout={signOut}
        alertCount={activeAlertCount}
        messageCount={unreadMessageCount}
      />

      <div className="flex-1 flex flex-col">
        <Header
          doctorName={doctor?.name ?? 'Doctor'}
          notificationCount={activeAlertCount}
          onLogout={signOut}
        />

        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button
              onClick={() => router.push('/patients')}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Patient Roster
            </button>

            {/* Patient Header */}
            <div className="bg-card border border-border rounded-lg p-6 mb-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <PatientAvatar name={patient.name} avatar={patient.photo} size="lg" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl font-bold text-foreground">{patient.name}</h1>
                      <StatusBadge type="patient" value={patient.status} size="sm" />
                      <StatusBadge type="risk" value={patient.riskLevel} size="sm" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {patient.diagnoses.join(', ') || 'No diagnosis on file'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsMapOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <MapPinned className="w-4 h-4" />
                  View on Map
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Personal & Medical Info */}
                <section className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4">Patient Information</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow icon={<Cake className="w-4 h-4" />} label="Date of Birth">
                      {new Date(patient.dateOfBirth).toLocaleDateString()} (
                      {calculateAge(patient.dateOfBirth)} yrs)
                    </InfoRow>
                    <InfoRow icon={<Users2 className="w-4 h-4" />} label="Gender">
                      {patient.gender || '—'}
                    </InfoRow>
                    <InfoRow icon={<Mail className="w-4 h-4" />} label="Email">
                      {patient.email || '—'}
                    </InfoRow>
                    <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone">
                      {patient.phone || '—'}
                    </InfoRow>
                  </div>

                  <div className="border-t border-border mt-4 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow icon={<Activity className="w-4 h-4" />} label="Seizure Frequency">
                      {patient.seizureFrequency || '—'}
                    </InfoRow>
                    <InfoRow icon={<Clock className="w-4 h-4" />} label="Avg. Seizure Duration">
                      {patient.averageSeizureDuration}s
                    </InfoRow>
                    <InfoRow icon={<Heart className="w-4 h-4" />} label="Last Seizure">
                      {patient.lastSeizureDate
                        ? new Date(patient.lastSeizureDate).toLocaleDateString()
                        : 'None recorded'}
                    </InfoRow>
                    <InfoRow icon={<Pill className="w-4 h-4" />} label="Medication Adherence">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-border rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              patient.medicationAdherence >= 80
                                ? 'bg-green-500'
                                : patient.medicationAdherence >= 60
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${patient.medicationAdherence}%` }}
                          />
                        </div>
                        <span>{patient.medicationAdherence}%</span>
                      </div>
                    </InfoRow>
                  </div>
                </section>

                {/* Address */}
                <section className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Address
                  </h2>
                  {patient.address ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InfoRow label="Country">{patient.address.country}</InfoRow>
                      <InfoRow label="City">{patient.address.city}</InfoRow>
                      <InfoRow label="State">{patient.address.state || '—'}</InfoRow>
                      <InfoRow label="House Address">{patient.address.houseAddress}</InfoRow>
                      <InfoRow label="ZIP Code">{patient.address.zipCode || '—'}</InfoRow>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No address on file.</p>
                  )}

                  {!patient.currentLocation && patient.address && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">
                        This address hasn&apos;t been located on the map yet.
                      </p>
                      <button
                        onClick={handleLocateOnMap}
                        disabled={isLocating}
                        className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
                      >
                        {isLocating ? 'Locating...' : 'Try to locate on map'}
                      </button>
                      {locateError && (
                        <p className="text-xs text-destructive mt-1">{locateError}</p>
                      )}
                    </div>
                  )}
                </section>

                {/* Recent Seizures */}
                <section className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4">
                    Recent Seizure Events
                  </h2>
                  {seizures.length > 0 ? (
                    <div className="space-y-3">
                      {seizures.slice(0, 5).map((seizure) => (
                        <div
                          key={seizure.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground capitalize">
                              {seizure.type.replace('-', ' ')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(seizure.startTime).toLocaleString()} ·{' '}
                              {seizure.duration}s
                            </p>
                          </div>
                          <StatusBadge type="severity" value={seizure.severity} size="sm" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No seizure events recorded for this patient.
                    </p>
                  )}
                </section>

                {/* Recent Alerts */}
                <section className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4">Recent Alerts</h2>
                  {alerts.length > 0 ? (
                    <div className="space-y-3">
                      {alerts.slice(0, 5).map((alert) => (
                        <div
                          key={alert.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">{alert.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <StatusBadge type="severity" value={alert.severity} size="sm" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No alerts recorded for this patient.
                    </p>
                  )}
                </section>
              </div>

              {/* Sidebar column */}
              <div className="space-y-6">
                {/* Emergency Contact */}
                <section className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-sm font-bold text-foreground mb-4">Emergency Contact</h2>
                  {patient.emergencyContact ? (
                    <div className="space-y-3 text-sm">
                      <InfoRow label="Full Name">{patient.emergencyContact.fullName}</InfoRow>
                      <InfoRow label="Relation">{patient.emergencyContact.relation}</InfoRow>
                      <InfoRow label="Email">{patient.emergencyContact.email || '—'}</InfoRow>
                      <InfoRow label="Phone">
                        {patient.emergencyContact.phoneCountryCode}{' '}
                        {patient.emergencyContact.phone}
                      </InfoRow>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No emergency contact on file.
                    </p>
                  )}
                </section>

                {/* Devices */}
                <section className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-foreground">Devices</h2>
                    <button
                      onClick={() => setIsAddDeviceOpen(true)}
                      className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Device
                    </button>
                  </div>

                  {patient.devices.length > 0 ? (
                    <div className="space-y-3">
                      {patient.devices.map((device) => {
                        const meta = deviceStatusMeta[device.status];
                        return (
                          <div
                            key={device.id}
                            className="p-3 rounded-lg border border-border"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-foreground">{device.name}</p>
                              <span className={`flex items-center gap-1 text-xs ${meta.className}`}>
                                {meta.icon}
                                {meta.label}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground capitalize">
                              {device.type}
                              {device.batteryLevel != null && ` · ${device.batteryLevel}% battery`}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No devices assigned yet.</p>
                  )}
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* View Map Modal */}
      <Modal
        open={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        title={`${patient.name} — Location`}
        className="max-w-3xl"
      >
        {patient.currentLocation ? (
          <div className="h-[420px]">
            <PatientMap patients={[patient]} alerts={alerts} />
          </div>
        ) : (
          <div className="text-center py-12">
            <MapPinned className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-4">
              This patient hasn&apos;t been located on the map yet.
            </p>
            {patient.address && (
              <button
                onClick={handleLocateOnMap}
                disabled={isLocating}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isLocating ? 'Locating...' : 'Try to locate on map'}
              </button>
            )}
          </div>
        )}
      </Modal>

      <AddDeviceModal
        open={isAddDeviceOpen}
        onClose={() => setIsAddDeviceOpen(false)}
        patientId={patient.id}
        onAdded={(device) =>
          setPatient((prev) =>
            prev ? { ...prev, devices: [...prev.devices, device] } : prev
          )
        }
      />
    </div>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        {icon}
        {label}
      </p>
      <p className="text-sm font-medium text-foreground">{children}</p>
    </div>
  );
}
