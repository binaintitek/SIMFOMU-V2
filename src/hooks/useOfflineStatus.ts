import { useState, useEffect, useCallback } from 'react';

export interface OfflineStatusState {
  isOnline: boolean;
  isServiceWorkerReady: boolean;
  isChecking: boolean;
  lastChanged: Date;
  serviceWorkerScope?: string;
  isManualOffline: boolean;
  toggleManualOffline: () => void;
}

export function useOfflineStatus() {
  const [networkOnline, setNetworkOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [isManualOffline, setIsManualOffline] = useState<boolean>(() => {
    try {
      return localStorage.getItem('optisim_force_offline') === 'true';
    } catch {
      return false;
    }
  });
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [lastChanged, setLastChanged] = useState<Date>(new Date());
  const [swScope, setSwScope] = useState<string | undefined>(undefined);

  const isOnline = isManualOffline ? false : networkOnline;

  const toggleManualOffline = useCallback(() => {
    setIsManualOffline((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('optisim_force_offline', String(next));
      } catch {
        // Ignored
      }
      setLastChanged(new Date());
      return next;
    });
  }, []);

  // Check Service Worker registration
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          setIsServiceWorkerReady(true);
          setSwScope(reg.scope);
        })
        .catch(() => {
          setIsServiceWorkerReady(false);
        });

      navigator.serviceWorker.getRegistrations().then((registrations) => {
        if (registrations.length > 0) {
          setIsServiceWorkerReady(true);
          setSwScope(registrations[0]?.scope);
        }
      });
    }
  }, []);

  // Listen to standard online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setNetworkOnline(true);
      setLastChanged(new Date());
    };

    const handleOffline = () => {
      setNetworkOnline(false);
      setLastChanged(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Active connectivity ping check (useful for remote area field technicians)
  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    if (isManualOffline) {
      return false;
    }
    setIsChecking(true);
    try {
      // Use head request with cache buster and short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      // Attempt to ping a lightweight public endpoint or current origin
      await fetch(`/?_t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      setNetworkOnline(true);
      setLastChanged(new Date());
      setIsChecking(false);
      return true;
    } catch {
      // If failed and navigator reports offline or network failed
      if (!navigator.onLine) {
        setNetworkOnline(false);
        setLastChanged(new Date());
      }
      setIsChecking(false);
      return false;
    }
  }, [isManualOffline]);

  return {
    isOnline,
    isServiceWorkerReady,
    isChecking,
    lastChanged,
    serviceWorkerScope: swScope,
    isManualOffline,
    toggleManualOffline,
    checkConnectivity,
  };
}
