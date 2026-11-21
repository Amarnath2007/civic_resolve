import React from 'react';
import { ComplaintStatus } from '@/types';

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = {
    Reported: {
      bg: 'bg-slate-100 text-slate-800 border-slate-300',
      dot: 'bg-slate-500',
      label: 'Reported',
    },
    'Under Review': {
      bg: 'bg-blue-50 text-blue-800 border-blue-200',
      dot: 'bg-blue-500',
      label: 'Under Review',
    },
    'In Progress': {
      bg: 'bg-amber-50 text-amber-900 border-amber-300',
      dot: 'bg-amber-600 animate-pulse',
      label: 'In Progress',
    },
    Resolved: {
      bg: 'bg-emerald-50 text-emerald-900 border-emerald-300',
      dot: 'bg-emerald-600',
      label: 'Resolved',
    },
  }[status] || {
    bg: 'bg-slate-50 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    label: status,
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs sm:text-sm px-2.5 py-1',
    lg: 'text-sm sm:text-base px-3 py-1.5 font-medium',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.bg} ${sizeClasses}`}
    >
      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};
