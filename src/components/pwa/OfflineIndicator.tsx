import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, WifiOff, HardDrive, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { OfflineModal } from './OfflineModal';
import { soundEffects } from '../../utils/audio';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, isServiceWorkerReady, isChecking, checkConnectivity, isManualOffline, toggleManualOffline } = useOfflineStatus();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  return (
    <>
      {/* Floating Bottom Toast when offline */}
      <AnimatePresence>
        {!isOnline && !isDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-4 z-40 max-w-md w-[calc(100vw-2rem)] sm:w-auto"
          >
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/95 border border-amber-500/50 shadow-2xl backdrop-blur-md text-amber-200">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <WifiOff className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-amber-300">Mode Offline Aktif</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono font-bold border border-amber-500/30">
                    Area Remote
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 line-clamp-1">
                  Simulator tetap berjalan penuh via Service Worker tanpa koneksi internet.
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setIsModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer shadow-sm"
                >
                  Detail
                </button>
                <button
                  type="button"
                  onClick={() => setIsDismissed(true)}
                  title="Sembunyikan Notifikasi"
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Diagnostics Modal */}
      <OfflineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isOnline={isOnline}
        isServiceWorkerReady={isServiceWorkerReady}
        isChecking={isChecking}
        isManualOffline={isManualOffline}
        onToggleManualOffline={toggleManualOffline}
        onCheckConnectivity={checkConnectivity}
      />
    </>
  );
};

export const HeaderOfflineBadge: React.FC = () => {
  const { isOnline, isServiceWorkerReady, isChecking, checkConnectivity, isManualOffline, toggleManualOffline } = useOfflineStatus();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        id="btn-network-status"
        onClick={() => {
          soundEffects.playClick();
          setIsModalOpen(true);
        }}
        title={
          isOnline
            ? 'Koneksi Online: Terhubung. Klik untuk cek info Service Worker & PWA'
            : 'Mode Offline Aktif: Simulasi berjalan mandiri via Service Worker di area remote. Klik untuk info detail'
        }
        className={`cursor-pointer flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-bold transition-all shadow-sm ${
          isOnline
            ? 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-500/30 text-emerald-300 hover:text-white'
            : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400 text-amber-300 ring-1 ring-amber-400/40 animate-pulse'
        }`}
      >
        {isOnline ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline text-[10px] font-mono font-black">ONLINE</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-mono font-black">OFFLINE</span>
          </>
        )}
      </button>

      <OfflineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isOnline={isOnline}
        isServiceWorkerReady={isServiceWorkerReady}
        isChecking={isChecking}
        isManualOffline={isManualOffline}
        onToggleManualOffline={toggleManualOffline}
        onCheckConnectivity={checkConnectivity}
      />
    </>
  );
};
