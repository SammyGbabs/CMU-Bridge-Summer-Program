import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onClick?: () => void;
  className?: string;
  accentColor?: 'orange' | 'green' | 'red' | 'blue' | 'purple';
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  trendValue,
  onClick,
  className = '',
  accentColor = 'orange',
}: StatCardProps) {
  const accentColors = {
    orange: 'text-orange-500 bg-orange-50 dark:bg-orange-950/20',
    green: 'text-green-500 bg-green-50 dark:bg-green-950/20',
    red: 'text-red-500 bg-red-50 dark:bg-red-950/20',
    blue: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20',
    purple: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20',
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-card border border-border rounded-xl p-6
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:border-primary hover:shadow-md' : ''}
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <div className="flex items-end gap-2">
            <p className="text-2xl sm:text-3xl font-bold text-foreground">
              {value}
            </p>
            {trend && trendValue && (
              <div
                className={`flex items-center gap-1 mb-1 ${
                  trend === 'up'
                    ? 'text-green-600'
                    : trend === 'down'
                      ? 'text-red-600'
                      : 'text-gray-600'
                }`}
              >
                {trend === 'up' && <TrendingUp className="w-4 h-4" />}
                {trend === 'down' && <TrendingDown className="w-4 h-4" />}
                <span className="text-xs font-medium">{trendValue}</span>
              </div>
            )}
          </div>
        </div>
        {icon && (
          <div className={`p-3 rounded-lg ${accentColors[accentColor]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
