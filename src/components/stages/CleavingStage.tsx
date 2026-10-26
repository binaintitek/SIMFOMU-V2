import React, { useState } from 'react';
import { TechnicianState } from '../../types/fiber';
import { AddActionLogFn } from '../../types/actionLog';
import { soundEffects } from '../../utils/audio';
import { 
  Check, 
  ArrowRight, 
  AlertTriangle, 
  RotateCw, 
  Ruler, 
  Sliders, 
  Eye,
  Wrench,
  ShieldAlert
} from 'lucide-react';
import { RealToolButton } from '../RealToolPreviewCard';
import { getExamSettings } from '../../utils/adminAuth';
import { checkShouldTriggerFailure, resolveEquipmentIncident, DEFAULT_EQUIPMENT_HEALTH } from '../../utils/equipmentFailureService';

interface CleavingStageProps {
  state: TechnicianState;
  updateState: (updates: Partial<TechnicianState>) => void;
  onNextStep: () => void;
  addActionLog?: AddActionLogFn;
}

export const CleavingStage: React.FC<CleavingStageProps> = ({
  state,
  updateState,
  onNextStep,
  addActionLog,
}) => {
  const [activeSide, setActiveSide] = useState<'left' | 'right'>('left');
  const [gaugePos, setGaugePos] = useState<number>(16); // mm on cleaver ruler (10-20mm)
  const [clampClosed, setClampClosed] = useState<boolean>(false);
  const [isSlidingBlade, setIsSlidingBlade] = useState<boolean>(false);
  const [bladeSlidePercent, setBladeSlidePercent] = useState<number>(0);
  const [showMicroscope, setShowMicroscope] = useState<boolean>(false);

  const cleaveLength = activeSide === 'left' ? state.leftCleaveLength : state.rightCleaveLength;
  const cleaveAngle = activeSide === 'left' ? state.leftCleaveAngle : state.rightCleaveAngle;
  const isCleaved = cleaveLength > 0;

  const handlePerformCleave = () => {
    if (!clampClosed) {
      soundEffects.playError();
      alert('Tutup klem penjepit fiber terlebih dahulu sebelum menggeser bilah pisau!');
      return;
    }

    setIsSlidingBlade(true);
    soundEffects.playCleaverCut();

    // Animate blade carriage moving
    let p = 0;
    const interval = setInterval(() => {
      p += 20;
      setBladeSlidePercent(p);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsSlidingBlade(false);
          setBladeSlidePercent(0);

          // Calculate realistic cleave angle & check equipment failure:
          const examSettings = getExamSettings();
          const currentHealth = state.equipmentHealth || DEFAULT_EQUIPMENT_HEALTH;
          const failureIncident = checkShouldTriggerFailure(
            examSettings,
            currentHealth,
            'cleaving',
            'dull_cleaver'
          );

          let angle = 0.4;
          let isFailureActive = false;

          if (failureIncident || state.cleaveBladeCondition === 'worn' || currentHealth.cleaverBladeCondition === 'worn') {
            isFailureActive = true;
            angle = Number((1.3 + Math.random() * 0.5).toFixed(1));
            soundEffects.playEquipmentAlarm();
          } else {
            // normal variation: 0.3 to 0.6
            const variance = (Math.abs(gaugePos - 16) * 0.08) + (Math.random() * 0.2);
            angle = Number((0.3 + variance).toFixed(1));
          }

          const stateUpdates: Partial<TechnicianState> = {
            ...(activeSide === 'left'
              ? { leftCleaveLength: gaugePos, leftCleaveAngle: angle }
              : { rightCleaveLength: gaugePos, rightCleaveAngle: angle }),
          };

          if (failureIncident) {
            stateUpdates.cleaveBladeCondition = 'worn';
            stateUpdates.equipmentHealth = {
              ...currentHealth,
              activeFailure: failureIncident,
              cleaverBladeCondition: 'worn',
            };
          }

          updateState(stateUpdates);
          setShowMicroscope(true);

          const sideStr = activeSide === 'left' ? 'serat kiri' : 'serat kanan';
          if (isFailureActive) {
            addActionLog?.(`[ANOMALI ALAT] Pisau cleaver tumpul: Sudut potong ${angle.toFixed(1)}° (${sideStr})`, {
              step: 'cleaving',
              severity: 'error',
              dataBadge: `${angle.toFixed(1)}° FAIL`,
              detail: `Bilah intan cleaver posisi channel #${currentHealth.cleaverBladePosition} aus. Sudut ${angle.toFixed(1)}° gagal standar Telkom (≤0.8°). Putar posisi pisau dengan kunci L untuk mengasah titik potong baru.`,
            });
          } else {
            addActionLog?.(`Sudut potong ${angle.toFixed(1)} derajat (${sideStr})`, {
              step: 'cleaving',
              severity: angle <= 0.8 ? 'success' : 'warning',
              dataBadge: `${angle.toFixed(1)}°`,
              detail: angle <= 0.8
                ? `Pemotongan ${sideStr} presisi tinggi. Sudut ${angle.toFixed(1)}° memenuhi standar SOP Telkom (toleransi ≤ 0.8°). Panjang kupasan ${gaugePos}mm.`
                : `Sudut potong ${sideStr} (${angle.toFixed(1)}°) melebihi toleransi standar (0.8°). Hasil sambungan berisiko loss tinggi.`,
            });
          }
        }, 300);
      }
    }, 40);
  };

  const handleRotateBladeChannel = () => {
    soundEffects.playToolFixed();
    const currentHealth = state.equipmentHealth || DEFAULT_EQUIPMENT_HEALTH;
    const nextHealth = resolveEquipmentIncident(currentHealth, 'dull_cleaver');

    updateState({
      equipmentHealth: nextHealth,
      cleaveBladeCondition: 'sharp',
      leftCleaveAngle: state.leftCleaveAngle > 1.0 ? 0.4 : state.leftCleaveAngle,
      rightCleaveAngle: state.rightCleaveAngle > 1.0 ? 0.3 : state.rightCleaveAngle,
    });

    addActionLog?.(`[KETANGGUHAN TEKNISI] Rotasi mata pisau cleaver ke posisi channel #${nextHealth.cleaverBladePosition}`, {
      step: 'cleaving',
      severity: 'success',
      dataBadge: `Blade #${nextHealth.cleaverBladePosition}`,
      detail: `SOP Maintenance Cleaver FC-6S: Baut heksagonal dilonggarkan, roda mata pisau diputar dari posisi #${currentHealth.cleaverBladePosition} ke posisi #${nextHealth.cleaverBladePosition}. Mata intan baru siap digunakan.`,
    });
  };

  const handleRecut = () => {
    soundEffects.playClick();
    const sideStr = activeSide === 'left' ? 'serat kiri' : 'serat kanan';
    setClampClosed(false);
    setShowMicroscope(false);
    if (activeSide === 'left') {
      updateState({ leftCleaveLength: 0, leftCleaveAngle: 0.4 });
    } else {
      updateState({ rightCleaveLength: 0, rightCleaveAngle: 0.3 });
    }
    addActionLog?.(`Menyiapkan pemotongan ulang pada ${sideStr}`, {
      step: 'cleaving',
      severity: 'info',
      detail: 'Serat dikeluarkan dari klem cleaver untuk dipotong kembali.',
    });
  };

  const bothCleaved = state.leftCleaveLength > 0 && state.rightCleaveLength > 0;

  return (
    <div className="flex-1 bg-slate-950 p-4 sm:p-6 flex flex-col relative overflow-y-auto">
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      ></div>

      <div className="flex-1 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col z-10">
        {/* Top Control Bar */}
        <div className="h-14 border-b border-slate-800 bg-slate-800/40 flex items-center px-4 sm:px-6 justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pilih Serat:
            </span>
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setActiveSide('left');
                  setClampClosed(false);
                  setShowMicroscope(state.leftCleaveLength > 0);
                }}
                className={`px-3 py-1 text-xs font-bold rounded transition-colors flex items-center gap-1.5 ${
                  activeSide === 'left'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Serat Kiri
                {state.leftCleaveLength > 0 && <Check className="w-3 h-3 text-emerald-400" />}
              </button>
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setActiveSide('right');
                  setClampClosed(false);
                  setShowMicroscope(state.rightCleaveLength > 0);
                }}
                className={`px-3 py-1 text-xs font-bold rounded transition-colors flex items-center gap-1.5 ${
                  activeSide === 'right'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Serat Kanan
                {state.rightCleaveLength > 0 && <Check className="w-3 h-3 text-emerald-400" />}
              </button>
            </div>

            {/* Real Tool Button */}
            <RealToolButton currentStep="cleaving" />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Hasil Potong:</span>
              <span
                className={`font-mono font-bold ${
                  isCleaved
                    ? cleaveAngle <= 0.8
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                    : 'text-slate-500'
                }`}
              >
                {isCleaved ? `${cleaveLength}mm | Sudut: ${cleaveAngle.toFixed(1)}°` : 'BELUM DIPOTONG'}
              </span>
            </div>
            <button
              onClick={handleRecut}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded border border-slate-700 text-xs flex items-center gap-1"
              title="Potong ulang serat ini"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Potong Ulang</span>
            </button>
          </div>
        </div>

        {/* Workbench Area */}
        <div className="flex-1 p-6 flex flex-col lg:flex-row gap-6 items-center justify-center">
          {/* Main Realistic Cleaver Visualization */}
          <div className="w-full lg:flex-1 h-72 sm:h-80 bg-slate-950 rounded-2xl border border-slate-800 relative flex flex-col p-6 overflow-hidden shadow-inner">
            {/* Top status & Cleaver Model Badge */}
            <div className="flex justify-between items-center mb-4 z-10">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                  High Precision Cleaver FC-6S
                </span>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Toleransi &lt; 0.8°
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Klem:{' '}
                <span className={clampClosed ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {clampClosed ? 'TERKUNCI' : 'TERBUKA'}
                </span>
              </div>
            </div>

            {/* Blade Condition & Channel Status Indicator */}
            {(() => {
              const currentHealth = state.equipmentHealth || DEFAULT_EQUIPMENT_HEALTH;
              const isBladeWorn = state.cleaveBladeCondition === 'worn' || currentHealth.cleaverBladeCondition === 'worn';
              return (
                <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 mb-3 text-[11px] flex-wrap gap-2 z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono">
                      Mata Pisau: Channel <strong className="text-white">#{currentHealth.cleaverBladePosition}</strong>/16
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isBladeWorn 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse' 
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {isBladeWorn ? '⚠️ TUMPUL / AUS' : '✓ TAJAM'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleRotateBladeChannel}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isBladeWorn
                        ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-900/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                    title="Rotasi pisau ke titik potong berikutnya (1-16)"
                  >
                    <Wrench className="w-3 h-3" />
                    <span>Putar Pisau ke Posisi #{((currentHealth.cleaverBladePosition % 16) + 1)}</span>
                  </button>
                </div>
              );
            })()}

            {/* Cleaver Body Illustration */}
            <div className="flex-1 relative bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col justify-center px-6 overflow-hidden">
              {/* Ruler Scale on Cleaver Bed */}
              <div className="flex justify-between border-b-2 border-slate-700 pb-1 mb-4 text-[10px] font-mono text-slate-400">
                <span className="text-slate-600">8mm</span>
                <span className={gaugePos === 10 ? 'text-blue-400 font-bold' : ''}>10mm</span>
                <span className={gaugePos === 12 ? 'text-blue-400 font-bold' : ''}>12mm</span>
                <span className={gaugePos === 16 ? 'text-emerald-400 font-extrabold' : ''}>
                  16mm (Ideal Telkom)
                </span>
                <span className={gaugePos === 20 ? 'text-blue-400 font-bold' : ''}>20mm</span>
              </div>

              {/* Fiber on V-Groove Channel */}
              <div className="relative flex items-center w-full">
                {/* Fiber Cable Entering from Left */}
                <div className="w-24 h-6 bg-yellow-500 rounded-l flex items-center pl-2 shadow-md">
                  <span className="text-[8px] font-bold text-slate-950">COATING</span>
                </div>

                {/* Bare Glass Fiber Laying across ruler bed */}
                <div
                  className="h-1.5 bg-sky-200 relative shadow-[0_0_8px_rgba(56,189,248,0.7)]"
                  style={{ width: `${gaugePos * 18}px` }}
                >
                  <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[1px] bg-red-500"></div>
                </div>

                {/* Cleaver Cut Line Marker */}
                <div className="w-0.5 h-12 bg-rose-500/80 -translate-y-2 relative flex items-center justify-center">
                  <span className="absolute -top-4 text-[9px] font-bold text-rose-400 uppercase">
                    Titik Potong
                  </span>
                </div>

                {/* Off-cut scrap fiber (falls into bin after cut) */}
                {!isCleaved ? (
                  <div className="w-16 h-1.5 bg-sky-200/50"></div>
                ) : (
                  <div className="text-[10px] text-slate-500 italic pl-3">
                    [Sisa potongan masuk ke kotak limbah]
                  </div>
                )}
              </div>

              {/* Clamp Lid Visual Representation */}
              <div
                className={`mt-4 py-2 px-3 rounded-lg border text-xs flex items-center justify-between transition-all ${
                  clampClosed
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                }`}
              >
                <span className="flex items-center gap-1.5 font-semibold">
                  <Sliders className="w-3.5 h-3.5" />
                  {clampClosed
                    ? 'Klem Fiber Rapat & Terkunci (Siap Potong)'
                    : 'Klem Fiber Terbuka (Kunci klem sebelum potong)'}
                </span>
                <button
                  id="btn-clamp-cleaver"
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setClampClosed(!clampClosed);
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-bold border border-slate-700"
                >
                  {clampClosed ? 'Buka Klem' : 'Kunci Klem'}
                </button>
              </div>

              {/* Sliding Blade Animation overlay */}
              {isSlidingBlade && (
                <div
                  className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-red-600/40 via-red-500 to-red-600/40 border-x border-red-400 shadow-2xl flex items-center justify-center z-20 pointer-events-none"
                  style={{ left: `${bladeSlidePercent}%` }}
                >
                  <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>
                </div>
              )}
            </div>

            {/* Bottom guide note */}
            <div className="mt-3 flex justify-between items-center text-[10px] text-slate-400">
              <span>Pastikan serat lurus 90° tegak lurus terhadap bilah intan.</span>
              <span className="text-emerald-400 font-mono">Standar Panjang: 12mm - 16mm</span>
            </div>
          </div>

          {/* Side Control & Microscope Inspection Panel */}
          <div className="w-full lg:w-80 bg-slate-950/90 rounded-2xl border border-slate-800 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Ruler className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Pengaturan Cleaver
                </h3>
                <p className="text-[10px] text-slate-400">Presisi Panjang &amp; Sudut Potong</p>
              </div>
            </div>

            {/* Ruler Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-semibold text-slate-300">
                  Posisi Skala Penggaris:
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">{gaugePos} mm</span>
              </div>
              <input
                type="range"
                min={10}
                max={20}
                step={2}
                value={gaugePos}
                disabled={clampClosed}
                onChange={(e) => setGaugePos(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer h-2 bg-slate-800 rounded-lg disabled:opacity-50"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
                <span>10mm</span>
                <span className="text-emerald-400 font-bold">16mm Ideal</span>
                <span>20mm</span>
              </div>
            </div>

            {/* Microscope End-Face Inspection */}
            {showMicroscope && isCleaved ? (
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    Inspeksi Ujung Serat (Microscope)
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      cleaveAngle <= 0.8
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {cleaveAngle <= 0.8 ? 'LULUS (PERFECT)' : 'WARNING (MIRING)'}
                  </span>
                </div>

                {/* Graphical cross section */}
                <div className="h-20 bg-black/60 rounded-lg border border-slate-700/60 relative flex items-center justify-center overflow-hidden">
                  <div className="relative flex items-center">
                    {/* Fiber glass cylinder */}
                    <div
                      className="w-28 h-10 bg-gradient-to-b from-sky-300 to-sky-600 rounded-l shadow-inner relative overflow-hidden"
                      style={{
                        transform: `rotate(${cleaveAngle > 0.8 ? (cleaveAngle - 0.5) * 2 : 0}deg)`,
                      }}
                    >
                      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-2 bg-red-400/80"></div>
                    </div>
                    {/* Flat cut end face */}
                    <div className="w-1.5 h-10 bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]"></div>
                  </div>
                  <span className="absolute bottom-1 right-2 text-[9px] font-mono text-emerald-400">
                    Sudut: {cleaveAngle.toFixed(1)}° (Max 0.8°)
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                Kunci klem lalu dorong tombol potong bilah intan untuk melihat hasil sudut cleaving di bawah mikroskop.
              </div>
            )}

            {/* Cut Button */}
            <button
              id="btn-perform-cleave"
              onClick={handlePerformCleave}
              disabled={isSlidingBlade || !clampClosed}
              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
                clampClosed && !isSlidingBlade
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/30 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              {isSlidingBlade
                ? 'Sedang Memotong...'
                : `Dorong Bilah Pisau (Potong Serat ${activeSide === 'left' ? 'Kiri' : 'Kanan'})`}
            </button>
          </div>
        </div>

        {/* Bottom Progression Bar */}
        <div className="h-16 bg-slate-900 border-t border-slate-800 flex items-center px-6 justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Serat Kiri:</span>
              <span
                className={`font-mono font-bold ${
                  state.leftCleaveLength > 0 ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {state.leftCleaveLength > 0
                  ? `${state.leftCleaveLength}mm (${state.leftCleaveAngle.toFixed(1)}°)`
                  : 'Belum'}
              </span>
            </div>
            <div className="h-4 w-px bg-slate-700"></div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Serat Kanan:</span>
              <span
                className={`font-mono font-bold ${
                  state.rightCleaveLength > 0 ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {state.rightCleaveLength > 0
                  ? `${state.rightCleaveLength}mm (${state.rightCleaveAngle.toFixed(1)}°)`
                  : 'Belum'}
              </span>
            </div>
          </div>

          <button
            id="btn-next-to-splicing"
            onClick={() => {
              soundEffects.playClick();
              onNextStep();
            }}
            disabled={!bothCleaved}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
              bothCleaved
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            Lanjut ke Langkah 04: Fusion Splicing
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
