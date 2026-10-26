import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  BatteryLow, 
  Wrench, 
  Zap, 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  ShieldAlert,
  RotateCw,
  Cpu,
  Plug
} from 'lucide-react';
import { TechnicianState } from '../types/fiber';
import { AddActionLogFn } from '../types/actionLog';
import { resolveEquipmentIncident } from '../utils/equipmentFailureService';
import { soundEffects } from '../utils/audio';

interface EquipmentFailureHUDProps {
  state: TechnicianState;
  updateState: (updates: Partial<TechnicianState>) => void;
  addActionLog?: AddActionLogFn;
}

export const EquipmentFailureHUD: React.FC<EquipmentFailureHUDProps> = ({
  state,
  updateState,
  addActionLog,
}) => {
  const activeFailure = state.equipmentHealth?.activeFailure;

  if (!activeFailure) return null;

  const handleResolve = () => {
    soundEffects.playToolFixed();

    const prevHealth = state.equipmentHealth || {
      splicerBatteryLevel: 95,
      splicerIsCharging: false,
      cleaverBladePosition: 1,
      cleaverBladeCondition: 'sharp',
      electrodesCondition: 'clean',
      vGrooveCondition: 'clean',
      heaterCondition: 'ready',
      activeFailure: null,
      resolvedFailuresCount: 0,
    };

    const nextHealth = resolveEquipmentIncident(prevHealth, activeFailure.type);

    const updates: Partial<TechnicianState> = {
      equipmentHealth: nextHealth,
    };

    // Stage-specific recovery side effects
    if (activeFailure.type === 'dull_cleaver') {
      updates.cleaveBladeCondition = 'sharp';
      // Reset any broken cleave angle to normal range
      if (state.leftCleaveAngle > 1.0) updates.leftCleaveAngle = 0.4;
      if (state.rightCleaveAngle > 1.0) updates.rightCleaveAngle = 0.3;
    } else if (activeFailure.type === 'dirty_electrode') {
      // Clear arc defects
      if (state.defectType === 'bubble' || state.defectType === 'waist') {
        updates.defectType = 'none';
      }
    } else if (activeFailure.type === 'dusty_vgroove') {
      // V-Groove cleaned, allow alignment
      updates.motorAligned = false;
    }

    updateState(updates);

    addActionLog?.(`[KETANGGUHAN TEKNISI] Gangguan alat berhasil diatasi: ${activeFailure.title}`, {
      step: activeFailure.stepTriggered,
      severity: 'success',
      dataBadge: 'SOP Tuntas',
      detail: `Tindakan perbaikan ${activeFailure.mitigationButtonLabel} berhasil dilaksanakan sesuai standar SOP pemeliharaan Telkom. Peralatan kembali beroperasi normal.`,
    });
  };

  const getIcon = () => {
    switch (activeFailure.type) {
      case 'low_battery':
        return <BatteryLow className="w-5 h-5 text-amber-400 animate-pulse" />;
      case 'dull_cleaver':
        return <Wrench className="w-5 h-5 text-rose-400" />;
      case 'dirty_electrode':
        return <Zap className="w-5 h-5 text-amber-300" />;
      case 'dusty_vgroove':
        return <Sparkles className="w-5 h-5 text-cyan-300" />;
      case 'heater_fault':
        return <Flame className="w-5 h-5 text-orange-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className="w-full bg-gradient-to-r from-rose-950/90 via-amber-950/80 to-slate-900 border-b-2 border-amber-500 shadow-2xl p-3 sm:px-6 relative z-30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 backdrop-blur-md"
      >
        {/* Left side: Warning Badge & Details */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            {getIcon()}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold border border-rose-500/30">
                {activeFailure.code}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                GANGGUAN ALAT (RANDOM EQUIPMENT FAILURE)
              </span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">•</span>
              <span className="text-[10px] text-amber-200/80 italic hidden sm:inline">
                Uji Respon &amp; Ketangguhan Teknisi
              </span>
            </div>

            <h4 className="text-xs sm:text-sm font-black text-white tracking-wide">
              {activeFailure.title}
            </h4>

            <p className="text-[11px] text-slate-300 max-w-2xl leading-relaxed">
              {activeFailure.symptom} <span className="text-amber-300 font-medium">{activeFailure.sopInstruction}</span>
            </p>
          </div>
        </div>

        {/* Right side: Interactive Mitigation Button */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center w-full md:w-auto">
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleResolve}
            className="w-full md:w-auto px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {activeFailure.type === 'low_battery' ? (
              <Plug className="w-4 h-4 text-slate-950" />
            ) : activeFailure.type === 'dull_cleaver' ? (
              <RotateCw className="w-4 h-4 text-slate-950" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
            )}
            <span>{activeFailure.mitigationButtonLabel}</span>
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
