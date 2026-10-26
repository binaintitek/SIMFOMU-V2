import React, { useState, useRef } from 'react';
import { 
  Users, 
  UserPlus, 
  Play, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  X, 
  RotateCcw, 
  Search, 
  Building2, 
  FileText, 
  Sparkles, 
  Filter,
  Layers,
  FileSpreadsheet,
  Download,
  Upload,
  AlertCircle,
  FileCheck,
  Check,
  HelpCircle
} from 'lucide-react';
import { ParticipantRecord, ParticipantTestStatus } from '../types/fiber';
import { formatDuration, getSpeedRating } from '../utils/leaderboard';
import { 
  addParticipantToQueue, 
  batchAddParticipantsToQueue, 
  parseBatchParticipantsText, 
  deleteParticipantFromQueue, 
  resetParticipantInQueue, 
  clearParticipantQueue,
  generateTraineeId,
  ParsedBatchCandidate
} from '../utils/participantQueue';
import { 
  downloadExcelTemplate, 
  downloadCsvTemplate, 
  parseExcelOrCsvFile, 
  exportParticipantResultsToExcel 
} from '../utils/excelParticipantUtils';
import { soundEffects } from '../utils/audio';

interface ParticipantQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  queue: ParticipantRecord[];
  activeParticipantId?: string;
  onSelectParticipant: (participant: ParticipantRecord) => void;
  onQueueUpdated: (updatedQueue: ParticipantRecord[]) => void;
}

const INSTANCE_PRESETS = [
  'PT Telkom Akses',
  'PT Telkom Indonesia (Witel)',
  'Mitra OSP / FTTH Telkom',
  'SMK Telkom / Vokasi Jaringan',
  'Politeknik Telekomunikasi',
  'Indosat Ooredoo Hutchison',
  'XL Axiata / FiberStar',
];

