import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import clsx from 'clsx';

export default function NotificationToast({ notifications = [], onClose = () => {} }) {
  const iconMap = {
    success: CheckCircle2,
    warning: AlertTriangle,
    error: XCircle,
    info: Info
  };

  const colorMap = {
    success: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    warning: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    error: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
    info: 'text-apple-blue bg-apple-blue/15 border-apple-blue/30'
  };

  return (
    <div className="fixed top-12 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {notifications.map((item) => {
          const Icon = iconMap[item.type || 'info'] || Info;
          const colorClass = colorMap[item.type || 'info'];

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className={clsx(
                'pointer-events-auto p-3.5 rounded-2xl glass-panel border flex items-start gap-3 shadow-apple-lg',
                colorClass
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                {item.title && <h4 className="text-xs font-semibold text-white/95">{item.title}</h4>}
                <p className="text-xs text-white/80 leading-relaxed mt-0.5">{item.message}</p>
              </div>
              <button
                onClick={() => onClose(item.id)}
                className="text-white/40 hover:text-white/80 p-0.5 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
