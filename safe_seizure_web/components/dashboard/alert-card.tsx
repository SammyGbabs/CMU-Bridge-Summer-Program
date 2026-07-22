import React from 'react';
import { Alert } from '@/lib/types';
import { StatusBadge } from '../status-badge';
import { Clock, ChevronRight, AlertTriangle } from 'lucide-react';

interface AlertCardProps {
  alert: Alert;
  onClick?: () => void;
  onAcknowledge?: (alertId: string) => void;
}

export function AlertCard({ alert, onClick, onAcknowledge }: AlertCardProps) {
  const getIcon = () => {
    switch (alert.type) {
      case 'seizure':
        return <AlertTriangle className="w-5 h-5" />;
      case 'device':
        return '📱';
      case 'medication':
        return '💊';
      case 'appointment':
        return '📅';
      default:
        return '⚠️';
    }
  };

  const getTypeLabel = () => {
    return alert.type.charAt(0).toUpperCase() + alert.type.slice(1);
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div
      className={`
        bg-card border rounded-lg p-4 transition-all duration-200
        ${
          alert.status === 'active'
            ? 'border-red-300'
            : alert.status === 'acknowledged'
              ? 'border-amber-300'
              : 'border-border'
        }
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`
            flex-shrink-0 p-2 rounded-lg
            ${
              alert.status === 'active'
                ? 'bg-red-100 text-red-600 dark:bg-red-900/50'
                : alert.status === 'acknowledged'
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/50'
                  : 'bg-blue-100 text-blue-600 dark:bg-blue-900/50'
            }
          `}
        >
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <p className="font-semibold text-foreground text-sm sm:text-base">
                {alert.title}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {getTypeLabel()}
              </p>
            </div>
            <StatusBadge
              type="severity"
              value={alert.severity}
              size="sm"
            />
          </div>

          <p className="text-sm text-foreground mb-3 line-clamp-2">
            {alert.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo(alert.timestamp)}
              </span>
              <StatusBadge
                type="severity"
                value={alert.severity === 'critical' ? 'critical' : 'high'}
                size="sm"
              />
            </div>

            {alert.status === 'active' && onAcknowledge && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAcknowledge(alert.id);
                }}
                className="text-xs font-medium px-3 py-1 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Acknowledge
              </button>
            )}
            {onClick && (
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
