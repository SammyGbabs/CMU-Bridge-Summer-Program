import React from 'react';

interface PatientAvatarProps {
  name?: string;
  patient?: {
    name: string;
    photo?: string;
    status?: 'stable' | 'monitoring' | 'alert' | 'online' | 'offline' | 'idle';
  };
  avatar?: string;
  status?: 'online' | 'offline' | 'idle' | 'stable' | 'monitoring' | 'alert';
  size?: 'sm' | 'md' | 'lg';
}

export function PatientAvatar({
  name: providedName,
  patient,
  avatar,
  status,
  size = 'md',
}: PatientAvatarProps) {
  const name = patient?.name || providedName || 'Patient';
  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-xs';
      case 'md':
        return 'w-10 h-10 text-sm';
      case 'lg':
        return 'w-12 h-12 text-base';
      default:
        return 'w-10 h-10 text-sm';
    }
  };

  const getStatusIndicatorSize = () => {
    switch (size) {
      case 'sm':
        return 'w-2 h-2';
      case 'md':
        return 'w-3 h-3';
      case 'lg':
        return 'w-3.5 h-3.5';
      default:
        return 'w-3 h-3';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-green-500 border-green-600';
      case 'offline':
        return 'bg-gray-400 border-gray-500';
      case 'idle':
        return 'bg-amber-500 border-amber-600';
      default:
        return '';
    }
  };

  return (
    <div className="relative">
      <div
        className={`
          ${getSizeClasses()}
          flex items-center justify-center
          rounded-full
          font-bold
          bg-gradient-to-br from-orange-200 to-orange-300
          text-orange-900
          border-2 border-orange-400
        `}
        title={name}
      >
        {avatar || getInitials(name)}
      </div>
      {status && (
        <div
          className={`
            absolute bottom-0 right-0
            ${getStatusIndicatorSize()}
            rounded-full
            border-2 border-white
            ${getStatusColor()}
          `}
          aria-label={`${name} is ${status}`}
        />
      )}
    </div>
  );
}
