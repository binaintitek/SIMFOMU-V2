import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SplicingStep, TechnicianState } from '../types/fiber';
import { STEP_METADATA, checkStepPassingCriteria } from '../utils/standards';
import { soundEffects } from '../utils/audio';
import { CheckCircle2, ChevronRight, Info, AlertTriangle, Timer, Lock } from 'lucide-react';
import { RealToolPreviewCard } from './RealToolPreviewCard';

interface StepNavigationProps {
  currentStep: SplicingStep;
  onSelectStep: (step: SplicingStep) => void;
  state: TechnicianState;
  unlockedIndex?: number;
  currentStepIndex?: number;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  onSelectStep,
  state,
  unlockedIndex: propUnlockedIndex,
  currentStepIndex: propCurrentStepIndex,
}) => {
  const criteria = checkStepPassingCriteria(state);
  const unlockedIndex = propUnlockedIndex !== undefined ? propUnlockedIndex : criteria.unlockedIndex;

  const isStepCompleted = (stepId: string): boolean => {
    switch (stepId) {
      case 'stripping':
        return criteria.isStep0Passed;
      case 'cleaning':
        return criteria.isStep1Passed;
      case 'cleaving':
        return criteria.isStep2Passed;
      case 'splicing':
        return criteria.isStep3Passed;
      case 'heating':
        return criteria.isStep4Passed;
      case 'assessment':
        return criteria.isStep4Passed && state.spliceSuccess;
      default:
        return false;
    }
  };

  const currentStepMeta = STEP_METADATA.find((s) => s.id === currentStep) || STEP_METADATA[0];

  return (
    <aside className="w-72 sm:w-80 bg-slate-900/60 border-r border-slate-800 flex flex-col p-4 sm:p-5 shrink-0 select-none overflow-y-auto">
      {/* Title & Mode */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Langkah Kerja Splicing
          </h2>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
            Strict Step Locking: Level {unlockedIndex + 1}/6
          </p>
        </div>
        <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
          PROSES UTAMA
        </span>
      </div>

      {/* Step List */}
      <div className="space-y-2.5 flex-1">
        {STEP_METADATA.map((step, idx) => {
          const isActive = currentStep === step.id;
          const completed = isStepCompleted(step.id);
          const isUnlocked = idx <= unlockedIndex;

          return (
            <motion.button
              key={step.id}
              disabled={!isUnlocked}
              whileHover={isUnlocked ? { x: 3 } : {}}
              whileTap={isUnlocked ? { scale: 0.98 } : {}}
              onClick={() => {
                if (!isUnlocked) return;
                soundEffects.playClick();
                onSelectStep(step.id as SplicingStep);
              }}
              className={`w-full text-left transition-colors duration-200 flex items-start gap-3 p-3 rounded-xl border relative overflow-hidden ${
                !isUnlocked
                  ? 'opacity-50 cursor-not-allowed bg-slate-950/40 border-slate-800/40 text-slate-500'
                  : isActive
                  ? 'border-blue-500/60 shadow-lg shadow-blue-900/10'
                  : completed
                  ? 'bg-slate-800/30 border-slate-800 hover:bg-slate-800/60 text-slate-300'
                  : 'bg-transparent border-slate-800/60 hover:bg-slate-800/20 text-slate-400 opacity-70 hover:opacity-100'
              }`}
            >
              {/* Active Animated Background Highlight */}
              {isActive && (
                <motion.div
                  layoutId="activeStepNavIndicator"
                  className="absolute inset-0 bg-blue-600/15 rounded-xl border border-blue-500/50 shadow-md shadow-blue-900/20 pointer-events-none"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              {/* Step Number or Completed Icon or Lock Icon */}
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  !isUnlocked
                    ? 'border border-slate-800 bg-slate-900/80 text-slate-500'
                    : isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400/40'
                    : completed
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                    : 'border border-slate-700 bg-slate-800 text-slate-400'
                }`}
              >
                {completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : !isUnlocked ? (
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  step.number
                )}
              </div>

              {/* Step Info */}
              <div className="relative z-10 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p
                    className={`text-xs sm:text-sm font-bold truncate ${
                      !isUnlocked
                        ? 'text-slate-500'
                        : isActive
                        ? 'text-blue-400'
                        : completed
                        ? 'text-slate-200'
                        : 'text-slate-300'
                    }`}
                  >
                    {step.title}
                  </p>
                  {!isUnlocked ? (
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-0.5">
                      <Lock className="w-3 h-3 text-slate-500" />
                    </span>
                  ) : isActive ? (
                    <motion.div
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    </motion.div>
                  ) : null}
                </div>
                <p
                  className={`text-[11px] truncate mt-0.5 ${
                    !isUnlocked ? 'text-slate-600' : isActive ? 'text-blue-300/70' : 'text-slate-500'
                  }`}
                >
                  {step.sub}
                </p>
                {/* Step timing tracking badge */}
                {isActive && state.timeTrialRunning && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] font-mono">
                    <Timer className={`w-3 h-3 ${state.isStepOvertime ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
                    <span className={state.isStepOvertime ? 'text-rose-300 font-black' : 'text-amber-300 font-bold'}>
                      {state.currentStepTime || 0}s
                      {state.stepTimeLimitSeconds ? ` / ${state.stepTimeLimitSeconds}s` : ''}
                    </span>
                    {state.isStepOvertime && (
                      <span className="text-[9px] font-sans px-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Overtime
                      </span>
                    )}
                  </div>
                )}
                {!isActive && state.stepTimeElapsed?.[step.id as SplicingStep] !== undefined && (
                  <div className="mt-0.5 text-[9px] font-mono text-slate-400">
                    Durasi: {state.stepTimeElapsed[step.id as SplicingStep]}s
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Visual Guide & Real Tool Callout in Bottom */}
      <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
        {/* Real Tools Image Card Component */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300">
              <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Panduan Visual Langkah</span>
            </div>
            <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
              ALAT RIIL
            </span>
          </div>

          {/* Real Tool Preview Card (Switches automatically based on currentStep) */}
          <RealToolPreviewCard currentStep={currentStep} layoutMode="sidebar" />
        </div>

        {/* Step Standard Instruction Details with Smooth Motion Transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="bg-slate-800/40 rounded-xl p-3 border border-slate-800/80"
          >
            <div className="text-[11px] text-slate-300/90 leading-relaxed mb-2 font-sans">
              {currentStepMeta.instruction}
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
              <span className="text-slate-500 font-medium">Alat Kerja:</span>
              <span className="font-semibold text-blue-400 truncate max-w-[170px]">
                {currentStepMeta.tool}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Quick K3 Warning Tip */}
        <div className="flex items-center gap-2 text-[10px] text-amber-300/80 bg-amber-500/5 border border-amber-500/10 rounded-lg px-2.5 py-1.5">
          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
          <span>Wajib buang sisa pecahan kaca optik ke kotak limbah khusus!</span>
        </div>
      </div>
    </aside>
  );
};
