import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SplicingStep } from '../types/fiber';
import { soundEffects } from '../utils/audio';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  CheckCircle2, 
  Compass, 
  Play, 
  Zap, 
  HelpCircle,
  ArrowDown,
  ArrowUp,
  MousePointerClick
} from 'lucide-react';

export interface TutorialStep {
  id: string;
  stage: SplicingStep;
  targetId: string;
  title: string;
  badge: string;
  instruction: string;
  actionTip: string;
  detail: string;
  preferredArrow?: 'up' | 'down' | 'left' | 'right';
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'strip-action',
    stage: 'stripping',
    targetId: 'btn-strip-action',
    title: 'Kupas Serat Optik',
    badge: 'Langkah 01 • Pengupasan',
    instruction: 'Gunakan lubang no.3 Miller Stripper (250µm) dan atur panjang kupas 30-35mm.',
    actionTip: 'Klik tombol "Kupas Serat Kiri" yang disorot.',
    detail: 'Pengupasan yang tepat menghasilkan bare glass 125µm tanpa goresan mikroskopis.',
    preferredArrow: 'down'
  },
  {
    id: 'strip-next',
    stage: 'stripping',
    targetId: 'btn-next-to-cleaning',
    title: 'Lanjut ke Tahap Pembersihan',
    badge: 'Langkah 02 • Selesai Kupas',
    instruction: 'Kedua serat optik kini telah siap dan terkupas dengan panjang ideal.',
    actionTip: 'Klik tombol "Lanjut ke Langkah 02: Cleaning Core".',
    detail: 'Pastikan status panjang serat mencapai ≥ 25mm pada kedua sisi kabel.',
    preferredArrow: 'up'
  },
  {
    id: 'clean-ipa',
    stage: 'cleaning',
    targetId: 'btn-dispense-ipa',
    title: 'Basahi Tisu Kimwipes',
    badge: 'Langkah 03 • Alkohol IPA',
    instruction: 'Tekan pompa alkohol IPA 99.8% untuk membasahi tisu Kimwipes bebas serat.',
    actionTip: 'Klik tombol "Tekan Pompa" dispenser alkohol.',
    detail: 'Hanya gunakan isopropil alkohol murni 99.8% agar tidak meninggalkan residu air atau minyak.',
    preferredArrow: 'down'
  },
  {
    id: 'clean-wipe',
    stage: 'cleaning',
    targetId: 'btn-wipe-fiber',
    title: 'Seka Serat Satu Arah',
    badge: 'Langkah 04 • Usapan 1 Arah',
    instruction: 'Tarik tisu lembut dari batas coating menuju ujung kaca serat optik.',
    actionTip: 'Klik tombol "Usap 1 Arah" hingga kebersihan ≥ 90%.',
    detail: 'Dengarkan suara "mencicit" (squeak sound) tanda kaca silika telah steril bebas kotoran.',
    preferredArrow: 'down'
  },
  {
    id: 'clean-next',
    stage: 'cleaning',
    targetId: 'btn-next-to-cleaving',
    title: 'Lanjut ke Pemotongan (Cleaving)',
    badge: 'Langkah 05 • Selesai Bersih',
    instruction: 'Partikel residu telah 0 ppm. Kaca siap dipotong presisi.',
    actionTip: 'Klik tombol "Lanjut ke Langkah 03: Fiber Cleaving".',
    detail: 'Jangan pernah menyentuh bare glass dengan jari setelah dibersihkan!',
    preferredArrow: 'up'
  },
  {
    id: 'cleave-clamp',
    stage: 'cleaving',
    targetId: 'btn-clamp-cleaver',
    title: 'Kunci Klem Penjepit Fiber',
    badge: 'Langkah 06 • Klem Cleaver',
    instruction: 'Posisikan serat pada mistar penggaris 16mm lalu kunci penutup klem.',
    actionTip: 'Klik tombol "Kunci Klem" untuk menahan posisi serat.',
    detail: 'Klem yang terkunci rapat mencegah serat bergeser saat mata pisau intan meluncur.',
    preferredArrow: 'down'
  },
  {
    id: 'cleave-cut',
    stage: 'cleaving',
    targetId: 'btn-perform-cleave',
    title: 'Dorong Bilah Pisau Cleaver',
    badge: 'Langkah 07 • Pemotongan Presisi',
    instruction: 'Luncurkan carriage pisau intan presisi untuk memotong ujung serat 90° tegak lurus.',
    actionTip: 'Klik tombol "Dorong Bilah Pisau" untuk memotong serat.',
    detail: 'Standar Telkom mensyaratkan sudut kemiringan potong (cleave angle) ≤ 0.8°.',
    preferredArrow: 'down'
  },
  {
    id: 'cleave-next',
    stage: 'cleaving',
    targetId: 'btn-next-to-splicing',
    title: 'Menuju Mesin Fusion Splicer',
    badge: 'Langkah 08 • Selesai Cleaving',
    instruction: 'Permukaan ujung serat terpotong datar dan sempurna.',
    actionTip: 'Klik tombol "Lanjut ke Langkah 04: Fusion Splicing".',
    detail: 'Sisa pecahan kaca optik otomatis diarahkan masuk ke kotak limbah.',
    preferredArrow: 'up'
  },
  {
    id: 'splice-cover',
    stage: 'splicing',
    targetId: 'btn-toggle-cover',
    title: 'Tutup Wind Protector Cover',
    badge: 'Langkah 09 • Proteksi Angin',
    instruction: 'Tutup kap pelindung angin untuk mengisolasi ruang elektroda dari debu dan udara.',
    actionTip: 'Klik tombol "Wind Cover: Tutup" untuk mengunci ruang elektroda.',
    detail: 'Sensor keselamatan splicer hanya mengizinkan pelepasan busur jika wind cover tertutup.',
    preferredArrow: 'down'
  },
  {
    id: 'splice-align',
    stage: 'splicing',
    targetId: 'btn-auto-align',
    title: 'Penjajaran Inti Serat (PAS Auto)',
    badge: 'Langkah 10 • Core Alignment',
    instruction: 'Motor stepper mikro X-Y akan menyejajarkan sumbu inti serat optik secara otomatis.',
    actionTip: 'Klik tombol "Auto Alignment" untuk menyelaraskan core.',
    detail: 'Sistem Profile Alignment System (PAS) mendeteksi batas inti (core) dan selubung (cladding).',
    preferredArrow: 'up'
  },
  {
    id: 'splice-arc',
    stage: 'splicing',
    targetId: 'btn-perform-arc',
    title: 'Pelepasan Busur Fusi (SET / ARC)',
    badge: 'Langkah 11 • Arc Plasma Discharge',
    instruction: 'Nyalakan busur listrik plasma 2000°C untuk meleburkan dan menyambung serat kaca.',
    actionTip: 'Klik tombol "SET / ARC" yang berkedip untuk fusi.',
    detail: 'Kedua ujung silika menyatu menjadi satu kontinuitas optik dengan redaman minimal (≤ 0.02 dB).',
    preferredArrow: 'up'
  },
  {
    id: 'splice-next',
    stage: 'splicing',
    targetId: 'btn-next-to-heating',
    title: 'Menuju Stasiun Heat Shrink',
    badge: 'Langkah 12 • Fusi Berhasil',
    instruction: 'Sambungan fusi telah teruji kuat dan nilai redaman transmisi optimal.',
    actionTip: 'Klik tombol "Langkah 05: Sleeve & Heater".',
    detail: 'Titik fusi kaca telanjang masih rapuh dan wajib diberi selongsong perlindungan mekanis.',
    preferredArrow: 'up'
  },
  {
    id: 'heat-sleeve',
    stage: 'heating',
    targetId: 'btn-position-sleeve',
    title: 'Posisikan Protection Sleeve',
    badge: 'Langkah 13 • Sleeve Alignment',
    instruction: 'Geser selongsong pelindung termal 60mm tepat di tengah titik sambungan.',
    actionTip: 'Klik link "Otomatis Posisikan di Titik Tengah (50%)".',
    detail: 'Batang stainless steel (SUS) harus menopang kedua sisi titik sambungan secara simetris.',
    preferredArrow: 'down'
  },
  {
    id: 'heat-action',
    stage: 'heating',
    targetId: 'btn-start-heating',
    title: 'Panaskan Oven Pemanas (Start Heat)',
    badge: 'Langkah 14 • Pemanasan Termal',
    instruction: 'Kunci klem oven lalu mulai siklus pemanasan 200°C selama 12 detik.',
    actionTip: 'Klik tombol "Mulai Pemanasan (Start Heat)".',
    detail: 'Sleeve akan menyusut rapat mengunci batang baja dan melindungi kaca dari tekukan makrobend.',
    preferredArrow: 'down'
  },
  {
    id: 'heat-next',
    stage: 'heating',
    targetId: 'btn-next-to-assessment',
    title: 'Evaluasi & Sertifikat Kelulusan',
    badge: 'Langkah 15 • Selesai Pemanasan',
    instruction: 'Seluruh tahapan penyambungan kabel fiber optik telah selesai sempurna!',
    actionTip: 'Klik tombol "Lanjut ke Hasil & Evaluasi Sertifikasi".',
    detail: 'Lihat kartu skor akurasi 5 langkah, grafik OTDR, dan cetak sertifikat kompetensi Anda.',
    preferredArrow: 'up'
  },
  {
    id: 'assess-export',
    stage: 'assessment',
    targetId: 'btn-export-pdf',
    title: 'Selesai: Unduh / Cetak Sertifikat',
    badge: 'Langkah 16 • Sertifikasi Teknisi',
    instruction: 'Selamat! Anda telah menuntaskan simulasi SOP Telkom Akses dengan predikat unggul.',
    actionTip: 'Klik "Export Certificate (PDF)" atau "Cetak Sertifikat".',
    detail: 'Sertifikat memuat skor akurasi, redaman dB, dan verifikasi standar ITU-T G.652.D.',
    preferredArrow: 'down'
  }
];

