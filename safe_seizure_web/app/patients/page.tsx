'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar, defaultSidebarItems } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { StatusBadge } from '@/components/status-badge';
import { PatientAvatar } from '@/components/patient-avatar';
import { RegisterPatientModal } from '@/components/patients/register-patient-modal';
import { Search, Filter, Download, Plus } from 'lucide-react';
import { listPatients } from '@/lib/supabase/patients';
import { getActiveAlertCount } from '@/lib/supabase/alerts';
import { getUnreadMessageCount } from '@/lib/supabase/messages';
import { Patient, RiskLevel, PatientStatus } from '@/lib/types';
import { useDoctor } from '@/lib/supabase/use-doctor';

export default function PatientsPage() {
  const { doctor, signOut } = useDoctor();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<PatientStatus | 'all'>('all');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  useEffect(() => {
    if (!doctor) return;
    let isMounted = true;

    Promise.all([listPatients(), getActiveAlertCount(), getUnreadMessageCount(doctor.id)])
      .then(([patientsData, alertCount, messageCount]) => {
        if (isMounted) {
          setPatients(patientsData);
          setActiveAlertCount(alertCount);
          setUnreadMessageCount(messageCount);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load patients.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [doctor]);

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesSearch =
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.diagnoses[0]?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRisk = riskFilter === 'all' || patient.riskLevel === riskFilter;
      const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;

      return matchesSearch && matchesRisk && matchesStatus;
    });
  }, [patients, searchQuery, riskFilter, statusFilter]);

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

        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Patient Roster
              </h1>
              <p className="text-muted-foreground">
                Manage and monitor all your patients
              </p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Total Patients</p>
                <p className="text-2xl font-bold text-foreground">{patients.length}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Requiring Attention</p>
                <p className="text-2xl font-bold text-red-600">
                  {patients.filter((p) => p.status !== 'stable').length}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Avg. Adherence</p>
                <p className="text-2xl font-bold text-green-600">
                  {patients.length === 0
                    ? 0
                    : Math.round(
                        patients.reduce((sum, p) => sum + p.medicationAdherence, 0) /
                          patients.length
                      )}
                  %
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-card border border-border rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search by name or diagnosis..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Risk Filter */}
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value as RiskLevel | 'all')}
                  className="px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                  <option value="critical">Critical Risk</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as PatientStatus | 'all')}
                  className="px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Statuses</option>
                  <option value="stable">Stable</option>
                  <option value="monitoring">Monitoring</option>
                  <option value="alert">Alert</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setIsRegisterOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Patient
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors text-sm font-medium">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>

            {/* Patients Table */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                        Diagnosis
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                        Risk Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                        Adherence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                        Last Seizure
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                        Devices
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredPatients.map((patient) => (
                      <tr
                        key={patient.id}
                        className="hover:bg-secondary/50 transition-colors cursor-pointer"
                        onClick={() => {
                          window.location.href = `/patients/${patient.id}`;
                        }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <PatientAvatar
                              name={patient.name}
                              avatar={patient.photo}
                              size="md"
                            />
                            <div>
                              <p className="font-medium text-foreground">
                                {patient.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(patient.dateOfBirth).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-foreground">
                            {patient.diagnoses.join(', ')}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge
                            type="patient"
                            value={patient.status}
                            size="sm"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge
                            type="risk"
                            value={patient.riskLevel}
                            size="sm"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-border rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  patient.medicationAdherence >= 80
                                    ? 'bg-green-500'
                                    : patient.medicationAdherence >= 60
                                      ? 'bg-amber-500'
                                      : 'bg-red-500'
                                }`}
                                style={{
                                  width: `${patient.medicationAdherence}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-medium text-foreground">
                              {patient.medicationAdherence}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {patient.lastSeizureDate
                            ? new Date(patient.lastSeizureDate).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-foreground">
                            {patient.devices.length}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {isLoading && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading patients...</p>
                </div>
              )}

              {!isLoading && loadError && (
                <div className="text-center py-12">
                  <p className="text-destructive">{loadError}</p>
                </div>
              )}

              {!isLoading && !loadError && filteredPatients.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {patients.length === 0
                      ? 'No patients yet. Click "Add Patient" to register your first one.'
                      : 'No patients found matching your criteria.'}
                  </p>
                </div>
              )}
            </div>

            <RegisterPatientModal
              open={isRegisterOpen}
              onClose={() => setIsRegisterOpen(false)}
              onRegister={(newPatient) => setPatients((prev) => [newPatient, ...prev])}
              doctorId={doctor?.id ?? ''}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
