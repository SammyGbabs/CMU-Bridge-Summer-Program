'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar, defaultSidebarItems } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { StatusBadge } from '@/components/status-badge';
import { Heart, Filter, Download, Calendar } from 'lucide-react';
import { listSeizureEvents, SeizureEventWithPatient } from '@/lib/supabase/seizures';
import { getActiveAlertCount } from '@/lib/supabase/alerts';
import { getUnreadMessageCount } from '@/lib/supabase/messages';
import { SeizureType } from '@/lib/types';
import { useDoctor } from '@/lib/supabase/use-doctor';

export default function SeizuresPage() {
  const { doctor, signOut } = useDoctor();
  const [seizureEvents, setSeizureEvents] = useState<SeizureEventWithPatient[]>([]);
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<SeizureType | 'all'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    if (!doctor) return;
    let isMounted = true;

    Promise.all([listSeizureEvents(), getActiveAlertCount(), getUnreadMessageCount(doctor.id)])
      .then(([data, alertCount, messageCount]) => {
        if (isMounted) {
          setSeizureEvents(data);
          setActiveAlertCount(alertCount);
          setUnreadMessageCount(messageCount);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load seizure records.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [doctor]);

  const filteredSeizures = useMemo(() => {
    return seizureEvents.filter((seizure) => {
      const matchesSearch = seizure.patientName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'all' || seizure.type === typeFilter;

      const matchesDate =
        (!dateRange.start || seizure.startTime >= new Date(dateRange.start)) &&
        (!dateRange.end || seizure.startTime <= new Date(dateRange.end));

      return matchesSearch && matchesType && matchesDate;
    });
  }, [seizureEvents, searchQuery, typeFilter, dateRange]);

  const stats = {
    total: seizureEvents.length,
    thisWeek: seizureEvents.filter(
      (s) =>
        s.startTime >
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length,
    averageDuration:
      seizureEvents.length === 0
        ? 0
        : Math.round(
            seizureEvents.reduce((sum, s) => sum + s.duration, 0) / seizureEvents.length
          ),
  };

  const getSeizureTypeLabel = (type: SeizureType) => {
    const labels: Record<SeizureType, string> = {
      'tonic-clonic': 'Tonic-Clonic',
      focal: 'Focal',
      absence: 'Absence',
      atonic: 'Atonic',
      myoclonic: 'Myoclonic',
      unknown: 'Unknown',
    };
    return labels[type];
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

        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Seizure Records
              </h1>
              <p className="text-muted-foreground">
                Track and analyze all recorded seizure events
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Total Events
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.total}
                    </p>
                  </div>
                  <Heart className="w-8 h-8 text-red-500" />
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      This Week
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.thisWeek}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Avg. Duration
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.averageDuration}s
                  </p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-card border border-border rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="lg:col-span-2">
                  <input
                    type="text"
                    placeholder="Search by patient name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Type Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as SeizureType | 'all')}
                  className="px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Types</option>
                  <option value="tonic-clonic">Tonic-Clonic</option>
                  <option value="focal">Focal</option>
                  <option value="absence">Absence</option>
                  <option value="atonic">Atonic</option>
                  <option value="myoclonic">Myoclonic</option>
                </select>

                {/* Date Range */}
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                  className="px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="From"
                />

                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value })
                  }
                  className="px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="To"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors text-sm font-medium">
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Seizures Table */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                        Severity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredSeizures.map((seizure) => {
                      return (
                        <tr
                          key={seizure.id}
                          className="hover:bg-secondary/50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-foreground">
                            {new Date(seizure.startTime).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-foreground">
                              {seizure.patientName}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {getSeizureTypeLabel(seizure.type)}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {seizure.duration}s
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge
                              type="severity"
                              value={seizure.severity}
                              size="sm"
                            />
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {seizure.location?.address || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                            {seizure.notes || 'No notes'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {isLoading && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading seizure records...</p>
                </div>
              )}

              {!isLoading && loadError && (
                <div className="text-center py-12">
                  <p className="text-destructive">{loadError}</p>
                </div>
              )}

              {!isLoading && !loadError && filteredSeizures.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No seizure records found matching your criteria.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
