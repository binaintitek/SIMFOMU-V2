import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wifi, 
  WifiOff, 
  HardDrive, 
  CheckCircle2, 
  RefreshCw, 
  X, 
  ShieldCheck, 
  Server, 
  Download, 
  FileSpreadsheet, 
  FileText,
  Smartphone
} from 'lucide-react';
import { soundEffects } from '../../utils/audio';

interface OfflineModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  isServiceWorkerReady: boolean;
  isChecking: boolean;
  isManualOffline?: boolean;
  onToggleManualOffline?: () => void;
  onCheckConnectivity: () => Promise<boolean>;
}

export const OfflineModal: React.FC<OfflineModalProps> = ({
  isOpen,
  onClose,
  isOnline,
  isServiceWorkerReady,
  isChecking,
  isManualOffline = false,
  onToggleManualOffline,
  onCheckConnectivity,
}) => {
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    soundEffects.playClick();
    setTestResult(null);
    const result = await onCheckConnectivity();
    setTestResult(
      result 
        ? '✅ Terhubung! Koneksi internet aktif.' 
        : '⚠️ Tetap Offline. Simulasi tetap dapat dijalankan penuh tanpa gangguan.'
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-5 py-4 flex items-center justify-between border-b ${
          isOnline ? 'bg-slate-950 border-emerald-500/30' : 'bg-slate-950 border-amber-500/30'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              isOnline 
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
            }`}>
              {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">
                  {isOnline ? 'Status Jaringan: Online' : 'Status Jaringan: Mode Offline Aktif'}
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono border ${
                  isOnline 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                }`}>
                  {isOnline ? 'Internet OK' : 'Area Remote'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                PWA Service Worker & Cache Offline OptiSim Fiber Pro
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Main Status Notice */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            isOnline
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
          }`}>
            <HardDrive className={`w-5 h-5 shrink-0 mt-0.5 ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`} />
            <div className="text-xs leading-relaxed space-y-1">
              <strong className="block font-bold text-white text-sm">
                {isOnline
                  ? 'Aplikasi Terhubung & Ter-cache Sempurna'
                  : 'Siap untuk Operasi Lapangan di Area Blank Spot / Remote'}
              </strong>
              <p className="text-slate-300 text-xs">
                Seluruh aset simulasi fiber optik telah di-cache oleh <strong>Service Worker</strong> ke dalam memori perangkat. Teknisi Telkom Akses dapat menyelesaikan seluruh modul praktikum tanpa memerlukan koneksi internet aktif.
              </p>
            </div>
          </div>

          {/* Offline Capabilities Matrix */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Kesiapan Fitur Saat Offline:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">6 Tahap Simulasi Lengkap</div>
                  <div className="text-[11px] text-slate-400">Stripping, Cleaning, Cleaving, Splicing, Heat Oven, & OTDR jalan lokal 100%.</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Generator PDF Sertifikat</div>
                  <div className="text-[11px] text-slate-400">Pencetakan sertifikat kompetensi & barcode diproses di browser offline.</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Ekspor Rekap Excel (XLSX)</div>
                  <div className="text-[11px] text-slate-400">Rekap data antrean peserta & nilai ujian dapat diunduh tanpa server.</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Database Lokal (Persistent)</div>
                  <div className="text-[11px] text-slate-400">Data nilai, log tindakan, dan leaderboard disimpan aman di LocalStorage.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Service Worker Technical Status */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-slate-400 text-[11px]">Status Service Worker:</span>
                <div className="font-mono font-bold text-slate-200">
                  {isServiceWorkerReady ? 'Aktif & Mengontrol (Ready)' : 'Mendaftarkan...'}
                </div>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
              isServiceWorkerReady 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              {isServiceWorkerReady ? 'PWA ACTIVE' : 'INITIALIZING'}
            </span>
          </div>

          {/* Manual Offline Mode Simulation Toggle */}
          {onToggleManualOffline && (
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                    <span>Simulasi Mode Offline (Tes Lapangan Remote)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Paksa status offline untuk menguji keandalan simulasi tanpa memutus koneksi internet perangkat.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    onToggleManualOffline();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                    isManualOffline
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {isManualOffline ? 'Mode Offline: AKTIF' : 'Mode Offline: NONAKTIF'}
                </button>
              </div>
            </div>
          )}

          {/* Test Connectivity Button */}
          <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleTest}
              disabled={isChecking}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Memeriksa Jaringan...' : 'Tes Ulang Koneksi Lapangan'}</span>
            </button>

            {testResult && (
              <span className="text-xs font-semibold text-slate-300 text-center sm:text-right">
                {testResult}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">
            PWA Standalone • Telkom Akses Field Readiness
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
          >
            Mengerti & Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
};
