import React, { useState, useMemo } from 'react';
import { 
  X, 
  History, 
  TrendingUp, 
  Award, 
  Clock, 
  Timer, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  Trash2, 
  PlusCircle, 
  ChevronRight, 
  ChevronDown, 
  Zap, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  RefreshCw, 
  BarChart3, 
  Activity,
  FileSpreadsheet,
  Calendar,
  Building,
  User,
  Check
} from 'lucide-react';
import { TechnicianState } from '../types/fiber';
import { 
  TrainingSessionRecord, 
  loadTrainingHistory, 
  saveTrainingSession, 
  deleteTrainingSession, 
  clearTrainingHistory, 
  calculateProgressAnalytics, 
  exportHistoryToCSV, 
  createTrainingSessionRecord,
  generateSampleHistoryIfEmpty,
  ScenarioCategory
} from '../utils/trainingHistory';
import { soundEffects } from '../utils/audio';

interface TrainingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState?: TechnicianState;
  onSessionLogged?: () => void;
}

export const TrainingHistoryModal: React.FC<TrainingHistoryModalProps> = ({
  isOpen,
  onClose,
  currentState,
  onSessionLogged,
}) => {
  const [sessions, setSessions] = useState<TrainingSessionRecord[]>(() => loadTrainingHistory());
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'report'>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'training' | 'exam' | 'timetrial'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'compliant' | 'non_compliant'>('all');
  const [selectedSession, setSelectedSession] = useState<TrainingSessionRecord | null>(null);
  const [showSavedToast, setShowSavedToast] = useState<boolean>(false);

  // Reload history when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSessions(loadTrainingHistory());
    }
  }, [isOpen]);

  const analytics = useMemo(() => calculateProgressAnalytics(sessions), [sessions]);

  // Filtered session list
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchSearch =
        s.traineeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.traineeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.companyOrInstitution.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.scenariosFaced.some((sc) => sc.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchMode = filterMode === 'all' || s.mode === filterMode;
      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'compliant' && s.telkomCompliant) ||
        (filterStatus === 'non_compliant' && !s.telkomCompliant);

      return matchSearch && matchMode && matchStatus;
    });
  }, [sessions, searchQuery, filterMode, filterStatus]);

  if (!isOpen) return null;

  const handleRecordCurrentSession = () => {
    if (!currentState) return;
    soundEffects.playSuccessBeep();
    const newRecord = createTrainingSessionRecord(currentState);
    const updated = saveTrainingSession(newRecord);
    setSessions(updated);
    setSelectedSession(newRecord);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
    onSessionLogged?.();
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playClick();
    if (confirm('Apakah Anda yakin ingin menghapus catatan sesi pelatihan ini?')) {
      const updated = deleteTrainingSession(id);
      setSessions(updated);
      if (selectedSession?.id === id) {
        setSelectedSession(null);
      }
    }
  };

  const handleClearAllHistory = () => {
    soundEffects.playClick();
    if (confirm('PERINGATAN: Apakah Anda yakin ingin mengosongkan SELURUH riwayat pelatihan? Data tidak dapat dipulihkan.')) {
      clearTrainingHistory();
      setSessions([]);
      setSelectedSession(null);
    }
  };

  const handleRestoreSampleHistory = () => {
    soundEffects.playClick();
    const samples = generateSampleHistoryIfEmpty();
    setSessions(samples);
  };

  const handleExportCSV = () => {
    soundEffects.playClick();
    exportHistoryToCSV(sessions);
  };

  const handlePrint = () => {
    soundEffects.playClick();
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const getScenarioCategoryBadge = (cat: ScenarioCategory) => {
    switch (cat) {
      case 'contamination':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'misalignment':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'excessive_tension':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'cleave_defect':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'stripping_flaw':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'equipment_failure':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'sop_compliant':
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn print:p-0 print:bg-white print:static">
      <div 
        id="training-report-container"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl shadow-blue-950/40 overflow-hidden print:max-h-none print:border-none print:shadow-none print:bg-white text-slate-100"
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-md">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Sistem Pelaporan & Riwayat Pelatihan
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {sessions.length} Sesi Tercatat
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pencatatan skor akurasi, waktu pengerjaan, dan skenario kesalahan yang dihadapi untuk melacak kemajuan kompetensi teknisi.
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {currentState && (
              <button
                type="button"
                onClick={handleRecordCurrentSession}
                className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-950/40 cursor-pointer"
                title="Catat kondisi dan hasil sesi pengerjaan saat ini ke riwayat permanen"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Catat Sesi Ini</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={sessions.length === 0}
              className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              title="Unduh seluruh log sesi dalam format file CSV / Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Ekspor CSV</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('report');
                setTimeout(() => handlePrint(), 250);
              }}
              disabled={sessions.length === 0}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              title="Cetak format laporan rekapitulasi kemajuan pelatihan teknisi"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Cetak Laporan</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Saved Toast Notification */}
        {showSavedToast && (
          <div className="bg-emerald-600/90 text-white text-xs font-bold px-4 py-2.5 flex items-center justify-between gap-2 shadow-lg animate-fadeIn print:hidden">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Sesi latihan berhasil dicatat ke riwayat! Skor akurasi, waktu, dan skenario telah diperbarui.</span>
            </div>
            <button 
              type="button"
              onClick={() => setShowSavedToast(false)} 
              className="text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-4 flex-wrap print:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setActiveTab('overview');
              }}
              className={`px-4 py-2 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-400 bg-slate-900/90'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Ringkasan & Analisis Kemajuan</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setActiveTab('sessions');
              }}
              className={`px-4 py-2 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'sessions'
                  ? 'border-blue-500 text-blue-400 bg-slate-900/90'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Daftar Riwayat Sesi ({sessions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setActiveTab('report');
              }}
              className={`px-4 py-2 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'report'
                  ? 'border-blue-500 text-blue-400 bg-slate-900/90'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Format Laporan Resmi (Print)</span>
            </button>
          </div>

          {/* Quick Clear / Reset Controls */}
          <div className="flex items-center gap-2 pb-2">
            {sessions.length === 0 ? (
              <button
                type="button"
                onClick={handleRestoreSampleHistory}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold underline"
              >
                <RefreshCw className="w-3 h-3" />
                Muat Contoh Riwayat Latihan
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClearAllHistory}
                className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                title="Hapus semua rekaman riwayat"
              >
                <Trash2 className="w-3 h-3" />
                Kosongkan Riwayat
              </button>
            )}
          </div>
        </div>

        {/* Modal Main Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: OVERVIEW & PROGRESS ANALYTICS */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Top KPI Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {/* Total Sesi */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Total Sesi Latihan</span>
                    <History className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-white">{analytics.totalSessions}</span>
                    <span className="text-xs text-slate-400">sesi</span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                    <span className="text-emerald-400 font-bold">{analytics.passedSessions} lulus</span>
                    <span>•</span>
                    <span className="text-rose-400 font-bold">{analytics.failedSessions} re-exam</span>
                  </div>
                  <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
                </div>

                {/* Rata-Rata Skor Akurasi */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Rata-rata Skor Akurasi</span>
                    <Award className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-amber-400">{analytics.averageScore}</span>
                    <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                  <div className="mt-2 text-[11px] flex items-center gap-1 font-bold">
                    {analytics.scoreImprovement >= 0 ? (
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" />
                        +{analytics.scoreImprovement} poin progres
                      </span>
                    ) : (
                      <span className="text-rose-400">
                        {analytics.scoreImprovement} poin
                      </span>
                    )}
                  </div>
                  <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                </div>

                {/* Rata-Rata Waktu Pengerjaan */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Rata-rata Waktu Dihabiskan</span>
                    <Clock className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-cyan-300">
                      {Math.floor(analytics.averageDurationSeconds / 60)}m {analytics.averageDurationSeconds % 60}s
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                    {analytics.durationReductionSeconds > 0 ? (
                      <span className="text-emerald-400 font-bold">
                        ⚡ {analytics.durationReductionSeconds}s lebih cepat
                      </span>
                    ) : (
                      <span>Waktu per sesi stabil</span>
                    )}
                  </div>
                  <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
                </div>

                {/* Rasio Kelulusan SOP Telkom */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Kelulusan SOP Telkom</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-400">{analytics.passRatePercentage}%</span>
                    <span className="text-xs text-slate-400">compliance</span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400">
                    Rata-rata redaman: <span className="font-bold text-slate-200">{analytics.averageLoss} dB</span>
                  </div>
                  <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                </div>
              </div>

              {/* Progress Charts & Scenarios Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visual Chart: Skor Akurasi & Redaman per Sesi (2 cols) */}
                <div className="lg:col-span-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-400" />
                        Grafik Perkembangan Skor Akurasi & Pengurangan Redaman
                      </h3>
                      <p className="text-xs text-slate-400">
                        Memvisualisasikan peningkatan skor teknisi dan penurunan rugi daya (loss dB) dari sesi ke sesi.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Skor Akurasi
                      </span>
                      <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Loss (dB x100)
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <span className="w-2.5 h-0.5 bg-emerald-400"></span> Target Lulus (85)
                      </span>
                    </div>
                  </div>

                  {/* SVG Line / Bar Progression Graph */}
                  {sessions.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-slate-500 text-xs italic">
                      Belum ada sesi latihan tercatat. Klik &quot;Catat Sesi Ini&quot; atau selesaikan simulasi fusi.
                    </div>
                  ) : (
                    <div className="w-full bg-slate-900/60 rounded-xl p-4 border border-slate-800/80">
                      <div className="h-56 relative flex items-end gap-3 sm:gap-6 pt-6 pb-2 px-2 overflow-x-auto">
                        {/* Target line at 85% */}
                        <div 
                          className="absolute left-0 right-0 border-b border-dashed border-emerald-500/60 pointer-events-none z-10 flex items-center justify-end pr-2 text-[10px] text-emerald-400 font-mono"
                          style={{ bottom: `${(85 / 100) * 80 + 10}%` }}
                        >
                          Standar Telkom 85 Pts
                        </div>

                        {/* Session Bars/Points sorted chronologically */}
                        {[...sessions].reverse().map((session, idx) => {
                          const scoreHeight = Math.max(12, Math.min(100, session.accuracyScore));
                          const lossHeight = Math.min(90, Math.max(8, (session.estimatedLoss / 0.15) * 80));
                          const isPass = session.telkomCompliant;

                          return (
                            <div 
                              key={session.id} 
                              onClick={() => {
                                soundEffects.playClick();
                                setSelectedSession(session);
                              }}
                              className="flex-1 min-w-[50px] max-w-[90px] h-full flex flex-col justify-end items-center group cursor-pointer"
                              title={`${session.traineeName} - ${session.dateFormatted}: Skor ${session.accuracyScore}, Loss ${session.estimatedLoss} dB, Durasi ${session.durationFormatted}`}
                            >
                              {/* Hover tooltip indicator */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 border border-slate-700 text-white text-[10px] p-1.5 rounded-lg shadow-xl absolute -top-8 whitespace-nowrap z-20 pointer-events-none">
                                <span className="font-bold text-amber-300">{session.accuracyScore} Pts</span> | Loss: {session.estimatedLoss}dB | {session.durationFormatted}
                              </div>

                              {/* Dual Column Bars */}
                              <div className="w-full flex items-end justify-center gap-1.5 h-full pb-2">
                                {/* Score Bar */}
                                <div 
                                  className={`w-4 sm:w-6 rounded-t-md transition-all duration-300 group-hover:brightness-125 ${
                                    isPass 
                                      ? 'bg-gradient-to-t from-blue-700 to-blue-500 shadow-sm shadow-blue-500/30' 
                                      : 'bg-gradient-to-t from-amber-700 to-amber-500 shadow-sm shadow-amber-500/30'
                                  }`}
                                  style={{ height: `${(scoreHeight / 100) * 82}%` }}
                                >
                                  <div className="text-[10px] font-black text-white text-center pt-1 drop-shadow">
                                    {session.accuracyScore}
                                  </div>
                                </div>

                                {/* Loss Indicator Bar */}
                                <div 
                                  className="w-2.5 sm:w-3 bg-gradient-to-t from-rose-900 to-rose-500/80 rounded-t-sm"
                                  style={{ height: `${lossHeight}%` }}
                                  title={`Loss: ${session.estimatedLoss} dB`}
                                />
                              </div>

                              {/* X Axis Labels */}
                              <div className="text-[10px] font-semibold text-slate-400 group-hover:text-blue-300 text-center truncate w-full">
                                Sesi {idx + 1}
                              </div>
                              <div className="text-[9px] text-slate-400 font-mono truncate w-full text-center">
                                {session.dateFormatted.split(' ')[0]} {session.dateFormatted.split(' ')[1]}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Competency Breakdown Bars */}
                  <div className="pt-2">
                    <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      Rata-rata Skor per Tahap Pengerjaan (5 Tahap SOP)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { label: 'Stripping', score: analytics.competencyAverages.stripping, color: 'from-blue-600 to-cyan-500' },
                        { label: 'Cleaning', score: analytics.competencyAverages.cleaning, color: 'from-cyan-600 to-teal-500' },
                        { label: 'Cleaving', score: analytics.competencyAverages.cleaving, color: 'from-amber-600 to-yellow-500' },
                        { label: 'Splicing', score: analytics.competencyAverages.splicing, color: 'from-indigo-600 to-purple-500' },
                        { label: 'Heating', score: analytics.competencyAverages.heating, color: 'from-rose-600 to-pink-500' },
                      ].map((item) => (
                        <div key={item.label} className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>{item.label}</span>
                            <span className="font-bold text-white">{item.score}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                            <div 
                              className={`h-full bg-gradient-to-r ${item.color} rounded-full`} 
                              style={{ width: `${item.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Skenario Kesalahan yang Pernah Dihadapi (User Core Request) */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      Skenario yang Pernah Dihadapi
                    </h3>
                    <p className="text-xs text-slate-400">
                      Frekuensi anomali dan skenario kesalahan yang dialami teknisi dalam riwayat latihan.
                    </p>
                  </div>

                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {Object.keys(analytics.scenarioFrequencyMap).length === 0 ? (
                      <div className="p-4 bg-slate-900/60 rounded-xl text-center text-xs text-slate-400">
                        Belum ada skenario yang tercatat.
                      </div>
                    ) : (
                      (Object.values(analytics.scenarioFrequencyMap) as { count: number; category: ScenarioCategory; name: string }[])
                        .sort((a, b) => b.count - a.count)
                        .map((sc, i) => (
                          <div
                            key={i}
                            className="p-3 bg-slate-900/90 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${getScenarioCategoryBadge(sc.category)}`}>
                                {sc.category === 'contamination' && '🧪 Kontaminasi'}
                                {sc.category === 'misalignment' && '📐 Misalignment'}
                                {sc.category === 'excessive_tension' && '⚡ Over-Tension'}
                                {sc.category === 'cleave_defect' && '🔪 Cleave Defect'}
                                {sc.category === 'stripping_flaw' && '✂️ Strip Flaw'}
                                {sc.category === 'equipment_failure' && '🛠️ Gangguan Alat'}
                                {sc.category === 'sop_compliant' && '✅ SOP Standar'}
                              </span>
                              <span className="font-semibold text-slate-200 truncate">{sc.name}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-black bg-blue-500/20 text-blue-300 shrink-0">
                              {sc.count}x
                            </span>
                          </div>
                        ))
                    )}
                  </div>

                  {/* Recommendation Box */}
                  <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-blue-300">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      Rekomendasi Instruktur & SOP
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {analytics.competencyAverages.cleaving < 80
                        ? 'Fokuskan latihan pada pemotongan serat (Cleaving) untuk menjaga sudut potong < 0.8°. Lakukan rotasi bilah cleaver jika tumpul.'
                        : analytics.competencyAverages.cleaning < 85
                        ? 'Prioritaskan konsistensi penyekaan alkohol IPA satu arah untuk mencegah kontaminasi partikel debu mikro.'
                        : 'Pertahankan ketelitian fusi. Teknisi menunjukkan kestabilan pengerjaan yang memenuhi standar Telkom Akses.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SESSION HISTORY LIST & DETAILED CARDS */}
          {activeTab === 'sessions' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Search & Filter Bar */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap">
                {/* Search Box */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama peserta, ID, atau skenario..."
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Filter Mode */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" />
                    Mode:
                  </span>
                  <select
                    value={filterMode}
                    onChange={(e) => setFilterMode(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">Semua Mode</option>
                    <option value="training">Latihan (Training)</option>
                    <option value="exam">Ujian Resmi</option>
                    <option value="timetrial">Time-Trial</option>
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">Semua Status</option>
                    <option value="compliant">Lulus Standar Telkom</option>
                    <option value="non_compliant">Re-Exam / Tidak Lulus</option>
                  </select>
                </div>
              </div>

              {/* Sessions Table / List */}
              {filteredSessions.length === 0 ? (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs space-y-2">
                  <History className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="font-semibold text-slate-300">Tidak ada catatan sesi yang sesuai filter pencarian.</p>
                  <p>Cobalah ubah kata kunci pencarian atau reset filter di atas.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSessions.map((session, index) => {
                    const isSelected = selectedSession?.id === session.id;

                    return (
                      <div
                        key={session.id}
                        onClick={() => {
                          soundEffects.playClick();
                          setSelectedSession(isSelected ? null : session);
                        }}
                        className={`bg-slate-950/80 border rounded-xl p-4 transition-all cursor-pointer shadow-sm ${
                          isSelected
                            ? 'border-blue-500 ring-1 ring-blue-500/50 bg-slate-900'
                            : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        {/* Summary Row */}
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          {/* Trainee & Date Info */}
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-md shrink-0 ${
                                session.grade === 'A+' || session.grade === 'A'
                                  ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-emerald-950/50'
                                  : session.grade === 'B'
                                  ? 'bg-gradient-to-br from-blue-500 to-indigo-700 text-white shadow-blue-950/50'
                                  : 'bg-gradient-to-br from-rose-500 to-red-700 text-white shadow-rose-950/50'
                              }`}
                            >
                              {session.grade}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-white">{session.traineeName}</h4>
                                <span className="text-[10px] text-slate-400 font-mono">({session.traineeId})</span>
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                                  {session.mode}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  {session.dateFormatted} • {session.timeFormatted}
                                </span>
                                <span>•</span>
                                <span className="text-slate-400">{session.companyOrInstitution}</span>
                              </div>
                            </div>
                          </div>

                          {/* Key Metrics: Score, Duration, Loss */}
                          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                            {/* Accuracy Score */}
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block font-medium">Skor Akurasi</span>
                              <span className="text-base font-black text-white">
                                {session.accuracyScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                              </span>
                            </div>

                            {/* Waktu yang Dihabiskan */}
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block font-medium">Waktu Dihabiskan</span>
                              <span className="text-sm font-black text-cyan-300 flex items-center gap-1 justify-end">
                                <Clock className="w-3 h-3 text-cyan-400" />
                                {session.durationFormatted}
                              </span>
                            </div>

                            {/* Splice Loss */}
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block font-medium">Redaman (Loss)</span>
                              <span className={`text-sm font-black ${session.telkomCompliant ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {session.estimatedLoss.toFixed(3)} dB
                              </span>
                            </div>

                            {/* Compliance Badge */}
                            <div className="shrink-0">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                                  session.telkomCompliant
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                }`}
                              >
                                {session.telkomCompliant ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    Lulus Telkom
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                    Re-Exam
                                  </>
                                )}
                              </span>
                            </div>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteSession(session.id, e)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Hapus sesi ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Skenario yang Dihadapi (Badges Row) */}
                        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              Skenario Dihadapi:
                            </span>
                            {session.scenariosFaced.map((sc, scIdx) => (
                              <span
                                key={scIdx}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getScenarioCategoryBadge(sc.category)}`}
                                title={sc.details}
                              >
                                {sc.name}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-1 text-[11px] text-blue-400 font-semibold">
                            <span>{isSelected ? 'Tutup Rincian' : 'Lihat Rincian Teknis'}</span>
                            {isSelected ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </div>
                        </div>

                        {/* EXPANDED DETAILS CARD */}
                        {isSelected && (
                          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                            {/* Left: Step Score Breakdown */}
                            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800/80 space-y-2.5">
                              <h5 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-blue-400" />
                                Rincian Nilai per Tahap Pengerjaan
                              </h5>
                              <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between py-0.5 border-b border-slate-800 text-slate-300">
                                  <span>01. Pengupasan (Stripping 32mm)</span>
                                  <span className="font-bold font-mono text-white">{session.scoreBreakdown.stripping} / 100</span>
                                </div>
                                <div className="flex justify-between py-0.5 border-b border-slate-800 text-slate-300">
                                  <span>02. Pembersihan (Cleaning Kimwipes/IPA)</span>
                                  <span className="font-bold font-mono text-white">{session.scoreBreakdown.cleaning} / 100</span>
                                </div>
                                <div className="flex justify-between py-0.5 border-b border-slate-800 text-slate-300">
                                  <span>03. Pemotongan (Cleaving Sudut &lt;0.8°)</span>
                                  <span className="font-bold font-mono text-white">{session.scoreBreakdown.cleaving} / 100</span>
                                </div>
                                <div className="flex justify-between py-0.5 border-b border-slate-800 text-slate-300">
                                  <span>04. Fusi & Alignment (Splicing Z-Gap/PAS)</span>
                                  <span className="font-bold font-mono text-white">{session.scoreBreakdown.splicing} / 100</span>
                                </div>
                                <div className="flex justify-between py-0.5 text-slate-300">
                                  <span>05. Pemanasan Sleeve (Heat Shrink 200°C)</span>
                                  <span className="font-bold font-mono text-white">{session.scoreBreakdown.heating} / 100</span>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                                <span>Sudut Potong Rata-rata: <strong className="text-slate-200">{session.cleaveAngleAvg}°</strong></span>
                                <span>Offset Core: <strong className="text-slate-200">{session.coreOffset}µm</strong></span>
                                <span>Kebersihan: <strong className="text-slate-200">{session.cleanlinessAvg}%</strong></span>
                              </div>
                            </div>

                            {/* Right: Detailed Scenarios & SOP Feedback */}
                            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800/80 space-y-2.5">
                              <h5 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                Umpan Balik & Prosedur Korektif SOP
                              </h5>
                              <p className="text-xs text-slate-300 italic bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                                &quot;{session.summaryNotes}&quot;
                              </p>

                              <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                  SOP Perbaikan Terkait Skenario:
                                </span>
                                {session.scenariosFaced.map((sc, i) => (
                                  <div key={i} className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded border border-slate-800/60 space-y-0.5">
                                    <div className="font-bold text-amber-300 flex items-center gap-1">
                                      <span>•</span> {sc.name}
                                    </div>
                                    <p className="text-[11px] text-slate-400 pl-2">{sc.details}</p>
                                    {sc.sopCorrection && (
                                      <p className="text-[11px] text-emerald-400 pl-2 font-medium">
                                        👉 SOP Korektif: {sc.sopCorrection}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OFFICIAL REPORT PRINTABLE VIEW */}
          {activeTab === 'report' && (
            <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-10 space-y-8 shadow-2xl print:p-0 print:shadow-none print:rounded-none">
              {/* Kop Surat Resmi */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border-2 border-slate-900 p-1 flex items-center justify-center shrink-0">
                    <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }} />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-900">
                      Laboratorium Fiber Optik & Uji Kompetensi
                    </h2>
                    <h3 className="text-sm font-bold text-slate-700">
                      SMK INDUSTRI TELKOM • PUSAT PELATIHAN SPLICING FTTH
                    </h3>
                    <p className="text-xs text-slate-500">
                      Standar Prosedur Operasional Telkom Akses / ITU-T G.652.D / IEC 60794
                    </p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-mono font-bold text-slate-500">DOKUMEN RESMI</div>
                  <div className="text-sm font-black text-slate-900">REKAPITULASI PELATIHAN</div>
                  <div className="text-xs text-slate-500">Tercetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
              </div>

              {/* Ringkasan Profil Teknisi & Analitik */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-100 rounded-xl border border-slate-300 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block">Total Sesi Latihan</span>
                  <span className="text-lg font-black text-slate-900">{analytics.totalSessions} Sesi</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Rata-rata Skor Akurasi</span>
                  <span className="text-lg font-black text-slate-900">{analytics.averageScore} / 100</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Rata-rata Redaman (Loss)</span>
                  <span className="text-lg font-black text-slate-900">{analytics.averageLoss} dB</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Tingkat Kelulusan SOP</span>
                  <span className="text-lg font-black text-emerald-700">{analytics.passRatePercentage}% Lulus</span>
                </div>
              </div>

              {/* Tabel Riwayat Sesi Pelatihan */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3 border-l-4 border-blue-600 pl-2 uppercase">
                  Log Sesi Pelatihan, Skor Akurasi, Waktu, dan Skenario yang Dihadapi
                </h4>
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-200 text-slate-800 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-2.5 border-b border-slate-300">No</th>
                        <th className="p-2.5 border-b border-slate-300">Tanggal / Waktu</th>
                        <th className="p-2.5 border-b border-slate-300">Nama Teknisi</th>
                        <th className="p-2.5 border-b border-slate-300">Mode</th>
                        <th className="p-2.5 border-b border-slate-300 text-center">Waktu Dihabiskan</th>
                        <th className="p-2.5 border-b border-slate-300 text-center">Loss (dB)</th>
                        <th className="p-2.5 border-b border-slate-300 text-center">Skor Akurasi</th>
                        <th className="p-2.5 border-b border-slate-300 text-center">Grade</th>
                        <th className="p-2.5 border-b border-slate-300">Skenario Kesalahan Dihadapi</th>
                        <th className="p-2.5 border-b border-slate-300 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {sessions.map((s, idx) => (
                        <tr key={s.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                          <td className="p-2.5 font-bold">{idx + 1}</td>
                          <td className="p-2.5 text-slate-600">{s.dateFormatted} {s.timeFormatted}</td>
                          <td className="p-2.5 font-bold text-slate-900">{s.traineeName}</td>
                          <td className="p-2.5 uppercase font-mono text-[10px]">{s.mode}</td>
                          <td className="p-2.5 text-center font-mono font-bold text-slate-800">{s.durationFormatted}</td>
                          <td className="p-2.5 text-center font-mono">{s.estimatedLoss.toFixed(3)}</td>
                          <td className="p-2.5 text-center font-black text-slate-900">{s.accuracyScore}</td>
                          <td className="p-2.5 text-center font-black">{s.grade}</td>
                          <td className="p-2.5 text-slate-700 text-[11px]">
                            {s.scenariosFaced.map(sc => sc.name).join(', ')}
                          </td>
                          <td className="p-2.5 text-center font-bold">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${s.telkomCompliant ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {s.telkomCompliant ? 'LULUS' : 'RE-EXAM'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tanda Tangan & Verifikasi Instruktur */}
              <div className="pt-6 border-t border-slate-300 flex items-center justify-between gap-8 text-xs text-slate-700">
                <div>
                  <p className="font-semibold text-slate-900">Catatan Asesor Kompetensi:</p>
                  <p className="text-slate-500 mt-1 max-w-md">
                    Rekapitulasi ini dihasilkan secara otomatis oleh Simulator Fiber Optik OptiSim berdasarkan data real-time parameter fusi, alignment, dan sensor uji tarik.
                  </p>
                </div>

                <div className="text-center w-56">
                  <p className="text-slate-500 mb-12">Instruktur / Penguji Utama,</p>
                  <div className="border-b border-slate-900 w-full mb-1"></div>
                  <p className="font-bold text-slate-900">Ir. Bambang S., S.T., M.T.</p>
                  <p className="text-[10px] text-slate-500">NIP / Sertifikasi Asesor Telkom</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
