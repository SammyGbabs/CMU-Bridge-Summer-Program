'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Sidebar, defaultSidebarItems } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { StatCard } from '@/components/dashboard/stat-card';
import { PatientAvatar } from '@/components/patient-avatar';
import { listAppointments, AppointmentWithPatient } from '@/lib/supabase/appointments';
import { getActiveAlertCount } from '@/lib/supabase/alerts';
import { getUnreadMessageCount } from '@/lib/supabase/messages';
import { ScheduleAppointmentModal } from '@/components/appointments/schedule-appointment-modal';
import { useDoctor } from '@/lib/supabase/use-doctor';

export default function AppointmentsPage() {
  const { doctor, signOut } = useDoctor();
  const [appointmentsWithPatients, setAppointmentsWithPatients] = useState<
    AppointmentWithPatient[]
  >([]);
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  useEffect(() => {
    if (!doctor) return;
    let isMounted = true;

    Promise.all([
      listAppointments(doctor.id),
      getActiveAlertCount(),
      getUnreadMessageCount(doctor.id),
    ])
      .then(([data, alertCount, messageCount]) => {
        if (isMounted) {
          setAppointmentsWithPatients(data);
          setActiveAlertCount(alertCount);
          setUnreadMessageCount(messageCount);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load appointments.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [doctor]);

  /* Filter appointments by status */
  const filteredAppointments = appointmentsWithPatients.filter(
    (apt) => selectedStatus === 'all' || apt.status === selectedStatus
  );

  /* Calculate statistics */
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayAppointments = appointmentsWithPatients.filter((apt) => {
    const aptDate = new Date(apt.startTime);
    aptDate.setHours(0, 0, 0, 0);
    return aptDate.getTime() === today.getTime();
  });

  const upcomingAppointments = appointmentsWithPatients.filter(
    (apt) => apt.status === 'scheduled' && apt.startTime > new Date()
  );

  const completedAppointments = appointmentsWithPatients.filter(
    (apt) => apt.status === 'completed'
  );

  /* Get appointment type color */
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'follow-up':
        return 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-100';
      case 'medication-review':
        return 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-100';
      case 'initial':
        return 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-100';
      default:
        return 'bg-gray-100 dark:bg-gray-950/30 text-gray-700 dark:text-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-100';
      case 'completed':
        return 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-100';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-100';
      default:
        return 'bg-gray-100 dark:bg-gray-950/30 text-gray-700 dark:text-gray-100';
    }
  };

  /* Format time range */
  const formatTimeRange = (start: Date, end: Date) => {
    const startTime = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${startTime} - ${endTime}`;
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
        <Header doctorName={doctor?.name ?? 'Doctor'} notificationCount={activeAlertCount} onLogout={signOut} />

        <main className="flex-1 overflow-auto p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  <Calendar className="w-8 h-8 text-primary" />
                  Appointments
                </h1>
                <p className="text-muted-foreground mt-1">
                  Schedule and manage patient consultations
                </p>
              </div>
              <button
                onClick={() => setIsScheduleOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
              >
                <Plus className="w-5 h-5" />
                Schedule Appointment
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8">
            <StatCard
              label="Today's Appointments"
              value={todayAppointments.length.toString()}
              icon={<Calendar className="w-6 h-6" />}
            />
            <StatCard
              label="Upcoming"
              value={upcomingAppointments.length.toString()}
              icon={<Clock className="w-6 h-6" />}
            />
            <StatCard
              label="Completed"
              value={completedAppointments.length.toString()}
              icon={<CheckCircle2 className="w-6 h-6" />}
            />
          </div>

          {/* View Mode Selector */}
          <div className="bg-card rounded-xl border border-border p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                  className="p-2 hover:bg-secondary rounded-lg transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-semibold text-foreground min-w-48">
                  {currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                </h3>
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                  className="p-2 hover:bg-secondary rounded-lg transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <div className="flex gap-2">
                {(['month', 'week', 'day'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      viewMode === mode
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div className="bg-card rounded-xl border border-border p-4 mb-6">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-foreground">Filter by Status:</label>
              <div className="flex gap-2">
                {(['all', 'scheduled', 'completed', 'cancelled'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                      selectedStatus === status
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Appointments List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-12 bg-card rounded-xl border border-border">
                <p className="text-muted-foreground">Loading appointments...</p>
              </div>
            ) : loadError ? (
              <div className="flex items-center justify-center p-12 bg-card rounded-xl border border-border">
                <p className="text-destructive">{loadError}</p>
              </div>
            ) : filteredAppointments.length > 0 ? (
              filteredAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <PatientAvatar patient={apt.patient} size="lg" />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground">{apt.patientName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {apt.patient?.diagnoses?.[0] || 'Patient consultation'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getTypeColor(apt.type)}`}>
                        {apt.type.replace('-', ' ').toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getStatusColor(apt.status)}`}>
                        {apt.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Appointment Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-secondary/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Date</p>
                        <p className="text-sm font-medium text-foreground">
                          {apt.startTime.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Time</p>
                        <p className="text-sm font-medium text-foreground">
                          {formatTimeRange(apt.startTime, apt.endTime)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="text-sm font-medium text-foreground">
                          {apt.location || 'Telehealth / Virtual'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Notes & Actions */}
                  {apt.notes && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700 dark:text-blue-200">
                        <strong>Notes:</strong> {apt.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4">
                    <button className="text-sm text-muted-foreground hover:text-foreground transition">
                      View Details
                    </button>
                    {apt.status === 'scheduled' && (
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-sm bg-secondary text-foreground rounded hover:bg-secondary/80 transition">
                          Reschedule
                        </button>
                        <button className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-100 rounded hover:bg-red-200 dark:hover:bg-red-950/50 transition">
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center p-12 bg-card rounded-xl border border-border">
                <div className="text-center">
                  <Calendar className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-muted-foreground">No appointments found</p>
                </div>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="mt-8 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-lg p-6">
            <div className="flex gap-4">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  Appointment Management Tips
                </h3>
                <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                  <li>• Send appointment reminders 24 hours in advance</li>
                  <li>• Allow buffer time between appointments for notes and transitions</li>
                  <li>• Confirm high-risk patients&apos; attendance before appointment time</li>
                  <li>• Keep detailed notes on appointment outcomes for continuity of care</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>

      {doctor && (
        <ScheduleAppointmentModal
          open={isScheduleOpen}
          onClose={() => setIsScheduleOpen(false)}
          onScheduled={(appointment) =>
            setAppointmentsWithPatients((prev) =>
              [...prev, appointment].sort(
                (a, b) => a.startTime.getTime() - b.startTime.getTime()
              )
            )
          }
          doctorId={doctor.id}
        />
      )}
    </div>
  );
}