export const ParticipantQueueModal: React.FC<ParticipantQueueModalProps> = ({
  isOpen,
  onClose,
  queue,
  activeParticipantId,
  onSelectParticipant,
  onQueueUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'excel_import' | 'add_single' | 'add_batch'>('roster');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  // Single Add form states
  const [singleName, setSingleName] = useState('');
  const [singleId, setSingleId] = useState('');
  const [singleInst, setSingleInst] = useState('PT Telkom Akses / Witel Regional');
  const [singleError, setSingleError] = useState('');

  // Batch Add states (Text area)
  const [batchText, setBatchText] = useState('');
  const [batchInst, setBatchInst] = useState('PT Telkom Akses / Witel Regional');

  // Excel Upload states
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [excelParsedCandidates, setExcelParsedCandidates] = useState<ParsedBatchCandidate[]>([]);
  const [excelParseError, setExcelParseError] = useState<string>('');
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [excelDefaultInst, setExcelDefaultInst] = useState('PT Telkom Akses / Witel Regional');
  const [replaceExistingQueue, setReplaceExistingQueue] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Filter queue
  const filteredQueue = queue.filter((item) => {
    const matchesSearch = 
      item.traineeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.traineeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.companyOrInstitution.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filterStatus === 'all') return true;
    return item.status === filterStatus;
  });

  // Statistics
  const totalCount = queue.length;
  const untestedCount = queue.filter((p) => p.status === 'untested').length;
  const inProgressCount = queue.filter((p) => p.status === 'in_progress').length;
  const completedCount = queue.filter((p) => p.status === 'completed').length;

  const handleSingleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName.trim()) {
      setSingleError('Nama lengkap teknisi wajib diisi.');
      soundEffects.playError();
      return;
    }

    const newRecord = addParticipantToQueue(
      singleName.trim(),
      singleId.trim() || generateTraineeId(),
      singleInst.trim() || 'PT Telkom Akses / Witel Regional'
    );

    const updated = [newRecord, ...queue.filter((p) => p.id !== newRecord.id)];
    onQueueUpdated(updated);

    soundEffects.playSuccessBeep();
    setSingleName('');
    setSingleId('');
    setSingleError('');
    setActiveTab('roster');
  };

  const handleBatchAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseBatchParticipantsText(batchText, batchInst);
    if (parsed.length === 0) {
      soundEffects.playError();
      return;
    }

    const updated = batchAddParticipantsToQueue(parsed);
    onQueueUpdated(updated);

    soundEffects.playSuccessBeep();
    setBatchText('');
    setActiveTab('roster');
  };

  // Excel File Processing
  const handleFileProcess = async (file: File) => {
    setIsParsingExcel(true);
    setExcelParseError('');
    setUploadedFile(file);

    try {
      const res = await parseExcelOrCsvFile(file, excelDefaultInst);
      if (res.success && res.candidates.length > 0) {
        setExcelParsedCandidates(res.candidates);
        soundEffects.playSuccessBeep();
      } else {
        setExcelParseError(res.error || 'File tidak memuat baris nama peserta yang valid.');
        setExcelParsedCandidates([]);
        soundEffects.playError();
      }
    } catch (err: any) {
      setExcelParseError(err?.message || 'Gagal memproses file Excel.');
      setExcelParsedCandidates([]);
      soundEffects.playError();
    } finally {
      setIsParsingExcel(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const handleCommitExcelCandidates = () => {
    if (excelParsedCandidates.length === 0) return;

    soundEffects.playSuccessBeep();

    let updated: ParticipantRecord[];
    if (replaceExistingQueue) {
      clearParticipantQueue();
      updated = batchAddParticipantsToQueue(excelParsedCandidates);
    } else {
      updated = batchAddParticipantsToQueue(excelParsedCandidates);
    }

    onQueueUpdated(updated);
    setExcelParsedCandidates([]);
    setUploadedFile(null);
    setExcelParseError('');
    setActiveTab('roster');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playClick();
    const updated = deleteParticipantFromQueue(id);
    onQueueUpdated(updated);
  };

  const handleResetTest = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playClick();
    const updated = resetParticipantInQueue(id);
    onQueueUpdated(updated);
  };

  const handleClearAllQueue = () => {
    soundEffects.playClick();
    const updated = clearParticipantQueue();
    onQueueUpdated(updated);
    setConfirmClearAll(false);
  };

  const handleSelectCandidate = (item: ParticipantRecord) => {
    soundEffects.playSuccessBeep();
    onSelectParticipant(item);
    onClose();
  };

  const parsedBatchPreview = parseBatchParticipantsText(batchText, batchInst);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border-2 border-blue-500/40 rounded-3xl shadow-2xl shadow-blue-950/80 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-blue-400/40 flex items-center justify-center p-1.5 shadow-lg shadow-blue-900/40 shrink-0 overflow-hidden">
              <img 
                src="/logo.svg" 
                alt="Logo SMK Industri" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/logo.png';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Manajemen & Antrean Peserta Uji Splicing
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                  Multi-Candidate System
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Input peserta menggunakan template Excel rapi, kelola antrean satu per satu, dan rekam waktu SOP.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation & Statistics Bar */}
        <div className="px-5 sm:px-6 pt-3 pb-2 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Sub-tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
            <button
              onClick={() => {
                soundEffects.playClick();
                setActiveTab('roster');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'roster'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Daftar Antrean ({totalCount})</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playClick();
                setActiveTab('excel_import');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'excel_import'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40 font-black'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
              <span>📊 Template & Upload Excel</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playClick();
                setActiveTab('add_single');
                setSingleId(generateTraineeId());
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'add_single'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Tambah Satuan</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playClick();
                setActiveTab('add_batch');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'add_batch'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>📋 Tempel Teks Batch</span>
            </button>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-2 text-[11px] font-semibold">
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
              Belum: <strong className="text-white font-mono">{untestedCount}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              Sedang Uji: <strong className="text-amber-200 font-mono">{inProgressCount}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              Selesai: <strong className="text-emerald-200 font-mono">{completedCount}</strong>
            </span>
          </div>
        </div>

        {/* Tab 1: Roster List Table */}
        {activeTab === 'roster' && (
          <div className="flex-1 overflow-hidden flex flex-col p-4 sm:p-6 space-y-4">
            {/* Search, Filter & Quick Excel Action Toolbar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative w-full lg:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, NIK, instansi..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0 mr-1">
                  <Filter className="w-3 h-3" /> Status:
                </span>
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'untested', label: 'Belum Uji' },
                  { id: 'in_progress', label: 'Sedang Uji' },
                  { id: 'completed', label: 'Selesai' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      soundEffects.playClick();
                      setFilterStatus(st.id);
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer shrink-0 font-medium ${
                      filterStatus === st.id
                        ? 'bg-blue-600/30 text-blue-300 border-blue-500 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Action Buttons: Download Template, Upload Excel, Export Excel */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    downloadExcelTemplate();
                  }}
                  className="px-2.5 py-1.5 bg-emerald-950/50 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  title="Unduh template Excel resmi berformat rapi (.xlsx)"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Unduh Template</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setActiveTab('excel_import');
                  }}
                  className="px-2.5 py-1.5 bg-blue-950/50 hover:bg-blue-900/50 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  title="Upload file Excel (.xlsx / .csv)"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span>Upload Excel</span>
                </button>

                {totalCount > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playSuccessBeep();
                        exportParticipantResultsToExcel(queue);
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      title="Ekspor seluruh daftar & nilai peserta ke file Excel (.xlsx)"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ekspor Excel</span>
                    </button>

                    {confirmClearAll ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleClearAllQueue}
                          className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Ya, Kosongkan
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmClearAll(false)}
                          className="px-2 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-[11px] transition-colors cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmClearAll(true)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer"
                        title="Kosongkan seluruh antrean peserta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950/60 divide-y divide-slate-800/80">
              {filteredQueue.length === 0 ? (
                <div className="py-12 px-6 text-center text-slate-400 space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
                    <FileSpreadsheet className="w-8 h-8 text-emerald-400/80" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Antrean Peserta Belum Diisi</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Tidak ada nama peserta bawaan. Anda dapat mengunduh format Excel di bawah, mengisinya, dan mengunggahnya langsung untuk pengujian bergiliran.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playClick();
                        downloadExcelTemplate();
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh Template Excel (.xlsx)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playClick();
                        setActiveTab('excel_import');
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload File Excel</span>
                    </button>
                  </div>
                </div>
              ) : (
                filteredQueue.map((participant, index) => {
                  const isCurrentActive = activeParticipantId === participant.id || participant.status === 'in_progress';

                  return (
                    <div
                      key={participant.id}
                      className={`p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                        isCurrentActive
                          ? 'bg-blue-950/30 hover:bg-blue-950/40 border-l-4 border-l-blue-500'
                          : 'hover:bg-slate-900/60'
                      }`}
                    >
                      {/* Left: Index, Name & Details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 font-mono text-xs flex items-center justify-center font-bold shrink-0">
                          {index + 1}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-white truncate">
                              {participant.traineeName}
                            </h4>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-800 border border-slate-700 rounded text-cyan-300">
                              {participant.traineeId}
                            </span>
                            {isCurrentActive && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase animate-pulse">
                                Aktif di Simulator
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                            <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                            {participant.companyOrInstitution}
                          </p>
                        </div>
                      </div>

                      {/* Middle: Status & Performance Metrics */}
                      <div className="flex items-center gap-3 sm:gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                        {/* Status Badge */}
                        <div>
                          {participant.status === 'completed' ? (
                            <div className="text-left sm:text-right">
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Selesai
                              </span>
                              <div className="text-[11px] font-mono mt-0.5 font-bold text-slate-300">
                                Waktu: <strong className="text-amber-300">{formatDuration(participant.durationSeconds || 0)}</strong>
                                {participant.totalScore !== undefined && (
                                  <span className="ml-1 text-emerald-400 font-black">
                                    • {participant.totalScore}/100 ({participant.grade})
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : participant.status === 'in_progress' ? (
                            <div className="text-left sm:text-right">
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                                Sedang Diuji
                              </span>
                              <p className="text-[10px] text-amber-200/80 font-mono mt-0.5">
                                Siap / Berjalan
                              </p>
                            </div>
                          ) : (
                            <div className="text-left sm:text-right">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                <Clock className="w-3 h-3" /> Belum Diuji
                              </span>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Menunggu Antrean
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5">
                          {participant.status === 'completed' ? (
                            <button
                              onClick={() => handleSelectCandidate(participant)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                              title="Pilih kembali peserta ini (Uji Ulang / Tampilkan Nilai)"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Uji Ulang</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSelectCandidate(participant)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                                isCurrentActive
                                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40'
                                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40'
                              }`}
                              title="Aktifkan peserta ini ke simulator & reset timer ke 00:00"
                            >
                              <Play className="w-3 h-3 fill-white" />
                              <span>{isCurrentActive ? 'Mulai Uji' : 'Pilih & Uji'}</span>
                            </button>
                          )}

                          {/* Delete from Queue */}
                          <button
                            onClick={(e) => handleDelete(participant.id, e)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Hapus dari antrean"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Helper Instructions footer */}
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Klik <strong className="text-white">"Pilih & Uji"</strong> pada nama peserta untuk memuat identitas ke simulator dan mereset stopwatch ke <code className="text-amber-300 font-bold">00:00 Standby</code>.
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setActiveTab('excel_import');
                }}
                className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Format Template Excel →</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Excel Template Download & File Upload (Usability: drag-and-drop + click) */}
        {activeTab === 'excel_import' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
            {/* Step 1: Download Template Section */}
            <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                    Langkah 1: Unduh Format Template
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white mt-1 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                    Template Spreadsheet Resmi (Excel & CSV)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                    Format file telah dirapikan dengan lebar kolom presisi, judul header resmi, dan petunjuk pengisian. Buka di Microsoft Excel, Google Sheets, atau LibreOffice.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playSuccessBeep();
                      downloadExcelTemplate();
                    }}
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Format Excel (.xlsx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      downloadCsvTemplate();
                    }}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Format CSV (.csv)</span>
                  </button>
                </div>
              </div>

              {/* Column Structure Reference */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 font-mono block text-[10px]">Kolom A</span>
                  <strong className="text-white">No</strong>
                  <span className="text-slate-500 block text-[10px]">1, 2, 3...</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-emerald-500/30">
                  <span className="text-emerald-400 font-mono block text-[10px]">Kolom B (Wajib)</span>
                  <strong className="text-white">Nama Lengkap</strong>
                  <span className="text-slate-400 block text-[10px]">Nama teknisi peserta</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 font-mono block text-[10px]">Kolom C (Opsional)</span>
                  <strong className="text-white">NIK / ID Teknisi</strong>
                  <span className="text-slate-500 block text-[10px]">Auto-generate jika kosong</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 font-mono block text-[10px]">Kolom D (Opsional)</span>
                  <strong className="text-white">Instansi / Witel</strong>
                  <span className="text-slate-500 block text-[10px]">Witel / Mitra OSP</span>
                </div>
              </div>
            </div>

            {/* Step 2: Upload Area (Drag & Drop + File Selection) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                    Langkah 2: Unggah File
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1">
                    Upload Dokumen Excel (.xlsx / .xls) atau CSV
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 hidden sm:inline-block">
                  Mendukung Drag-and-Drop & Klik Manual
                </span>
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                className="hidden"
              />

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-emerald-400 bg-emerald-950/30 shadow-xl shadow-emerald-950/40 scale-[1.01]'
                    : 'border-slate-700 hover:border-blue-500 bg-slate-950/50 hover:bg-slate-950/80'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center mx-auto text-blue-400 mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">
                  {uploadedFile ? uploadedFile.name : 'Tarik & Jatuhkan File Excel di Sini'}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  atau <span className="text-blue-400 font-bold underline">klik untuk memilih file</span> dari komputer Anda
                </p>
                <p className="text-[10px] text-slate-500 mt-2">
                  Format yang didukung: <strong>.XLSX, .XLS, .CSV</strong> (Maksimal 5 MB)
                </p>
              </div>

              {/* Error Notification if any */}
              {excelParseError && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{excelParseError}</span>
                </div>
              )}

              {/* Fallback Default Institution */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <label className="text-xs text-slate-300 font-medium">
                  Instansi Cadangan (jika kolom Instansi pada file kosong):
                </label>
                <input
                  type="text"
                  value={excelDefaultInst}
                  onChange={(e) => setExcelDefaultInst(e.target.value)}
                  className="w-full sm:w-64 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Step 3: Parsed Results Preview & Commit */}
            {excelParsedCandidates.length > 0 && (
              <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white">
                      Pratinjau Data: {excelParsedCandidates.length} Peserta Terdeteksi Siap Diimpor
                    </h4>
                  </div>
                  <span className="text-xs text-emerald-300 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    File: {uploadedFile?.name}
                  </span>
                </div>

                {/* Table of detected candidates */}
                <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl bg-slate-900/60 divide-y divide-slate-800 text-xs">
                  {excelParsedCandidates.map((c, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded bg-slate-800 text-slate-400 font-mono text-[11px] flex items-center justify-center font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <strong className="text-white truncate">{c.name}</strong>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono text-cyan-300 text-[11px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          {c.id}
                        </span>
                        <span className="text-slate-400 text-[11px] truncate max-w-[160px]">
                          {c.institution}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Queue option checkbox */}
                <div className="flex items-center gap-2.5 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    id="replaceQueueCheck"
                    checked={replaceExistingQueue}
                    onChange={(e) => setReplaceExistingQueue(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500/20 bg-slate-950 cursor-pointer accent-emerald-600"
                  />
                  <label htmlFor="replaceQueueCheck" className="text-xs text-slate-300 cursor-pointer select-none">
                    <strong>Kosongkan antrean sebelumnya</strong> (Ganti seluruh peserta yang ada dengan data dari file Excel ini)
                  </label>
                </div>

                {/* Commit Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setExcelParsedCandidates([]);
                      setUploadedFile(null);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Pilih File Lain
                  </button>

                  <button
                    type="button"
                    onClick={handleCommitExcelCandidates}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-950/60 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Masukkan {excelParsedCandidates.length} Peserta ke Antrean</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Single Add Form */}
        {activeTab === 'add_single' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-8 max-w-2xl mx-auto w-full">
            <div className="mb-5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                Tambah Satu Peserta ke Antrean
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tambahkan peserta tunggal untuk diuji berikutnya tanpa menghapus antrean saat ini.
              </p>
            </div>

            <form onSubmit={handleSingleAdd} className="space-y-4">
              {singleError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium">
                  {singleError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nama Lengkap Teknisi / Peserta <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={singleName}
                  onChange={(e) => {
                    setSingleName(e.target.value);
                    if (singleError) setSingleError('');
                  }}
                  placeholder="Contoh: Hendra Wijaya"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    NIK / ID Teknisi
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setSingleId(generateTraineeId());
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Acak ID Baru
                  </button>
                </div>
                <input
                  type="text"
                  value={singleId}
                  onChange={(e) => setSingleId(e.target.value)}
                  placeholder="Contoh: OPT-TK-9021"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Instansi / Perusahaan / Witel
                </label>
                <input
                  type="text"
                  value={singleInst}
                  onChange={(e) => setSingleInst(e.target.value)}
                  placeholder="Contoh: PT Telkom Akses Witel Jakarta Barat"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {INSTANCE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        soundEffects.playClick();
                        setSingleInst(preset);
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                        singleInst === preset
                          ? 'bg-blue-600/20 text-blue-300 border-blue-500/50 font-bold'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setActiveTab('roster');
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Kembali ke Antrean
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-900/40 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Simpan ke Antrean</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 4: Batch Text Form */}
        {activeTab === 'add_batch' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-8 max-w-3xl mx-auto w-full">
            <div className="mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Input Banyak Peserta Sekaligus (Batch Text)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Salin & tempel daftar nama peserta (satu baris per nama, atau format: <code className="text-indigo-300">Nama, NIK, Instansi</code>).
              </p>
            </div>

            <form onSubmit={handleBatchAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Instansi Default (Jika Baris Tidak Menyebutkan Instansi)
                </label>
                <input
                  type="text"
                  value={batchInst}
                  onChange={(e) => setBatchInst(e.target.value)}
                  placeholder="Contoh: PT Telkom Akses Witel Bandung"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Daftar Nama Peserta (1 baris per peserta)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setBatchText(
                        `Bambang Sudarsono, OPT-TK-8120, PT Telkom Akses Witel Surabaya\n` +
                        `Dewi Rahayu, OPT-TK-4412, PT Telkom Akses Witel Surabaya\n` +
                        `Eko Prasetyo, OPT-TK-3391, PT Telkom Akses Witel Surabaya\n` +
                        `Fitri Handayani\n` +
                        `Gunawan Wibowo`
                      );
                    }}
                    className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3 h-3" />
                    Isi Contoh Teks
                  </button>
                </div>

                <textarea
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  rows={7}
                  placeholder={`Contoh baris per baris:\nBambang Sudarsono, OPT-TK-8120, PT Telkom Akses\nDewi Rahayu\nEko Prasetyo\nFitri Handayani`}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-2xl p-3.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Real-time Parsed Preview Box */}
              {parsedBatchPreview.length > 0 && (
                <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Pratinjau Impor ({parsedBatchPreview.length} Peserta Terdeteksi):
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID otomatis dibuat jika kosong
                    </span>
                  </div>

                  <div className="max-h-32 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-800">
                    {parsedBatchPreview.map((item, idx) => (
                      <div key={idx} className="pt-1 first:pt-0 flex items-center justify-between text-xs">
                        <span className="font-bold text-white truncate max-w-[200px]">
                          {idx + 1}. {item.name}
                        </span>
                        <span className="font-mono text-cyan-300 text-[11px]">
                          {item.id}
                        </span>
                        <span className="text-slate-400 text-[11px] truncate max-w-[180px]">
                          {item.institution}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setActiveTab('roster');
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={parsedBatchPreview.length === 0}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                    parsedBatchPreview.length > 0
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-900/40'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Impor ke Antrean ({parsedBatchPreview.length} Peserta)</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
