import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Award,
  Zap,
  RotateCcw,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Sliders,
  Maximize2
} from 'lucide-react';
import { TechnicianState } from '../types/fiber';
import { FIBER_SPECS } from '../utils/standards';
import { soundEffects } from '../utils/audio';
import {
  getTechnicianPerformanceHistory,
  recordCompletedSession,
  resetTechnicianHistory,
  PerformanceSessionRecord,
} from '../utils/performanceHistory';

interface SplicePerformanceTrendChartProps {
  state: TechnicianState;
  onRefreshEvaluation?: () => void;
}

type MetricView = 'accuracy' | 'loss' | 'radar' | 'breakdown';

export const SplicePerformanceTrendChart: React.FC<SplicePerformanceTrendChartProps> = ({
  state,
  onRefreshEvaluation,
}) => {
  const [activeTab, setActiveTab] = useState<MetricView>('accuracy');
  const [historyVersion, setHistoryVersion] = useState<number>(0);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const spec = FIBER_SPECS[state.fiberType];

  // Retrieve history data including current session
  const historyData = useMemo(() => {
    return getTechnicianPerformanceHistory(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, historyVersion]);

  // Current session & baseline session
  const currentRecord = historyData[historyData.length - 1];
  const firstRecord = historyData[0];

  // Calculated Deltas
  const scoreDelta = currentRecord && firstRecord ? currentRecord.totalScore - firstRecord.totalScore : 0;
  const lossDelta = currentRecord && firstRecord ? Number((firstRecord.spliceLoss - currentRecord.spliceLoss).toFixed(3)) : 0;
  const avgCleaveImprovement = currentRecord && firstRecord
    ? Number((firstRecord.cleaveAngle - currentRecord.cleaveAngle).toFixed(2))
    : 0;

  // 5-Pillars radar / comparison data
  const radarData = useMemo(() => {
    if (!firstRecord || !currentRecord) return [];
    return [
      {
        subject: 'Stripping (Kupas)',
        baseline: firstRecord.strippingScore,
        current: currentRecord.strippingScore,
        target: 95,
        fullMark: 100,
      },
      {
        subject: 'Cleaning (IPA 99%)',
        baseline: firstRecord.cleaningScore,
        current: currentRecord.cleaningScore,
        target: 95,
        fullMark: 100,
      },
      {
        subject: 'Cleaving (Presisi Sudut)',
        baseline: firstRecord.cleavingScore,
        current: currentRecord.cleavingScore,
        target: 95,
        fullMark: 100,
      },
      {
        subject: 'Splicing (Loss < 0.05dB)',
        baseline: firstRecord.splicingScore,
        current: currentRecord.splicingScore,
        target: 95,
        fullMark: 100,
      },
      {
        subject: 'Heat Shrink (Proteksi)',
        baseline: firstRecord.heatingScore,
        current: currentRecord.heatingScore,
        target: 95,
        fullMark: 100,
      },
    ];
  }, [firstRecord, currentRecord]);

  const handleSaveToPermanentHistory = () => {
    soundEffects.playClick();
    recordCompletedSession(state);
    setHistoryVersion((v) => v + 1);
    setSaveSuccessMsg('Sesi uji berhasil ditambahkan ke riwayat historis permanen!');
    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 3500);
  };

  const handleResetHistory = () => {
    soundEffects.playClick();
    if (window.confirm('Reset riwayat evaluasi teknisi ke data baseline awal?')) {
      resetTechnicianHistory(state.traineeId);
      setHistoryVersion((v) => v + 1);
    }
  };

  return (
    <div
      id="splice-performance-trend-container"
      className="bg-slate-900/95 rounded-3xl border border-slate-800 p-5 sm:p-7 shadow-2xl space-y-6 print:hidden relative overflow-hidden"
    >
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  Tren Akurasi & Evaluasi Kinerja Historis (Recharts)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold font-mono">
                  LIVE ANALYTICS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Visualisasi kurva pembelajaran teknisi <span className="text-blue-400 font-bold">{state.traineeName}</span> ({state.traineeId}) sepanjang sesi pengujian.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
          {saveSuccessMsg && (
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-3 py-1.5 rounded-xl animate-fade-in flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {saveSuccessMsg}
            </span>
          )}
          <button
            onClick={handleSaveToPermanentHistory}
            className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:border-blue-400"
            title="Catat sesi pengerjaan saat ini sebagai riwayat pengujian baru"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Simpan Sesi ke Riwayat
          </button>
          <button
            onClick={handleResetHistory}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl border border-slate-700/80 text-xs transition-colors cursor-pointer"
            title="Reset riwayat ke baseline awal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Performance Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Score Progress */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Peningkatan Akurasi</span>
            {scoreDelta >= 0 ? (
              <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                <TrendingUp className="w-3.5 h-3.5" /> +{scoreDelta}%
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-0.5 font-bold">
                <TrendingDown className="w-3.5 h-3.5" /> {scoreDelta}%
              </span>
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-white">
              {currentRecord?.totalScore}%
            </span>
            <span className="text-xs text-slate-500">dari baseline {firstRecord?.totalScore}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${currentRecord?.totalScore}%` }}
            ></div>
          </div>
        </div>

        {/* Splice Loss Progress */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Redaman Terkini (Loss)</span>
            {lossDelta > 0 ? (
              <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                <TrendingDown className="w-3.5 h-3.5" /> -{lossDelta} dB
              </span>
            ) : (
              <span className="text-blue-400 font-bold">Presisi</span>
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-emerald-400">
              {currentRecord?.spliceLoss.toFixed(2)} dB
            </span>
            <span className="text-xs text-slate-500">Tol. {spec.maxAllowedLoss}dB</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {currentRecord?.spliceLoss <= 0.03 ? '🌟 Golden Standard Telkom' : '✓ Memenuhi Standar ITU-T'}
          </p>
        </div>

        {/* Cleave Angle Precision */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Sudut Potong (Cleave)</span>
            <span className="text-blue-400 font-mono font-bold">
              {currentRecord?.cleaveAngle.toFixed(1)}°
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-white">
              {currentRecord?.cleaveAngle <= 0.5 ? '< 0.5°' : `${currentRecord?.cleaveAngle}°`}
            </span>
            <span className="text-xs text-slate-500">Max 1.0°</span>
          </div>
          <p className="text-[10px] text-emerald-400 mt-1">
            {avgCleaveImprovement > 0 ? `Tereduksi ${avgCleaveImprovement}° lebih tegak lurus` : 'Presisi sudut stabil'}
          </p>
        </div>

        {/* Total Sessions Tracked */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Sesi Terdata</span>
            <span className="text-purple-400 font-bold font-mono">
              #{historyData.length}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-purple-300">
              {historyData.length} Sesi
            </span>
            <span className="text-xs text-emerald-400 font-semibold">
              {historyData.filter((h) => h.telkomCompliant).length} Lulus
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Penyimpanan lokal tersinkronisasi
          </p>
        </div>
      </div>

      {/* Chart Navigation Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('accuracy');
            }}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'accuracy'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Tren Skor Akurasi (%)
          </button>
          <button
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('loss');
            }}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'loss'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Tren Redaman Loss (dB)
          </button>
          <button
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('radar');
            }}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'radar'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Radar 5 Pilar Kompetensi
          </button>
          <button
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('breakdown');
            }}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'breakdown'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Komparasi Sub-Tahap (Bar)
          </button>
        </div>

        {/* Legend / Status Hint */}
        <div className="text-[11px] text-slate-400 flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            Data Historis
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            Sesi Terkini ({currentRecord?.sessionLabel})
          </span>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="bg-slate-950/80 rounded-2xl border border-slate-800/90 p-4 sm:p-5">
        {/* Tab 1: AreaChart Skor Akurasi */}
        {activeTab === 'accuracy' && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Kurva Progres Skor Akurasi Keseluruhan (0 - 100%)</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Ambang batas kelulusan standar Telkom Akses adalah 80% (Standar Industri) & 90% (Grade A).
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950/60 px-2.5 py-1 rounded border border-blue-800/50">
                Target: ≥ 85%
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={historyData}
                  margin={{ top: 15, right: 25, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis
                    dataKey="sessionLabel"
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <YAxis
                    domain={[40, 100]}
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    unit="%"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                    }}
                    formatter={(value: any, name: any) => {
                      if (name === 'totalScore') return [`${value}%`, 'Skor Total'];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Detail: ${label}`}
                  />
                  <ReferenceLine
                    y={85}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Target Telkom (85%)',
                      fill: '#10b981',
                      fontSize: 11,
                      position: 'top',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalScore"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#accuracyGradient)"
                    activeDot={{ r: 6, fill: '#60a5fa', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 2: LineChart Splice Loss (dB) */}
        {activeTab === 'loss' && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Kurva Reduksi Redaman Sambungan (Splice Loss dalam dB)</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Semakin rendah kurva, semakin sempurna hasil fusi core kaca. Standar Telkom {spec.standardAuthority}: ≤ {spec.maxAllowedLoss} dB.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800/50">
                Max Loss: {spec.maxAllowedLoss} dB
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={historyData}
                  margin={{ top: 15, right: 25, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis
                    dataKey="sessionLabel"
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <YAxis
                    domain={[0, 0.15]}
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    unit=" dB"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [`${value} dB`, 'Redaman Sambungan']}
                  />
                  <ReferenceLine
                    y={spec.maxAllowedLoss}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    label={{
                      value: `Batas Maks (${spec.maxAllowedLoss} dB)`,
                      fill: '#f43f5e',
                      fontSize: 11,
                      position: 'top',
                    }}
                  />
                  <ReferenceLine
                    y={0.02}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    label={{
                      value: 'Ultra Low Loss (0.02 dB)',
                      fill: '#10b981',
                      fontSize: 11,
                      position: 'bottom',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="spliceLoss"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#10b981' }}
                    activeDot={{ r: 7, fill: '#34d399', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 3: RadarChart 5 Pilar */}
        {activeTab === 'radar' && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Radar Analisis Penguasaan 5 Pilar Splicing
                </h4>
                <p className="text-[11px] text-slate-400">
                  Perbandingan performa antara Sesi Awal (Baseline) vs Sesi Saat Ini vs Target Telkom Akses.
                </p>
              </div>
            </div>

            <div className="h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 9 }} />
                  <Radar
                    name="Sesi Baseline Awal"
                    dataKey="baseline"
                    stroke="#64748b"
                    fill="#64748b"
                    fillOpacity={0.2}
                  />
                  <Radar
                    name="Sesi Saat Ini"
                    dataKey="current"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.45}
                  />
                  <Radar
                    name="Target Telkom (95%)"
                    dataKey="target"
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    fill="none"
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 4: BarChart Sub-Tahapan */}
        {activeTab === 'breakdown' && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Komparasi Nilai 5 Sub-Tahap Sepanjang Sesi
                </h4>
                <p className="text-[11px] text-slate-400">
                  Analisis konsistensi skor stripping, cleaning, cleaving, loss, dan proteksi panas per sesi pengerjaan.
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={historyData}
                  margin={{ top: 15, right: 25, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="sessionLabel" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="strippingScore" name="Stripping" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cleaningScore" name="Cleaning" fill="#818cf8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cleavingScore" name="Cleaving" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="splicingScore" name="Splicing" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="heatingScore" name="Heating" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Historical Data Table / Log Summary */}
      <div className="bg-slate-950/60 rounded-2xl border border-slate-800/80 p-4 overflow-x-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            Tabel Rekapitulasi Data Sesi Pengujian
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            ID: {state.traineeId} • Kabel: {spec.name}
          </span>
        </div>
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="text-slate-400 border-b border-slate-800 text-[11px]">
              <th className="py-2 px-2.5">Sesi / Tanggal</th>
              <th className="py-2 px-2.5">Skor Total</th>
              <th className="py-2 px-2.5">Loss (dB)</th>
              <th className="py-2 px-2.5">Sudut Cleave</th>
              <th className="py-2 px-2.5">Waktu</th>
              <th className="py-2 px-2.5">Grade</th>
              <th className="py-2 px-2.5 text-right">Status Regulasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {historyData.map((session, idx) => (
              <tr
                key={session.id || idx}
                className={`hover:bg-slate-900/50 transition-colors ${
                  session.isCurrent ? 'bg-blue-500/10 font-bold' : ''
                }`}
              >
                <td className="py-2.5 px-2.5 flex items-center gap-2">
                  {session.isCurrent && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  )}
                  <span>{session.sessionLabel}</span>
                  <span className="text-[10px] text-slate-500 font-sans">({session.dateStr})</span>
                </td>
                <td className="py-2.5 px-2.5">
                  <span
                    className={
                      session.totalScore >= 85
                        ? 'text-emerald-400 font-bold'
                        : session.totalScore >= 70
                        ? 'text-blue-400'
                        : 'text-amber-400'
                    }
                  >
                    {session.totalScore}%
                  </span>
                </td>
                <td className="py-2.5 px-2.5">
                  <span
                    className={
                      session.spliceLoss <= 0.03
                        ? 'text-emerald-400 font-bold'
                        : session.spliceLoss <= spec.maxAllowedLoss
                        ? 'text-blue-400'
                        : 'text-rose-400 font-bold'
                    }
                  >
                    {session.spliceLoss.toFixed(2)} dB
                  </span>
                </td>
                <td className="py-2.5 px-2.5">{session.cleaveAngle.toFixed(1)}°</td>
                <td className="py-2.5 px-2.5 text-slate-400">
                  {Math.floor(session.durationSeconds / 60)}m {session.durationSeconds % 60}s
                </td>
                <td className="py-2.5 px-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      session.grade === 'A+' || session.grade === 'A'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : session.grade === 'B'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {session.grade}
                  </span>
                </td>
                <td className="py-2.5 px-2.5 text-right font-sans">
                  {session.telkomCompliant ? (
                    <span className="text-emerald-400 text-[11px] font-bold inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Lulus Telkom
                    </span>
                  ) : (
                    <span className="text-rose-400 text-[11px] font-bold inline-flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Perlu Evaluasi
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
