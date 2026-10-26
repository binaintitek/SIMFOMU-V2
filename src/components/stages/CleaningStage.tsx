import React, { useState } from 'react';
import { TechnicianState } from '../../types/fiber';
import { AddActionLogFn } from '../../types/actionLog';
import { soundEffects } from '../../utils/audio';
import { Sparkles, Droplets, Check, ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { RealToolButton } from '../RealToolPreviewCard';

interface CleaningStageProps {
  state: TechnicianState;
  updateState: (updates: Partial<TechnicianState>) => void;
  onNextStep: () => void;
  addActionLog?: AddActionLogFn;
}

export const CleaningStage: React.FC<CleaningStageProps> = ({
  state,
  updateState,
  onNextStep,
  addActionLog,
}) => {
  const [activeSide, setActiveSide] = useState<'left' | 'right'>('left');
  const [wipePos, setWipePos] = useState<number>(10); // 10% to 100%
  const [isWiping, setIsWiping] = useState<boolean>(false);
  const [isDispensingIpa, setIsDispensingIpa] = useState<boolean>(false);
  const [ipaWet, setIpaWet] = useState<boolean>(true);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  const cleanScore = activeSide === 'left' ? state.leftCleanliness : state.rightCleanliness;

  const handleDispenseIpa = () => {
    soundEffects.playClick();
    setIsDispensingIpa(true);
    setIpaWet(true);
    addActionLog?.('Membasahi tisu Kimwipes dengan cairan alkohol 99.8% IPA', {
      step: 'cleaning',
      severity: 'info',
      dataBadge: 'IPA 99.8%',
      detail: 'Dispenser alkohol ditekan. Tisu bebas serat siap digunakan untuk menyeka partikel residu.',
    });
    setTimeout(() => {
      setIsDispensingIpa(false);
    }, 400);
  };

  const handleSingleWipe = () => {
    if (!ipaWet) {
      soundEffects.playError();
      setWarningMsg('Kimwipes kering! Basahi dengan alkohol IPA 99% terlebih dahulu.');
      addActionLog?.('Peringatan: Mencoba menyeka serat dengan tisu kering tanpa alkohol IPA', {
        step: 'cleaning',
        severity: 'warning',
        detail: 'Menyeka tanpa pelarut dapat menimbulkan goresan mikro pada kaca dan meninggalkan listrik statis.',
      });
      return;
    }

    setWarningMsg(null);
    setIsWiping(true);
    soundEffects.playWipeSqueak();

    // Animate wipe moving from base to tip
    let pos = 10;
    const interval = setInterval(() => {
      pos += 15;
      setWipePos(pos);
      if (pos >= 95) {
        clearInterval(interval);
        setIsWiping(false);
        setWipePos(10);

        // Increase cleanliness
        const increment = 35;
        const sideStr = activeSide === 'left' ? 'kiri' : 'kanan';
        if (activeSide === 'left') {
          const next = Math.min(100, (state.leftCleanliness || 0) + increment);
          updateState({ 
            leftCleanliness: next,
            defectType: next >= 90 && state.rightCleanliness >= 90 && state.defectType === 'bubble' ? 'none' : state.defectType,
          });
          addActionLog?.(`Pembersihan serat optik ${sideStr}: Kebersihan ${next}%`, {
            step: 'cleaning',
            severity: next >= 80 ? 'success' : 'info',
            dataBadge: `${next}%`,
            detail: `Teknik seka 1-arah dilakukan sempurna. ${next >= 80 ? 'Terdengar derit serat tanda bersih bebas minyak.' : 'Ulangi usapan hingga kebersihan ≥ 90%.'}`,
          });
        } else {
          const next = Math.min(100, (state.rightCleanliness || 0) + increment);
          updateState({ 
            rightCleanliness: next,
            defectType: next >= 90 && state.leftCleanliness >= 90 && state.defectType === 'bubble' ? 'none' : state.defectType,
          });
          addActionLog?.(`Pembersihan serat optik ${sideStr}: Kebersihan ${next}%`, {
            step: 'cleaning',
            severity: next >= 80 ? 'success' : 'info',
            dataBadge: `${next}%`,
            detail: `Teknik seka 1-arah dilakukan sempurna. ${next >= 80 ? 'Terdengar derit serat tanda bersih bebas minyak.' : 'Ulangi usapan hingga kebersihan ≥ 90%.'}`,
          });
        }
      }
    }, 40);
  };

  const handleBackwardWipeMistake = () => {
    // Teaching tech not to wipe backward
    soundEffects.playError();
    const sideStr = activeSide === 'left' ? 'kiri' : 'kanan';
    setWarningMsg('SALAH: Jangan mengusap bolak-balik! Usap selalu 1 arah ke ujung fiber agar debu tidak menumpuk kembali.');
    if (activeSide === 'left') {
      updateState({ leftCleanliness: Math.max(10, state.leftCleanliness - 30) });
    } else {
      updateState({ rightCleanliness: Math.max(10, state.rightCleanliness - 30) });
    }
    addActionLog?.(`Kesalahan teknik seka: Mengusap bolak-balik pada serat ${sideStr}`, {
      step: 'cleaning',
      severity: 'error',
      detail: 'SOP Telkom melarang keras usap bolak-balik karena mencemari kembali area kaca yang telah bersih.',
    });
  };

  const bothClean = state.leftCleanliness >= 90 && state.rightCleanliness >= 90;

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
                  setWarningMsg(null);
                }}
                className={`px-3 py-1 text-xs font-bold rounded transition-colors flex items-center gap-1.5 ${
                  activeSide === 'left'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Serat Kiri
                {state.leftCleanliness >= 90 && <Check className="w-3 h-3 text-emerald-400" />}
              </button>
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setActiveSide('right');
                  setWarningMsg(null);
                }}
                className={`px-3 py-1 text-xs font-bold rounded transition-colors flex items-center gap-1.5 ${
                  activeSide === 'right'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Serat Kanan
                {state.rightCleanliness >= 90 && <Check className="w-3 h-3 text-emerald-400" />}
              </button>
            </div>

            {/* Real Tool Button */}
            <RealToolButton currentStep="cleaning" />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Kebersihan Core:</span>
              <span
                className={`text-sm font-mono font-bold ${
                  cleanScore >= 90 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {cleanScore}% {cleanScore >= 90 ? '(PRISTINE)' : '(PERLU DIUSAP)'}
              </span>
            </div>
            <button
              onClick={() => {
                soundEffects.playClick();
                if (activeSide === 'left') updateState({ leftCleanliness: 0 });
                else updateState({ rightCleanliness: 0 });
              }}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded border border-slate-700 text-xs"
              title="Reset kebersihan serat ini"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Warning Toast if any mistake */}
        {warningMsg && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex items-center gap-2 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{warningMsg}</span>
          </div>
        )}

        {/* Microscope View of Bare Core Cladding */}
        <div className="flex-1 p-6 flex flex-col lg:flex-row gap-6 items-center justify-center">
          {/* Main Visual Window: High Magnification Fiber View */}
          <div className="w-full lg:flex-1 h-64 sm:h-72 bg-slate-950 rounded-2xl border border-slate-800 relative flex flex-col justify-center px-8 overflow-hidden shadow-inner">
            {/* Magnifier reticle lines */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-48 h-48 rounded-full border border-sky-400"></div>
              <div className="w-72 h-72 rounded-full border border-dashed border-sky-500/50"></div>
            </div>

            {/* Microscopic fiber horizontal bar */}
            <div className="relative flex items-center w-full my-auto">
              {/* Buffer / Primary coating left border */}
              <div className="w-24 h-12 bg-amber-500/80 rounded-l border-y border-l border-amber-400/60 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-slate-950 uppercase">Coating 250μm</span>
              </div>

              {/* Bare Glass Cladding 125um with high magnification */}
              <div className="flex-1 h-7 bg-gradient-to-r from-sky-400/30 via-sky-200/50 to-sky-400/30 border-y border-sky-300/60 relative overflow-hidden flex items-center shadow-[0_0_15px_rgba(56,189,248,0.3)]">
                {/* 9um core centerline */}
                <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[2px] bg-red-400/70"></div>

                {/* Dirt & Dust particles if cleanliness < 90% */}
                {cleanScore < 90 && (
                  <div className="absolute inset-0 flex items-center justify-around pointer-events-none">
                    <span className="w-2 h-2 rounded-full bg-slate-600/80 blur-[0.5px]"></span>
                    <span className="w-3 h-1.5 rounded-full bg-amber-800/80 blur-[0.5px]"></span>
                    <span className="w-1.5 h-2 rounded-full bg-slate-500/90 blur-[0.5px]"></span>
                    <span className="w-2.5 h-2 rounded-full bg-amber-900/80 blur-[0.5px]"></span>
                    <span className="w-2 h-2 rounded-full bg-slate-700/80 blur-[0.5px]"></span>
                  </div>
                )}

                {/* Pristine glisten light flash when 100% clean */}
                {cleanScore >= 90 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[pulse_2s_infinite]"></div>
                )}

                {/* Animated Wipe Pad / Kimwipes on Fiber */}
                {isWiping && (
                  <div
                    className="absolute top-0 bottom-0 w-16 bg-white/90 shadow-2xl rounded border border-blue-200 flex flex-col items-center justify-center text-[8px] font-bold text-blue-900 transition-all duration-75 z-20 pointer-events-none"
                    style={{ left: `${wipePos}%` }}
                  >
                    <Sparkles className="w-3 h-3 text-blue-600 animate-spin" />
                    <span>IPA 99%</span>
                  </div>
                )}
              </div>

              {/* End tip of fiber */}
              <div className="w-1 h-7 bg-sky-200 rounded-r border-r border-sky-100 shadow-sm shrink-0"></div>
            </div>

            {/* Audio Cue Feedback */}
            <div className="absolute bottom-3 left-6 right-6 flex justify-between items-center text-[10px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Dengarkan bunyi "mencicit" kaca saat ditarik.
              </span>
              <span className="font-mono text-emerald-400">
                Residu Partikel: {cleanScore >= 90 ? '0 ppm (Steril)' : `${100 - cleanScore}% terdeteksi`}
              </span>
            </div>
          </div>

          {/* Cleaning Tools Panel: Kimwipes + IPA Bottle */}
          <div className="w-full lg:w-80 bg-slate-950/90 rounded-2xl border border-slate-800 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Stasiun Pembersih Optik
                </h3>
                <p className="text-[10px] text-slate-400">Kimwipes &amp; Isopropil Alkohol 99%</p>
              </div>
            </div>

            {/* IPA Dispenser Pump */}
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-200">Botol Pompa IPA 99%</p>
                <p className="text-[10px] text-slate-400">
                  {ipaWet ? 'Tisu sudah basah alkohol' : 'Tisu belum dibasahi'}
                </p>
              </div>
              <button
                id="btn-dispense-ipa"
                type="button"
                onClick={handleDispenseIpa}
                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Droplets className="w-3.5 h-3.5" />
                {isDispensingIpa ? 'Basahi...' : 'Tekan Pompa'}
              </button>
            </div>

            {/* SOP Usapan 1 Arah Guide */}
            <div className="bg-blue-950/30 p-3 rounded-xl border border-blue-900/50 text-[11px] text-blue-300 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-blue-400" />
                SOP Pengusapan Serat:
              </p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Tarik tisu lembut dari batas coating menuju ujung bare fiber. Jangan pernah mengusap
                bolak-balik atau menggunakan kembali sisi tisu yang sudah kotor.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                id="btn-wipe-fiber"
                onClick={handleSingleWipe}
                disabled={isWiping}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isWiping ? 'Sedang Mengusap...' : `Usap 1 Arah (Serat ${activeSide === 'left' ? 'Kiri' : 'Kanan'})`}
              </button>

              <button
                onClick={handleBackwardWipeMistake}
                type="button"
                className="w-full py-1.5 bg-slate-900 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 text-[10px] rounded-lg border border-slate-800 transition-colors"
              >
                [Uji SOP] Coba Usap Bolak-Balik (Simulasi Kesalahan)
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Progression to Step 3 */}
        <div className="h-16 bg-slate-900 border-t border-slate-800 flex items-center px-6 justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Kebersihan Kiri:</span>
              <span
                className={`font-mono font-bold ${
                  state.leftCleanliness >= 90 ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {state.leftCleanliness}% {state.leftCleanliness >= 90 ? 'SIAP' : ''}
              </span>
            </div>
            <div className="h-4 w-px bg-slate-700"></div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Kebersihan Kanan:</span>
              <span
                className={`font-mono font-bold ${
                  state.rightCleanliness >= 90 ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {state.rightCleanliness}% {state.rightCleanliness >= 90 ? 'SIAP' : ''}
              </span>
            </div>
          </div>

          <button
            id="btn-next-to-cleaving"
            onClick={() => {
              soundEffects.playClick();
              onNextStep();
            }}
            disabled={!bothClean}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
              bothClean
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            Lanjut ke Langkah 03: Fiber Cleaving
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
