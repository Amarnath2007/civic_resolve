import React from 'react';
import { PriorityLevel } from '@/types';
import { AlertOctagon, AlertTriangle, Info, CheckCircle } from 'lucide-react';

interface PriorityBadgeProps {
  priority: PriorityLevel;
  score?: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  score,
  showScore = false,
  size = 'md',
}) => {
  const config = {
    Low: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Low Priority',
      icon: CheckCircle,
    },
    Medium: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
      label: 'Medium Priority',
      icon: Info,
    },
    High: {
      bg: 'bg-orange-50 text-orange-900 border-orange-300',
      dot: 'bg-orange-600',
      label: 'High Priority',
      icon: AlertTriangle,
    },
    Critical: {
      bg: 'bg-rose-50 text-rose-900 border-rose-300',
      dot: 'bg-rose-600',
      label: 'Critical Priority',
      icon: AlertOctagon,
    },
  }[priority] || {
    bg: 'bg-slate-50 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    label: priority,
    icon: Info,
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs sm:text-sm px-2.5 py-1',
    lg: 'text-sm sm:text-base px-3 py-1.5 font-medium',
  }[size];

  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.bg} ${sizeClasses}`}
      aria-label={`Priority: ${config.label}`}
    >
      <IconComponent className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{config.label}</span>
      {showScore && typeof score === 'number' && (
        <span className="ml-1 opacity-75 font-mono text-[11px]">({score}/100)</span>
      )}
    </span>
  );
};
