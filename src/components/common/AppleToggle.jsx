import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function AppleToggle({
  checked = false,
  onChange = () => {},
  disabled = false,
  label = null,
  description = null,
  size = 'md' // 'sm' | 'md'
}) {
  const isSm = size === 'sm';

  return (
    <label className={clsx('flex items-center justify-between gap-4 cursor-pointer select-none', disabled && 'opacity-50 cursor-not-allowed')}>
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-sm font-medium text-white/90">{label}</span>}
          {description && <span className="text-xs text-white/50">{description}</span>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={clsx(
          'relative inline-flex flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none',
          isSm ? 'w-9 h-5' : 'w-11 h-6',
          checked ? 'bg-apple-green' : 'bg-white/20'
        )}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={clsx(
            'pointer-events-none inline-block rounded-full bg-white shadow-md transform ring-0 transition-all ease-in-out',
            isSm ? 'w-3.5 h-3.5 mt-[3px]' : 'w-5 h-5 mt-[2px]',
            checked
              ? isSm ? 'ml-[19px]' : 'ml-[22px]'
              : isSm ? 'ml-[3px]' : 'ml-[2px]'
          )}
        />
      </button>
    </label>
  );
}
