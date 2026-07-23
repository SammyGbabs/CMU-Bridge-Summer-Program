import { AlertSeverity, PatientStatus, DeviceStatus, RiskLevel } from '@/lib/types';

interface StatusBadgeProps {
  type: 'severity' | 'patient' | 'device' | 'risk';
  value: AlertSeverity | PatientStatus | DeviceStatus | RiskLevel;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ type, value, size = 'md' }: StatusBadgeProps) {
  const getStyles = () => {
    switch (type) {
      case 'severity':
        switch (value) {
          case 'critical':
            return 'bg-red-100 text-red-700 border-red-300';
          case 'high':
            return 'bg-orange-100 text-orange-700 border-orange-300';
          case 'medium':
            return 'bg-amber-100 text-amber-700 border-amber-300';
          case 'low':
            return 'bg-blue-100 text-blue-700 border-blue-300';
          default:
            return 'bg-gray-100 text-gray-700 border-gray-300';
        }
      case 'patient':
        switch (value) {
          case 'alert':
            return 'bg-red-100 text-red-700 border-red-300';
          case 'monitoring':
            return 'bg-amber-100 text-amber-700 border-amber-300';
          case 'stable':
            return 'bg-green-100 text-green-700 border-green-300';
          case 'offline':
            return 'bg-gray-100 text-gray-700 border-gray-300';
          default:
            return 'bg-gray-100 text-gray-700 border-gray-300';
        }
      case 'device':
        switch (value) {
          case 'online':
            return 'bg-green-100 text-green-700 border-green-300';
          case 'offline':
            return 'bg-gray-100 text-gray-700 border-gray-300';
          case 'low-battery':
            return 'bg-amber-100 text-amber-700 border-amber-300';
          case 'error':
            return 'bg-red-100 text-red-700 border-red-300';
          default:
            return 'bg-gray-100 text-gray-700 border-gray-300';
        }
      case 'risk':
        switch (value) {
          case 'critical':
            return 'bg-red-100 text-red-700 border-red-300';
          case 'high':
            return 'bg-orange-100 text-orange-700 border-orange-300';
          case 'medium':
            return 'bg-amber-100 text-amber-700 border-amber-300';
          case 'low':
            return 'bg-green-100 text-green-700 border-green-300';
          default:
            return 'bg-gray-100 text-gray-700 border-gray-300';
        }
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'md':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-1.5 text-sm';
    }
  };

  const getLabel = () => {
    if (type === 'patient' && value === 'monitoring') return 'Monitoring';
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  return (
    <span
      className={`inline-block border rounded-full font-medium ${getSizeClasses()} ${getStyles()}`}
      aria-label={`${type} status: ${value}`}
    >
      {getLabel()}
    </span>
  );
}
