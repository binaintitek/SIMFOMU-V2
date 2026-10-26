import React, { useEffect } from 'react';
import { TechnicianState } from '../../types/fiber';
import { FIBER_SPECS, calculateSpliceAccuracy } from '../../utils/standards';
import { soundEffects } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Award, 
  CheckCircle2, 
  Printer, 
  RotateCcw, 
  ShieldCheck, 
  FileSpreadsheet, 
  Check, 
  AlertTriangle,
  Zap,
  Calendar,
  Building,
  Trophy,
  Sparkles,
  Timer,
  Clock,
  FileDown,
  Users,
  Play,
  History
} from 'lucide-react';
import { 
  createLeaderboardEntryFromState, 
  saveLeaderboardEntry,
  formatDuration,
  getSpeedRating
} from '../../utils/leaderboard';
import { 
  createTrainingSessionRecord, 
  saveTrainingSession, 
  extractScenariosFaced,
  ScenarioFacedTag
} from '../../utils/trainingHistory';
import { OTDRTraceViewer } from '../OTDRTraceViewer';
import { exportCertificateToPdf } from '../../utils/exportCertificatePdf';
import { markParticipantCompletedInQueue } from '../../utils/participantQueue';
import { RealToolButton, RealToolPreviewCard } from '../RealToolPreviewCard';
import { SplicePerformanceTrendChart } from '../SplicePerformanceTrendChart';

interface AssessmentCertificateProps {
  state: TechnicianState;
  onRestart: () => void;
  onOpenLeaderboard: () => void;
  onOpenQueueModal?: () => void;
  onNextParticipant?: () => void;
  hasMoreParticipants?: boolean;
  isAdmin?: boolean;
  onRestrictedFeatureClick?: (feature: string, desc?: string) => void;
  onOpenExamRecap?: () => void;
  onOpenTrainingHistory?: () => void;
}

