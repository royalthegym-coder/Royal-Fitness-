import React, { useEffect, useState } from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useNetworkStatus();
  const [updateBanner, setUpdateBanner] = useState<string | null>(null);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setUpdateBanner('Back Online · Syncing latest Fitness Future updates...');
      const timer = setTimeout(() => {
        setUpdateBanner(null);
        setWasOffline(false);
      }, 3800);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  useEffect(() => {
    const handleAppUpdated = () => {
      setUpdateBanner('Fitness Future auto-updated to the latest version.');
      setTimeout(() => setUpdateBanner(null), 4000);
    };
    window.addEventListener('fitness-app-updated', handleAppUpdated);
    return () => window.removeEventListener('fitness-app-updated', handleAppUpdated);
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          key="offline-bar"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[9999] pt-safe bg-gradient-to-r from-amber-600 to-amber-500 text-zinc-950 shadow-xl"
        >
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span className="text-xs font-bold tracking-wide">
              Offline Mode Active — Saved data & workouts are ready. Changes will auto-sync when online.
            </span>
          </div>
        </motion.div>
      )}
      {isOnline && updateBanner && (
        <motion.div
          key="update-bar"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[9999] pt-safe bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-xl"
        >
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2">
            {updateBanner.includes('Syncing') ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="text-xs font-bold tracking-wide">{updateBanner}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
