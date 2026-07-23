'use client';

import React, { useState } from 'react';
import { Search, Bell, Settings, User, LogOut } from 'lucide-react';
import { PatientAvatar } from '../patient-avatar';

interface HeaderProps {
  doctorName: string;
  onSearch?: (query: string) => void;
  onLogout?: () => void;
  notificationCount?: number;
}

export function Header({
  doctorName,
  onSearch,
  onLogout,
  notificationCount = 0,
}: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border h-20">
      <div className="h-full px-6 flex items-center justify-between gap-4">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search patients, alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </form>

        {/* Right Side - Notifications and Profile */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button
            className="relative p-2 hover:bg-secondary rounded-lg transition-colors"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-foreground" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 p-2 hover:bg-secondary rounded-lg transition-colors"
              aria-label="Profile menu"
            >
              <PatientAvatar name={doctorName} size="sm" status="online" />
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-foreground">{doctorName}</p>
                <p className="text-xs text-muted-foreground">Dr.</p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg py-1">
                <button
                  className="w-full text-left px-4 py-2 hover:bg-secondary flex items-center gap-2 text-foreground"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-secondary flex items-center gap-2 text-foreground"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-secondary flex items-center gap-2 text-red-600"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout?.();
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
