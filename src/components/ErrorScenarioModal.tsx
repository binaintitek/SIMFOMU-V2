import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  AlertTriangle, 
  Sparkles, 
  Activity, 
  AlertOctagon, 
  Wrench, 
  CheckCircle2, 
  Flame, 
  ShieldCheck, 
  BookOpen, 
  Play, 
  RotateCcw,
  TrendingDown,
  Layers,
  ArrowRight
} from 'lucide-react';
import { SplicingStep, TechnicianState } from '../types/fiber';
import { AddActionLogFn } from '../types/actionLog';
import { COMMON_ERROR_CATALOG, injectErrorScenario, applySopFix } from '../utils/errorScenarioService';
import { CommonErrorScenario, ErrorScenarioCategory } from '../types/errorScenarios';
import { soundEffects } from '../utils/audio';

interface ErrorScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: TechnicianState;
  updateState: (updates: Partial<TechnicianState>) => void;
  onNavigateStep?: (step: SplicingStep) => void;
  addActionLog?: AddActionLogFn;
}

export const ErrorScenarioModal: React.FC<ErrorScenarioModalProps> = ({
  isOpen,
  onClose,
  state,
  updateState,
  onNavigateStep,
  addActionLog,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeScenarioId, setActiveScenarioId] = useState<string>('endface_contamination');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const scenariosList = Object.values(COMMON_ERROR_CATALOG);

  const filteredScenarios = selectedCategory === 'all'
    ? scenariosList
    : scenariosList.filter((s) => s.category === selectedCategory);

  const currentScenario = COMMON_ERROR_CATALOG[activeScenarioId] || scenariosList[0];

  const handleInjectScenario = (scenario: CommonErrorScenario) => {
    soundEffects.playEquipmentAlarm();
    const updates = injectErrorScenario(scenario.id, state);
    updateState(updates);

    setToastMessage(`Skenario "${scenario.title}" berhasil diinjeksikan ke simulator.`);
    setTimeout(() => setToastMessage(null), 3000);

    addActionLog?.(`[SIMULASI KESALAHAN UMUM] Skenario diaktifkan: ${scenario.title}`, {
      step: scenario.step,
      severity: 'error',
      dataBadge: scenario.code,
      detail: `Skenario ${scenario.code} disimulasikan untuk menguji kepekaan dan pemecahan masalah teknisi: ${scenario.symptom}`,
    });

    if (onNavigateStep && scenario.step !== state.mode) {
      // Allow user to navigate directly to the stage
      onNavigateStep(scenario.step);
    }
  };

  const handleApplySop = (scenario: CommonErrorScenario) => {
    soundEffects.playToolFixed();
    const updates = applySopFix(scenario.id, state);
    updateState(updates);

    setToastMessage(`Solusi SOP berhasil diterapkan untuk "${scenario.title}".`);
    setTimeout(() => setToastMessage(null), 3000);

    addActionLog?.(`[SOLUSI SOP DITERAPKAN] Anomali diatasi: ${scenario.title}`, {
      step: scenario.step,
      severity: 'success',
      dataBadge: 'SOP RESOLVED',
      detail: `Teknisi menerapkan SOP perbaikan: ${scenario.sopCorrection}`,
    });
  };

  const getCategoryIcon = (category: ErrorScenarioCategory) => {
    switch (category) {
      case 'contamination':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'misalignment':
        return <Activity className="w-4 h-4 text-cyan-400" />;
      case 'excessive_tension':
        return <AlertOctagon className="w-4 h-4 text-rose-400" />;
      case 'cleave_defect':
        return <Wrench className="w-4 h-4 text-purple-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl relative my-auto overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-cyan-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                  Modul Skenario Kesalahan Umum Fiber Optik
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                  ITU-T &amp; Telkom Akses SOP
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Deteksi anomali, analisis fisika optik transmisi, dan simulasi penanganan kesalahan teknisi lapangan.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-6 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Semua Skenario ({scenariosList.length})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('contamination')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              selectedCategory === 'contamination'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>1. Kontaminasi Ujung Serat</span>
          </button>

          <button
            onClick={() => setSelectedCategory('misalignment')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              selectedCategory === 'misalignment'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>2. Misalignment Sumbu Inti</span>
          </button>

          <button
            onClick={() => setSelectedCategory('excessive_tension')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              selectedCategory === 'excessive_tension'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            <span>3. Penarikan Berlebihan (&gt; 2.2N)</span>
          </button>

          <button
            onClick={() => setSelectedCategory('cleave_defect')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              selectedCategory === 'cleave_defect'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-purple-400" />
            <span>4. Sudut Potong Miring</span>
          </button>
        </div>

        {/* Modal Main Content: Split Master-Detail */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-0">
          {/* Left Column: List of Scenarios */}
          <div className="md:col-span-5 border-r border-slate-800 p-4 overflow-y-auto space-y-2 bg-slate-950/40">
            {filteredScenarios.map((item) => {
              const isSelected = item.id === currentScenario.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    soundEffects.playClick();
                    setActiveScenarioId(item.id);
                  }}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 relative ${
                    isSelected
                      ? 'bg-slate-800/90 border-blue-500/80 shadow-lg shadow-blue-950/50'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 font-bold border border-slate-800 flex items-center gap-1.5">
                      {getCategoryIcon(item.category)}
                      {item.code}
                    </span>
                    <span
                      className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                        item.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {item.severity === 'critical' ? 'Kritikal' : 'Peringatan'}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white leading-snug">
                    {item.title}
                  </h4>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {item.symptom}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 font-mono">
                    <span>Tahap: {item.step.toUpperCase()}</span>
                    <span className="text-rose-400 font-semibold">{item.lossImpactDb}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Deep Technical Inspector & Action Sandbox */}
          <div className="md:col-span-7 p-5 sm:p-6 overflow-y-auto space-y-4 bg-slate-900/40">
            {/* Toast notification */}
            <AnimatePresence>
              {toastMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{toastMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scenario Header Card */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 font-mono text-[11px] font-bold border border-blue-500/30">
                  {currentScenario.code}
                </span>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Kategori: {currentScenario.category.toUpperCase()}
                </span>
                <span className="text-xs text-slate-600">•</span>
                <span className="text-xs font-mono text-emerald-400">
                  Tahap: {currentScenario.step.toUpperCase()}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-black text-white">
                {currentScenario.title}
              </h2>

              <p className="text-xs text-slate-300 leading-relaxed">
                {currentScenario.symptom}
              </p>
            </div>

            {/* Sensor Detection & Physics Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Kriteria Deteksi Sensor</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                  {currentScenario.sensorTriggerSummary}
                </p>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold uppercase tracking-wider">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Dampak Redaman Transmisi</span>
                </div>
                <p className="text-[11px] text-rose-300 leading-relaxed font-mono font-bold">
                  {currentScenario.lossImpactDb}
                </p>
              </div>
            </div>

            {/* Physics Transmission Impact */}
            <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Analisis Fisika Optik &amp; Teori Transmisi</span>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                {currentScenario.physicsImpact}
              </p>
              <div className="text-[10px] font-mono text-amber-400/80 pt-1 border-t border-amber-500/20">
                Regulasi: {currentScenario.regulatoryStandard}
              </div>
            </div>

            {/* SOP Mitigation & Prevention */}
            <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Prosedur Operasi Standar (SOP) Telkom / ITU-T</span>
              </div>
              <p className="text-xs text-emerald-200 leading-relaxed">
                {currentScenario.sopCorrection}
              </p>
              <div className="text-[11px] text-slate-300 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 mt-2">
                <strong className="text-cyan-300">💡 Tips Pencegahan:</strong> {currentScenario.preventionAdvice}
              </div>
            </div>

            {/* Interactive Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => handleInjectScenario(currentScenario)}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Simulasikan Kasus Ini (Inject)</span>
              </button>

              <button
                onClick={() => handleApplySop(currentScenario)}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Terapkan Solusi SOP (Fix)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Standar Evaluasi Telkom Akses: Loss Maksimal 0.05 dB per titik fusi.</span>
          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </motion.div>
    </div>
  );
};
