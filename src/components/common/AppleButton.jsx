import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function AppleButton({
  children,
  onClick,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  loading = false,
  className = '',
  icon: Icon = null,
  type = 'button'
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none select-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2 text-sm rounded-xl gap-2',
    lg: 'px-5 py-2.5 text-base rounded-2xl gap-2.5 shadow-sm'
  };

  const variantStyles = {
    primary: 'bg-apple-blue hover:bg-blue-600 text-white shadow-apple-sm active:bg-blue-700',
    secondary: 'bg-white/10 hover:bg-white/15 text-white/90 border border-white/10 active:bg-white/20 backdrop-blur-md',
    ghost: 'hover:bg-white/10 text-white/80 active:bg-white/15',
    danger: 'bg-apple-red/20 hover:bg-apple-red/30 text-apple-red border border-apple-red/30 active:bg-apple-red/40',
    success: 'bg-apple-green/20 hover:bg-apple-green/30 text-emerald-400 border border-apple-green/30 active:bg-apple-green/40'
  };

  return (
    <motion.button
      type={type}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      className={clsx(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : Icon ? (
        <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      ) : null}
      {children}
    </motion.button>
  );
}
