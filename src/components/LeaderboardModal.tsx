import React, { useState, useEffect, useMemo } from 'react';
import { LeaderboardEntry, TechnicianState } from '../types/fiber';
import { 
  getLeaderboardEntries, 
  saveLeaderboardEntry, 
  deleteLeaderboardEntry, 
  resetLeaderboard, 
  exportLeaderboardToCSV,
  createLeaderboardEntryFromState,
  formatDuration,
  formatDurationLong,
  getSpeedRating
} from '../utils/leaderboard';
import { soundEffects } from '../utils/audio';
import { 
  Trophy, 
  X, 
  Search, 
  Filter, 
  Download, 
  RotateCcw, 
  PlusCircle, 
  Medal, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Building, 
  Trash2, 
  Eye, 
  Sparkles,
  Zap,
  ArrowUpDown,
  Clock,
  Timer
} from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState?: TechnicianState;
  onRefreshCurrent?: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentState,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [modeFilter, setModeFilter] = useState<'all' | 'exam' | 'training' | 'timetrial'>('all');
  const [fiberFilter, setFiberFilter] = useState<'all' | 'G652D_SM' | 'G657A_FTTH' | 'OM3_MM'>('all');
  const [complianceFilter, setComplianceFilter] = useState<'all' | 'compliant_only'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'loss' | 'fastest' | 'recent'>('score');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [justSavedId, setJustSavedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    const list = getLeaderboardEntries();
    setEntries(list);
  };

  const handleSaveCurrentSession = () => {
    if (!currentState) return;
    soundEffects.playSuccessBeep();
    const newEntry = createLeaderboardEntryFromState(currentState);
    saveLeaderboardEntry(newEntry);
    setJustSavedId(newEntry.id);
    loadData();
    setTimeout(() => setJustSavedId(null), 4000);
  };

  const handleDelete = (id: string, name: string) => {
    soundEffects.playClick();
    if (confirm(`Hapus catatan hasil splicing untuk teknisi "${name}" dari leaderboard?`)) {
      const updated = deleteLeaderboardEntry(id);
      setEntries(updated);
    }
  };

  const handleResetData = () => {
    soundEffects.playClick();
    if (confirm('Kembalikan data leaderboard ke daftar teknisi standar awal?')) {
      const reset = resetLeaderboard();
      setEntries(reset);
    }
  };

  const handleExportCSV = () => {
    soundEffects.playClick();
    exportLeaderboardToCSV(filteredAndSortedEntries);
  };

  // Filter and sort entries
  const filteredAndSortedEntries = useMemo(() => {
    let result = [...entries];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.traineeName.toLowerCase().includes(q) ||
          e.traineeId.toLowerCase().includes(q) ||
          e.companyOrInstitution.toLowerCase().includes(q)
      );
    }

    // Mode filter
    if (modeFilter !== 'all') {
      result = result.filter((e) => e.mode === modeFilter);
    }

    // Fiber filter
    if (fiberFilter !== 'all') {
      result = result.filter((e) => e.fiberType === fiberFilter);
    }

    // Compliance filter
    if (complianceFilter === 'compliant_only') {
      result = result.filter((e) => e.telkomCompliant);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'fastest') {
        // Lowest duration first, then highest score
        const durA = a.durationSeconds || 9999;
        const durB = b.durationSeconds || 9999;
        if (durA !== durB) return durA - durB;
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return a.spliceLoss - b.spliceLoss;
      }
      if (sortBy === 'score') {
        // High score first, then lowest loss, then fastest
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        if (a.spliceLoss !== b.spliceLoss) return a.spliceLoss - b.spliceLoss;
        return (a.durationSeconds || 9999) - (b.durationSeconds || 9999);
      }
      if (sortBy === 'loss') {
        // Lowest loss first (loss in dB, 0.01 is better than 0.05), then highest score
        if (a.spliceLoss !== b.spliceLoss) return a.spliceLoss - b.spliceLoss;
        return b.totalScore - a.totalScore;
      }
      // Recent first
      return b.timestamp - a.timestamp;
    });

    return result;
  }, [entries, searchQuery, modeFilter, fiberFilter, complianceFilter, sortBy]);

  // Overall Statistics
  const stats = useMemo(() => {
    if (entries.length === 0) {
      return { total: 0, avgLoss: 0, complianceRate: 0, bestLoss: 0, fastestTime: 0, avgTime: 0 };
    }
    const total = entries.length;
    const avgLoss = entries.reduce((acc, curr) => acc + curr.spliceLoss, 0) / total;
    const compliantCount = entries.filter((e) => e.telkomCompliant).length;
    const complianceRate = Math.round((compliantCount / total) * 100);
    const bestLoss = Math.min(...entries.map((e) => e.spliceLoss));
    const validDurations = entries.map((e) => e.durationSeconds || 120);
    const fastestTime = Math.min(...validDurations);
    const avgTime = Math.round(validDurations.reduce((acc, curr) => acc + curr, 0) / total);

    return { total, avgLoss, complianceRate, bestLoss, fastestTime, avgTime };
  }, [entries]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto relative">
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-900/30 border border-amber-300/40">
              <Trophy className="w-6 h-6 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  Leaderboard Teknisi Splicing
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {entries.length} Teknisi Terdaftar
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Peringkat &amp; komparasi kualitas sambungan serat optik berstandar Telkom &amp; ITU-T
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentState && (
              <button
                type="button"
                onClick={handleSaveCurrentSession}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-emerald-900/30 cursor-pointer"
                title="Simpan skor teknisi yang sedang aktif ke daftar peringkat"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Simpan Hasil Saya</span>
              </button>
            )}

            <button
              onClick={() => {
                soundEffects.playClick();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Just Saved Notification Banner */}
        {justSavedId && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-6 py-2.5 text-xs text-emerald-300 flex items-center justify-between shrink-0 animate-in fade-in">
            <span className="flex items-center gap-2 font-medium">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Hasil sambungan Anda telah berhasil dicatat ke Leaderboard!
            </span>
            <span className="font-mono text-[10px] text-emerald-400 font-bold">TERVERIFIKASI</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* 4 Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Teknisi
              </span>
              <p className="text-xl font-mono font-black text-white mt-1">{stats.total}</p>
              <span className="text-[10px] text-slate-500">Regional &amp; OSP Mitra</span>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block flex items-center justify-between">
                <span>Rekor Waktu Tercepat</span>
                <span className="text-amber-400 font-bold text-[9px] bg-amber-500/10 px-1.5 py-0.2 rounded">TIME-TRIAL</span>
              </span>
              <p className="text-xl font-mono font-black text-amber-400 mt-1 flex items-center gap-1.5">
                <Timer className="w-5 h-5 text-amber-400 shrink-0" />
                {formatDuration(stats.fastestTime)}
              </p>
              <span className="text-[10px] text-slate-500">Rata-rata: {formatDuration(stats.avgTime)}</span>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Rata-rata Redaman (Loss)
              </span>
              <p className="text-xl font-mono font-black text-blue-400 mt-1">
                {stats.avgLoss.toFixed(2)} dB
              </p>
              <span className="text-[10px] text-slate-500">Rekor Terbaik: {stats.bestLoss.toFixed(2)} dB</span>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Kelulusan Standar Telkom
              </span>
              <p className="text-xl font-mono font-black text-emerald-400 mt-1">
                {stats.complianceRate}%
              </p>
              <span className="text-[10px] text-slate-500">Lulus Uji SOP Transmisi</span>
            </div>
          </div>

          {/* Top 3 Podium Cards */}
          {filteredAndSortedEntries.length >= 3 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Medal className="w-4 h-4 text-amber-400" />
                Podium Teknisi Unggulan (Top 3)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 2nd Place */}
                <div className="order-2 md:order-1 bg-gradient-to-b from-slate-800/80 to-slate-900 rounded-2xl border border-slate-700/70 p-4 relative flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div className="w-8 h-8 rounded-full bg-slate-300/20 border border-slate-300/40 text-slate-200 flex items-center justify-center font-black text-sm">
                      2
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                        <Timer className="w-3 h-3 text-amber-400" />
                        {formatDuration(filteredAndSortedEntries[1].durationSeconds || 120)}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                        {filteredAndSortedEntries[1].spliceLoss.toFixed(2)} dB
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <h4 className="font-bold text-sm text-white truncate">
                      {filteredAndSortedEntries[1].traineeName}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                      <Building className="w-3 h-3 text-slate-500 shrink-0" />
                      {filteredAndSortedEntries[1].companyOrInstitution}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-300 font-bold">
                      Skor: {filteredAndSortedEntries[1].totalScore}%
                    </span>
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      Grade {filteredAndSortedEntries[1].grade}
                    </span>
                  </div>
                </div>

                {/* 1st Place (Gold Champion) */}
                <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/15 via-slate-900 to-slate-900 rounded-2xl border-2 border-amber-500/50 p-4.5 relative flex flex-col justify-between shadow-xl shadow-amber-950/20">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[10px] font-black uppercase px-3 py-0.5 rounded-full shadow-md">
                    Juara 1 • Splicer Terbaik
                  </div>
                  <div className="flex items-start justify-between pt-1">
                    <div className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-base shadow-md shadow-amber-500/30">
                      1
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5 text-amber-400" />
                        {formatDuration(filteredAndSortedEntries[0].durationSeconds || 120)}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-200 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-lg">
                        {filteredAndSortedEntries[0].spliceLoss.toFixed(2)} dB
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <h4 className="font-bold text-base text-white truncate">
                      {filteredAndSortedEntries[0].traineeName}
                    </h4>
                    <p className="text-[11px] text-slate-300 truncate flex items-center gap-1 mt-0.5">
                      <Building className="w-3 h-3 text-amber-400 shrink-0" />
                      {filteredAndSortedEntries[0].companyOrInstitution}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-emerald-400 font-bold">
                      Skor: {filteredAndSortedEntries[0].totalScore}%
                    </span>
                    <span className="px-2.5 py-0.5 rounded font-black text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Grade {filteredAndSortedEntries[0].grade}
                    </span>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="order-3 md:order-3 bg-gradient-to-b from-slate-800/60 to-slate-900 rounded-2xl border border-amber-800/40 p-4 relative flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div className="w-8 h-8 rounded-full bg-amber-700/30 border border-amber-700/50 text-amber-400 flex items-center justify-center font-black text-sm">
                      3
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                        <Timer className="w-3 h-3 text-amber-400" />
                        {formatDuration(filteredAndSortedEntries[2].durationSeconds || 120)}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-amber-400/90 bg-slate-800 px-2 py-0.5 rounded">
                        {filteredAndSortedEntries[2].spliceLoss.toFixed(2)} dB
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <h4 className="font-bold text-sm text-white truncate">
                      {filteredAndSortedEntries[2].traineeName}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                      <Building className="w-3 h-3 text-slate-500 shrink-0" />
                      {filteredAndSortedEntries[2].companyOrInstitution}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-300 font-bold">
                      Skor: {filteredAndSortedEntries[2].totalScore}%
                    </span>
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      Grade {filteredAndSortedEntries[2].grade}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters and Search Toolbar */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col lg:flex-row gap-3 items-center justify-between flex-wrap">
            {/* Search */}
            <div className="relative w-full lg:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari teknisi, ID, atau instansi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Filter selectors */}
            <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
              {/* Mode */}
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">Semua Mode</option>
                <option value="timetrial">⚡ Time-Trial Mode</option>
                <option value="exam">Mode Ujian (Exam)</option>
                <option value="training">Mode Latihan</option>
              </select>

              {/* Fiber Type */}
              <select
                value={fiberFilter}
                onChange={(e) => setFiberFilter(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">Semua Fiber</option>
                <option value="G652D_SM">G.652.D Single Mode</option>
                <option value="G657A_FTTH">G.657.A2 FTTH</option>
                <option value="OM3_MM">OM3 Multi Mode</option>
              </select>

              {/* Sort */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-400">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="score" className="bg-slate-900">Skor Tertinggi</option>
                  <option value="fastest" className="bg-slate-900">⚡ Tercepat (Durasi Pengerjaan)</option>
                  <option value="loss" className="bg-slate-900">Redaman Terbaik (Loss)</option>
                  <option value="recent" className="bg-slate-900">Terbaru</option>
                </select>
              </div>

              {/* CSV Export & Reset Actions */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Ekspor daftar leaderboard ke format CSV"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>

              <button
                type="button"
                onClick={handleResetData}
                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors cursor-pointer"
                title="Reset ke data awal"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Leaderboard Table List */}
          <div className="bg-slate-950/60 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-3.5 text-center w-14">Rank</th>
                    <th className="py-3 px-3.5">Teknisi &amp; Instansi</th>
                    <th className="py-3 px-3.5">Fiber &amp; Mode</th>
                    <th className="py-3 px-3.5 text-center">Durasi Pengerjaan</th>
                    <th className="py-3 px-3.5 text-center">Loss Sambungan</th>
                    <th className="py-3 px-3.5 text-center">Skor Akurasi</th>
                    <th className="py-3 px-3.5 text-center">Standar Telkom</th>
                    <th className="py-3 px-3.5 text-right w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredAndSortedEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                        Tidak ada data teknisi yang sesuai dengan kriteria pencarian / filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedEntries.map((entry, index) => {
                      const isExpanded = expandedId === entry.id;
                      const speedRating = getSpeedRating(entry.durationSeconds || 120);

                      return (
                        <React.Fragment key={entry.id}>
                          <tr
                            className={`hover:bg-slate-900/50 transition-colors ${
                              isExpanded ? 'bg-slate-900/80' : ''
                            }`}
                          >
                            {/* Rank */}
                            <td className="py-3.5 px-3.5 text-center">
                              {index === 0 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs shadow-sm">
                                  1
                                </span>
                              ) : index === 1 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-bold text-xs shadow-sm">
                                  2
                                </span>
                              ) : index === 2 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white font-bold text-xs shadow-sm">
                                  3
                                </span>
                              ) : (
                                <span className="font-mono text-slate-400 font-medium">
                                  #{index + 1}
                                </span>
                              )}
                            </td>

                            {/* Name & Org */}
                            <td className="py-3.5 px-3.5">
                              <div className="flex flex-col">
                                <span className="font-bold text-white text-xs sm:text-sm">
                                  {entry.traineeName}
                                </span>
                                <span className="text-[11px] text-slate-400 truncate max-w-[220px]">
                                  {entry.companyOrInstitution}
                                </span>
                                <span className="text-[9px] font-mono text-slate-500 mt-0.5">
                                  ID: {entry.traineeId}
                                </span>
                              </div>
                            </td>

                            {/* Fiber Type & Mode */}
                            <td className="py-3.5 px-3.5">
                              <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-semibold text-slate-300">
                                  {entry.fiberType === 'G652D_SM'
                                    ? 'G.652.D Single Mode'
                                    : entry.fiberType === 'G657A_FTTH'
                                    ? 'G.657.A2 FTTH'
                                    : 'OM3 Multi Mode'}
                                </span>
                                <span
                                  className={`inline-block w-fit px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                    entry.mode === 'timetrial' || entry.isTimeTrial
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                                      : entry.mode === 'exam'
                                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                      : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                                  }`}
                                >
                                  {entry.mode === 'timetrial' || entry.isTimeTrial
                                    ? '⚡ Time-Trial'
                                    : entry.mode === 'exam'
                                    ? 'Ujian'
                                    : 'Latihan'}
                                </span>
                              </div>
                            </td>

                            {/* Durasi Pengerjaan */}
                            <td className="py-3.5 px-3.5 text-center">
                              <div className="inline-flex flex-col items-center">
                                <span className="font-mono font-bold text-xs text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                                  <Timer className="w-3 h-3 text-amber-400" />
                                  {formatDuration(entry.durationSeconds || 120)}
                                </span>
                                <span className={`text-[9px] mt-0.5 font-bold ${speedRating.color}`}>
                                  {speedRating.label}
                                </span>
                              </div>
                            </td>

                            {/* Splice Loss */}
                            <td className="py-3.5 px-3.5 text-center">
                              <div className="inline-flex flex-col items-center">
                                <span
                                  className={`font-mono font-bold text-sm ${
                                    entry.spliceLoss <= 0.03
                                      ? 'text-emerald-400'
                                      : entry.spliceLoss <= 0.05
                                      ? 'text-blue-400'
                                      : 'text-rose-400'
                                  }`}
                                >
                                  {entry.spliceLoss.toFixed(2)} dB
                                </span>
                                <span className="text-[9px] text-slate-500">
                                  {entry.spliceLoss <= 0.03 ? 'Sangat Baik' : entry.spliceLoss <= 0.05 ? 'Standar' : 'Melebihi Batas'}
                                </span>
                              </div>
                            </td>

                            {/* Total Score & Grade */}
                            <td className="py-3.5 px-3.5 text-center">
                              <div className="inline-flex items-center gap-2">
                                <span className="font-mono font-bold text-white text-xs">
                                  {entry.totalScore}%
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    entry.grade === 'A+' || entry.grade === 'A'
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : entry.grade === 'B'
                                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  }`}
                                >
                                  {entry.grade}
                                </span>
                              </div>
                            </td>

                            {/* Compliance Status */}
                            <td className="py-3.5 px-3.5 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  entry.telkomCompliant
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                                }`}
                              >
                                {entry.telkomCompliant ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3" /> Lulus
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="w-3 h-3" /> Re-evaluasi
                                  </>
                                )}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                                  className={`p-1.5 rounded-lg border text-xs transition-colors ${
                                    isExpanded
                                      ? 'bg-blue-600 text-white border-blue-500'
                                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                                  }`}
                                  title="Lihat rincian nilai teknisi"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(entry.id, entry.traineeName)}
                                  className="p-1.5 rounded-lg border border-slate-800 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors"
                                  title="Hapus rekaman ini"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Detailed Sub-score Breakdown Drawer */}
                          {isExpanded && (
                            <tr className="bg-slate-900/90">
                              <td colSpan={8} className="p-4 sm:p-5">
                                <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3">
                                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                                      Rincian Uji 5 Tahap &amp; Waktu: {entry.traineeName} ({entry.traineeId})
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500">
                                      {new Date(entry.timestamp).toLocaleString('id-ID')}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
                                    {/* 1. Stripping */}
                                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                                      <p className="text-[9px] text-slate-400 uppercase font-semibold">
                                        Stripping (Kupas)
                                      </p>
                                      <p className="text-base font-mono font-bold text-white mt-0.5">
                                        {entry.strippingScore}%
                                      </p>
                                      <span className="text-[9px] text-slate-500">Panjang 30-35mm</span>
                                    </div>

                                    {/* 2. Cleaning */}
                                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                                      <p className="text-[9px] text-slate-400 uppercase font-semibold">
                                        Cleaning (IPA 99%)
                                      </p>
                                      <p className="text-base font-mono font-bold text-white mt-0.5">
                                        {entry.cleaningScore}%
                                      </p>
                                      <span className="text-[9px] text-slate-500">Bebas Partikel Debu</span>
                                    </div>

                                    {/* 3. Cleaving */}
                                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                                      <p className="text-[9px] text-slate-400 uppercase font-semibold">
                                        Cleaving Angle
                                      </p>
                                      <p className="text-base font-mono font-bold text-blue-400 mt-0.5">
                                        {entry.cleaveAngleLeft.toFixed(1)}° / {entry.cleaveAngleRight.toFixed(1)}°
                                      </p>
                                      <span className="text-[9px] text-slate-500">Batas Max &lt; 0.8°</span>
                                    </div>

                                    {/* 4. Splicing Loss */}
                                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                                      <p className="text-[9px] text-slate-400 uppercase font-semibold">
                                        Splice Arc Loss
                                      </p>
                                      <p className="text-base font-mono font-bold text-emerald-400 mt-0.5">
                                        {entry.spliceLoss.toFixed(2)} dB
                                      </p>
                                      <span className="text-[9px] text-slate-500">Max 0.05 dB</span>
                                    </div>

                                    {/* 5. Heat Shrink */}
                                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                                      <p className="text-[9px] text-slate-400 uppercase font-semibold">
                                        Sleeve &amp; Oven
                                      </p>
                                      <p className="text-base font-mono font-bold text-white mt-0.5">
                                        {entry.heatingScore}%
                                      </p>
                                      <span className="text-[9px] text-slate-500">Proof Test 2.2N</span>
                                    </div>

                                    {/* 6. Total Duration */}
                                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-amber-500/30">
                                      <p className="text-[9px] text-amber-400 uppercase font-semibold flex items-center gap-1">
                                        <Timer className="w-2.5 h-2.5" />
                                        Total Durasi
                                      </p>
                                      <p className="text-base font-mono font-bold text-amber-300 mt-0.5">
                                        {formatDuration(entry.durationSeconds || 120)}
                                      </p>
                                      <span className={`text-[9px] font-bold ${speedRating.color}`}>
                                        {speedRating.label} ({entry.durationSeconds || 120}s)
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between flex-wrap gap-3 shrink-0 text-xs">
          <div className="text-slate-400 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>
              Standar Evaluasi: <strong className="text-slate-200">ITU-T G.652.D &amp; SOP Telkom Akses</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {currentState && (
              <button
                type="button"
                onClick={handleSaveCurrentSession}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-900/30"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Simpan Skor Aktif ({currentState.traineeName})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                onClose();
              }}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-colors cursor-pointer border border-slate-700"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
