import React from 'react';
import { 
  Lock, 
  ShieldAlert, 
  X, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  Sliders, 
  FileSpreadsheet,
  Layers
} from 'lucide-react';
import { soundEffects } from '../utils/audio';

interface AccessRestrictedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLoginAdmin: () => void;
  featureName?: string;
  featureDescription?: string;
}

export const AccessRestrictedModal: React.FC<AccessRestrictedModalProps> = ({
  isOpen,
  onClose,
  onOpenLoginAdmin,
  featureName = 'Fitur Otoritas Penguji / Admin',
  featureDescription = 'Manajemen daftar antrean peserta, parameter soal ujian, dan cetak rekapitulasi nilai hanya dapat diakses oleh Admin / Asesor Penguji Uji Kompetensi.',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative text-slate-200">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-amber-900/60 via-slate-900 to-slate-900 p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Lock className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                Akses Khusus Penguji
              </h3>
              <p className="text-xs text-amber-400/90 font-semibold">
                Otoritas Administrator Diperlukan
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {featureName}
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {featureDescription}
            </p>
          </div>

          <div className="space-y-2 text-xs text-slate-300 bg-blue-950/20 border border-blue-500/20 p-3.5 rounded-2xl">
            <p className="font-bold text-blue-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              Tetap Bisa Latihan Bebas (Mode Peserta):
            </p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Dalam <strong>Mode Latihan (Free Play)</strong>, Anda bebas melakukan stripping, cleaning, cleaving, penyambungan arc, heating, dan mencetak lembar sertifikat pelatihan atas nama sendiri tanpa perlu login.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                onClose();
              }}
              className="w-full sm:w-1/2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors border border-slate-700 cursor-pointer"
            >
              Lanjutkan Latihan Bebas
            </button>
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                onClose();
                onOpenLoginAdmin();
              }}
              className="w-full sm:w-1/2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Login Admin / Penguji</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
