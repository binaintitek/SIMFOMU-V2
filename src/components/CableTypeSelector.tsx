import React, { useState } from 'react';
import { FiberType, FiberMode, TechnicianState } from '../types/fiber';
import { FIBER_SPECS, calculateSpliceAccuracy } from '../utils/standards';
import { soundEffects } from '../utils/audio';
import { AddActionLogFn } from '../types/actionLog';
import { 
  Layers, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Info, 
  ArrowRight,
  Zap,
  Activity,
  Cpu
} from 'lucide-react';

interface CableTypeSelectorProps {
  currentFiberType: FiberType;
  onSelectFiberType: (fiberType: FiberType) => void;
  addActionLog?: AddActionLogFn;
  className?: string;
  isCompact?: boolean;
}

export const CableTypeSelector: React.FC<CableTypeSelectorProps> = ({
  currentFiberType,
  onSelectFiberType,
  addActionLog,
  className = '',
  isCompact = false,
}) => {
  const currentSpec = FIBER_SPECS[currentFiberType] || FIBER_SPECS.G652D_SM;
  const [selectedMode, setSelectedMode] = useState<FiberMode>(currentSpec.modeType);

  const handleSelectCable = (type: FiberType) => {
    soundEffects.playClick();
    const newSpec = FIBER_SPECS[type];
    onSelectFiberType(type);

    addActionLog?.(
      `Tipe kabel dikonfigurasi: ${newSpec.name} (${newSpec.modeType})`,
      {
        step: 'stripping',
        severity: 'info',
        dataBadge: `${newSpec.modeType} ${newSpec.coreDiameter}µm`,
        detail: `Pengujian disesuaikan dengan standar ${newSpec.standardAuthority}. Batas redaman sambungan (loss): ≤ ${newSpec.maxAllowedLoss} dB. Toleransi sudut cleave: ≤ ${newSpec.maxCleaveAngle}°.`,
      }
    );
  };

  const smCables: FiberType[] = ['G652D_SM', 'G657A_FTTH'];
  const mmCables: FiberType[] = ['OM3_MM', 'OM4_MM'];

  return (
    <div className={`bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl ${className}`}>
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Pilihan Tipe Kabel Optik Sesi Ini
            </h3>
            <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
              SM vs MM
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Pilih jenis kabel sebelum pengupasan. Tipe serat menentukan algoritma kalkulasi redaman (loss) dan standar pengujian.
          </p>
        </div>

        {/* Mode Toggle (SM vs MM) */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-700/80 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setSelectedMode('SM');
              if (currentSpec.modeType !== 'SM') {
                handleSelectCable('G652D_SM');
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedMode === 'SM'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-950"></span>
            Single-Mode (SM)
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setSelectedMode('MM');
              if (currentSpec.modeType !== 'MM') {
                handleSelectCable('OM3_MM');
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedMode === 'MM'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-950"></span>
            Multi-Mode (MM)
          </button>
        </div>
      </div>

      {/* Cable Selection Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        {(selectedMode === 'SM' ? smCables : mmCables).map((cableKey) => {
          const item = FIBER_SPECS[cableKey];
          const isSelected = currentFiberType === cableKey;

          return (
            <div
              key={cableKey}
              onClick={() => handleSelectCable(cableKey)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? selectedMode === 'SM'
                    ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-950/30'
                    : 'bg-cyan-500/10 border-cyan-500/60 shadow-lg shadow-cyan-950/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
              }`}
            >
              {/* Selected Badge */}
              {isSelected && (
                <div
                  className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                    selectedMode === 'SM'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-cyan-500 text-slate-950'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                  Aktif
                </div>
              )}

              {/* Card Header: Color Swatch & Cable Name */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm shrink-0"
                    style={{ backgroundColor: item.jacketColorHex }}
                  />
                  <span className="text-[11px] font-mono text-slate-400">
                    {item.colorName}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white leading-tight">
                  {item.name}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  {item.description}
                </p>
              </div>

              {/* Cable Specs Strip */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-3">
                  <span className="text-slate-300">
                    Core: <strong className="text-white font-bold">{item.coreDiameter}µm</strong>
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-300">
                    Clad: <strong className="text-slate-200">125µm</strong>
                  </span>
                </div>
                <div
                  className={`px-2 py-0.5 rounded font-bold ${
                    isSelected
                      ? selectedMode === 'SM'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Max Loss: ≤ {item.maxAllowedLoss} dB
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Physics & Loss Assessment Impact Matrix */}
      {!isCompact && (
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 bg-slate-900/40 rounded-xl p-3 border border-slate-800/60">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] font-bold text-slate-300">
              Pengaruh Pemilihan Serat terhadap Algoritma Evaluasi & Akurasi:
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[10px]">
            {/* Box 1: Loss Threshold */}
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block font-medium">Batas Maks Redaman:</span>
              <p className="font-mono text-emerald-400 font-bold mt-0.5">
                {currentSpec.modeType === 'SM' ? '≤ 0.05 dB (Telkom / ITU-T)' : '≤ 0.10 dB (ISO/IEC 11801)'}
              </p>
              <span className="text-slate-500 text-[9px] block mt-0.5">
                {currentSpec.modeType === 'SM' ? 'Regulasi SOP ketat OSP' : 'Standar Data Center LAN'}
              </span>
            </div>

            {/* Box 2: Core Offset Sensitivity */}
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block font-medium">Sensitivitas PAS Core Offset:</span>
              <p className="font-mono text-blue-400 font-bold mt-0.5">
                {currentSpec.modeType === 'SM' ? 'Sangat Tinggi (Formula Marcuse)' : 'Sedang (Graded-Index 50µm)'}
              </p>
              <span className="text-slate-500 text-[9px] block mt-0.5">
                {currentSpec.modeType === 'SM' ? 'Inti 9µm rentan geser sumbu' : 'Inti 50µm area 30x lebih besar'}
              </span>
            </div>

            {/* Box 3: Cleave Tolerance */}
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 block font-medium">Toleransi Sudut Potong (Cleave):</span>
              <p className="font-mono text-amber-400 font-bold mt-0.5">
                {currentSpec.modeType === 'SM' ? '≤ 0.8° (Ideal < 0.5°)' : '≤ 1.2° (Ideal < 0.7°)'}
              </p>
              <span className="text-slate-500 text-[9px] block mt-0.5">
                {currentSpec.modeType === 'SM' ? 'NA rendah (sudut terima kecil)' : 'NA tinggi (0.20 NA acceptance)'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
