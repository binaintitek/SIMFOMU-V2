import React, { useState } from 'react';
import { TechnicianState } from '../../types/fiber';
import { AddActionLogFn } from '../../types/actionLog';
import { FIBER_SPECS } from '../../utils/standards';
import { soundEffects } from '../../utils/audio';
import { Scissors, Check, AlertTriangle, ArrowRight, RefreshCw, Gauge, SlidersHorizontal } from 'lucide-react';
import { CableTypeSelector } from '../CableTypeSelector';
import { RealToolButton } from '../RealToolPreviewCard';

interface StrippingStageProps {
  state: TechnicianState;
  updateState: (updates: Partial<TechnicianState>) => void;
  onNextStep: () => void;
  addActionLog?: AddActionLogFn;
}

export const StrippingStage: React.FC<StrippingStageProps> = ({
  state,
  updateState,
  onNextStep,
  addActionLog,
}) => {
  const [activeSide, setActiveSide] = useState<'left' | 'right'>('left');
  const [selectedHole, setSelectedHole] = useState<number>(3); // 1: jacket, 2: buffer, 3: coating
  const [isStrippingAnim, setIsStrippingAnim] = useState<boolean>(false);
  const [pullTensionMode, setPullTensionMode] = useState<'normal' | 'excessive'>('normal');
  const [stripSliderVal, setStripSliderVal] = useState<number>(
    activeSide === 'left' ? state.leftStrippedLength || 32 : state.rightStrippedLength || 32
  );
  const [showCableConfig, setShowCableConfig] = useState<boolean>(
    state.leftStrippedLength === 0 && state.rightStrippedLength === 0
  );

  const spec = FIBER_SPECS[state.fiberType] || FIBER_SPECS.G652D_SM;
  const currentLength = activeSide === 'left' ? state.leftStrippedLength : state.rightStrippedLength;
  const currentQuality = activeSide === 'left' ? state.strippingQualityLeft : state.strippingQualityRight;

  const handlePerformStrip = () => {
    soundEffects.playStripper();
    setIsStrippingAnim(true);

    setTimeout(() => {
      let quality: TechnicianState['strippingQualityLeft'] = 'perfect';
      if (pullTensionMode === 'excessive') {
        // Excessive pull force (> 15N) causes micro-cracking / nicking on cladding
        quality = 'nicked';
        soundEffects.playGlassSnap();
      } else if (selectedHole !== 3) {
        // If wrong hole used to strip primary coating, it might nick the fiber or leave coating
        quality = 'nicked';
        soundEffects.playError();
      } else if (stripSliderVal < 25) {
        quality = 'too_short';
      } else if (stripSliderVal > 40) {
        quality = 'too_long';
      }

      if (activeSide === 'left') {
        updateState({
          leftStrippedLength: stripSliderVal,
          strippingQualityLeft: quality,
        });
      } else {
        updateState({
          rightStrippedLength: stripSliderVal,
          strippingQualityRight: quality,
        });
      }
      setIsStrippingAnim(false);

      // Log real-time action
      const sideStr = activeSide === 'left' ? 'kiri' : 'kanan';
      if (quality === 'perfect') {
        addActionLog?.(`Kabel berhasil dikupas ${stripSliderVal}mm`, {
          step: 'stripping',
          severity: 'success',
          dataBadge: `${stripSliderVal}mm`,
          detail: `Serat optik ${sideStr} dikupas presisi dengan lubang no.3 (coating 250µm). Kaca cladding bersih tanpa goresan.`,
        });
      } else if (quality === 'nicked') {
        addActionLog?.(`Peringatan pengupasan: Serat optik ${sideStr} tergores (nicked)!`, {
          step: 'stripping',
          severity: 'warning',
          dataBadge: `${stripSliderVal}mm`,
          detail: `Pengupasan menggunakan lubang tang stripper yang salah (lubang no.${selectedHole}). Kaca cladding berisiko retak.`,
        });
      } else if (quality === 'too_short') {
        addActionLog?.(`Kupasan kabel ${stripSliderVal}mm terlalu pendek (< 25mm)`, {
          step: 'stripping',
          severity: 'warning',
          dataBadge: `${stripSliderVal}mm`,
          detail: `Panjang kupasan serat ${sideStr} tidak mencukupi untuk dudukan klem cleaver.`,
        });
      } else {
        addActionLog?.(`Kupasan kabel ${stripSliderVal}mm terlalu panjang (> 40mm)`, {
          step: 'stripping',
          severity: 'warning',
          dataBadge: `${stripSliderVal}mm`,
          detail: `Panjang kupasan serat ${sideStr} melebihi proteksi sleeve 60mm sehingga rawan patah.`,
        });
      }
    }, 600);
  };

  const handleResetCurrentSide = () => {
    soundEffects.playClick();
    const sideStr = activeSide === 'left' ? 'kiri' : 'kanan';
    if (activeSide === 'left') {
      updateState({
        leftStrippedLength: 0,
        strippingQualityLeft: 'unstripped',
      });
    } else {
      updateState({
        rightStrippedLength: 0,
        strippingQualityRight: 'unstripped',
      });
    }
    addActionLog?.(`Mereset pengupasan serat ${sideStr}`, {
      step: 'stripping',
      severity: 'info',
      detail: 'Kabel disiapkan ulang untuk proses pengupasan baru.',
    });
  };

  const bothFibersReady = state.leftStrippedLength >= 25 && state.rightStrippedLength >= 25;

  return (
    <div className="flex-1 bg-slate-950 p-4 sm:p-6 flex flex-col relative overflow-y-auto space-y-4">
      {/* Background blueprint grid */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      ></div>

      {/* Cable Type Configuration Panel at Start of Session */}
      {showCableConfig && (
        <div className="relative z-20">
          <CableTypeSelector
            currentFiberType={state.fiberType}
            onSelectFiberType={(type) => {
              updateState({ fiberType: type });
            }}
            addActionLog={addActionLog}
          />
        </div>
      )}

      {/* Stage Container */}
      <div className="flex-1 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col z-10">
        {/* Top Control Bar */}
        <div className="h-14 border-b border-slate-800 bg-slate-800/40 flex items-center px-4 sm:px-6 justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Target Fiber:
            </span>
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setActiveSide('left');
                  setStripSliderVal(state.leftStrippedLength || 32);
                }}
                className={`px-3 py-1 text-xs font-bold rounded transition-colors flex items-center gap-1.5 ${
                  activeSide === 'left'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Serat Kiri (Left)
                {state.leftStrippedLength >= 25 && (
                  <Check className="w-3 h-3 text-emerald-400" />
                )}
              </button>
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setActiveSide('right');
                  setStripSliderVal(state.rightStrippedLength || 32);
                }}
                className={`px-3 py-1 text-xs font-bold rounded transition-colors flex items-center gap-1.5 ${
                  activeSide === 'right'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Serat Kanan (Right)
                {state.rightStrippedLength >= 25 && (
                  <Check className="w-3 h-3 text-emerald-400" />
                )}
              </button>
            </div>

            {/* Quick Cable Switch Button */}
            <button
              onClick={() => {
                soundEffects.playClick();
                setShowCableConfig(!showCableConfig);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                showCableConfig
                  ? 'bg-blue-600/20 text-blue-300 border-blue-500/50'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3 text-blue-400" />
              <span className="hidden sm:inline">Kabel:</span>
              <span className="font-mono text-blue-400">{spec.modeType}</span>
              <span className="text-[10px] text-slate-500">({spec.name.split(' ')[0]})</span>
            </button>

            {/* Real Tool Image / Specs Button */}
            <RealToolButton currentStep="stripping" />
          </div>

          <div className="flex items-center gap-3">
            <div className="text-[11px] font-mono text-slate-400">
              STATUS:{' '}
              <span
                className={
                  currentLength >= 25 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'
                }
              >
                {currentLength >= 25
                  ? `TERKUPAS ${currentLength}mm (${currentQuality.toUpperCase()})`
                  : 'BELUM DIKUPAS'}
              </span>
            </div>
            <button
              onClick={handleResetCurrentSide}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded border border-slate-700 text-xs"
              title="Ulangi pengupasan kabel ini"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Visual Workbench Canvas */}
        <div className="flex-1 p-6 flex flex-col lg:flex-row gap-6 items-center justify-center relative">
          {/* Fiber Graphic Representation Area */}
          <div className="w-full lg:flex-1 h-64 sm:h-72 bg-slate-950/80 rounded-2xl border border-slate-800/90 relative flex flex-col justify-center px-6 overflow-hidden shadow-inner">
            {/* Measurement Ruler Scale */}
            <div className="absolute top-4 left-12 right-12 flex justify-between border-b border-slate-800 pb-1 text-[9px] font-mono text-slate-500">
              <span>0mm</span>
              <span>10mm</span>
              <span>20mm</span>
              <span className="text-emerald-400 font-bold">30-35mm (Ideal)</span>
              <span>45mm</span>
              <span>60mm</span>
            </div>

            {/* Visual Cable Rendering */}
            <div className="relative flex items-center w-full my-auto">
              {/* Outer Jacket */}
              <div
                className="h-10 rounded-l-md relative shadow-md transition-all duration-300 flex items-center pl-3 border border-black/30"
                style={{
                  width: '35%',
                  backgroundColor: spec.jacketColorHex,
                }}
              >
                <span className={`text-[10px] font-bold uppercase truncate ${
                  spec.jacketColorHex === '#1e293b' ? 'text-slate-200' : 'text-slate-950'
                }`}>
                  {spec.name.split(' ')[0]} ({spec.jacketDiameter}mm)
                </span>
              </div>

              {/* Tight Buffer 900um */}
              <div
                className="h-6 relative shadow-inner transition-all duration-300 flex items-center pl-2"
                style={{
                  width: '20%',
                  backgroundColor: spec.bufferColor,
                }}
              >
                <span className="text-[9px] font-bold text-white/90 truncate">Buffer 900μm</span>
              </div>

              {/* Acrylate Coating 250um (Stripped or remaining) */}
              {currentLength === 0 ? (
                <div className="h-3.5 bg-amber-200/90 w-44 rounded-r shadow-sm flex items-center pl-2 border border-amber-300/40">
                  <span className="text-[8px] font-mono text-slate-900">Coating 250μm</span>
                </div>
              ) : (
                <div className="flex items-center">
                  {/* Bare Silica Glass Core/Cladding 125um exposed! */}
                  <div
                    className="h-2 bg-gradient-to-r from-sky-200 via-white to-sky-100 shadow-[0_0_8px_rgba(56,189,248,0.8)] relative"
                    style={{
                      width: `${Math.min(220, currentLength * 4.5)}px`,
                    }}
                  >
                    {/* Cladding light reflection beam */}
                    <div className="absolute inset-0 bg-white/60 animate-pulse"></div>

                    {/* Core Line: SM (9um red laser line) vs MM (50um cyan graded index core) */}
                    {spec.modeType === 'SM' ? (
                      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[1.5px] bg-red-500/90 shadow-[0_0_4px_rgba(239,68,68,0.9)]"></div>
                    ) : (
                      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[4px] bg-gradient-to-r from-cyan-400 via-emerald-300 to-cyan-400 opacity-90 shadow-[0_0_6px_rgba(6,182,212,0.9)]"></div>
                    )}

                    {/* Nicked warning indicator if damaged */}
                    {currentQuality === 'nicked' && (
                      <div className="absolute -top-3 right-6 flex items-center gap-1 text-[9px] text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-500/40">
                        <AlertTriangle className="w-2.5 h-2.5" /> Core Retak / Tergores!
                      </div>
                    )}
                  </div>

                  {/* Cutoff remaining coating */}
                  <div className="h-3 bg-amber-200/70 w-16 rounded-r opacity-40 ml-0.5"></div>
                </div>
              )}
            </div>

            {/* Stripper tool graphic during animation */}
            {isStrippingAnim && (
              <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 animate-bounce bg-yellow-500/20 p-3 rounded-full border border-yellow-400/40 shadow-xl">
                <Scissors className="w-10 h-10 text-yellow-400" />
              </div>
            )}

            {/* Bottom cable anatomy guide */}
            <div className="absolute bottom-3 left-6 right-6 flex justify-between items-center text-[10px] text-slate-400">
              <span className="font-mono">
                Anatomi: Outer Jacket &gt; Buffer &gt; Primary Coating (250μm) &gt;{' '}
                <span className="text-sky-300 font-bold">Bare Glass (125μm)</span>
              </span>
              <span className="text-emerald-400 font-mono">
                Target Bare Core: 30 - 35 mm
              </span>
            </div>
          </div>

          {/* Interactive Tool Control Panel: Miller CFS-3 Stripper */}
          <div className="w-full lg:w-80 bg-slate-950/90 rounded-2xl border border-slate-800 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                <Scissors className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Miller Stripper CFS-3
                </h3>
                <p className="text-[10px] text-slate-400">Tang Pengupas Tiga Lubang Presisi</p>
              </div>
            </div>

            {/* Tri-hole Selector */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                Pilih Lubang Notch Stripper:
              </label>
              <div className="space-y-1.5">
                {[
                  {
                    id: 1,
                    label: 'Hole 1: Jaket Luar (1.6 - 3.0mm)',
                    desc: 'Kupas outer jacket tebal',
                  },
                  {
                    id: 2,
                    label: 'Hole 2: Tight Buffer (900μm)',
                    desc: 'Kupas tabung pelindung 900 mikron',
                  },
                  {
                    id: 3,
                    label: 'Hole 3: Primary Coating (250μm)',
                    desc: 'Kupas hingga bare glass 125 mikron (Wajib!)',
                  },
                ].map((hole) => (
                  <button
                    key={hole.id}
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setSelectedHole(hole.id);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs flex items-center justify-between ${
                      selectedHole === hole.id
                        ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-300 font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-[11px]">{hole.label}</p>
                      <p className="text-[9px] text-slate-500">{hole.desc}</p>
                    </div>
                    {selectedHole === hole.id && (
                      <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider Panjang Pengupasan */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-semibold text-slate-300">
                  Panjang Kupas (mm):
                </span>
                <span className="text-xs font-mono font-bold text-yellow-400">
                  {stripSliderVal} mm
                </span>
              </div>
              <input
                type="range"
                min={15}
                max={50}
                value={stripSliderVal}
                onChange={(e) => setStripSliderVal(Number(e.target.value))}
                className="w-full accent-yellow-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
                <span>15mm (Kurang)</span>
                <span className="text-emerald-400 font-bold">32mm Ideal</span>
                <span>50mm (Kelebihan)</span>
              </div>
            </div>

            {/* Gaya Penarikan Tang Stripper (Tension Pull Force Selector) */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-300">Gaya Penarikan (Tension Force):</span>
                <span className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  pullTensionMode === 'normal' 
                    ? 'text-emerald-400 bg-emerald-500/10' 
                    : 'text-rose-400 bg-rose-500/10 animate-pulse'
                }`}>
                  {pullTensionMode === 'normal' ? 'Lurus Halus (4-6 N - SOP)' : 'Kasar & Bersudut (18 N - Over-Tension)'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setPullTensionMode('normal');
                  }}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all border ${
                    pullTensionMode === 'normal'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  ✓ Tarik Halus (SOP Telkom)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setPullTensionMode('excessive');
                  }}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all border ${
                    pullTensionMode === 'excessive'
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-rose-300'
                  }`}
                  title="Simulasikan sentakan kasar yang memicu goresan cladding dan retak mikro"
                >
                  ⚡ Tarik Kasar (&gt; 15N)
                </button>
              </div>
            </div>

            {/* Action Button */}
            <button
              id="btn-strip-action"
              onClick={handlePerformStrip}
              disabled={isStrippingAnim}
              className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-yellow-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Scissors className="w-4 h-4" />
              {isStrippingAnim
                ? 'Sedang Mengupas...'
                : `Kupas Serat ${activeSide === 'left' ? 'Kiri' : 'Kanan'}`}
            </button>
          </div>
        </div>

        {/* Bottom Bar: Progression to Step 2 */}
        <div className="h-16 bg-slate-900 border-t border-slate-800 flex items-center px-6 justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Serat Kiri:</span>
              <span
                className={`font-mono font-bold ${
                  state.leftStrippedLength >= 25 ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {state.leftStrippedLength >= 25 ? `${state.leftStrippedLength}mm OK` : 'Belum'}
              </span>
            </div>
            <div className="h-4 w-px bg-slate-700"></div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Serat Kanan:</span>
              <span
                className={`font-mono font-bold ${
                  state.rightStrippedLength >= 25 ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {state.rightStrippedLength >= 25 ? `${state.rightStrippedLength}mm OK` : 'Belum'}
              </span>
            </div>
          </div>

          <button
            id="btn-next-to-cleaning"
            onClick={() => {
              soundEffects.playClick();
              onNextStep();
            }}
            disabled={!bothFibersReady}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
              bothFibersReady
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            Lanjut ke Langkah 02: Cleaning Core
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
