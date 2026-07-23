'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar, defaultSidebarItems } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { PatientAvatar } from '@/components/patient-avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Stethoscope,
  Building2,
  BadgeCheck,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Users,
} from 'lucide-react';
import { useDoctor, DoctorAvailability } from '@/lib/supabase/use-doctor';
import { updateDoctorProfile, updatePassword } from '@/lib/supabase/doctor';
import { listPatients } from '@/lib/supabase/patients';
import { getActiveAlertCount } from '@/lib/supabase/alerts';
import { getUnreadMessageCount } from '@/lib/supabase/messages';

const DAYS: { key: keyof DoctorAvailability; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export default function SettingsPage() {
  const { doctor, loading, signOut, refresh } = useDoctor();

  const [patientCount, setPatientCount] = useState(0);
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [facility, setFacility] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [availability, setAvailability] = useState<DoctorAvailability>({});

  const [profileError, setProfileError] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (!doctor) return;

    setName(doctor.name);
    setSpecialization(doctor.specialization ?? '');
    setFacility(doctor.facility ?? '');
    setLicenseNumber(doctor.licenseNumber ?? '');
    setIsAvailable(doctor.isAvailable);
    setAvailability(doctor.availability ?? {});

    let isMounted = true;
    Promise.all([listPatients(), getActiveAlertCount(), getUnreadMessageCount(doctor.id)]).then(
      ([patients, alertCount, messageCount]) => {
        if (!isMounted) return;
        setPatientCount(patients.length);
        setActiveAlertCount(alertCount);
        setUnreadMessageCount(messageCount);
      }
    );

    return () => {
      isMounted = false;
    };
  }, [doctor]);

  const handleSaveProfile = async () => {
    if (!doctor) return;
    if (!name.trim()) {
      setProfileError('Full name is required');
      return;
    }

    setIsSavingProfile(true);
    setProfileError('');
    setProfileSaved(false);

    try {
      await updateDoctorProfile(doctor.id, {
        name: name.trim(),
        specialization: specialization.trim() || undefined,
        facility: facility.trim() || undefined,
        licenseNumber: licenseNumber.trim() || undefined,
        isAvailable,
        availability,
      });
      await refresh();
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    setPasswordError('');
    setPasswordSaved(false);

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsSavingPassword(true);
    try {
      await updatePassword(newPassword);
      setPasswordSaved(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSaved(false), 2500);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

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
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-1">Settings</h1>
              <p className="text-muted-foreground">
                Manage your profile, availability, and account security
              </p>
            </div>

            {loading ? (
              <p className="text-muted-foreground">Loading settings...</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Overview */}
                <div className="space-y-6">
                  <section className="bg-card border border-border rounded-lg p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <PatientAvatar name={doctor?.name} size="lg" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground">{doctor?.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {doctor?.specialization || 'Specialization not set'}
                    </p>

                    <div className="mt-4 flex items-center justify-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isAvailable ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                      <span className="text-sm font-medium text-foreground">
                        {isAvailable ? 'Available for new patients' : 'Not accepting new patients'}
                      </span>
                    </div>

                    <div className="mt-6 pt-6 border-t border-border grid grid-cols-2 gap-4 text-left">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Email</p>
                        <p className="text-sm font-medium text-foreground truncate">
                          {doctor?.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Member Since</p>
                        <p className="text-sm font-medium text-foreground">
                          {doctor?.createdAt
                            ? new Date(doctor.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{patientCount}</p>
                        <p className="text-xs text-muted-foreground">Patients under your care</p>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Settings Tabs */}
                <div className="lg:col-span-2">
                  <div className="bg-card border border-border rounded-lg">
                    <Tabs defaultValue="profile">
                      <div className="px-6 pt-4">
                        <TabsList>
                          <TabsTrigger value="profile">Profile</TabsTrigger>
                          <TabsTrigger value="availability">Availability</TabsTrigger>
                          <TabsTrigger value="security">Security</TabsTrigger>
                        </TabsList>
                      </div>

                      <div className="p-6">
                        <TabsContent value="profile">
                          <div className="space-y-4">
                            <Field label="Full Name" icon={<User className="w-4 h-4" />} required>
                              <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={inputClass()}
                                placeholder="Dr. Jane Doe"
                              />
                            </Field>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <Field
                                label="Specialization"
                                icon={<Stethoscope className="w-4 h-4" />}
                              >
                                <input
                                  type="text"
                                  value={specialization}
                                  onChange={(e) => setSpecialization(e.target.value)}
                                  className={inputClass()}
                                  placeholder="Neurology"
                                />
                              </Field>
                              <Field label="Facility" icon={<Building2 className="w-4 h-4" />}>
                                <input
                                  type="text"
                                  value={facility}
                                  onChange={(e) => setFacility(e.target.value)}
                                  className={inputClass()}
                                  placeholder="Central Medical Center"
                                />
                              </Field>
                            </div>

                            <Field
                              label="License Number"
                              icon={<BadgeCheck className="w-4 h-4" />}
                            >
                              <input
                                type="text"
                                value={licenseNumber}
                                onChange={(e) => setLicenseNumber(e.target.value)}
                                className={inputClass()}
                                placeholder="MD-12345678"
                              />
                            </Field>

                            <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isAvailable}
                                onChange={(e) => setIsAvailable(e.target.checked)}
                                className="w-4 h-4 rounded border border-border"
                              />
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  Available for new patients
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Shown on your dashboard and to your care team
                                </p>
                              </div>
                            </label>
                          </div>
                        </TabsContent>

                        <TabsContent value="availability">
                          <div className="space-y-3">
                            <div>
                              <h3 className="text-sm font-semibold text-foreground mb-1">
                                Weekly Hours
                              </h3>
                              <p className="text-xs text-muted-foreground mb-4">
                                Enter hours as e.g. "09:00-17:00", or leave blank / write "Closed"
                                for days off.
                              </p>
                            </div>
                            {DAYS.map(({ key, label }) => (
                              <div key={key} className="flex items-center gap-4">
                                <label className="w-28 flex-shrink-0 text-sm font-medium text-foreground">
                                  {label}
                                </label>
                                <div className="relative flex-1">
                                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <input
                                    type="text"
                                    value={availability[key] ?? ''}
                                    onChange={(e) =>
                                      setAvailability((prev) => ({
                                        ...prev,
                                        [key]: e.target.value,
                                      }))
                                    }
                                    placeholder="Closed"
                                    className={`${inputClass()} pl-9`}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="security">
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-primary" />
                                Change Password
                              </h3>
                              <p className="text-xs text-muted-foreground mb-4">
                                Choose a strong password you don&apos;t use elsewhere.
                              </p>
                            </div>

                            <Field label="New Password">
                              <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className={inputClass()}
                                placeholder="••••••••"
                              />
                            </Field>
                            <Field label="Confirm New Password">
                              <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={inputClass()}
                                placeholder="••••••••"
                              />
                            </Field>

                            {passwordError && (
                              <FormMessage tone="error">{passwordError}</FormMessage>
                            )}
                            {passwordSaved && (
                              <FormMessage tone="success">
                                Password updated successfully.
                              </FormMessage>
                            )}

                            <button
                              type="button"
                              onClick={handleUpdatePassword}
                              disabled={isSavingPassword}
                              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                              {isSavingPassword ? 'Updating...' : 'Update Password'}
                            </button>

                            <div className="pt-4 border-t border-border">
                              <p className="text-xs text-muted-foreground">
                                Doctor ID:{' '}
                                <span className="font-mono text-foreground">{doctor?.id}</span>
                              </p>
                            </div>
                          </div>
                        </TabsContent>
                      </div>
                    </Tabs>

                    {/* Shared save bar for Profile + Availability */}
                    <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-border">
                      <div className="flex-1">
                        {profileError && <FormMessage tone="error">{profileError}</FormMessage>}
                        {profileSaved && (
                          <FormMessage tone="success">Changes saved.</FormMessage>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex-shrink-0"
                      >
                        {isSavingProfile ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  required,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
        {icon}
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}

function FormMessage({
  tone,
  children,
}: {
  tone: 'error' | 'success';
  children: React.ReactNode;
}) {
  const Icon = tone === 'error' ? AlertCircle : CheckCircle2;
  return (
    <div
      className={`flex items-center gap-2 text-sm ${
        tone === 'error' ? 'text-destructive' : 'text-accent'
      }`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {children}
    </div>
  );
}

function inputClass() {
  return 'w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm';
}
