import React, { useState } from 'react';
import { TechnicianState } from '../types/fiber';
import { ActionLogItem } from '../types/actionLog';
import { FIBER_SPECS, calculateSpliceAccuracy } from '../utils/standards';
import { soundEffects } from '../utils/audio';
import { OTDRTraceViewer } from './OTDRTraceViewer';
import { ActionLogPanel } from './ActionLogPanel';
import { formatDuration, getSpeedRating } from '../utils/leaderboard';
import { 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Award, 
  RotateCcw, 
  Sparkles, 
  Layers, 
  ClipboardList,
  Columns,
  Timer,
  Clock,
  Zap,
  Cpu,
  Play,
  Pause,
  History
} from 'lucide-react';

interface AccuracySidebarProps {
  state: TechnicianState;
  updateState: (updates: Partial<TechnicianState>) => void;
  onGoToAssessment: () => void;
  onReset: () => void;
  onOpenOTDR?: () => void;
  logs: ActionLogItem[];
  onClearLogs?: () => void;
  activeSidebarTab?: 'metrics' | 'logs';
  setActiveSidebarTab?: (tab: 'metrics' | 'logs') => void;
  onToggleTimer?: () => void;
  onResetTimer?: () => void;
  onOpenTrainingHistory?: () => void;
}

export const AccuracySidebar: React.FC<AccuracySidebarProps> = ({
  state,
  updateState,
  onGoToAssessment,
  onReset,
  onOpenOTDR,
  logs,
  onClearLogs,
  activeSidebarTab,
  setActiveSidebarTab,
  onToggleTimer,
  onResetTimer,
  onOpenTrainingHistory,
}) => {
  const [internalTab, setInternalTab] = useState<'metrics' | 'logs'>('metrics');
  const [isSplitView, setIsSplitView] = useState<boolean>(false);

  const currentTab = activeSidebarTab !== undefined ? activeSidebarTab : internalTab;
  const handleTabChange = (tab: 'metrics' | 'logs') => {
    if (setActiveSidebarTab) {
      setActiveSidebarTab(tab);
    } else {
      setInternalTab(tab);
    }
  };

  const spec = FIBER_SPECS[state.fiberType];
  const evaluation = calculateSpliceAccuracy(state);
  const loss = state.arcPerformed ? state.estimatedLoss : 0.02;
  const isCompliant = state.arcPerformed && loss <= spec.maxAllowedLoss;

  const handleRecalibrate = () => {
    soundEffects.playClick();
    soundEffects.playMotorStep();
    updateState({
      leftCleaveAngle: 0.4,
      rightCleaveAngle: 0.3,
      cleaveBladeCondition: 'sharp',
    });
  };

  return (
    <aside
      className={`${
        isSplitView ? 'w-[700px] max-w-[50vw]' : 'w-72 sm:w-84'
      } bg-slate-900/80 border-l border-slate-800 flex flex-col shrink-0 select-none overflow-hidden transition-all duration-200`}
    >
      {/* Top Tab Bar & Mode Switcher */}
      <div className="p-2.5 sm:p-3 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              handleTabChange('metrics');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'metrics' && !isSplitView
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-blue-300" />
            <span className="hidden sm:inline">Metrik &</span> OTDR
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              handleTabChange('logs');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'logs' && !isSplitView
                ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-900/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 text-cyan-300" />
            <span>Log Tindakan</span>
            <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-950 text-cyan-300 border border-cyan-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {logs.length}
            </span>
          </button>
        </div>

        {/* Split View toggle */}
        <button
          type="button"
          onClick={() => {
            soundEffects.playClick();
            setIsSplitView(!isSplitView);
          }}
          title={isSplitView ? 'Tampilkan Mode Tab Tunggal' : 'Tampilkan Mode Belah (Metrik + Log Berdampingan)'}
          className={`p-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
            isSplitView
              ? 'bg-cyan-600/20 border-cyan-500/40 text-cyan-300'
              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <Columns className="w-3.5 h-3.5" />
          <span className="text-[10px] hidden sm:inline">{isSplitView ? 'Tunggal' : 'Belah'}</span>
        </button>
      </div>

      {/* Main Body Content: Tabbed or Split */}
      <div className={`flex-1 flex overflow-hidden ${isSplitView ? 'divide-x divide-slate-800' : ''}`}>
        {/* Metrics & OTDR Section */}
        {(isSplitView || currentTab === 'metrics') && (
          <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
            {/* Title Bar */}
            <div className="flex items-center justify-between gap-1">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                Akurasi Sambungan
              </h2>
              <div className="flex items-center gap-1">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                    spec.modeType === 'SM'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                  }`}
                >
                  {spec.modeType} {spec.coreDiameter}µm
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                  {spec.standardName.split(' ')[0]}
                </span>
              </div>
            </div>

            {/* Time-Trial Live Duration Widget */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-amber-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Timer className={`w-3.5 h-3.5 ${state.timeTrialRunning ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
                  Time-Trial Stopwatch
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                  state.timeTrialCompleted 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : state.timeTrialRunning
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse'
                    : state.timeTrialDuration > 0
                    ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {state.timeTrialCompleted 
                    ? 'SELESAI' 
                    : state.timeTrialRunning 
                    ? 'BERJALAN' 
                    : state.timeTrialDuration > 0 
                    ? 'DIJEDA' 
                    : 'STANDBY'}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <p className={`text-2xl font-mono font-black ${
                    state.timeTrialCompleted 
                      ? 'text-emerald-400' 
                      : state.timeTrialRunning 
                      ? 'text-amber-300' 
                      : 'text-slate-300'
                  }`}>
                    {formatDuration(state.timeTrialDuration || 0)}
                  </p>
                  <p className="text-[10px] text-slate-400">Stripping s/d Heat Shrink</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-black ${getSpeedRating(state.timeTrialDuration || 0).color}`}>
                    ⚡ {getSpeedRating(state.timeTrialDuration || 0).label}
                  </span>
                  <p className="text-[10px] text-slate-500 font-mono">Target SOP: ≤ 180s</p>
                </div>
              </div>

              {/* Stopwatch Action Controls: Start & Reset */}
              {(onToggleTimer || onResetTimer) && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  {!state.timeTrialCompleted ? (
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playClick();
                        onToggleTimer?.();
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-black transition-all cursor-pointer shadow-sm ${
                        state.timeTrialRunning
                          ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40'
                      }`}
                    >
                      {state.timeTrialRunning ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Jeda Timer</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>{state.timeTrialDuration > 0 ? 'Lanjutkan Timer' : 'START / MULAI'}</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center text-xs font-bold text-emerald-400">
                      Tercatat: {formatDuration(state.timeTrialDuration)}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      onResetTimer?.();
                    }}
                    title="Reset Stopwatch kembali ke 00:00"
                    className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              )}
            </div>

            {/* Estimated Loss Meter */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-[11px] text-slate-400 uppercase font-medium">Estimated Loss</span>
                <span
                  className={`text-2xl font-mono font-bold ${
                    !state.arcPerformed
                      ? 'text-slate-500'
                      : loss <= 0.03
                      ? 'text-emerald-400'
                      : loss <= spec.maxAllowedLoss
                      ? 'text-blue-400'
                      : 'text-rose-400'
                  }`}
                >
                  {state.arcPerformed ? loss.toFixed(2) : '--.--'}{' '}
                  <span className="text-xs font-normal text-slate-400">dB</span>
                </span>
              </div>

              {/* Loss progress bar */}
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden relative">
                <div
                  className={`h-full transition-all duration-500 ${
                    !state.arcPerformed
                      ? 'w-0 bg-slate-700'
                      : loss <= 0.03
                      ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.7)]'
                      : loss <= spec.maxAllowedLoss
                      ? 'bg-blue-500'
                      : 'bg-rose-500'
                  }`}
                  style={{
                    width: !state.arcPerformed
                      ? '0%'
                      : `${Math.min(100, (loss / (spec.maxAllowedLoss * 2)) * 100)}%`,
                  }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>0.00 dB (Ideal)</span>
                <span className="text-amber-400 font-medium">
                  Batas Max: {spec.maxAllowedLoss} dB ({spec.modeType})
                </span>
              </div>

              {/* Physics-based Loss Breakdown (SM Marcuse vs MM Graded Index) */}
              {state.arcPerformed ? (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1 text-[10px] font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Offset Loss ({spec.modeType === 'SM' ? 'Marcuse 9µm' : 'Graded-Index 50µm'}):</span>
                    <span className="text-slate-200">+{evaluation.offsetLoss} dB</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Cleave Angle Loss:</span>
                    <span className="text-slate-200">+{evaluation.angleLoss} dB</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Cleanliness & Scattering:</span>
                    <span className="text-slate-200">+{evaluation.dirtLoss} dB</span>
                  </div>
                </div>
              ) : (
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                  <span className="font-semibold text-blue-400">Algoritma {spec.modeType}: </span>
                  {spec.modeType === 'SM'
                    ? 'Sensitivitas tinggi lateral offset (Core 9µm Marcuse), batas loss ketat ≤0.05 dB.'
                    : 'Toleransi lateral offset lebih longgar (Core 50µm Graded-Index), batas loss ≤0.10 dB.'}
                </div>
              )}
            </div>

            {/* Fiber Information Card */}
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Kategori Serat:
                </span>
                <span className="font-bold text-white">{spec.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Tipe Mode & Core:</span>
                <span className="font-mono text-slate-300">
                  {spec.modeType} ({spec.coreDiameter} / {spec.claddingDiameter} µm)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Standar Regulasi:</span>
                <span className="font-mono text-slate-300 text-[11px] truncate max-w-[150px]">
                  {spec.standardAuthority}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Warna Tube Buffer:</span>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${spec.bufferColor}`} />
                  <span className="text-slate-300">{spec.colorName}</span>
                </div>
              </div>

              {/* Quick Fiber Switch in Sidebar */}
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Beralih Tipe Kabel:</span>
                <select
                  value={state.fiberType}
                  onChange={(e) => {
                    soundEffects.playClick();
                    updateState({ fiberType: e.target.value as TechnicianState['fiberType'] });
                  }}
                  className="bg-slate-900 border border-slate-700 text-blue-400 font-bold text-[10px] rounded px-2 py-0.5 focus:outline-none cursor-pointer"
                >
                  <optgroup label="Single-Mode (SM)">
                    <option value="G652D_SM">G.652.D (SM 9µm)</option>
                    <option value="G657A_FTTH">G.657.A2 (FTTH Drop)</option>
                  </optgroup>
                  <optgroup label="Multi-Mode (MM)">
                    <option value="OM3_MM">OM3 (MM 50µm)</option>
                    <option value="OM4_MM">OM4 (MM 50µm)</option>
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Step Status Grid */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Parameter Kunci ({spec.standardAuthority})
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Cleave Angle Left */}
                <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Sudut Cleave L</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-200">
                      {state.leftCleaveLength > 0 ? `${state.leftCleaveAngle}°` : '--°'}
                    </span>
                    {state.leftCleaveLength > 0 && (
                      <span
                        className={`text-[10px] font-bold ${
                          state.leftCleaveAngle <= spec.maxCleaveAngle ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {state.leftCleaveAngle <= spec.maxCleaveAngle ? 'OK' : 'FAIL'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Cleave Angle Right */}
                <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Sudut Cleave R</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-200">
                      {state.rightCleaveLength > 0 ? `${state.rightCleaveAngle}°` : '--°'}
                    </span>
                    {state.rightCleaveLength > 0 && (
                      <span
                        className={`text-[10px] font-bold ${
                          state.rightCleaveAngle <= spec.maxCleaveAngle ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {state.rightCleaveAngle <= spec.maxCleaveAngle ? 'OK' : 'FAIL'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Cleanliness */}
                <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Kebersihan Serat</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-200">
                      {Math.round(((state.leftCleanliness + state.rightCleanliness) / 2) || 0)}%
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        (state.leftCleanliness + state.rightCleanliness) / 2 >= 80
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {(state.leftCleanliness + state.rightCleanliness) / 2 >= 80 ? 'BERSIH' : 'KOTOR'}
                    </span>
                  </div>
                </div>

                {/* Core Alignment Offset */}
                <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Core Offset (PAS)</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-200">
                      {state.motorAligned ? `${(Math.abs(state.xOffset) + Math.abs(state.yOffset)).toFixed(1)} µm` : '-- µm'}
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        state.motorAligned ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {state.motorAligned ? 'ALIGNED' : 'WAIT'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance Status Notice */}
            <div
              className={`p-3 rounded-xl border flex flex-col gap-1.5 ${
                state.arcPerformed && isCompliant
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                  : state.arcPerformed && !isCompliant
                  ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                  : 'bg-blue-950/30 border-blue-500/30 text-blue-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    state.arcPerformed && isCompliant
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : state.arcPerformed && !isCompliant
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {state.arcPerformed ? (
                    isCompliant ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                </div>
                <span
                  className={`text-xs font-bold ${
                    state.arcPerformed && isCompliant
                      ? 'text-emerald-400'
                      : state.arcPerformed && !isCompliant
                      ? 'text-rose-400'
                      : 'text-blue-400'
                  }`}
                >
                  {!state.arcPerformed
                    ? 'Simulasi Aktif'
                    : isCompliant
                    ? `Standar ${spec.standardAuthority} Terpenuhi`
                    : 'Redaman Melebihi Batas'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {!state.arcPerformed
                  ? `Selesaikan langkah 01 sampai 04 untuk mendapatkan kalkulasi loss akurasi sambungan kabel tipe ${spec.name}.`
                  : isCompliant
                  ? `Hasil fusi ${loss.toFixed(2)} dB memenuhi standar ${spec.standardAuthority} (toleransi maks ≤ ${spec.maxAllowedLoss} dB untuk serat ${spec.modeType}).`
                  : `Hasil fusi ${loss.toFixed(2)} dB melampaui batas toleransi (maks ≤ ${spec.maxAllowedLoss} dB untuk serat ${spec.modeType}). Periksa kebersihan fiber atau potong ulang.`}
              </p>
            </div>

            {/* Live OTDR Trace Card */}
            <OTDRTraceViewer
              variant="compact"
              loss={loss}
              isArcPerformed={state.arcPerformed}
              fiberType={state.fiberType}
              defectType={state.defectType}
              onOpenFullModal={onOpenOTDR}
              maxAllowedLoss={state.maxAllowedLoss}
              dynamicDifficulty={state.dynamicDifficulty}
            />

            {/* Bottom Action Buttons */}
            <div className="mt-auto pt-3 border-t border-slate-800 space-y-2">
              <button
                onClick={onGoToAssessment}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Award className="w-4 h-4" />
                Lihat Sertifikat & Evaluasi
              </button>

              {onOpenTrainingHistory && (
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    onOpenTrainingHistory();
                  }}
                  className="w-full py-2 px-3 bg-slate-800/90 hover:bg-slate-700 text-blue-300 border border-slate-700 hover:border-blue-500/50 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  title="Buka Sistem Pelaporan & Riwayat Pelatihan (Skor Akurasi, Waktu, Skenario)"
                >
                  <History className="w-3.5 h-3.5 text-blue-400" />
                  <span>Riwayat Pelatihan & Kemajuan</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleRecalibrate}
                  className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold text-[11px] border border-slate-700 transition-colors cursor-pointer"
                  title="Kalibrasi ulang bilah pisau cleaver agar sudut potong tajam"
                >
                  Asah Cleaver
                </button>
                <button
                  onClick={onReset}
                  className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg font-semibold text-[11px] border border-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Uji
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Log Section */}
        {(isSplitView || currentTab === 'logs') && (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950/60">
            <ActionLogPanel
              logs={logs}
              onClearLogs={onClearLogs}
              className="h-full border-none"
            />
          </div>
        )}
      </div>
    </aside>
  );
};
