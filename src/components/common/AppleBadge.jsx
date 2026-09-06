import React from 'react';
import clsx from 'clsx';

export default function AppleBadge({
  status = 'OFFLINE', // 'ONLINE' | 'RUNNING' | 'STARTING' | 'STOPPING' | 'OFFLINE'
  size = 'md',
  showDot = true,
  children = null
}) {
  const normalized = status.toUpperCase();

  const statusConfig = {
    RUNNING: {
      label: 'RUNNING',
      dotClass: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,199,89,0.8)] animate-pulse',
      bgClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    },
    ONLINE: {
      label: 'ONLINE',
      dotClass: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,199,89,0.8)] animate-pulse',
      bgClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    },
    STARTING: {
      label: 'STARTING...',
      dotClass: 'bg-amber-400 shadow-[0_0_8px_rgba(255,204,0,0.8)] animate-spin',
      bgClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    },
    STOPPING: {
      label: 'STOPPING...',
      dotClass: 'bg-orange-400 shadow-[0_0_8px_rgba(255,149,0,0.8)] animate-pulse',
      bgClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30'
    },
    OFFLINE: {
      label: 'OFFLINE',
      dotClass: 'bg-white/40',
      bgClass: 'bg-white/10 text-white/60 border-white/10'
    }
  };

  const config = statusConfig[normalized] || statusConfig.OFFLINE;

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium border rounded-full backdrop-blur-md select-none',
        size === 'sm' ? 'px-2 py-0.5 text-[11px] gap-1.5' : 'px-2.5 py-1 text-xs gap-2',
        config.bgClass
      )}
    >
      {showDot && (
        <span className={clsx('rounded-full', size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2', config.dotClass)} />
      )}
      <span>{children || config.label}</span>
    </span>
  );
}
