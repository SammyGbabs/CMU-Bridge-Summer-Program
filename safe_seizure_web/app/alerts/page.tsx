'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar, defaultSidebarItems } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { AlertCard } from '@/components/dashboard/alert-card';
import { StatusBadge } from '@/components/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { listAlerts, acknowledgeAlert, resolveAlert } from '@/lib/supabase/alerts';
import { getUnreadMessageCount } from '@/lib/supabase/messages';
import { Alert } from '@/lib/types';
import { useDoctor } from '@/lib/supabase/use-doctor';

export default function AlertsPage() {
  const { doctor, signOut } = useDoctor();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'acknowledged' | 'resolved'>('active');

  useEffect(() => {
    if (!doctor) return;
    let isMounted = true;

    Promise.all([listAlerts(), getUnreadMessageCount(doctor.id)])
      .then(([data, messageCount]) => {
        if (isMounted) {
          setAlerts(data);
          setUnreadMessageCount(messageCount);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load alerts.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [doctor]);

  const alertsByStatus = useMemo(() => {
    return {
      active: alerts.filter((a) => a.status === 'active'),
      acknowledged: alerts.filter((a) => a.status === 'acknowledged'),
      resolved: alerts.filter((a) => a.status === 'resolved'),
    };
  }, [alerts]);

  const handleAcknowledgeAlert = async (alertId: string) => {
    if (!doctor) return;
    const updated = await acknowledgeAlert(alertId, doctor.id);
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? updated : a)));
  };

  const handleResolveAlert = async (alertId: string) => {
    const updated = await resolveAlert(alertId);
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? updated : a)));
  };

  const stats = {
    critical: alerts.filter((a) => a.severity === 'critical').length,
    high: alerts.filter((a) => a.severity === 'high').length,
    active: alertsByStatus.active.length,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        items={defaultSidebarItems}
        onLogout={signOut}
        alertCount={stats.active}
        messageCount={unreadMessageCount}
      />

      <div className="flex-1 flex flex-col">
        <Header doctorName={doctor?.name ?? 'Doctor'} notificationCount={stats.active} onLogout={signOut} />

        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Alerts & Notifications
              </h1>
              <p className="text-muted-foreground">
                Track and manage all patient alerts and system notifications
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-700 dark:text-red-400 mb-1">
                      Critical
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {stats.critical}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mb-1">
                      High Priority
                    </p>
                    <p className="text-2xl font-bold text-amber-600">{stats.high}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-amber-600" />
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mb-1">
                      Active Alerts
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.active}
                    </p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-card border border-border rounded-lg">
              <div className="border-b border-border">
                <div className="px-6 pt-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTab('active')}
                      className={`px-4 py-2 font-medium text-sm transition-colors ${
                        activeTab === 'active'
                          ? 'text-primary border-b-2 border-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Active ({alertsByStatus.active.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('acknowledged')}
                      className={`px-4 py-2 font-medium text-sm transition-colors ${
                        activeTab === 'acknowledged'
                          ? 'text-primary border-b-2 border-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Acknowledged ({alertsByStatus.acknowledged.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('resolved')}
                      className={`px-4 py-2 font-medium text-sm transition-colors ${
                        activeTab === 'resolved'
                          ? 'text-primary border-b-2 border-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Resolved ({alertsByStatus.resolved.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isLoading ? (
                    <div className="col-span-full text-center py-12">
                      <p className="text-muted-foreground">Loading alerts...</p>
                    </div>
                  ) : loadError ? (
                    <div className="col-span-full text-center py-12">
                      <p className="text-destructive">{loadError}</p>
                    </div>
                  ) : alertsByStatus[activeTab].length > 0 ? (
                    alertsByStatus[activeTab].map((alert) => (
                      <div key={alert.id} className="flex flex-col h-full">
                        <AlertCard
                          alert={alert}
                          onAcknowledge={() => handleAcknowledgeAlert(alert.id)}
                          onClick={() => {}}
                        />
                        {activeTab === 'active' && (
                          <button
                            onClick={() => handleResolveAlert(alert.id)}
                            className="self-end mt-2 px-3 py-2 text-xs font-medium rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <p className="text-muted-foreground">
                        No {activeTab} alerts at this time.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Alert Details Modal Placeholder */}
            <div className="mt-8 bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">
                Alert Management Tips
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    Critical seizure alerts require immediate acknowledgment
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    Device alerts indicate connectivity or battery issues
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    Mark alerts as resolved once the underlying issue is addressed
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
