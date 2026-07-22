'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Sidebar, defaultSidebarItems } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { StatCard } from '@/components/dashboard/stat-card';
import { useDoctor } from '@/lib/supabase/use-doctor';
import { getDashboardStats } from '@/lib/supabase/dashboard';
import { listPatients } from '@/lib/supabase/patients';
import { listAlerts } from '@/lib/supabase/alerts';
import {
  Users,
  AlertTriangle,
  Wifi,
  Calendar,
  UserPlus,
  Activity,
  MessageSquare,
  CalendarPlus,
} from 'lucide-react';
import { DashboardStats, Patient, Alert } from '@/lib/types';

const EMPTY_STATS: DashboardStats = {
  totalPatients: 0,
  activeAlerts: 0,
  onlineDevices: 0,
  appointmentsToday: 0,
  pendingMessages: 0,
  seizuresToday: 0,
  deviceIssues: 0,
};

const PatientMap = dynamic(
  () => import('@/components/dashboard/patient-map').then((m) => m.PatientMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full min-h-[420px] rounded-lg border border-border bg-secondary/30 animate-pulse" />
    ),
  }
);

export default function DashboardPage() {
  const { doctor, signOut } = useDoctor();
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (!doctor) return;
    let isMounted = true;

    Promise.all([getDashboardStats(doctor.id), listPatients(), listAlerts()])
      .then(([statsData, patientsData, alertsData]) => {
        if (!isMounted) return;
        setStats(statsData);
        setPatients(patientsData);
        setAlerts(alertsData);
      })
      .catch(() => {
        /* Dashboard tiles simply show zero/empty state on failure. */
      });

    return () => {
      isMounted = false;
    };
  }, [doctor]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        items={defaultSidebarItems}
        onLogout={signOut}
        alertCount={stats.activeAlerts}
        messageCount={stats.pendingMessages}
      />

      <div className="flex-1 flex flex-col">
        <Header doctorName={doctor?.name ?? 'Doctor'} notificationCount={stats.activeAlerts} onLogout={signOut} />

        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-1">
                Dashboard
              </h1>
              <p className="text-muted-foreground">
                Welcome back{doctor?.name ? `, Dr. ${doctor.name.split(' ')[0]}` : ''}.
                Here&apos;s your clinical overview.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                label="Total Patients"
                value={stats.totalPatients}
                icon={<Users className="w-6 h-6" />}
                accentColor="blue"
              />
              <StatCard
                label="Active Alerts"
                value={stats.activeAlerts}
                icon={<AlertTriangle className="w-6 h-6" />}
                accentColor="red"
                onClick={() => {
                  window.location.href = '/alerts';
                }}
              />
              <StatCard
                label="Online Devices"
                value={stats.onlineDevices}
                icon={<Wifi className="w-6 h-6" />}
                accentColor="green"
              />
              <StatCard
                label="Today&apos;s Appointments"
                value={stats.appointmentsToday}
                icon={<Calendar className="w-6 h-6" />}
                accentColor="orange"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {/* Patient Locations Section */}
                <section className="h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-foreground">
                      Patient Locations
                    </h2>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        Alert
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        Monitoring
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        Stable
                      </span>
                    </div>
                  </div>

                  <PatientMap patients={patients} alerts={alerts} />
                </section>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <section className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-sm font-bold text-foreground mb-4">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/patients"
                      className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:border-primary hover:bg-secondary/50 transition-colors text-center"
                    >
                      <UserPlus className="w-5 h-5 text-primary" />
                      <span className="text-xs font-medium text-foreground">
                        Add Patient
                      </span>
                    </Link>
                    <Link
                      href="/seizures"
                      className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:border-primary hover:bg-secondary/50 transition-colors text-center"
                    >
                      <Activity className="w-5 h-5 text-primary" />
                      <span className="text-xs font-medium text-foreground">
                        Log Seizure
                      </span>
                    </Link>
                    <Link
                      href="/messages"
                      className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:border-primary hover:bg-secondary/50 transition-colors text-center"
                    >
                      <MessageSquare className="w-5 h-5 text-primary" />
                      <span className="text-xs font-medium text-foreground">
                        Message
                      </span>
                    </Link>
                    <Link
                      href="/appointments"
                      className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:border-primary hover:bg-secondary/50 transition-colors text-center"
                    >
                      <CalendarPlus className="w-5 h-5 text-primary" />
                      <span className="text-xs font-medium text-foreground">
                        Schedule
                      </span>
                    </Link>
                  </div>
                </section>

                {/* Quick Stats */}
                <section className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-sm font-bold text-foreground mb-4">
                    Quick Overview
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Pending Messages
                      </span>
                      <span className="text-lg font-bold text-foreground">
                        {stats.pendingMessages}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Today&apos;s Seizures
                      </span>
                      <span className="text-lg font-bold text-red-600">
                        {stats.seizuresToday}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Device Issues
                      </span>
                      <span className="text-lg font-bold text-amber-600">
                        {stats.deviceIssues}
                      </span>
                    </div>
                  </div>
                </section>

                {/* Clinic Hours */}
                <section className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-sm font-bold text-foreground mb-4">
                    Your Availability
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mon-Fri</span>
                      <span className="font-medium text-foreground">
                        9AM - 5PM
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Saturday</span>
                      <span className="font-medium text-foreground">Closed</span>
                    </div>
                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">
                        Status
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-sm font-medium text-foreground">
                          Available
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
