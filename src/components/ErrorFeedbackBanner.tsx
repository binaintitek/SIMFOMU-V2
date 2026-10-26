import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  AlertOctagon, 
  Sparkles, 
  Activity, 
  Flame, 
  Wrench, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight,
  TrendingDown,
  Info
} from 'lucide-react';
import { SplicingStep, TechnicianState } from '../types/fiber';
import { AddActionLogFn } from '../types/actionLog';
import { detectActiveErrors, applySopFix } from '../utils/errorScenarioService';
import { soundEffects } from '../utils/audio';

interface ErrorFeedbackBannerProps {
  state: TechnicianState;
  updateState: (updates: Partial<TechnicianState>) => void;
  currentStep: SplicingStep;
  addActionLog?: AddActionLogFn;
  onOpenScenarioModal?: () => void;
}

export const ErrorFeedbackBanner: React.FC<ErrorFeedbackBannerProps> = ({
  state,
  updateState,
  currentStep,
  addActionLog,
  onOpenScenarioModal,
}) => {
  const activeErrors = detectActiveErrors(state, currentStep);

  if (activeErrors.length === 0) {
    return null;
  }

  // Pick the most critical error to display prominently
  const primaryError = activeErrors[0];

  const handleApplyFix = (scenarioId: string, title: string) => {
    soundEffects.playToolFixed();
    const fixUpdates = applySopFix(scenarioId, state);
    updateState(fixUpdates);

    addActionLog?.(`Tindakan Koreksi SOP: Mengatasi ${title}`, {
      step: currentStep,
      severity: 'success',
      dataBadge: 'SOP PASS',
      detail: 'Teknisi menerapkan prosedur operasional standar untuk mengoreksi anomali. Parameter fisik dikembalikan ke rentang aman.',
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'contamination':
        return <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />;
      case 'misalignment':
        return <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />;
      case 'excessive_tension':
        return <AlertOctagon className="w-5 h-5 text-rose-500 animate-bounce" />;
      case 'cleave_defect':
        return <Wrench className="w-5 h-5 text-purple-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    }
  };

  const isCritical = primaryError.severity === 'critical';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className={`w-full border-b shadow-2xl p-3 sm:px-6 relative z-30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 backdrop-blur-md transition-colors ${
          isCritical
            ? 'bg-gradient-to-r from-rose-950/95 via-rose-900/85 to-slate-900 border-rose-500 shadow-rose-950/40'
            : 'bg-gradient-to-r from-amber-950/90 via-slate-900/90 to-slate-900 border-amber-500 shadow-amber-950/40'
        }`}
      >
        {/* Left Side: Sensor Telemetry & Diagnostics */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-lg ${
              isCritical
                ? 'bg-rose-500/20 border-rose-500/50 shadow-rose-500/20'
                : 'bg-amber-500/20 border-amber-500/50 shadow-amber-500/20'
            }`}
          >
            {getCategoryIcon(primaryError.category)}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                  isCritical
                    ? 'bg-rose-500/30 text-rose-200 border-rose-400/50'
                    : 'bg-amber-500/30 text-amber-200 border-amber-400/50'
                }`}
              >
                {primaryError.code}
              </span>

              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider ${
                  isCritical ? 'text-rose-300' : 'text-amber-300'
                }`}
              >
                {isCritical ? '⚠️ KESALAHAN KRITIKAL TERDETEKSI' : '⚠️ ANOMALI PROSES TERDETEKSI'}
              </span>

              <span className="text-slate-500 hidden sm:inline">•</span>

              <span className="text-[10px] font-mono text-cyan-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-700 font-bold">
                {primaryError.metricReadout}
              </span>

              {primaryError.lossPenaltyDb > 0 && (
                <span className="text-[10px] font-mono text-rose-300 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-rose-400" />
                  Loss Penalti: +{primaryError.lossPenaltyDb.toFixed(2)} dB
                </span>
              )}
            </div>

            <h4 className="text-xs sm:text-sm font-black text-white tracking-wide">
              {primaryError.title}
            </h4>

            <p className="text-[11px] text-slate-300 max-w-2xl leading-relaxed">
              {primaryError.feedbackMessage}{' '}
              <span className="text-amber-300 font-semibold underline decoration-amber-400/40">
                SOP: {primaryError.sopCorrection}
              </span>
            </p>
          </div>
        </div>

        {/* Right Side: Interactive SOP Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center w-full md:w-auto">
          {onOpenScenarioModal && (
            <button
              onClick={() => {
                soundEffects.playClick();
                onOpenScenarioModal();
              }}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Pelajari teori & skenario kesalahan lainnya"
            >
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Panduan</span> Skenario
            </button>
          )}

          <button
            onClick={() => handleApplyFix(primaryError.scenarioId, primaryError.title)}
            className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg cursor-pointer ${
              isCritical
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/50'
                : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-950/50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Koreksi SOP Sekarang</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
