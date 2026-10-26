import React, { useState } from 'react';
import { TechnicianState } from '../types/fiber';
import { soundEffects } from '../utils/audio';
import { Activity, Flame, RotateCcw, Award, Info, Sparkles, UserCheck } from 'lucide-react';
import { DeveloperInfoModal } from './DeveloperInfoModal';

interface FooterProps {
  state: TechnicianState;
  updateState: (updates: Partial<TechnicianState>) => void;
  onReset: () => void;
  latestLogMessage?: string;
  onOpenLog?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  state, 
  updateState, 
  onReset,
  latestLogMessage,
  onOpenLog,
}) => {
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);

  const toggleMode = () => {
    soundEffects.playClick();
    const nextMode = state.mode === 'training' ? 'exam' : 'training';
    updateState({ mode: nextMode });
  };

  const handleOpenDevModal = () => {
    soundEffects.playClick();
    setIsDevModalOpen(true);
  };

  return (
    <>
      <footer className="h-14 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-md flex items-center px-3 sm:px-6 shrink-0 select-none z-30 text-xs justify-between gap-3 shadow-lg">
        {/* Left: Subtle branding & Core Alignment indicator */}
        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
          {/* Subtle Application Identity */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-xs shadow-cyan-400/50"></span>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-300 tracking-tight">
              OptiSim Fiber Pro <span className="text-cyan-400 font-mono font-bold">v1.0</span>
              <span className="hidden md:inline text-slate-500 font-normal"> • Simulator Splicing Optik</span>
            </span>
          </div>

          {/* Core Alignment / Status dot */}
          <div className="hidden sm:flex items-center gap-1.5 pl-2 sm:border-l sm:border-slate-800">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                state.motorAligned ? 'bg-emerald-400' : 'bg-blue-400 animate-pulse'
              }`}
            ></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {state.motorAligned ? 'Axis Aligned' : 'PAS Ready'}
            </span>
          </div>
        </div>

        {/* Center: Prominent "Tentang Perancang / Pengembang" Button */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            id="btn-developer-info"
            onClick={handleOpenDevModal}
            title="Informasi Tim & Perancang Aplikasi: Achmad Mawardi S.Kom"
            className="group relative inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-1.5 rounded-full bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-blue-600/20 hover:from-blue-600/30 hover:via-cyan-500/30 hover:to-blue-600/30 border border-cyan-400/50 hover:border-cyan-300 text-cyan-200 hover:text-white font-bold text-[11px] sm:text-xs tracking-wide shadow-sm hover:shadow-md hover:shadow-cyan-500/20 transition-all cursor-pointer active:scale-95"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <Info className="w-3.5 h-3.5 text-cyan-300 group-hover:rotate-12 transition-transform" />
            <span>Tentang Perancang / Pengembang</span>
          </button>

          {/* Live log ticker (Desktop only) */}
          {latestLogMessage && (
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                onOpenLog?.();
              }}
              title="Buka panel log tindakan"
              className="hidden xl:flex items-center gap-2 px-3 py-1 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-full max-w-xs truncate transition-colors text-left cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider shrink-0">Log:</span>
              <span className="text-[11px] text-cyan-300 font-mono truncate">{latestLogMessage}</span>
            </button>
          )}
        </div>

        {/* Right: Mode Toggle & Reset controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mode Toggle button */}
          <button
            type="button"
            onClick={toggleMode}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer ${
              state.mode === 'training'
                ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600/20'
                : 'bg-amber-600/10 border-amber-500/30 text-amber-300 hover:bg-amber-600/20'
            }`}
          >
            <Award className="w-3 h-3" />
            <span className="hidden sm:inline">Mode: </span>
            <span>{state.mode === 'training' ? 'Pelatihan' : 'Ujian'}</span>
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={onReset}
            title="Reset simulasi ke kondisi awal"
            className="px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </footer>

      {/* Developer Info Modal Dialog */}
      <DeveloperInfoModal 
        isOpen={isDevModalOpen}
        onClose={() => setIsDevModalOpen(false)}
      />
    </>
  );
};

