import React, { useState } from 'react';
import { TechnicianState } from '../../types/fiber';
import { AddActionLogFn } from '../../types/actionLog';
import { soundEffects } from '../../utils/audio';
import { Flame, Check, ArrowRight, Shield, Clock, AlertCircle, RefreshCw, AlertTriangle, RotateCcw } from 'lucide-react';
import { RealToolButton } from '../RealToolPreviewCard';
import { getExamSettings } from '../../utils/adminAuth';
import { checkShouldTriggerFailure, resolveEquipmentIncident, DEFAULT_EQUIPMENT_HEALTH } from '../../utils/equipmentFailureService';

interface HeatShrinkStageProps {
  state: TechnicianState;
  updateState: (updates: Partial<TechnicianState>) => void;
  onNextStep: () => void;
  addActionLog?: AddActionLogFn;
}

export const HeatShrinkStage: React.FC<HeatShrinkStageProps> = ({
  state,
  updateState,
  onNextStep,
  addActionLog,
}) => {
  const [sleeveOffset, setSleeveOffset] = useState<number>(state.sleevePositioned ? 50 : 15); // 50 is centered
  const [isHeating, setIsHeating] = useState<boolean>(false);
  const [heatTimer, setHeatTimer] = useState<number>(12); // 12 seconds heater cycle
  const [heatProgress, setHeatProgress] = useState<number>(state.heatingCompleted ? 100 : 0);

  const isCentered = sleeveOffset >= 45 && sleeveOffset <= 55;

  const handleStartHeating = () => {
    if (!state.sleevePositioned) {
      soundEffects.playError();
      alert('Posisikan protection sleeve tepat di tengah titik sambungan sebelum memanaskan!');
      addActionLog?.('Peringatan: Upaya memanaskan sleeve yang belum diposisikan di tengah', {
        step: 'heating',
        severity: 'warning',
        detail: 'Titik fusi kaca telanjang dapat patah jika protection sleeve tidak menutupi area sambungan secara simetris.',
      });
      return;
    }
    if (!state.heaterClosed) {
      soundEffects.playError();
      alert('Tutup penutup klem oven pemanas (heater cover) terlebih dahulu!');
      addActionLog?.('Peringatan: Klem oven pemanas belum ditutup', {
        step: 'heating',
        severity: 'warning',
        detail: 'Klem harus ditutup agar suhu pemanas merata dan sensor oven aktif.',
      });
      return;
    }

    const examSettings = getExamSettings();
    const currentHealth = state.equipmentHealth || DEFAULT_EQUIPMENT_HEALTH;
    const heaterIncident = checkShouldTriggerFailure(examSettings, currentHealth, 'heating', 'heater_fault');

    setIsHeating(true);
    soundEffects.playClick();
    addActionLog?.('Memulai siklus oven pemanas (200°C) selama 12 detik', {
      step: 'heating',
      severity: 'info',
      dataBadge: '200°C / 12s',
      detail: 'Elemen pemanas mikro oven aktif untuk menciutkan selongsong proteksi termal.',
    });
    let timeLeft = 12;
    setHeatTimer(timeLeft);

    const interval = setInterval(() => {
      timeLeft -= 1;
      setHeatTimer(timeLeft);
      const prog = Math.round(((12 - timeLeft) / 12) * 100);
      setHeatProgress(prog);

      // Trigger heater thermal fault halfway through if incident is active or triggered
      if ((heaterIncident || currentHealth.heaterCondition === 'fault') && timeLeft === 7) {
        clearInterval(interval);
        setIsHeating(false);
        soundEffects.playEquipmentAlarm();
        if (heaterIncident) {
          updateState({
            equipmentHealth: {
              ...currentHealth,
              activeFailure: heaterIncident,
              heaterCondition: 'fault',
            },
          });
        }
        addActionLog?.('[ANOMALI ALAT] Oven Heater Trip: Sensor over-temperature menghentikan pemanasan', {
          step: 'heating',
          severity: 'error',
          dataBadge: 'ERR-OVR-HEAT',
          detail: 'Siklus pemanasan terputus di 40% karena proteksi termal aktif. Tekan tombol Reset Proteksi Termal untuk melanjutkan.',
        });
        return;
      }

      if (timeLeft <= 0) {
        clearInterval(interval);
        setIsHeating(false);

        const finalDuration = state.timeTrialDuration > 0
          ? state.timeTrialDuration
          : (state.timeTrialStartTime
            ? Math.max(1, Math.round((Date.now() - state.timeTrialStartTime) / 1000))
            : 0);

        updateState({
          heatingCompleted: true,
          heatingProgress: 100,
          timeTrialRunning: false,
          timeTrialCompleted: true,
          timeTrialDuration: finalDuration,
        });
        soundEffects.playHeaterComplete();
        addActionLog?.(`Pemanasan selesai: Durasi total pengerjaan ${finalDuration} detik`, {
          step: 'heating',
          severity: 'success',
          dataBadge: `${finalDuration}s Total`,
          detail: `Proses pengerjaan dari pengupasan hingga heat shrink tuntas dalam ${finalDuration} detik. Data terekam untuk papan peringkat Leaderboard.`,
        });
      }
    }, 1000);
  };

  const handleResetThermalTrip = () => {
    soundEffects.playToolFixed();
    const currentHealth = state.equipmentHealth || DEFAULT_EQUIPMENT_HEALTH;
    const nextHealth = resolveEquipmentIncident(currentHealth, 'heater_fault');
    updateState({
      equipmentHealth: nextHealth,
    });
    addActionLog?.('[KETANGGUHAN TEKNISI] Reset proteksi termal oven pemanas berhasil', {
      step: 'heating',
      severity: 'success',
      dataBadge: 'Heater Ready',
      detail: 'Sirkuit proteksi termal oven di-reset ke kondisi normal. Oven siap menjalankan kembali siklus penciutan sleeve.',
    });
  };

  const handlePositionSleeve = () => {
    soundEffects.playClick();
    setSleeveOffset(50);
    updateState({ sleevePositioned: true });
    addActionLog?.('Protection sleeve (60mm) diposisikan simetris tepat di tengah titik sambung', {
      step: 'heating',
      severity: 'success',
      dataBadge: 'Sleeve 60mm',
      detail: 'Batang penguat baja (steel rod) melindungi titik fusi kaca dari tekukan dan benturan fisik.',
    });
  };

  const handleToggleHeaterCover = () => {
    soundEffects.playClick();
    const next = !state.heaterClosed;
    updateState({ heaterClosed: next });
    addActionLog?.(next ? 'Klem oven pemanas ditutup rapat' : 'Klem oven pemanas dibuka', {
      step: 'heating',
      severity: 'info',
      detail: next ? 'Oven siap memanaskan sleeve proteksi.' : 'Buka klem untuk mendinginkan sleeve di cooling tray.',
    });
  };

  const handleResetHeat = () => {
    soundEffects.playClick();
    setSleeveOffset(15);
    setHeatProgress(0);
    updateState({
      sleevePositioned: false,
      heaterClosed: false,
      heatingCompleted: false,
      heatingProgress: 0,
    });
    addActionLog?.('Siklus oven pemanas di-reset ulang', {
      step: 'heating',
      severity: 'info',
      detail: 'Posisikan kembali sleeve proteksi sebelum pemanasan berikutnya.',
    });
  };

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
        {/* Header Bar */}
        <div className="h-14 border-b border-slate-800 bg-slate-800/40 flex items-center px-4 sm:px-6 justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Modul Pemanas:
            </span>
            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20">
              Built-in Tube Heater (200°C)
            </span>

            {/* Real Tool Button */}
            <RealToolButton currentStep="heating" />
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs font-mono text-slate-400">
              STATUS:{' '}
              <span
                className={`font-bold ${
                  state.heatingCompleted
                    ? 'text-emerald-400'
                    : isHeating
                    ? 'text-amber-400 animate-pulse'
                    : 'text-blue-400'
                }`}
              >
                {state.heatingCompleted
                  ? 'SELESAI (COOLED)'
                  : isHeating
                  ? `HEATING (${heatTimer}s)...`
                  : 'STANDBY'}
              </span>
            </div>
            <button
              onClick={handleResetHeat}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded border border-slate-700 text-xs"
              title="Reset tahapan heating sleeve"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Workbench Visual */}
        <div className="flex-1 p-6 flex flex-col lg:flex-row gap-6 items-center justify-center">
          {/* Main Heater & Sleeve Chamber Visual */}
          <div className="w-full lg:flex-1 h-72 sm:h-80 bg-slate-950 rounded-2xl border border-slate-800 relative flex flex-col p-6 overflow-hidden shadow-inner">
            {/* Top Indicator */}
            <div className="flex justify-between items-center mb-2 z-10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Protection Sleeve 60mm &amp; Heating Oven
              </span>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Suhu Target: 190°C - 200°C
              </span>
            </div>

            {/* Heater Oven Chamber Rendering */}
            <div
              className={`flex-1 relative rounded-xl border flex flex-col justify-center px-8 transition-colors duration-500 overflow-hidden ${
                isHeating
                  ? 'bg-amber-950/40 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              {/* Heating Coil Glow lines when active */}
              {isHeating && (
                <div className="absolute inset-0 flex flex-col justify-around py-4 pointer-events-none opacity-40">
                  <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-300 to-orange-500 animate-pulse"></div>
                  <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-300 to-orange-500 animate-pulse"></div>
                </div>
              )}

              {/* Spliced Fiber Cable with Joint */}
              <div className="relative flex items-center w-full my-auto">
                {/* Left Coating Cable */}
                <div className="w-1/4 h-5 bg-yellow-500 rounded-l border border-amber-600 shadow-sm flex items-center pl-2">
                  <span className="text-[8px] font-bold text-slate-950">LEFT</span>
                </div>

                {/* Central Bare Glass Fiber */}
                <div className="flex-1 h-1 bg-sky-200 shadow-[0_0_8px_rgba(56,189,248,0.8)] relative flex items-center justify-center">
                  {/* Fused Splice Center Marker */}
                  <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_red] z-0"></div>

                  {/* Protection Sleeve Tube sliding over the joint */}
                  <div
                    className={`absolute h-8 rounded-lg border flex items-center justify-center transition-all duration-300 z-10 ${
                      state.heatingCompleted
                        ? 'h-6 bg-slate-800/90 border-blue-400/80 shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                        : 'h-9 bg-slate-200/80 border-slate-300 shadow-lg'
                    }`}
                    style={{
                      left: `${sleeveOffset}%`,
                      transform: 'translateX(-50%)',
                      width: state.heatingCompleted ? '220px' : '230px',
                    }}
                  >
                    {/* Stainless Steel Reinforcing Rod */}
                    <div className="w-full h-1.5 bg-slate-400 rounded-full mx-2 border border-slate-500 shadow-inner flex items-center justify-center">
                      <span className="text-[7px] font-bold text-slate-800 uppercase tracking-tighter">
                        Batang Baja Penguat (SUS Rod)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Coating Cable */}
                <div className="w-1/4 h-5 bg-yellow-500 rounded-r border border-amber-600 shadow-sm flex items-center justify-end pr-2">
                  <span className="text-[8px] font-bold text-slate-950">RIGHT</span>
                </div>
              </div>

              {/* Center Guidance Tag */}
              <div className="absolute bottom-3 left-6 right-6 flex justify-between items-center text-[10px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  Sleeve melindungi serat kaca dari tekukan makrobend &amp; patah.
                </span>
                <span
                  className={`font-mono font-bold ${
                    isCentered ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  Posisi Sleeve: {isCentered ? 'Presisi di Tengah (OK)' : 'Kurang Pas di Tengah'}
                </span>
              </div>
            </div>

            {/* Heater Cover Toggle in Stage */}
            <div className="mt-3 flex justify-between items-center text-xs">
              <span className="text-slate-400">Penutup Heater Oven:</span>
              <button
                id="btn-toggle-heater-clamp"
                type="button"
                onClick={handleToggleHeaterCover}
                className={`px-3 py-1 rounded-lg font-bold border transition-colors ${
                  state.heaterClosed
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                }`}
              >
                {state.heaterClosed ? 'Klem Oven Terkunci (Tutup)' : 'Klem Oven Terbuka (Buka)'}
              </button>
            </div>
          </div>

          {/* Side Control Panel */}
          <div className="w-full lg:w-80 bg-slate-950/90 rounded-2xl border border-slate-800 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Kontrol Pemanas Sleeve
                </h3>
                <p className="text-[10px] text-slate-400">Penyusutan Termal Protection Tube</p>
              </div>
            </div>

            {/* Centering Position Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-semibold text-slate-300">
                  Posisi Protection Sleeve:
                </span>
                <span
                  className={`text-xs font-mono font-bold ${
                    isCentered ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {sleeveOffset}% ({isCentered ? 'Tepat di Titik Sambung' : 'Miring'})
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={80}
                value={sleeveOffset}
                disabled={isHeating || state.heatingCompleted}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSleeveOffset(val);
                  updateState({ sleevePositioned: val >= 45 && val <= 55 });
                }}
                className="w-full accent-blue-400 cursor-pointer h-2 bg-slate-800 rounded-lg disabled:opacity-50"
              />
              <div className="flex justify-between items-center mt-1.5">
                <button
                  id="btn-position-sleeve"
                  type="button"
                  onClick={handlePositionSleeve}
                  disabled={isHeating || state.heatingCompleted}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold underline disabled:opacity-40"
                >
                  Otomatis Posisikan di Titik Tengah (50%)
                </button>
              </div>
            </div>

            {/* Heating Progress Bar */}
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Siklus Pemanasan
                </span>
                <span className="font-mono text-amber-400">{heatProgress}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                  style={{ width: `${heatProgress}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                {state.heatingCompleted
                  ? 'Sleeve telah menyusut sempurna dan mengunci batang stainless steel.'
                  : 'Proses pemanasan membutuhkan waktu 12 detik pada suhu 200°C.'}
              </p>
            </div>

            {/* Equipment Anomaly Box: Heater Thermal Trip */}
            {state.equipmentHealth?.heaterCondition === 'fault' && (
              <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl p-3 text-rose-200 text-xs flex flex-col gap-2">
                <div className="flex items-center gap-2 text-rose-300 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>HEATER TRIP: Over-Temperature Fault</span>
                </div>
                <p className="text-[11px] text-rose-200/80">
                  Sensor proteksi termal oven aktif akibat panas berlebih. Lakukan reset sistem proteksi termal untuk melanjutkan siklus pemanasan.
                </p>
                <button
                  type="button"
                  onClick={handleResetThermalTrip}
                  className="w-full py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Proteksi Termal Oven</span>
                </button>
              </div>
            )}

            {/* Start Heating Action Button */}
            <button
              id="btn-start-heating"
              onClick={handleStartHeating}
              disabled={isHeating || state.heatingCompleted || !state.heaterClosed}
              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
                !isHeating && !state.heatingCompleted && state.heaterClosed
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-900/30 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Flame className="w-4 h-4" />
              {isHeating
                ? `Sedang Memanaskan (${heatTimer}s)...`
                : state.heatingCompleted
                ? 'Sleeve Telah Dipanaskan'
                : 'Mulai Pemanasan (Start Heat)'}
            </button>
          </div>
        </div>

        {/* Bottom Progression Bar */}
        <div className="h-16 bg-slate-900 border-t border-slate-800 flex items-center px-6 justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400 font-medium">Status Proteksi:</span>
            <span
              className={`font-bold ${
                state.heatingCompleted ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              {state.heatingCompleted
                ? 'PROTECTION SLEEVE TERPASANG KUAT (SIAP DITARIK KE CLOSURE)'
                : 'BELUM SELESAI DIPANASKAN'}
            </span>
          </div>

          <button
            id="btn-next-to-assessment"
            onClick={() => {
              soundEffects.playClick();
              onNextStep();
            }}
            disabled={!state.heatingCompleted}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
              state.heatingCompleted
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            Lanjut ke Hasil &amp; Evaluasi Sertifikasi
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