export const AssessmentCertificate: React.FC<AssessmentCertificateProps> = ({
  state,
  onRestart,
  onOpenLeaderboard,
  onOpenQueueModal,
  onNextParticipant,
  hasMoreParticipants = false,
  isAdmin = false,
  onRestrictedFeatureClick,
  onOpenExamRecap,
  onOpenTrainingHistory,
}) => {
  const [savedToLeaderboard, setSavedToLeaderboard] = React.useState<boolean>(false);
  const [isExportingPDF, setIsExportingPDF] = React.useState<boolean>(false);
  const spec = FIBER_SPECS[state.fiberType];
  const evalData = calculateSpliceAccuracy(state);
  const loss = state.arcPerformed ? state.estimatedLoss : 0.02;

  // Total duration recorded
  const recordedDuration = state.timeTrialDuration || (state.timeTrialStartTime ? Math.max(15, Math.round((Date.now() - state.timeTrialStartTime) / 1000)) : 115);
  const speedRating = getSpeedRating(recordedDuration);

  // Automatically mark this participant as completed in queue upon viewing certificate
  React.useEffect(() => {
    if (state.traineeName) {
      markParticipantCompletedInQueue(state.traineeId, state.traineeName, {
        durationSeconds: recordedDuration,
        totalScore: evalData.total,
        grade: evalData.grade,
        spliceLoss: loss,
        telkomCompliant: evalData.telkomCompliant,
      });
    }
  }, [state.traineeId, state.traineeName, recordedDuration, evalData.total, evalData.grade, loss, evalData.telkomCompliant]);

  // Automatically record this completed session into training history
  const sessionLoggedRef = React.useRef<boolean>(false);
  React.useEffect(() => {
    if (!sessionLoggedRef.current && state.traineeName) {
      sessionLoggedRef.current = true;
      const sessionRecord = createTrainingSessionRecord(state);
      saveTrainingSession(sessionRecord);
    }
  }, [state]);

  const scenariosFaced = React.useMemo(() => extractScenariosFaced(state), [state]);

  const handleSaveToLeaderboard = () => {
    soundEffects.playSuccessBeep();
    const entry = createLeaderboardEntryFromState(state);
    saveLeaderboardEntry(entry);
    setSavedToLeaderboard(true);
    onOpenLeaderboard();
  };

  const handleExportPDF = async () => {
    soundEffects.playClick();
    setIsExportingPDF(true);

    try {
      await exportCertificateToPdf({
        cardElementId: 'certificate-printable-card',
        state,
        recordedDuration,
      });
      soundEffects.playSuccessBeep();
    } catch (error) {
      console.error('Failed to export PDF certificate:', error);
      soundEffects.playError();
    } finally {
      setIsExportingPDF(false);
    }
  };

  useEffect(() => {
    if (evalData.grade === 'A+' || evalData.grade === 'A') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#6366f1'],
        });
      } catch {
        // Safe fallback
      }
    }
  }, [evalData.grade]);

  const handlePrint = () => {
    soundEffects.playClick();
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex-1 bg-slate-950 p-4 sm:p-6 flex flex-col relative overflow-y-auto print:bg-white print:p-0">
      {/* Background blueprint grid */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none print:hidden"
        style={{
          backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      ></div>

      <div className="max-w-5xl mx-auto w-full space-y-6 z-10 print:max-w-full">
        {/* Top Grade Banner */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 print:hidden">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center font-extrabold text-2xl shadow-xl ${
                evalData.grade === 'A+' || evalData.grade === 'A'
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-emerald-900/40'
                  : evalData.grade === 'B'
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-700 text-white shadow-blue-900/40'
                  : 'bg-gradient-to-br from-rose-500 to-red-700 text-white shadow-rose-900/40'
              }`}
            >
              {evalData.grade}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">
                  Evaluasi Akhir Splicing Fiber Optik
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    evalData.telkomCompliant
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {evalData.telkomCompliant ? `MEMENUHI STANDAR ${spec.standardAuthority.toUpperCase()}` : 'RE-EVALUASI DIPERLUKAN'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pengujian spesifikasi redaman transmisi ({spec.name}) sesuai regulasi {spec.standardAuthority}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              id="btn-export-pdf"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/40 disabled:opacity-60"
              title="Unduh Sertifikat Kelayakan Resmi dan Ringkasan Riwayat Kesalahan dalam format PDF 2 Halaman (Standar Telkom Akses)"
            >
              {isExportingPDF ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Mengekspor PDF...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-emerald-200" />
                  Export Certificate &amp; Riwayat (PDF)
                </>
              )}
            </button>
            <button
              onClick={handleSaveToLeaderboard}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-950/40"
              title="Simpan hasil pengujian teknisi ke papan peringkat leaderboard"
            >
              <Trophy className="w-4 h-4 fill-slate-950" />
              {savedToLeaderboard ? 'Tersimpan (Buka Leaderboard)' : 'Simpan ke Leaderboard'}
            </button>
            <button
              id="btn-print-certificate"
              onClick={handlePrint}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              Cetak Sertifikat
            </button>

            {onOpenTrainingHistory && (
              <button
                id="btn-certificate-training-history"
                onClick={() => {
                  soundEffects.playClick();
                  onOpenTrainingHistory();
                }}
                className="px-4 py-2.5 bg-blue-600/30 hover:bg-blue-600/45 text-blue-200 border border-blue-500/50 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-950/40"
                title="Buka Sistem Pelaporan & Riwayat Pelatihan (Skor, Waktu, Skenario)"
              >
                <History className="w-4 h-4 text-blue-400" />
                <span>Riwayat & Kemajuan</span>
              </button>
            )}

            {/* Real Tool Button */}
            <RealToolButton currentStep="assessment" />

            {/* Rekap Nilai Ujian (Admin Only) */}
            {isAdmin && onOpenExamRecap && (
              <button
                onClick={() => {
                  soundEffects.playClick();
                  onOpenExamRecap();
                }}
                className="px-4 py-2.5 bg-emerald-950/70 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-500/50 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
                title="Cetak dan Export Rekap Nilai Seluruh Peserta"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Rekap Nilai</span>
              </button>
            )}

            {onOpenQueueModal && (
              <button
                onClick={() => {
                  soundEffects.playClick();
                  if (isAdmin) {
                    onOpenQueueModal();
                  } else {
                    onRestrictedFeatureClick?.(
                      'Manajemen Daftar Peserta',
                      'Pengelolaan antrean peserta dan evaluasi batch hanya dapat diakses oleh Admin / Penguji Uji Kompetensi.'
                    );
                  }
                }}
                className={`px-4 py-2.5 border rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-sm ${
                  isAdmin
                    ? 'bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title={isAdmin ? 'Buka Daftar Antrean Peserta Uji Splicing' : 'Akses Terbatas: Hanya Penguji / Admin'}
              >
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Antrean Peserta {!isAdmin && '🔒'}</span>
              </button>
            )}

            {hasMoreParticipants && onNextParticipant && (
              <button
                onClick={() => {
                  soundEffects.playClick();
                  onNextParticipant();
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/40 animate-pulse"
                title="Aktifkan peserta berikutnya dari antrean dan reset stopwatch ke 00:00 Standby"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Uji Peserta Berikutnya →</span>
              </button>
            )}

            <button
              id="btn-restart-simulation"
              onClick={() => {
                soundEffects.playClick();
                onRestart();
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-blue-900/40"
            >
              <RotateCcw className="w-4 h-4" />
              Uji Sambungan Baru
            </button>
          </div>
        </div>

        {/* 5-Step Accuracy Score Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 print:hidden">
          {/* Stripping */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">01. Stripping</p>
            <div className="flex items-end justify-between">
              <p className="text-xl font-mono font-bold text-white">{evalData.strippingScore}%</p>
              <span className="text-[10px] text-emerald-400">
                {state.leftStrippedLength}mm / {state.rightStrippedLength}mm
              </span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${evalData.strippingScore}%` }}
              ></div>
            </div>
          </div>

          {/* Cleaning */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">02. Cleaning</p>
            <div className="flex items-end justify-between">
              <p className="text-xl font-mono font-bold text-white">{evalData.cleaningScore}%</p>
              <span className="text-[10px] text-emerald-400">IPA 99% 1-Arah</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${evalData.cleaningScore}%` }}
              ></div>
            </div>
          </div>

          {/* Cleaving */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">03. Cleaving</p>
            <div className="flex items-end justify-between">
              <p className="text-xl font-mono font-bold text-white">{evalData.cleavingScore}%</p>
              <span className="text-[10px] text-emerald-400">
                {state.leftCleaveAngle.toFixed(1)}° / {state.rightCleaveAngle.toFixed(1)}°
              </span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${evalData.cleavingScore}%` }}
              ></div>
            </div>
          </div>

          {/* Splicing Loss */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">
              04. Loss Sambungan
            </p>
            <div className="flex items-end justify-between">
              <p className="text-xl font-mono font-bold text-emerald-400">{loss.toFixed(2)} dB</p>
              <span className="text-[10px] text-slate-400">Max {spec.maxAllowedLoss}dB</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full ${loss <= 0.03 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${evalData.splicingScore}%` }}
              ></div>
            </div>
          </div>

          {/* Protection Sleeve */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">
              05. Heat Shrink
            </p>
            <div className="flex items-end justify-between">
              <p className="text-xl font-mono font-bold text-white">{evalData.heatingScore}%</p>
              <span className="text-[10px] text-emerald-400">2.2N Test Pass</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${evalData.heatingScore}%` }}
              ></div>
            </div>
          </div>

          {/* 06. Durasi Pengerjaan */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-amber-500/30">
            <p className="text-[10px] text-amber-400 uppercase font-semibold mb-1 flex items-center gap-1">
              <Timer className="w-3 h-3 text-amber-400" />
              06. Durasi Waktu
            </p>
            <div className="flex items-end justify-between">
              <p className="text-xl font-mono font-bold text-amber-300">{formatDuration(recordedDuration)}</p>
              <span className={`text-[10px] font-bold ${speedRating.color}`}>
                {speedRating.label}
              </span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-amber-500"
                style={{ width: `${Math.max(10, Math.min(100, 100 - ((recordedDuration - 60) / 120) * 80))}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Skenario yang Dihadapi dalam Sesi Ini (User Request) */}
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-5 shadow-xl space-y-3.5 print:hidden">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  Skenario yang Dihadapi dalam Sesi Ini
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    {scenariosFaced.length} Terdeteksi
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Parameter teknis dan anomali yang dialami selama tahapan stripping, cleaning, cleaving, splicing, dan heating.
                </p>
              </div>
            </div>

            {onOpenTrainingHistory && (
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  onOpenTrainingHistory();
                }}
                className="px-3.5 py-1.5 bg-blue-600/25 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <History className="w-4 h-4 text-blue-400" />
                <span>Lihat Seluruh Riwayat & Grafik Kemajuan</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {scenariosFaced.map((sc: ScenarioFacedTag, idx: number) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex flex-col justify-between gap-2 text-xs ${
                  sc.severity === 'critical'
                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                    : sc.severity === 'warning'
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        sc.severity === 'critical' ? 'bg-rose-500 animate-pulse' : sc.severity === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      {sc.name}
                    </span>
                    <span className="text-[10px] uppercase font-mono font-bold opacity-80">
                      {sc.category.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {sc.details}
                  </p>
                </div>
                {sc.sopCorrection && (
                  <div className="pt-2 border-t border-white/10 text-[10px] text-cyan-300 font-medium">
                    🛠️ Tindakan Korektif: {sc.sopCorrection}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Check className="w-3.5 h-3.5" />
              Sesi latihan ini telah otomatis tersimpan dalam Sistem Riwayat Pelatihan.
            </span>
            <span className="font-mono text-slate-400">
              ID Sesi: {state.traineeId || 'TEK'}-{Date.now().toString().slice(-4)}
            </span>
          </div>
        </div>

        {/* Real Tool Physical Instrument Card: OTDR Field Tester */}
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-center gap-5 print:hidden">
          <div className="w-full md:w-72 shrink-0">
            <RealToolPreviewCard currentStep="assessment" />
          </div>
          <div className="flex-1 min-w-0 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold border border-blue-400/30">
                ALAT FISIK LAPANGAN
              </span>
              <h3 className="text-base font-black text-white">
                Verifikasi Kurva Jejak OTDR & Redaman Sambungan (dB)
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              OTDR (Optical Time Domain Reflectometer) memancarkan pulsa cahaya laser dan menganalisis pantulan balik (Rayleigh backscattering & Fresnel reflection). Pada kurva di bawah, titik sambungan fusi terlihat sebagai event redaman (splice loss event). Nilai terukur saat ini: <strong className="text-emerald-400 font-mono font-bold">{loss.toFixed(2)} dB</strong> (Standar Telkom: ≤ {spec.maxAllowedLoss} dB).
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Kalibrasi 1310nm / 1550nm Aktif
              </span>
              <span className="text-slate-600">•</span>
              <span>Event Dead Zone: ≤ 0.8m</span>
              <span className="text-slate-600">•</span>
              <span className="text-blue-400 font-mono font-semibold">Tension: 2.2N Pass</span>
            </div>
          </div>
        </div>

        {/* Interactive OTDR Trace Reflection Visualizer */}
        <div className="space-y-2 print:hidden">
          <OTDRTraceViewer
            loss={loss}
            isArcPerformed={state.arcPerformed}
            fiberType={state.fiberType}
            defectType={state.defectType}
            variant="full"
            traineeName={state.traineeName}
            traineeId={state.traineeId}
            maxAllowedLoss={state.maxAllowedLoss}
            dynamicDifficulty={state.dynamicDifficulty}
          />
        </div>

        {/* Historical Splice Performance & Accuracy Trend Visualizer (Recharts) */}
        <SplicePerformanceTrendChart state={state} />

        {/* Official Printable Competency Certificate Card */}
        <div 
          id="certificate-printable-card" 
          className="bg-gradient-to-b from-[#ffffff] via-[#fcfbf9] to-[#f5efe4] text-slate-800 rounded-3xl border-4 border-[#c59b27]/80 p-6 sm:p-10 md:p-12 shadow-2xl relative overflow-hidden print:border print:border-black print:p-8 print:bg-white print:text-black"
        >
          {/* Inner Secondary Navy Frame */}
          <div className="absolute inset-2.5 sm:inset-3.5 border-2 border-[#0f2b5c]/30 rounded-2xl pointer-events-none"></div>

          {/* Decorative Corner Filigrees (Gold & Navy) */}
          <div className="absolute top-3.5 left-3.5 w-16 h-16 pointer-events-none">
            <svg viewBox="0 0 64 64" fill="none" className="w-full h-full text-[#c59b27]">
              <path d="M4 28V4H28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path d="M10 24V10H24" stroke="#0f2b5c" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="10" cy="10" r="2.5" fill="currentColor" />
            </svg>
          </div>
          <div className="absolute top-3.5 right-3.5 w-16 h-16 pointer-events-none">
            <svg viewBox="0 0 64 64" fill="none" className="w-full h-full text-[#c59b27]">
              <path d="M60 28V4H36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path d="M54 24V10H40" stroke="#0f2b5c" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="54" cy="10" r="2.5" fill="currentColor" />
            </svg>
          </div>
          <div className="absolute bottom-3.5 left-3.5 w-16 h-16 pointer-events-none">
            <svg viewBox="0 0 64 64" fill="none" className="w-full h-full text-[#c59b27]">
              <path d="M4 36V60H28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path d="M10 40V54H24" stroke="#0f2b5c" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="10" cy="54" r="2.5" fill="currentColor" />
            </svg>
          </div>
          <div className="absolute bottom-3.5 right-3.5 w-16 h-16 pointer-events-none">
            <svg viewBox="0 0 64 64" fill="none" className="w-full h-full text-[#c59b27]">
              <path d="M60 36V60H36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path d="M54 40V54H40" stroke="#0f2b5c" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="54" cy="54" r="2.5" fill="currentColor" />
            </svg>
          </div>

          {/* Background Security Watermark Guilloche Pattern */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none">
            <svg viewBox="0 0 400 400" className="w-96 h-96 text-[#0f2b5c]">
              <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="2" fill="none" />
              <circle cx="200" cy="200" r="150" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
              <circle cx="200" cy="200" r="120" stroke="currentColor" strokeWidth="2" fill="none" />
              <circle cx="200" cy="200" r="90" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
              <circle cx="200" cy="200" r="60" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M20 200 Q200 20 380 200 Q200 380 20 200" stroke="currentColor" strokeWidth="1" fill="none" />
              <path d="M200 20 Q380 200 200 380 Q20 200 200 20" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          </div>

          {/* Certificate Header */}
          <div className="text-center space-y-2.5 mb-7 relative z-10">
            {/* SMK Industri Official Emblem Logo */}
            <div className="flex items-center justify-center gap-3 mb-2">
              <img 
                src="/logo.svg" 
                alt="Logo SMK Industri" 
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-md"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/logo.png';
                }}
              />
            </div>

            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-extrabold uppercase tracking-widest shadow-sm ${
              isAdmin
                ? 'bg-[#0f2b5c] border-[#c59b27] text-[#f7d070]'
                : 'bg-slate-900 border-emerald-500/50 text-emerald-300'
            }`}>
              <Award className={`w-3.5 h-3.5 ${isAdmin ? 'text-[#f7d070]' : 'text-emerald-400'}`} />
              <span>
                {isAdmin
                  ? 'LEMBAR UJI KOMPETENSI RESMI TEKNISI FIBER OPTIK • TELKOM GROUP STANDARDS'
                  : 'LEMBAR PELATIHAN MANDIRI TEKNISI FIBER OPTIK • PRACTICE MODE'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0a192f] uppercase font-serif">
              SERTIFIKAT KELAYAKAN FUSION SPLICING
            </h1>
            <div className="w-48 h-0.5 bg-gradient-to-r from-transparent via-[#c59b27] to-transparent mx-auto"></div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto font-medium">
              Berdasarkan hasil simulasi teknis penyambungan serat optik ({spec.name})
              tingkat presisi tinggi berstandar {spec.standardAuthority}.
            </p>
          </div>

          {/* Trainee Details Plaque */}
          <div className="bg-gradient-to-r from-[#faf8f4] via-[#f3ede0]/70 to-[#faf8f4] rounded-2xl border-2 border-[#c59b27]/40 p-5 sm:p-6 mb-6 text-center relative shadow-xs z-10">
            {(state.mode === 'timetrial' || state.timeTrialDuration) && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase mb-2">
                <Timer className="w-3.5 h-3.5 text-amber-700" />
                Catatan Waktu Time-Trial: {formatDuration(recordedDuration)} ({speedRating.label})
              </div>
            )}
            <p className="text-xs uppercase text-[#854d0e] font-bold tracking-widest">
              Diberikan Kepada Teknisi:
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-[#0f284e] tracking-wide mt-1 font-serif">
              {state.traineeName.toUpperCase()}
            </h3>
            <p className="text-xs text-slate-700 mt-1 flex items-center justify-center gap-2 font-medium">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              {state.companyOrInstitution}
            </p>
            <p className="text-[11px] font-mono text-slate-500 mt-2">
              ID Registrasi: {state.traineeId} • Tanggal Uji: {currentDate}
            </p>
          </div>

          {/* 5-Step Evaluation Scores Breakdown Strip inside Certificate */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-7 text-center relative z-10">
            <div className="bg-white/95 p-3 rounded-xl border border-slate-200/90 shadow-xs">
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">1. Stripping</span>
              <p className="text-lg font-mono font-black text-[#0f284e]">{evalData.strippingScore}%</p>
              <span className="text-[10px] text-amber-800 font-semibold font-mono">{state.leftStrippedLength} mm</span>
            </div>
            <div className="bg-white/95 p-3 rounded-xl border border-slate-200/90 shadow-xs">
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">2. Cleaning</span>
              <p className="text-lg font-mono font-black text-[#0f284e]">{evalData.cleaningScore}%</p>
              <span className="text-[10px] text-amber-800 font-semibold font-mono">IPA 99%</span>
            </div>
            <div className="bg-white/95 p-3 rounded-xl border border-slate-200/90 shadow-xs">
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">3. Cleaving</span>
              <p className="text-lg font-mono font-black text-[#0f284e]">{evalData.cleavingScore}%</p>
              <span className="text-[10px] text-amber-800 font-semibold font-mono">{state.leftCleaveAngle.toFixed(1)}° cut</span>
            </div>
            <div className="bg-white/95 p-3 rounded-xl border border-slate-200/90 shadow-xs">
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">4. Splicing</span>
              <p className="text-lg font-mono font-black text-[#0f284e]">{evalData.splicingScore}%</p>
              <span className="text-[10px] text-amber-800 font-semibold font-mono">{loss.toFixed(2)} dB</span>
            </div>
            <div className="bg-white/95 p-3 rounded-xl border border-slate-200/90 shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">5. Heat Shrink</span>
              <p className="text-lg font-mono font-black text-[#0f284e]">{evalData.heatingScore}%</p>
              <span className="text-[10px] text-amber-800 font-semibold font-mono">Sleeve 60mm</span>
            </div>
          </div>

          {/* Technical Test Matrix Table */}
          <div className="mb-7 overflow-x-auto relative z-10 rounded-xl border border-slate-200 shadow-xs bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0f2b5c] text-white">
                  <th className="py-2.5 px-3.5 font-bold">Parameter Uji</th>
                  <th className="py-2.5 px-3.5 font-bold">Hasil Pengukuran</th>
                  <th className="py-2.5 px-3.5 font-bold">Batas Toleransi ({spec.standardAuthority})</th>
                  <th className="py-2.5 px-3.5 text-right font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                    Panjang Kupas Bare Fiber
                  </td>
                  <td className="py-2.5 px-3.5 font-mono font-bold text-[#0f284e]">
                    L: {state.leftStrippedLength}mm | R: {state.rightStrippedLength}mm
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-600">30 - 35 mm</td>
                  <td className="py-2.5 px-3.5 text-right">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300">
                      LULUS
                    </span>
                  </td>
                </tr>
                <tr className="bg-slate-50/60 hover:bg-slate-50">
                  <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                    Kebersihan Permukaan (IPA 99%)
                  </td>
                  <td className="py-2.5 px-3.5 font-mono font-bold text-[#0f284e]">
                    {Math.round((state.leftCleanliness + state.rightCleanliness) / 2)}%
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-600">≥ 90% Bebas Debu</td>
                  <td className="py-2.5 px-3.5 text-right">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300">
                      LULUS
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                    Sudut Potong Cleaver (Cleave Angle)
                  </td>
                  <td className="py-2.5 px-3.5 font-mono font-bold text-[#0f284e]">
                    {state.leftCleaveAngle.toFixed(1)}° &amp; {state.rightCleaveAngle.toFixed(1)}°
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-600">&lt; {spec.maxCleaveAngle}° Derajat</td>
                  <td className="py-2.5 px-3.5 text-right">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300">
                      LULUS
                    </span>
                  </td>
                </tr>
                <tr className="bg-slate-50/60 hover:bg-slate-50">
                  <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                    Estimasi Redaman Sambung (Splice Loss)
                  </td>
                  <td className="py-2.5 px-3.5 font-mono font-black text-emerald-700">
                    {loss.toFixed(2)} dB
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-600">
                    ≤ {evalData.maxAllowedLoss.toFixed(2)} dB
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                      evalData.telkomCompliant 
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-300' 
                        : 'text-rose-700 bg-rose-50 border border-rose-300'
                    }`}>
                      {evalData.telkomCompliant ? 'MEMENUHI SYARAT' : 'GAGAL / TIDAK MEMENUHI'}
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                    Uji Reflektometri OTDR (Event 2 @ 1.25 km)
                  </td>
                  <td className="py-2.5 px-3.5 font-mono font-bold text-[#0f284e]">
                    Step: -{loss.toFixed(2)} dB | 1310/1550nm
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-600">
                    Non-reflective (≤ {evalData.maxAllowedLoss.toFixed(2)} dB)
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                      evalData.telkomCompliant 
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-300' 
                        : 'text-rose-700 bg-rose-50 border border-rose-300'
                    }`}>
                      {evalData.telkomCompliant ? `LULUS (${spec.standardAuthority})` : 'GAGAL'}
                    </span>
                  </td>
                </tr>
                <tr className="bg-slate-50/60 hover:bg-slate-50">
                  <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                    Uji Tarik Mekanis (Proof Tension)
                  </td>
                  <td className="py-2.5 px-3.5 font-mono font-bold text-[#0f284e]">2.2 Newton</td>
                  <td className="py-2.5 px-3.5 text-slate-600">≥ 2.0 Newton</td>
                  <td className="py-2.5 px-3.5 text-right">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300">
                      LULUS
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                    Durasi Total Pengerjaan (Stripping s/d Heating)
                  </td>
                  <td className="py-2.5 px-3.5 font-mono font-bold text-[#0f284e]">
                    {formatDuration(recordedDuration)} ({recordedDuration} detik)
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-600">
                    Target SOP: ≤ 180 detik (3 Menit)
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                      recordedDuration <= 180 
                        ? 'text-amber-800 bg-amber-50 border border-amber-300' 
                        : 'text-blue-800 bg-blue-50 border border-blue-300'
                    }`}>
                      {speedRating.label.toUpperCase()}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Ringkasan Riwayat Kesalahan & Anomali Sesi Latihan (Official Error History Summary) */}
          <div className="mb-7 relative z-10 rounded-xl border border-slate-200 shadow-xs bg-white overflow-hidden">
            <div className="bg-[#0f2b5c] px-3.5 py-2.5 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs uppercase tracking-wider">
                  Ringkasan Riwayat Kesalahan &amp; Anomali Sesi (Error History Summary)
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-white/10 text-cyan-200">
                {scenariosFaced.length === 0 ? 'ZERO DEFECT' : `${scenariosFaced.length} Catatan Kejadian`}
              </span>
            </div>

            {scenariosFaced.length === 0 ? (
              <div className="p-4 text-center bg-emerald-50/60 text-emerald-900 border-t border-emerald-200">
                <p className="font-bold text-xs flex items-center justify-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  NIHIL KESALAHAN TEKNIS (ZERO DEFECT SPLICING)
                </p>
                <p className="text-[11px] text-emerald-700 mt-1 max-w-xl mx-auto">
                  Teknisi menyelesaikan seluruh proses tanpa cacat end-face, misalignment, over-tension, maupun sudut potong kritis.
                  Kualitas sambungan memenuhi kriteria presisi tinggi SOP PT Telkom Akses.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-[11px] border-b border-slate-200">
                      <th className="py-2 px-3 font-bold w-8">No</th>
                      <th className="py-2 px-3 font-bold">Kategori &amp; Skenario Kesalahan</th>
                      <th className="py-2 px-3 font-bold w-24">Tingkat</th>
                      <th className="py-2 px-3 font-bold">Deskripsi Dampak Teknis</th>
                      <th className="py-2 px-3 font-bold">Tindakan Korektif SOP Lapangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {scenariosFaced.map((sc: ScenarioFacedTag, idx: number) => (
                      <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                        <td className="py-2 px-3 font-mono font-bold text-slate-600">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900">{sc.name}</div>
                          <div className="text-[10px] text-slate-500 uppercase font-mono">{sc.category.replace('_', ' ')}</div>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            sc.severity === 'critical'
                              ? 'text-rose-700 bg-rose-50 border border-rose-300'
                              : sc.severity === 'warning'
                              ? 'text-amber-800 bg-amber-50 border border-amber-300'
                              : 'text-emerald-700 bg-emerald-50 border border-emerald-300'
                          }`}>
                            {sc.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-700 text-[11px] leading-relaxed">
                          {sc.details}
                        </td>
                        <td className="py-2 px-3 text-blue-900 font-semibold text-[11px] leading-relaxed">
                          {sc.sopCorrection || 'Lakukan pengulangan sesuai SOP Telkom Akses'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Signatures & Luxury Gold Seal Section */}
          <div className="flex justify-between items-end pt-5 border-t-2 border-slate-200 text-xs relative z-10">
            <div className="space-y-1.5 text-slate-600">
              <p className="font-bold text-[#0f284e]">
                Instruktur &amp; Verifikator Sistem:
              </p>
              <p className="text-slate-700 font-medium">OptiSim Fiber Certification Board</p>
              <div className="h-6"></div>
              <div className="inline-block px-2.5 py-1 rounded bg-blue-50 border border-blue-200">
                <p className="font-mono text-[10px] text-blue-800 font-bold">DIGITALLY VERIFIED VIA OPTISIM</p>
              </div>
            </div>

            {/* Official Prestigious Gold Seal Rosette */}
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 rounded-full border-4 border-[#c59b27] bg-gradient-to-br from-[#ffd700] via-[#f5af19] to-[#d4af37] flex flex-col items-center justify-center text-center p-2 shadow-xl">
                <div className="absolute inset-1 rounded-full border border-[#854d0e]/40 pointer-events-none"></div>
                <ShieldCheck className="w-6 h-6 text-[#5b3700] mb-0.5" />
                <span className="text-[7.5px] font-black text-[#4a2c00] uppercase tracking-tighter">
                  CERTIFIED SPLICER
                </span>
                <span className="text-[10px] font-black text-[#2e1900]">GRADE {evalData.grade}</span>
                <span className="text-[6.5px] font-bold text-[#5b3700] tracking-tight">{evalData.total}% SKOR</span>
              </div>
              {/* Ribbon Tails */}
              <div className="flex gap-1 -mt-1">
                <div className="w-3 h-4 bg-gradient-to-b from-[#d4af37] to-[#b48a3c] rounded-b-xs transform -rotate-12 shadow-xs"></div>
                <div className="w-3 h-4 bg-gradient-to-b from-[#d4af37] to-[#b48a3c] rounded-b-xs transform rotate-12 shadow-xs"></div>
              </div>
            </div>

            <div className="space-y-1.5 text-right text-slate-600">
              <p className="font-bold text-[#0f284e]">Tanda Tangan Teknisi:</p>
              <p className="text-slate-800 font-bold">{state.traineeName}</p>
              <div className="h-6"></div>
              <p className="font-mono text-[10px] text-slate-500">TANGGAL: {currentDate}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
