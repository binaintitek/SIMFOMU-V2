import React from 'react';
import { TechnicianState } from '../types/fiber';
import { FIBER_SPECS } from '../utils/standards';
import { soundEffects } from '../utils/audio';
import { formatDuration } from '../utils/leaderboard';
import { 
  Radio, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  BookOpen, 
  UserCheck, 
  RotateCcw,
  Zap,
  Edit2,
  Trophy,
  ClipboardList,
  Timer,
  Play,
  Pause,
  UserPlus,
  Users,
  Moon,
  Sun,
  Compass,
  Sparkles,
  Lock,
  Unlock,
  LogOut,
  Sliders,
  FileSpreadsheet,
  ShieldCheck,
  AlertTriangle,
  History,
  FileText
} from 'lucide-react';
import { HeaderOfflineBadge } from './pwa/OfflineIndicator';
import { PWAInstallButton } from './pwa/PWAInstallButton';

interface HeaderProps {
  state: TechnicianState;
  updateState: (updates: Partial<TechnicianState>) => void;
  onReset: () => void;
  onOpenSafety: () => void;
  onOpenDefects: () => void;
  onOpenLeaderboard: () => void;
  onOpenOTDR: () => void;
  onToggleActionLog?: () => void;
  actionLogsCount?: number;
  onOpenParticipantModal: () => void;
  onOpenQueueModal?: () => void;
  participantQueueCount?: number;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  isNightMode?: boolean;
  onToggleNightMode?: () => void;
  onOpenTutorial?: () => void;
  isTutorialActive?: boolean;
  isAdmin?: boolean;
  onOpenAdminLogin?: () => void;
  onLogoutAdmin?: () => void;
  onOpenExamSettings?: () => void;
  onOpenExamRecap?: () => void;
  onOpenErrorScenarios?: () => void;
  onOpenTrainingHistory?: () => void;
  onOpenCBT?: () => void;
  onRestrictedFeatureClick?: (featureName: string, description?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  updateState,
  onReset,
  onOpenSafety,
  onOpenDefects,
  onOpenLeaderboard,
  onOpenOTDR,
  onToggleActionLog,
  actionLogsCount = 0,
  onOpenParticipantModal,
  onOpenQueueModal,
  participantQueueCount = 0,
  onToggleTimer,
  onResetTimer,
  isNightMode = false,
  onToggleNightMode,
  onOpenTutorial,
  isTutorialActive = false,
  isAdmin = false,
  onOpenAdminLogin,
  onLogoutAdmin,
  onOpenExamSettings,
  onOpenExamRecap,
  onOpenErrorScenarios,
  onOpenTrainingHistory,
  onOpenCBT,
  onRestrictedFeatureClick,
}) => {
  const toggleSound = () => {
    const next = !state.soundEnabled;
    soundEffects.setEnabled(next);
    updateState({ soundEnabled: next });
    if (next) soundEffects.playClick();
  };

  return (
    <header 
      id="main-app-header"
      className="bg-[#323425] border-b border-black/40 flex flex-col shrink-0 select-none z-30 shadow-lg"
    >
      {/* Top Bar: Brand, Fiber Specs, Stopwatch, and Participant/Admin Status */}
      <div className="min-h-[50px] px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2.5 flex-wrap lg:flex-nowrap border-b border-white/5">
        {/* Left: Brand with uploaded SMK INDUSTRI logo & Fiber Spec */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-950 border border-blue-400/40 shadow-md shadow-blue-950/50 flex items-center justify-center p-0.5 group shrink-0">
            <img 
              src="/logo.svg" 
              alt="Logo SMK Industri" 
              className="w-full h-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo.png';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-blue-400 tracking-wider font-mono">
                SMK INDUSTRI
              </span>
              <span className="text-slate-500">•</span>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1">
                OPTISIM <span className="text-blue-400">FIBER PRO</span>
              </h1>
              <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded">
                v4.2
              </span>
            </div>
            <p className="text-[9px] text-slate-300/80 tracking-wider leading-tight">
              Simulasi Splicing Standar Telkom Akses / FTTH
            </p>
          </div>

          {/* Fiber Spec Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded-xl border border-slate-700/80 text-xs shrink-0 ml-1">
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider border ${
              (FIBER_SPECS[state.fiberType] || FIBER_SPECS.G652D_SM).modeType === 'SM'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
            }`}>
              {(FIBER_SPECS[state.fiberType] || FIBER_SPECS.G652D_SM).modeType === 'SM' ? 'SM 9µm' : 'MM 50µm'}
            </span>
            <select 
              id="select-fiber-type"
              value={state.fiberType}
              onChange={(e) => {
                soundEffects.playClick();
                updateState({ fiberType: e.target.value as TechnicianState['fiberType'] });
              }}
              aria-label="Pilih Jenis Kabel Fiber Optik"
              className="bg-slate-900 border border-slate-700 text-blue-300 font-semibold text-xs rounded px-1.5 py-0.5 focus:outline-none focus:border-blue-400 cursor-pointer max-w-[150px] sm:max-w-[200px]"
            >
              <optgroup label="Single-Mode (SM) - Standar Telkom">
                <option value="G652D_SM">G.652.D (SM 9/125μm)</option>
                <option value="G657A_FTTH">G.657.A2 (FTTH Drop)</option>
              </optgroup>
              <optgroup label="Multi-Mode (MM) - Data Center">
                <option value="OM3_MM">OM3 (MM 50/125μm)</option>
                <option value="OM4_MM">OM4 (MM 50/125μm)</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Center: Stopwatch & Time-Trial Control */}
        <div className="flex items-center gap-2 bg-slate-950/90 px-2.5 sm:px-3 py-1 rounded-xl border border-amber-500/30 text-xs shadow-inner shrink-0">
          <div className="flex items-center gap-1.5">
            <Timer className={`w-3.5 h-3.5 ${state.timeTrialRunning ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
            <div className="flex flex-col">
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                Time-Trial
              </span>
              <span className={`font-mono font-black text-sm leading-none ${
                state.timeTrialCompleted 
                  ? 'text-emerald-400' 
                  : state.timeTrialRunning 
                  ? 'text-amber-300' 
                  : state.timeTrialDuration > 0
                  ? 'text-yellow-300'
                  : 'text-slate-200'
              }`}>
                {formatDuration(state.timeTrialDuration || 0)}
              </span>
            </div>
          </div>

          {/* Per-step countdown/overtime badge if step time limit active */}
          {state.stepTimeLimitSeconds && !state.timeTrialCompleted && (
            <div
              className={`hidden sm:flex flex-col px-1.5 py-0.5 rounded border text-[9px] font-mono leading-tight ${
                state.isStepOvertime
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : (state.currentStepTime || 0) >= (state.stepTimeLimitSeconds * 0.75)
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700'
              }`}
              title={`Batas Waktu Per Langkah: ${state.stepTimeLimitSeconds} Detik (Kesulitan: ${state.dynamicDifficulty?.toUpperCase() || 'NORMAL'})`}
            >
              <div className="flex items-center gap-1 font-bold">
                <span>Step:</span>
                <span>{state.currentStepTime || 0}s/{state.stepTimeLimitSeconds}s</span>
              </div>
              {state.isStepOvertime && (
                <span className="text-[8px] font-sans font-black text-rose-400 uppercase tracking-tighter">
                  Overtime +{(state.currentStepTime || 0) - state.stepTimeLimitSeconds}s
                </span>
              )}
            </div>
          )}

          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${
            state.timeTrialCompleted
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : state.timeTrialRunning
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
              : state.timeTrialDuration > 0
              ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            {state.timeTrialCompleted 
              ? 'Selesai' 
              : state.timeTrialRunning 
              ? 'Jalan' 
              : state.timeTrialDuration > 0 
              ? 'Dijeda' 
              : 'Ready'}
          </span>

          {/* Start / Pause */}
          {!state.timeTrialCompleted ? (
            <button
              id="btn-timer-toggle"
              onClick={() => {
                soundEffects.playClick();
                onToggleTimer();
              }}
              title={state.timeTrialRunning ? 'Jeda Stopwatch' : 'Mulai Hitung Waktu Sesi (Start)'}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-black transition-all cursor-pointer shadow-sm ${
                state.timeTrialRunning
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
              }`}
            >
              {state.timeTrialRunning ? (
                <>
                  <Pause className="w-3 h-3" />
                  <span>Jeda</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-white" />
                  <span>{state.timeTrialDuration > 0 ? 'Lanjut' : 'START'}</span>
                </>
              )}
            </button>
          ) : (
            <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 rounded">
              Tuntas
            </span>
          )}

          {/* Reset Timer */}
          <button
            id="btn-timer-reset"
            onClick={() => {
              soundEffects.playClick();
              onResetTimer();
            }}
            title="Reset Stopwatch ke 00:00"
            className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="text-[10px]">Reset</span>
          </button>
        </div>

        {/* Right: Active Participant & Admin Status */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Active Trainee Profile Button */}
          <button
            id="btn-participant-profile"
            onClick={() => {
              soundEffects.playClick();
              onOpenParticipantModal();
            }}
            className={`cursor-pointer group flex items-center gap-2 px-2.5 py-1 rounded-xl transition-all shadow-sm ${
              state.traineeName
                ? 'bg-slate-900/90 hover:bg-slate-800 border border-blue-500/40 hover:border-blue-400'
                : 'bg-blue-600/25 hover:bg-blue-600/40 border border-blue-400/60 text-blue-200'
            }`}
            title={state.traineeName ? "Klik untuk Ubah Data Peserta Teknisi" : "Klik untuk Input / Pilih Data Peserta"}
          >
            <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
              state.traineeName
                ? 'bg-blue-600/20 border-blue-500/40 text-blue-400 group-hover:bg-blue-600 group-hover:text-white'
                : 'bg-blue-600 border-blue-400 text-white animate-pulse'
            }`}>
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1 leading-none">
                <span className="text-[8px] text-blue-400 font-bold uppercase tracking-wider">
                  PESERTA
                </span>
                <Edit2 className="w-2.5 h-2.5 text-slate-500 group-hover:text-blue-400 inline" />
              </div>
              <p className="text-xs font-bold text-slate-200 max-w-[130px] truncate leading-tight">
                {state.traineeName || 'Input Peserta'}
              </p>
            </div>
          </button>

          {/* Admin Status / Login Admin Button */}
          {!isAdmin ? (
            <div className="flex items-center gap-1.5">
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Latihan</span>
              </span>

              {onOpenAdminLogin && (
                <button
                  id="btn-login-admin"
                  onClick={() => {
                    soundEffects.playClick();
                    onOpenAdminLogin();
                  }}
                  title="Login Penguji / Admin (Default PIN: 1234)"
                  className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 hover:border-amber-400 text-amber-300 transition-all shadow-sm font-bold text-xs group"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="whitespace-nowrap font-black">🔐 Login Admin</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-950/90 px-2 py-1 rounded-xl border border-emerald-500/50 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-black text-emerald-300 whitespace-nowrap">
                👨‍🏫 Penguji Aktif
              </span>
            </div>
          )}

          {/* PWA In-App Install Prompt */}
          <PWAInstallButton />

          {/* Network Offline / Online Diagnostics Badge */}
          <HeaderOfflineBadge />
        </div>
      </div>

      {/* Bottom Bar: Clean, Full-Visibility Action Toolbar */}
      <div className="bg-black/40 px-2 sm:px-4 py-1.5 flex items-center justify-between gap-1.5 sm:gap-2 overflow-x-auto scrollbar-thin">
        {/* Group 1: Exam & Participant Management Tools */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Daftar Peserta / Antrean */}
          {onOpenQueueModal && (
            <button
              id="btn-queue-modal"
              onClick={() => {
                soundEffects.playClick();
                if (isAdmin) {
                  onOpenQueueModal();
                } else {
                  onRestrictedFeatureClick?.(
                    'Manajemen Daftar Peserta & Antrean Ujian',
                    'Fitur pendaftaran peserta terpusat, batch roster, dan import Excel hanya dapat dikelola oleh Admin / Penguji. Peserta dapat mengisi nama mandiri pada tombol PESERTA.'
                  );
                }
              }}
              title={
                isAdmin
                  ? 'Buka Manajemen Daftar Peserta & Antrean Ujian'
                  : 'Akses Terbatas: Hanya Penguji yang dapat mengelola antrean massal'
              }
              className={`cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all shadow-sm ${
                isAdmin
                  ? 'bg-indigo-600/25 hover:bg-indigo-600/40 border-indigo-500/40 text-indigo-300'
                  : 'bg-slate-800/90 hover:bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Daftar Peserta</span>
              {!isAdmin && <Lock className="w-3 h-3 text-amber-400 ml-0.5" />}
              <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-[10px] font-mono font-bold text-indigo-300 border border-indigo-500/30">
                {participantQueueCount}
              </span>
            </button>
          )}

          {/* Admin: Soal Ujian */}
          {isAdmin && onOpenExamSettings && (
            <button
              id="btn-open-exam-settings"
              onClick={() => {
                soundEffects.playClick();
                onOpenExamSettings();
              }}
              title="Pengaturan Parameter Soal Ujian (Batas Waktu, Injeksi Cacat, Standar)"
              className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-bold transition-all"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-300" />
              <span>Soal Ujian</span>
            </button>
          )}

          {/* Admin: Rekap Nilai */}
          {isAdmin && onOpenExamRecap && (
            <button
              id="btn-open-exam-recap"
              onClick={() => {
                soundEffects.playClick();
                onOpenExamRecap();
              }}
              title="Cetak & Export Rekapitulasi Nilai Ujian Batch Peserta"
              className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Rekap Nilai</span>
            </button>
          )}

          <div className="h-4 w-px bg-white/10 mx-0.5" />

          {/* OTDR Trace Analysis Button */}
          <button
            id="btn-header-otdr"
            onClick={() => {
              soundEffects.playClick();
              onOpenOTDR();
            }}
            title="Buka Analisis Grafik OTDR (Optical Time-Domain Reflectometer)"
            className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-bold transition-all shadow-sm"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>OTDR</span>
          </button>

          {/* Leaderboard Button */}
          <button
            id="btn-header-leaderboard"
            onClick={() => {
              soundEffects.playClick();
              onOpenLeaderboard();
            }}
            title="Buka Papan Peringkat Teknisi (Leaderboard)"
            className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-bold transition-all shadow-sm"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
            <span>Leaderboard</span>
          </button>

          {/* Sistem Pelaporan & Riwayat Pelatihan */}
          {onOpenTrainingHistory && (
            <button
              id="btn-header-training-history"
              onClick={() => {
                soundEffects.playClick();
                onOpenTrainingHistory();
              }}
              title="Buka Sistem Pelaporan & Riwayat Pelatihan (Skor, Durasi, Skenario)"
              className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-blue-300 rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              <History className="w-3.5 h-3.5 text-blue-400" />
              <span>Riwayat</span>
            </button>
          )}

          {/* Modul CBT (Computer Based Test) Button */}
          {onOpenCBT && (
            <button
              id="btn-header-cbt"
              onClick={() => {
                soundEffects.playClick();
                onOpenCBT();
              }}
              title="Buka Modul CBT (Computer Based Test): Pre-Test (Free Test) & Post-Test Evaluasi"
              className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-bold transition-all shadow-sm hover:scale-[1.02]"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>📝 CBT Test</span>
            </button>
          )}

          {/* Action Log Panel Button */}
          {onToggleActionLog && (
            <button
              id="btn-header-action-log"
              onClick={() => {
                soundEffects.playClick();
                onToggleActionLog();
              }}
              title="Buka / Tutup Panel Log Tindakan Real-Time"
              className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              <ClipboardList className="w-3.5 h-3.5 text-cyan-400" />
              <span>Log</span>
              <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-950 text-cyan-300 border border-cyan-600/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {actionLogsCount}
              </span>
            </button>
          )}
        </div>

        {/* Group 2: Knowledge, Guides, Preferences, and Utilities */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Panduan K3 */}
          <button
            id="btn-header-k3"
            onClick={() => {
              soundEffects.playClick();
              onOpenSafety();
            }}
            title="Panduan K3 Keselamatan Kerja Fiber Optik"
            className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-bold transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>K3 Safety</span>
          </button>

          {/* Katalog Defect */}
          <button
            id="btn-header-defect"
            onClick={() => {
              soundEffects.playClick();
              onOpenDefects();
            }}
            title="Katalog Kerusakan Sambungan Splicing & Standar Telkom"
            className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Defect</span>
          </button>

          {/* Skenario Kesalahan Umum */}
          {onOpenErrorScenarios && (
            <button
              id="btn-header-error-scenarios"
              onClick={() => {
                soundEffects.playClick();
                onOpenErrorScenarios();
              }}
              title="Katalog & Simulasi Skenario Kesalahan Umum (Kontaminasi, Misalignment, Tarik Berlebih)"
              className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Skenario Kesalahan</span>
            </button>
          )}

          {/* Quick Start Guide */}
          {onOpenTutorial && (
            <button
              type="button"
              id="btn-open-quickstart"
              onClick={() => {
                soundEffects.playClick();
                onOpenTutorial();
              }}
              title="Buka Panduan Tutorial Interaktif Quick Start"
              className={`cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all shadow-sm ${
                isTutorialActive
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400/50 shadow-cyan-950/40 animate-pulse'
                  : 'bg-cyan-950/60 hover:bg-cyan-900/70 border-cyan-500/40 text-cyan-300 hover:text-white'
              }`}
            >
              <Compass className={`w-3.5 h-3.5 text-cyan-400 ${isTutorialActive ? 'animate-spin' : ''}`} />
              <span>Quick Start</span>
              <span className="px-1 py-0.2 rounded bg-cyan-400/20 text-cyan-300 text-[8px] font-mono font-black">
                GUIDE
              </span>
            </button>
          )}

          <div className="h-4 w-px bg-white/10 mx-0.5" />

          {/* Mode Malam Switch */}
          {onToggleNightMode && (
            <button
              type="button"
              id="btn-toggle-night-mode"
              onClick={() => {
                soundEffects.playClick();
                onToggleNightMode();
              }}
              title={
                isNightMode
                  ? 'Mode Malam Aktif: Kontras tinggi OLED. Klik untuk beralih ke tema standar'
                  : 'Aktifkan Mode Malam: Skema warna kontras tinggi OLED untuk lingkungan minim cahaya'
              }
              className={`cursor-pointer flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-bold transition-all shadow-sm ${
                isNightMode
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              {isNightMode ? (
                <Moon className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="text-[11px]">{isNightMode ? 'Malam' : 'Normal'}</span>
              <div 
                className={`w-6 h-3.5 flex items-center rounded-full p-0.5 transition-colors ${
                  isNightMode ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${isNightMode ? 'bg-slate-950' : 'bg-slate-300'}`} />
              </div>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            id="btn-toggle-sound"
            onClick={toggleSound}
            title={state.soundEnabled ? 'Matikan Suara Simulator' : 'Aktifkan Suara Simulator'}
            className={`cursor-pointer flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold transition-colors ${
              state.soundEnabled 
                ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 hover:bg-blue-600/30' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {state.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-blue-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            <span className="text-[10px]">{state.soundEnabled ? 'Suara' : 'Mute'}</span>
          </button>

          {/* Admin Logout */}
          {isAdmin && onLogoutAdmin && (
            <button
              id="btn-logout-admin"
              onClick={() => {
                soundEffects.playClick();
                onLogoutAdmin();
              }}
              title="Logout dari Mode Admin dan Kembali ke Mode Latihan"
              className="cursor-pointer flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all ml-1"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