interface QuickStartTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: SplicingStep;
  onSelectStep: (step: SplicingStep) => void;
}

export const QuickStartTutorial: React.FC<QuickStartTutorialProps> = ({
  isOpen,
  onClose,
  currentStep,
  onSelectStep,
}) => {
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const animFrameRef = useRef<number | null>(null);

  const activeTutorialStep = TUTORIAL_STEPS[stepIndex] || TUTORIAL_STEPS[0];

  // Auto navigate to the correct stage if not already there
  useEffect(() => {
    if (!isOpen) return;
    if (activeTutorialStep && currentStep !== activeTutorialStep.stage) {
      onSelectStep(activeTutorialStep.stage);
    }
  }, [isOpen, stepIndex, activeTutorialStep, currentStep, onSelectStep]);

  // Update target bounding box smoothly
  const updateTargetPosition = useCallback(() => {
    if (!isOpen || !activeTutorialStep) {
      setTargetRect(null);
      return;
    }

    const element = document.getElementById(activeTutorialStep.targetId);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [isOpen, activeTutorialStep]);

  // Poll / track target position across animations and resize
  useEffect(() => {
    if (!isOpen) return;

    // Immediately scroll target into view if available
    const el = document.getElementById(activeTutorialStep.targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    const checkLoop = () => {
      updateTargetPosition();
      animFrameRef.current = requestAnimationFrame(checkLoop);
    };

    animFrameRef.current = requestAnimationFrame(checkLoop);
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition, true);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition, true);
    };
  }, [isOpen, activeTutorialStep, updateTargetPosition]);

  // Listen to user clicking the highlighted element to auto-advance
  useEffect(() => {
    if (!isOpen || !activeTutorialStep) return;

    const el = document.getElementById(activeTutorialStep.targetId);
    if (!el) return;

    const handleClick = () => {
      soundEffects.playClick();
      // Brief delay before advancing to let state update
      setTimeout(() => {
        if (stepIndex < TUTORIAL_STEPS.length - 1) {
          setStepIndex((prev) => prev + 1);
        }
      }, 450);
    };

    el.addEventListener('click', handleClick);
    return () => {
      el.removeEventListener('click', handleClick);
    };
  }, [isOpen, activeTutorialStep, stepIndex]);

  const handleNext = () => {
    soundEffects.playClick();
    if (stepIndex < TUTORIAL_STEPS.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    soundEffects.playClick();
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  };

  const handleTriggerTargetDirectly = () => {
    soundEffects.playClick();
    const el = document.getElementById(activeTutorialStep.targetId);
    if (el) {
      el.click();
    } else {
      handleNext();
    }
  };

  if (!isOpen) return null;

  const progressPercent = Math.round(((stepIndex + 1) / TUTORIAL_STEPS.length) * 100);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden font-sans">
      {/* Visual Spotlight Highlight Ring on Target Element */}
      {targetRect && targetRect.width > 0 && (
        <div
          className="absolute transition-all duration-300 pointer-events-none"
          style={{
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
          }}
        >
          {/* Pulsing Neon Cyan Spotlight Frame */}
          <div className="w-full h-full rounded-2xl border-3 border-cyan-400 ring-4 ring-cyan-400/40 animate-pulse shadow-[0_0_25px_rgba(6,182,212,0.9)] bg-cyan-400/10 backdrop-blur-[0.5px]">
            {/* Animated Target Corner Accents */}
            <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-white rounded-tl-sm"></div>
            <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-white rounded-tr-sm"></div>
            <div className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-white rounded-bl-sm"></div>
            <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-white rounded-br-sm"></div>
          </div>

          {/* Floating Pointer Arrow Badge */}
          <div
            className={`absolute flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500 text-slate-950 text-[11px] font-black tracking-wider uppercase shadow-xl whitespace-nowrap animate-bounce z-50 ${
              targetRect.top > 80
                ? '-top-9 left-1/2 -translate-x-1/2'
                : '-bottom-9 left-1/2 -translate-x-1/2'
            }`}
          >
            <MousePointerClick className="w-3.5 h-3.5 animate-pulse" />
            <span>Klik di Sini!</span>
            {targetRect.top > 80 ? (
              <ArrowDown className="w-3 h-3 text-slate-950" />
            ) : (
              <ArrowUp className="w-3 h-3 text-slate-950" />
            )}
          </div>
        </div>
      )}

      {/* Floating Interactive Guide HUD Dock */}
      <aside
        aria-label="Panduan Interaktif Quick Start"
        className={`pointer-events-auto absolute transition-all duration-300 z-50 shadow-2xl ${
          isMinimized
            ? 'bottom-5 right-5'
            : 'bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-[430px]'
        }`}
      >
        {isMinimized ? (
          /* Minimized Pill */
          <button
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/95 border-2 border-cyan-400 text-cyan-300 font-bold text-xs shadow-2xl hover:bg-slate-800 transition-all cursor-pointer backdrop-blur"
            title="Buka kembali panduan interaktif Quick Start"
          >
            <Compass className="w-4 h-4 text-cyan-400 animate-spin-slow" />
            <span>Quick Start ({stepIndex + 1}/{TUTORIAL_STEPS.length})</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>
        ) : (
          /* Full Interactive Guidance Card */
          <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl border-2 border-cyan-500/60 shadow-[0_12px_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col text-slate-200">
            {/* Header Strip */}
            <div className="h-11 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between px-3.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400">
                  <Compass className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black tracking-wider text-white uppercase">
                      Quick Start Tutorial
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[9px] font-bold border border-cyan-500/30">
                      INTERAKTIF
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 text-[10px] font-mono px-1.5"
                  title="Kecilkan panduan"
                >
                  Minimize
                </button>
                <button
                  onClick={onClose}
                  className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                  title="Tutup panduan"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 bg-slate-950 w-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            {/* Body Info */}
            <div className="p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950/70 border border-cyan-800/60 px-2 py-0.5 rounded-full">
                  {activeTutorialStep.badge}
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-400">
                  {stepIndex + 1} / {TUTORIAL_STEPS.length} ({progressPercent}%)
                </span>
              </div>

              <div>
                <h2 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  {activeTutorialStep.title}
                </h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {activeTutorialStep.instruction}
                </p>
              </div>

              {/* Action Tip Box */}
              <div className="bg-cyan-950/40 border border-cyan-500/40 rounded-xl p-2.5 flex items-start gap-2">
                <div className="p-1 rounded bg-cyan-500/20 text-cyan-300 shrink-0 mt-0.5">
                  <MousePointerClick className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] text-cyan-200 leading-snug">
                  <span className="font-bold text-cyan-300 block mb-0.5">Langkah Aksi Anda:</span>
                  {activeTutorialStep.actionTip}
                </div>
              </div>

              <p className="text-[10px] text-slate-400 italic leading-normal">
                💡 <strong className="text-slate-300">Standar SOP:</strong> {activeTutorialStep.detail}
              </p>
            </div>

            {/* Footer Navigation Controls */}
            <div className="h-13 bg-slate-950 border-t border-slate-800/80 px-3.5 py-2 flex items-center justify-between gap-2">
              <button
                onClick={handlePrev}
                disabled={stepIndex === 0}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTriggerTargetDirectly}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold border border-cyan-500/40 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Klik otomatis tombol yang ditargetkan untuk demonstrasi cepat"
                >
                  <Play className="w-2.5 h-2.5 fill-cyan-300" />
                  <span>Jalankan Aksi</span>
                </button>

                <button
                  onClick={handleNext}
                  className="px-4 py-1.5 rounded-lg text-xs font-black bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 flex items-center gap-1 shadow-md shadow-cyan-950/50 transition-all cursor-pointer"
                >
                  <span>{stepIndex === TUTORIAL_STEPS.length - 1 ? 'Selesai' : 'Lanjut'}</span>
                  {stepIndex === TUTORIAL_STEPS.length - 1 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-950" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
