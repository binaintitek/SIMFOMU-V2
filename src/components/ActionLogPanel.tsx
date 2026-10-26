import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ActionLogItem, LogSeverity } from '../types/actionLog';
import { SplicingStep } from '../types/fiber';
import { soundEffects } from '../utils/audio';
import { 
  ClipboardList, 
  Search, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  ArrowDown, 
  Filter, 
  Scissors, 
  Sparkles, 
  Ruler, 
  Zap, 
  Flame, 
  FileCheck, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Radio,
  Clock,
  ChevronDown
} from 'lucide-react';

interface ActionLogPanelProps {
  logs: ActionLogItem[];
  onClearLogs?: () => void;
  className?: string;
  isCompact?: boolean;
}

const STEP_LABELS: Record<SplicingStep, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  stripping: { label: 'Stripping', icon: Scissors },
  cleaning: { label: 'Cleaning', icon: Sparkles },
  cleaving: { label: 'Cleaving', icon: Ruler },
  splicing: { label: 'Splicing', icon: Zap },
  heating: { label: 'Heating', icon: Flame },
  assessment: { label: 'Evaluasi', icon: FileCheck },
};

export const ActionLogPanel: React.FC<ActionLogPanelProps> = ({
  logs,
  onClearLogs,
  className = '',
  isCompact = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStep, setSelectedStep] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll when new logs arrive if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      if (sortOrder === 'newest') {
        scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [logs.length, autoScroll, sortOrder]);

  // Filter and sort logs
  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        if (selectedStep !== 'all' && log.step !== selectedStep) return false;
        if (selectedSeverity !== 'all' && log.severity !== selectedSeverity) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesMsg = log.message.toLowerCase().includes(q);
          const matchesDetail = log.detail?.toLowerCase().includes(q);
          const matchesBadge = log.dataBadge?.toLowerCase().includes(q);
          if (!matchesMsg && !matchesDetail && !matchesBadge) return false;
        }
        return true;
      })
      .sort((a, b) => {
        return sortOrder === 'newest' ? b.rawTime - a.rawTime : a.rawTime - b.rawTime;
      });
  }, [logs, selectedStep, selectedSeverity, searchQuery, sortOrder]);

  // Copy logs as formatted text
  const handleCopyLogs = () => {
    soundEffects.playClick();
    const formattedText = logs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.step.toUpperCase()}] ${l.message}${
            l.dataBadge ? ` (${l.dataBadge})` : ''
          }${l.detail ? ` - ${l.detail}` : ''}`
      )
      .join('\n');

    navigator.clipboard.writeText(formattedText);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  // Export logs to downloadable file
  const handleExportLogs = () => {
    soundEffects.playClick();
    const formattedText = [
      '================================================================',
      'OPTISIM FIBER PRO - LOG TINDAKAN PENYAMBUNGAN REAL-TIME',
      `Tanggal Unduh: ${new Date().toLocaleString('id-ID')}`,
      `Total Tindakan: ${logs.length}`,
      '================================================================\n',
      ...logs.map(
        (l) =>
          `[${l.timestamp}] [${l.step.toUpperCase()}] [${l.severity.toUpperCase()}] ${l.message}${
            l.dataBadge ? ` [Nilai: ${l.dataBadge}]` : ''
          }${l.detail ? `\n   Catatan: ${l.detail}` : ''}`
      ),
    ].join('\n');

    const blob = new Blob([formattedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OptiSim_Splicing_ActionLog_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getSeverityBadge = (severity: LogSeverity) => {
    switch (severity) {
      case 'success':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          border: 'border-l-emerald-500',
          dot: 'bg-emerald-400',
          icon: CheckCircle2,
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          border: 'border-l-amber-500',
          dot: 'bg-amber-400',
          icon: AlertTriangle,
        };
      case 'error':
        return {
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          border: 'border-l-rose-500',
          dot: 'bg-rose-400',
          icon: XCircle,
        };
      case 'info':
      default:
        return {
          bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          border: 'border-l-cyan-500',
          dot: 'bg-cyan-400',
          icon: Info,
        };
    }
  };

  return (
    <div className={`flex flex-col h-full bg-slate-950/90 text-slate-200 border-slate-800 ${className}`}>
      {/* Panel Header */}
      <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-900/60 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-white">Log Tindakan Real-Time</h3>
                <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Perekaman otomatis setiap tahap pengupasan, pemotongan, dan fusi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopyLogs}
              title="Salin seluruh log ke clipboard"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer text-xs flex items-center gap-1"
            >
              {copiedToast ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline text-[10px]">{copiedToast ? 'Tersalin' : 'Salin'}</span>
            </button>

            {/* Export button */}
            <button
              type="button"
              onClick={handleExportLogs}
              title="Unduh log tindakan (.txt)"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer text-xs"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Clear button */}
            {onClearLogs && (
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  onClearLogs();
                }}
                title="Bersihkan riwayat log"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari tindakan (cth: '30mm', '0.4', 'fusi')..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Chips by Step */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedStep('all')}
            className={`px-2 py-0.5 rounded-md font-semibold transition-colors shrink-0 cursor-pointer ${
              selectedStep === 'all'
                ? 'bg-cyan-600 text-white font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua ({logs.length})
          </button>
          {(['stripping', 'cleaning', 'cleaving', 'splicing', 'heating'] as SplicingStep[]).map((st) => {
            const count = logs.filter((l) => l.step === st).length;
            const Icon = STEP_LABELS[st]?.icon || Scissors;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStep(st)}
                className={`px-2 py-0.5 rounded-md font-semibold transition-colors shrink-0 flex items-center gap-1 cursor-pointer ${
                  selectedStep === st
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-2.5 h-2.5" />
                <span>{STEP_LABELS[st]?.label}</span>
                {count > 0 && <span className="text-[9px] opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Controls row: Severity filter & sorting order */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSelectedSeverity('all')}
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                selectedSeverity === 'all' ? 'text-cyan-400 font-bold underline' : 'hover:text-slate-200'
              }`}
            >
              Semua
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setSelectedSeverity('success')}
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                selectedSeverity === 'success' ? 'text-emerald-400 font-bold underline' : 'hover:text-slate-200'
              }`}
            >
              Sukses
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setSelectedSeverity('warning')}
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                selectedSeverity === 'warning' ? 'text-amber-400 font-bold underline' : 'hover:text-slate-200'
              }`}
            >
              Peringatan
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
              className="hover:text-slate-200 cursor-pointer flex items-center gap-0.5"
            >
              <span>{sortOrder === 'newest' ? 'Terbaru ↑' : 'Terlama ↓'}</span>
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setAutoScroll(!autoScroll)}
              className={`cursor-pointer ${autoScroll ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}
            >
              {autoScroll ? 'Auto-scroll On' : 'Auto-scroll Off'}
            </button>
          </div>
        </div>
      </div>

      {/* Log Feed List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 divide-y divide-slate-800/40"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-2">
            <ClipboardList className="w-8 h-8 opacity-30 text-cyan-400" />
            <p className="text-xs font-semibold">Belum ada tindakan yang sesuai filter.</p>
            <p className="text-[11px] text-slate-600 max-w-xs">
              Lakukan tindakan pada tahap pengupasan, pembersihan, pemotongan, atau fusi untuk melihat log otomatis.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const StepInfo = STEP_LABELS[log.step] || { label: log.step, icon: ClipboardList };
            const StepIcon = StepInfo.icon;
            const sev = getSeverityBadge(log.severity);
            const SevIcon = sev.icon;

            return (
              <div
                key={log.id}
                className={`pt-2.5 first:pt-0 pl-3 border-l-2 ${sev.border} bg-slate-900/40 hover:bg-slate-900/80 transition-colors p-2.5 rounded-r-xl space-y-1.5`}
              >
                {/* Meta header: Step badge, Timestamp, and Parameter DataBadge */}
                <div className="flex items-center justify-between gap-2 flex-wrap text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      <StepIcon className="w-3 h-3 text-cyan-400" />
                      <span>{StepInfo.label}</span>
                    </span>
                    <span className="font-mono text-slate-500 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {log.timestamp}
                    </span>
                  </div>

                  {log.dataBadge && (
                    <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 shadow-xs">
                      {log.dataBadge}
                    </span>
                  )}
                </div>

                {/* Primary Message */}
                <div className="text-xs font-semibold text-white flex items-start gap-1.5">
                  <SevIcon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                    log.severity === 'success'
                      ? 'text-emerald-400'
                      : log.severity === 'warning'
                      ? 'text-amber-400'
                      : log.severity === 'error'
                      ? 'text-rose-400'
                      : 'text-cyan-400'
                  }`} />
                  <span className="leading-snug">{log.message}</span>
                </div>

                {/* Detail text if available */}
                {log.detail && (
                  <p className="text-[11px] text-slate-400 leading-relaxed pl-5 bg-slate-950/50 p-1.5 rounded-lg border border-slate-800/50">
                    {log.detail}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Summary */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950 text-[10px] text-slate-400 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span>Total: <strong className="text-white">{logs.length}</strong> tindakan</span>
          <span>•</span>
          <span className="text-emerald-400 font-semibold">
            {logs.filter((l) => l.severity === 'success').length} sukses
          </span>
          {logs.filter((l) => l.severity === 'warning' || l.severity === 'error').length > 0 && (
            <>
              <span>•</span>
              <span className="text-amber-400 font-semibold">
                {logs.filter((l) => l.severity === 'warning' || l.severity === 'error').length} peringatan
              </span>
            </>
          )}
        </div>
        <span className="font-mono text-slate-500">
          {logs.length > 0 ? `Update: ${logs[logs.length - 1].timestamp}` : 'Siap'}
        </span>
      </div>
    </div>
  );
};
