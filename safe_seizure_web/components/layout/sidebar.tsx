'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  AlertCircle,
  Heart,
  Pill,
  MessageSquare,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Stethoscope,
} from 'lucide-react';

export interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarProps {
  items?: SidebarItem[];
  onLogout?: () => void;
  alertCount?: number;
  messageCount?: number;
}

export function Sidebar({
  items: providedItems,
  onLogout,
  alertCount,
  messageCount,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  /* Default navigation items */
  const defaultItems: SidebarItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Patients', href: '/patients', icon: <Users className="w-5 h-5" /> },
    { label: 'Alerts', href: '/alerts', icon: <AlertCircle className="w-5 h-5" /> },
    { label: 'Seizures', href: '/seizures', icon: <Heart className="w-5 h-5" /> },
    { label: 'Medications', href: '/medications', icon: <Pill className="w-5 h-5" /> },
    { label: 'Messages', href: '/messages', icon: <MessageSquare className="w-5 h-5" /> },
    { label: 'Appointments', href: '/appointments', icon: <Calendar className="w-5 h-5" /> },
    { label: 'Analytics', href: '/analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Audit Logs', href: '/audits', icon: <Stethoscope className="w-5 h-5" /> },
  ];

  const items = providedItems || defaultItems;

  const badgeForItem = (item: SidebarItem) => {
    if (item.href === '/alerts') return alertCount ?? item.badge;
    if (item.href === '/messages') return messageCount ?? item.badge;
    return item.badge;
  };

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-screen
          bg-sidebar
          transition-all duration-300 ease-in-out
          z-50
          flex flex-col
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* Header */}
        <div className="relative flex items-center justify-center p-4 border-b border-sidebar-border h-20">
          {!isCollapsed && (
            <div className="flex items-center justify-center bg-foreground rounded-lg px-5 py-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="SafeSeizure"
                className="h-16 w-auto object-contain"
              />
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-primary/10 rounded-md transition-colors lg:hidden"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? (
              <Menu className="w-5 h-5" />
            ) : (
              <X className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-2">
          {items.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const badge = badgeForItem(item);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5
                  rounded-lg transition-all duration-200
                  group
                  ${isActive ? 'bg-primary/10' : 'hover:bg-primary/10'}
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? item.label : undefined}
              >
                <span
                  className={`flex-shrink-0 ${
                    isActive
                      ? 'text-primary'
                      : 'text-sidebar-foreground group-hover:text-primary'
                  }`}
                >
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <>
                    <span
                      className={`text-sm font-medium flex-1 ${
                        isActive
                          ? 'text-primary font-semibold'
                          : 'text-sidebar-foreground group-hover:text-primary'
                      }`}
                    >
                      {item.label}
                    </span>
                    {!!badge && badge > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          <Link
            href="/settings"
            className={`
              flex items-center gap-3 px-3 py-2.5
              rounded-lg transition-all duration-200
              group
              ${pathname === '/settings' || pathname?.startsWith('/settings/') ? 'bg-primary/10' : 'hover:bg-primary/10'}
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title={isCollapsed ? 'Settings' : undefined}
          >
            <Settings
              className={`w-5 h-5 flex-shrink-0 ${
                pathname === '/settings' || pathname?.startsWith('/settings/')
                  ? 'text-primary'
                  : 'text-sidebar-foreground group-hover:text-primary'
              }`}
            />
            {!isCollapsed && (
              <span
                className={`text-sm font-medium ${
                  pathname === '/settings' || pathname?.startsWith('/settings/')
                    ? 'text-primary font-semibold'
                    : 'text-sidebar-foreground group-hover:text-primary'
                }`}
              >
                Settings
              </span>
            )}
          </Link>
        </div>
      </aside>

      {/* Spacer for main content */}
      <div className={`${isCollapsed ? 'ml-20' : 'ml-64'}`} />
    </>
  );
}

export const defaultSidebarItems: SidebarItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'Patients',
    href: '/patients',
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: 'Alerts',
    href: '/alerts',
    icon: <AlertCircle className="w-5 h-5" />,
  },
  {
    label: 'Seizure Records',
    href: '/seizures',
    icon: <Heart className="w-5 h-5" />,
  },
  {
    label: 'Messages',
    href: '/messages',
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    label: 'Appointments',
    href: '/appointments',
    icon: <Calendar className="w-5 h-5" />,
  },
];
