import React from 'react';
import clsx from 'clsx';

export default function AppleCard({
  children,
  className = '',
  title = null,
  subtitle = null,
  action = null,
  icon: Icon = null,
  hoverable = false,
  onClick = null
}) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'glass-card rounded-2xl p-5 border border-white/10 relative overflow-hidden',
        hoverable && 'cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:border-white/20 active:scale-[0.99]',
        className
      )}
    >
      {(title || subtitle || action || Icon) && (
        <div className="flex items-center justify-between mb-4 pb-1 border-b border-white/5">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-8 h-8 rounded-xl bg-apple-blue/15 border border-apple-blue/30 flex items-center justify-center text-apple-blue">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div>
              {title && <h3 className="text-sm font-semibold text-white/90 tracking-tight">{title}</h3>}
              {subtitle && <p className="text-xs text-white/50">{subtitle}</p>}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
