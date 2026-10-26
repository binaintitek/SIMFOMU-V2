import React, { useState } from 'react';
import { 
  Sliders, 
  Settings, 
  X, 
  Clock, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles,
  Zap,
  Building,
  UserCheck,
  Shield,
  Layers,
  BatteryLow,
  Wrench,
  Flame,
  Check,
  Activity,
  ShieldAlert,
  Play
} from 'lucide-react';
import { 
  ExamSettings, 
  getExamSettings, 
  saveExamSettings, 
  DEFAULT_EXAM_SETTINGS 
} from '../utils/adminAuth';
import { EquipmentFailureType, FailureProbability } from '../types/equipmentFailure';
import { createManualIncident, DEFAULT_EQUIPMENT_HEALTH } from '../utils/equipmentFailureService';
import { TechnicianState } from '../types/fiber';
import { soundEffects } from '../utils/audio';

interface ExamSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: TechnicianState;
  updateState: (updates: Partial<TechnicianState>) => void;
  onApplySettings: (settings: ExamSettings) => void;
}

export const ExamSettingsModal: React.FC<ExamSettingsModalProps> = ({
  isOpen,
  onClose,
  state,
  updateState,
  onApplySettings,
}) => {
  const [settings, setSettings] = useState<ExamSettings>(() => getExamSettings());
  const [savedNotice, setSavedNotice] = useState(false);
  const [injectNotice, setInjectNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInjectFailureImmediate = (type: EquipmentFailureType) => {
    soundEffects.playEquipmentAlarm();
    const incident = createManualIncident(type, 'splicing');
    const prevHealth = state.equipmentHealth || DEFAULT_EQUIPMENT_HEALTH;
    updateState({
      randomEquipmentFailureEnabled: true,
      equipmentHealth: {
        ...prevHealth,
        activeFailure: incident,
        splicerBatteryLevel: type === 'low_battery' ? 7 : prevHealth.splicerBatteryLevel,
        cleaverBladeCondition: type === 'dull_cleaver' ? 'worn' : prevHealth.cleaverBladeCondition,
        electrodesCondition: type === 'dirty_electrode' ? 'oxidized' : prevHealth.electrodesCondition,
        vGrooveCondition: type === 'dusty_vgroove' ? 'dusty' : prevHealth.vGrooveCondition,
        heaterCondition: type === 'heater_fault' ? 'fault' : prevHealth.heaterCondition,
      },
      ...(type === 'dull_cleaver' ? { leftCleaveAngle: 1.5, rightCleaveAngle: 1.4 } : {}),
    });
    setInjectNotice(`Skenario '${incident.title}' berhasil diinjeksikan langsung!`);
    setTimeout(() => setInjectNotice(null), 3500);
  };

  const handleSave = (applyToSim = true) => {
    soundEffects.playSuccessBeep();
    saveExamSettings(settings);

    if (applyToSim) {
      onApplySettings(settings);

      // Apply initial conditions to simulator state if difficulty/cleaver preset is selected
      const updates: Partial<TechnicianState> = {
        mode: settings.examMode === 'exam' ? 'exam' : 'training',
        cleaveBladeCondition: settings.cleaverBladePreset,
        leftCleaveAngle: settings.initialCleaveAngle,
        rightCleaveAngle: Number((settings.initialCleaveAngle * 0.9).toFixed(1)),
        dynamicDifficulty: settings.dynamicDifficulty,
        maxAllowedLoss: settings.otdrToleranceDb,
        stepTimeLimitSeconds: settings.stepTimeLimitSeconds,
        randomEquipmentFailureEnabled: settings.randomEquipmentFailureEnabled,
      };

      if (!state.equipmentHealth) {
        updates.equipmentHealth = {
          ...DEFAULT_EQUIPMENT_HEALTH,
          cleaverBladeCondition: settings.cleaverBladePreset,
        };
      }

      if (settings.injectDefectType !== 'none') {
        updates.defectType = settings.injectDefectType;
      }

      updateState(updates);
    }

    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  const handleResetDefault = () => {
    soundEffects.playClick();
    setSettings(DEFAULT_EXAM_SETTINGS);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn font-sans">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden relative text-slate-200 my-6 max-h-[90vh] flex flex-col">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-indigo-900/60 via-blue-900/40 to-slate-900 p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <Sliders className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Pengaturan Parameter Soal Ujian
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-400/30">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Konfigurasi Skenario Uji Kompetensi, Batas Waktu & Injeksi Gangguan
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto pr-3">
          {/* Mode Sesi Selector */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              1. Mode Sesi Penilaian:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setSettings({ ...settings, examMode: 'practice' });
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.examMode === 'practice'
                    ? 'bg-blue-600/20 border-blue-400 text-white ring-1 ring-blue-400/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-blue-300">🎯 Mode Latihan Bebas</span>
                  {settings.examMode === 'practice' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Peserta bebas berlatih dan mencetak sertifikat latihan mandiri.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setSettings({ ...settings, examMode: 'exam' });
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.examMode === 'exam'
                    ? 'bg-amber-600/20 border-amber-400 text-white ring-1 ring-amber-400/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-amber-300">📝 Ujian Kompetensi Resmi</span>
                  {settings.examMode === 'exam' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Ujian resmi sertifikasi Telkom dengan parameter penguji ketat.
                </p>
              </button>
            </div>
          </div>

          {/* Batch Info & Examiner Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Judul Gelombang / Batch Ujian:
              </label>
              <input
                type="text"
                value={settings.batchTitle}
                onChange={(e) => setSettings({ ...settings, batchTitle: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-indigo-400"
                placeholder="Contoh: Uji Sertifikasi FTTH Telkom Gelombang I"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Nama Asesor / Penguji Resmi:
              </label>
              <input
                type="text"
                value={settings.examinerName}
                onChange={(e) => setSettings({ ...settings, examinerName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-indigo-400"
                placeholder="Nama Penguji / Asesor"
              />
            </div>
          </div>

          {/* Time Limit Setting */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              2. Batasan Waktu Ujian (Timer Limit):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { val: 0, label: 'Tanpa Batas', desc: 'Stopwatch biasa' },
                { val: 3, label: '3 Menit', desc: 'Speed Challenge' },
                { val: 5, label: '5 Menit', desc: 'Standar Telkom' },
                { val: 10, label: '10 Menit', desc: 'Sesi Ujian Santai' },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setSettings({ ...settings, timeLimitMinutes: item.val });
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    settings.timeLimitMinutes === item.val
                      ? 'bg-amber-500/20 border-amber-400 text-white font-bold ring-1 ring-amber-400/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <span className="block text-xs font-bold">{item.label}</span>
                  <span className="text-[10px] text-slate-500">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Difficulty (Easy/Normal/Hard) & OTDR Tolerance & Step Timing */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400" />
                3. Tingkat Kesulitan Dinamis &amp; Toleransi OTDR:
              </label>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                settings.dynamicDifficulty === 'hard'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : settings.dynamicDifficulty === 'easy'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
              }`}>
                Mode: {settings.dynamicDifficulty?.toUpperCase() || 'NORMAL'}
              </span>
            </div>

            {/* 3 Main Preset Cards: Easy / Normal / Hard */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* EASY MODE */}
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setSettings({
                    ...settings,
                    dynamicDifficulty: 'easy',
                    otdrToleranceDb: 0.08,
                    stepTimeLimitSeconds: 90,
                    maxAllowedLoss: 0.08,
                    difficultyLevel: 'standard',
                    cleaverBladePreset: 'sharp',
                    initialCleaveAngle: 0.3,
                    strictStandards: false,
                  });
                }}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  settings.dynamicDifficulty === 'easy'
                    ? 'bg-emerald-950/40 border-emerald-400 text-white ring-2 ring-emerald-400/40 shadow-lg shadow-emerald-950/50'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-xs text-emerald-400 flex items-center gap-1">
                    🌱 Mudah (Easy)
                  </span>
                  {settings.dynamicDifficulty === 'easy' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-300 leading-snug mb-2 font-medium">
                  Toleransi longgar &amp; ramah pemula, cocok untuk orientasi dasar.
                </p>
                <div className="space-y-1 text-[10px] font-mono border-t border-slate-800/80 pt-2">
                  <div className="flex items-center justify-between text-emerald-300">
                    <span className="text-slate-400">Toleransi OTDR:</span>
                    <strong className="font-bold">≤ 0.08 dB</strong>
                  </div>
                  <div className="flex items-center justify-between text-emerald-300">
                    <span className="text-slate-400">Waktu / Langkah:</span>
                    <strong className="font-bold">90 Detik</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Sudut Cleave:</span>
                    <span>0.3° (Tajam)</span>
                  </div>
                </div>
              </button>

              {/* NORMAL / STANDARD MODE */}
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setSettings({
                    ...settings,
                    dynamicDifficulty: 'normal',
                    otdrToleranceDb: 0.05,
                    stepTimeLimitSeconds: 50,
                    maxAllowedLoss: 0.05,
                    difficultyLevel: 'standard',
                    cleaverBladePreset: 'sharp',
                    initialCleaveAngle: 0.4,
                    strictStandards: false,
                  });
                }}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  settings.dynamicDifficulty === 'normal'
                    ? 'bg-blue-950/40 border-blue-400 text-white ring-2 ring-blue-400/40 shadow-lg shadow-blue-950/50'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-xs text-blue-400 flex items-center gap-1">
                    ⚙️ Standar (Normal)
                  </span>
                  {settings.dynamicDifficulty === 'normal' && (
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-300 leading-snug mb-2 font-medium">
                  Standar regulasi resmi Telkom Akses SOP ITU-T G.652.D.
                </p>
                <div className="space-y-1 text-[10px] font-mono border-t border-slate-800/80 pt-2">
                  <div className="flex items-center justify-between text-blue-300">
                    <span className="text-slate-400">Toleransi OTDR:</span>
                    <strong className="font-bold">≤ 0.05 dB</strong>
                  </div>
                  <div className="flex items-center justify-between text-blue-300">
                    <span className="text-slate-400">Waktu / Langkah:</span>
                    <strong className="font-bold">50 Detik</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Sudut Cleave:</span>
                    <span>0.4° (Tajam)</span>
                  </div>
                </div>
              </button>

              {/* HARD MODE */}
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setSettings({
                    ...settings,
                    dynamicDifficulty: 'hard',
                    otdrToleranceDb: 0.02,
                    stepTimeLimitSeconds: 25,
                    maxAllowedLoss: 0.02,
                    difficultyLevel: 'challenge',
                    cleaverBladePreset: 'worn',
                    initialCleaveAngle: 1.0,
                    strictStandards: true,
                  });
                }}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  settings.dynamicDifficulty === 'hard'
                    ? 'bg-rose-950/40 border-rose-400 text-white ring-2 ring-rose-400/40 shadow-lg shadow-rose-950/50'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-xs text-rose-400 flex items-center gap-1">
                    🔥 Ketat (Hard)
                  </span>
                  {settings.dynamicDifficulty === 'hard' && (
                    <CheckCircle2 className="w-4 h-4 text-rose-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-300 leading-snug mb-2 font-medium">
                  Waktu diperketat &amp; toleransi dB sangat minim, uji kecepatan &amp; ketangkasan.
                </p>
                <div className="space-y-1 text-[10px] font-mono border-t border-slate-800/80 pt-2">
                  <div className="flex items-center justify-between text-rose-300">
                    <span className="text-slate-400">Toleransi OTDR:</span>
                    <strong className="font-bold">≤ 0.02 dB</strong>
                  </div>
                  <div className="flex items-center justify-between text-rose-300">
                    <span className="text-slate-400">Waktu / Langkah:</span>
                    <strong className="font-bold">25 Detik</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Sudut Cleave:</span>
                    <span>1.0° (Aus)</span>
                  </div>
                </div>
              </button>
            </div>

            {/* Fine-Tuning Sliders for OTDR dB Tolerance and Step Time Limit */}
            <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800/80 space-y-3 mt-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  Fine-Tuning Parameter Uji Lapangan
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  Pengaturan kustom dinamis
                </span>
              </div>

              {/* Slider 1: OTDR Loss Tolerance (dB) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">
                    Toleransi Redaman OTDR (Maksimum dB):
                  </span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                    settings.otdrToleranceDb <= 0.03
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : settings.otdrToleranceDb <= 0.06
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    ≤ {settings.otdrToleranceDb.toFixed(2)} dB
                  </span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.15"
                  step="0.01"
                  value={settings.otdrToleranceDb}
                  onChange={(e) => {
                    const val = Number(parseFloat(e.target.value).toFixed(2));
                    setSettings({
                      ...settings,
                      otdrToleranceDb: val,
                      maxAllowedLoss: val,
                      dynamicDifficulty: val <= 0.03 ? 'hard' : (val >= 0.07 ? 'easy' : 'normal'),
                    });
                  }}
                  className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0.01 dB (Ultra Ketat)</span>
                  <span>0.05 dB (Standar Telkom)</span>
                  <span>0.15 dB (Longgar)</span>
                </div>
              </div>

              {/* Slider 2: Per-Step Time Limit (Seconds) */}
              <div className="space-y-1.5 pt-1 border-t border-slate-800/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">
                    Batas Waktu per Langkah / Tahapan:
                  </span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                    settings.stepTimeLimitSeconds <= 30
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : settings.stepTimeLimitSeconds <= 60
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    ⏱️ {settings.stepTimeLimitSeconds} Detik / Langkah
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="120"
                  step="5"
                  value={settings.stepTimeLimitSeconds}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setSettings({
                      ...settings,
                      stepTimeLimitSeconds: val,
                      dynamicDifficulty: val <= 30 ? 'hard' : (val >= 70 ? 'easy' : 'normal'),
                    });
                  }}
                  className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>15s (Kecepatan Tinggi / Hard)</span>
                  <span>50s (Standar)</span>
                  <span>120s (Santai / Easy)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Injeksi Defect Khusus */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                4. Injeksi Kerusakan Khusus (Defect Test):
              </label>
              <span className="text-[10px] text-slate-500">Uji kemampuan identifikasi teknisi</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { type: 'none', label: 'Normal (Tanpa Defect)' },
                { type: 'bubble', label: 'Gelembung Udara (Bubble)' },
                { type: 'waist', label: 'Penyempitan (Waist)' },
                { type: 'thick', label: 'Pembengkakan (Thick)' },
                { type: 'offset', label: 'Core Offset (Miring)' },
                { type: 'angle_fail', label: 'Sudut Cleave Miring' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setSettings({
                      ...settings,
                      injectDefectType: item.type as any,
                    });
                  }}
                  className={`p-2 rounded-xl border text-xs text-center transition-all ${
                    settings.injectDefectType === item.type
                      ? 'bg-indigo-600/30 border-indigo-400 text-white font-bold ring-1 ring-indigo-400/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Modul Pelatihan Ketangguhan: Random Equipment Failure */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <label className="text-xs font-bold text-white block">
                    5. Modul Ketangguhan Teknisi: Random Equipment Failure
                  </label>
                  <p className="text-[10px] text-slate-400">
                    Simulasikan anomali alat mendadak untuk melatih respon troubleshooting SOP
                  </p>
                </div>
              </div>

              {/* Master Switch Toggle */}
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setSettings({
                    ...settings,
                    randomEquipmentFailureEnabled: !settings.randomEquipmentFailureEnabled,
                  });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                  settings.randomEquipmentFailureEnabled
                    ? 'bg-rose-600/30 border-rose-400 text-rose-300 shadow-md shadow-rose-900/30'
                    : 'bg-slate-850 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${settings.randomEquipmentFailureEnabled ? 'bg-rose-400 animate-pulse' : 'bg-slate-600'}`} />
                <span>{settings.randomEquipmentFailureEnabled ? 'STATUS: AKTIF (ON)' : 'STATUS: NONAKTIF (OFF)'}</span>
              </button>
            </div>

            {settings.randomEquipmentFailureEnabled && (
              <div className="space-y-3.5 pt-2 border-t border-slate-800/80 animate-fadeIn">
                {/* Probability Selector */}
                <div>
                  <span className="text-[11px] font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    Frekuensi / Probabilitas Terjadinya Gangguan:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { val: 'low' as FailureProbability, label: 'Rendah (20%)', desc: 'Muncul sesekali' },
                      { val: 'medium' as FailureProbability, label: 'Sedang (45%)', desc: 'Rekomendasi Uji' },
                      { val: 'high' as FailureProbability, label: 'Tinggi (70%)', desc: 'Ujian Intensif' },
                      { val: 'always' as FailureProbability, label: 'Selalu (100%)', desc: 'Evaluasi Pasti' },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => {
                          soundEffects.playClick();
                          setSettings({ ...settings, failureProbability: item.val });
                        }}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          settings.failureProbability === item.val
                            ? 'bg-amber-500/20 border-amber-400 text-white font-bold ring-1 ring-amber-400/40'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                        }`}
                      >
                        <span className="block text-xs font-bold">{item.label}</span>
                        <span className="text-[9px] text-slate-500">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skenario Gangguan Alat Aktif */}
                <div>
                  <span className="text-[11px] font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                    Pilihan Skenario Masalah Alat yang Dapat Terjadi:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      {
                        type: 'low_battery' as EquipmentFailureType,
                        icon: <BatteryLow className="w-4 h-4 text-amber-400" />,
                        title: 'Baterai Lemah Splicer (< 10%)',
                        desc: 'Mesin blokir arc, teknisi wajib sambung adaptor charger',
                      },
                      {
                        type: 'dull_cleaver' as EquipmentFailureType,
                        icon: <Wrench className="w-4 h-4 text-rose-400" />,
                        title: 'Mata Pisau Cleaver Tumpul',
                        desc: 'Sudut > 1.2°, teknisi wajib rotasi posisi pisau (1-16)',
                      },
                      {
                        type: 'dirty_electrode' as EquipmentFailureType,
                        icon: <Zap className="w-4 h-4 text-amber-300" />,
                        title: 'Elektroda Teroksidasi',
                        desc: 'Arc sputter, teknisi wajib auto-clean & kalibrasi arc',
                      },
                      {
                        type: 'dusty_vgroove' as EquipmentFailureType,
                        icon: <Sparkles className="w-4 h-4 text-cyan-300" />,
                        title: 'V-Groove Berdebu (Motor Limit)',
                        desc: 'Motor PAS macet, teknisi wajib bersihkan alur dengan kuas alkohol',
                      },
                      {
                        type: 'heater_fault' as EquipmentFailureType,
                        icon: <Flame className="w-4 h-4 text-orange-400" />,
                        title: 'Sensor Oven Overheat Trip',
                        desc: 'Heater berhenti mendadak, teknisi wajib reset proteksi termal',
                      },
                    ].map((item) => {
                      const isActive = (settings.activeFailureTypes || []).includes(item.type);
                      return (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => {
                            soundEffects.playClick();
                            const current = settings.activeFailureTypes || [];
                            const next = isActive
                              ? current.filter((t) => t !== item.type)
                              : [...current, item.type];
                            setSettings({ ...settings, activeFailureTypes: next });
                          }}
                          className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                            isActive
                              ? 'bg-slate-900 border-amber-500/50 ring-1 ring-amber-500/30'
                              : 'bg-slate-950/60 border-slate-800/80 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">{item.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                {item.title}
                              </span>
                              {isActive && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                              {item.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Direct Simulation / Trigger Buttons for Examiner Demonstration */}
                <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                      <Play className="w-3 h-3 text-amber-400" />
                      Injeksi Gangguan Langsung (Live Test Run oleh Penguji):
                    </span>
                    <span className="text-[9px] text-slate-500">Uji reaksi teknisi saat ini</span>
                  </div>

                  {injectNotice && (
                    <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{injectNotice}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleInjectFailureImmediate('low_battery')}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold transition-all flex items-center gap-1"
                    >
                      <span>🪫 Baterai Lemah</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInjectFailureImmediate('dull_cleaver')}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-bold transition-all flex items-center gap-1"
                    >
                      <span>🔪 Cleaver Tumpul</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInjectFailureImmediate('dirty_electrode')}
                      className="px-2.5 py-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-[10px] font-bold transition-all flex items-center gap-1"
                    >
                      <span>⚡ Elektroda Kotor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInjectFailureImmediate('dusty_vgroove')}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold transition-all flex items-center gap-1"
                    >
                      <span>🧹 V-Groove Debu</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInjectFailureImmediate('heater_fault')}
                      className="px-2.5 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-300 text-[10px] font-bold transition-all flex items-center gap-1"
                    >
                      <span>🔥 Oven Overheat</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetDefault}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onClose()}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/30 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{savedNotice ? 'Tersimpan & Diterapkan!' : 'Terapkan Parameter Soal'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
