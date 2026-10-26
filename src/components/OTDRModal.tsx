import React from 'react';
import { TechnicianState } from '../types/fiber';
import { OTDRTraceViewer } from './OTDRTraceViewer';
import { soundEffects } from '../utils/audio';
import { X, Radio, ShieldCheck, Download } from 'lucide-react';

interface OTDRModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: TechnicianState;
}

export const OTDRModal: React.FC<OTDRModalProps> = ({ isOpen, onClose, state }) => {
  if (!isOpen) return null;

  const loss = state.arcPerformed ? state.estimatedLoss : 0.02;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Instrumen Analisis OTDR Interaktif
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                  Optical Time-Domain Reflectometer
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Teknisi: <strong className="text-slate-200">{state.traineeName}</strong> ({state.companyOrInstitution}) • Fiber: <span className="font-mono text-cyan-400">{state.fiberType}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: OTDR Trace Viewer Full Variant */}
        <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
          <OTDRTraceViewer
            loss={loss}
            isArcPerformed={state.arcPerformed}
            fiberType={state.fiberType}
            defectType={state.defectType}
            variant="full"
            traineeName={state.traineeName}
            traineeId={state.traineeId}
            maxAllowedLoss={state.maxAllowedLoss}
            dynamicDifficulty={state.dynamicDifficulty}
          />
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              Standar Evaluasi Reflektometri: ITU-T &amp; Telkom Akses (Toleransi Loss: ≤ {(state.maxAllowedLoss ?? 0.05).toFixed(2)} dB{state.dynamicDifficulty ? ` - Mode: ${state.dynamicDifficulty.toUpperCase()}` : ''})
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
          >
            Tutup Panel OTDR
          </button>
        </div>
      </div>
    </div>
  );
};
