import React, { useState, useEffect } from 'react';
import { 
  User, 
  Building2, 
  CheckCircle2, 
  X, 
  Play, 
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Hash,
  Award,
  Users,
  Layers
} from 'lucide-react';
import { TechnicianState } from '../types/fiber';
import { soundEffects } from '../utils/audio';
import { addParticipantToQueue } from '../utils/participantQueue';

interface ParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: TechnicianState;
  updateState: (updates: Partial<TechnicianState>) => void;
  onStartSession?: () => void;
  onOpenQueueModal?: () => void;
  onQueueUpdated?: () => void;
  isAdmin?: boolean;
}

const INSTANCE_PRESETS = [
  'PT Telkom Akses',
  'PT Telkom Indonesia (Witel)',
  'Mitra OSP / FTTH Telkom',
  'SMK Telkom / Vokasi Jaringan',
  'Politeknik Negeri Telekomunikasi',
  'Indosat Ooredoo Hutchison',
  'XL Axiata / FiberStar',
];

export const ParticipantModal: React.FC<ParticipantModalProps> = ({
  isOpen,
  onClose,
  state,
  updateState,
  onStartSession,
  onOpenQueueModal,
  onQueueUpdated,
  isAdmin = false,
}) => {
  const [name, setName] = useState(state.traineeName || '');
  const [traineeId, setTraineeId] = useState(state.traineeId || '');
  const [institution, setInstitution] = useState(state.companyOrInstitution || '');
  const [autoStartTimer, setAutoStartTimer] = useState(true);
  const [addToQueue, setAddToQueue] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(state.traineeName || '');
      setTraineeId(state.traineeId || `OPT-TK-${Math.floor(1000 + Math.random() * 9000)}`);
      setInstitution(state.companyOrInstitution || 'PT Telkom Akses / Witel Regional');
      setErrorMsg('');
    }
  }, [isOpen, state.traineeName, state.traineeId, state.companyOrInstitution]);

  if (!isOpen) return null;

  const handleGenerateRandomId = () => {
    soundEffects.playClick();
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    setTraineeId(`OPT-TK-${randomDigits}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama lengkap teknisi wajib diisi.');
      soundEffects.playError();
      return;
    }

    const finalName = name.trim();
    const finalId = traineeId.trim() || `OPT-TK-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalInst = institution.trim() || 'PT Telkom Akses / Witel Regional';

    // Persist to state
    updateState({
      traineeName: finalName,
      traineeId: finalId,
      companyOrInstitution: finalInst,
    });

    // Also add to participant queue if requested by Admin so existing candidates aren't replaced/lost
    if (isAdmin && addToQueue) {
      addParticipantToQueue(finalName, finalId, finalInst);
      if (onQueueUpdated) {
        onQueueUpdated();
      }
    }

    // Persist to localStorage
    try {
      localStorage.setItem('optisim_participant_info', JSON.stringify({
        traineeName: finalName,
        traineeId: finalId,
        companyOrInstitution: finalInst,
      }));
      localStorage.setItem('optisim_has_registered', 'true');
    } catch (err) {
      console.warn('Could not write to localStorage:', err);
    }

    soundEffects.playSuccessBeep();

    if (autoStartTimer && onStartSession) {
      onStartSession();
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-blue-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-950/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative corner glows */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl border border-blue-400/40 bg-slate-950 flex items-center justify-center p-1.5 shadow-lg shrink-0 overflow-hidden">
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
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {isAdmin ? 'Registrasi Peserta Ujian' : 'Data Teknisi (Sertifikat Latihan)'}
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                  isAdmin 
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  {isAdmin ? 'Mode Penguji' : 'Mode Latihan'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAdmin
                  ? 'Input atau kelola data peserta ujian resmi berstandar Telkom.'
                  : 'Nama dan instansi ini dicantumkan pada lembar sertifikat pelatihan mandiri.'}
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

        {/* Quick Shortcut to Multi-Participant Queue & Excel / Batch Add (Admin Only) */}
        {isAdmin && onOpenQueueModal && (
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              onClose();
              onOpenQueueModal();
            }}
            className="w-full mb-4 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-indigo-950/60 to-blue-950/60 hover:from-emerald-900/60 hover:to-blue-900/60 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer group shadow-sm"
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400 group-hover:text-white transition-colors" />
              <span>Daftar Antrean & Impor Template Excel (.xlsx)</span>
            </span>
            <span className="text-[10px] bg-emerald-600/40 px-2.5 py-0.5 rounded-lg border border-emerald-400/40 text-white flex items-center gap-1 font-mono">
              Buka Antrean & Excel →
            </span>
          </button>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 font-semibold flex items-center gap-2 animate-shake">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
            {errorMsg}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {/* Field 1: Nama Lengkap */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
              Nama Lengkap Teknisi / Trainee <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="Contoh: Budi Santoso, S.T."
              className="w-full bg-slate-950/80 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              required
              autoFocus
            />
          </div>

          {/* Field 2: ID / NIK Teknisi */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-blue-400" />
                Nomor ID / NIK Teknisi
              </label>
              <button
                type="button"
                onClick={handleGenerateRandomId}
                className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
                title="Buat ID Acak Otomatis"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Generate ID Acak
              </button>
            </div>
            <input
              type="text"
              value={traineeId}
              onChange={(e) => setTraineeId(e.target.value)}
              placeholder="Contoh: OPT-TK-8492 atau NIK Karyawan"
              className="w-full bg-slate-950/80 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Field 3: Instansi / Perusahaan */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              Nama Instansi / Regional / Lembaga
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="Contoh: PT Telkom Akses / Witel Regional"
              className="w-full bg-slate-950/80 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium mb-2"
            />

            {/* Quick Preset Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-500 font-medium">Pilih cepat:</span>
              {INSTANCE_PRESETS.slice(0, 4).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setInstitution(preset);
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                    institution === preset
                      ? 'bg-blue-600/20 text-blue-300 border-blue-500/50 font-bold'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Add to Queue Checkbox (Admin Only) */}
          {isAdmin ? (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                id="addToQueue"
                checked={addToQueue}
                onChange={(e) => setAddToQueue(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500/20 bg-slate-900 cursor-pointer accent-indigo-600"
              />
              <label htmlFor="addToQueue" className="text-xs text-slate-300 cursor-pointer select-none">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  Simpan ke Antrean Peserta Ujian (Multi-Queue)
                </span>
                <span className="text-[10px] text-slate-400">
                  Menyimpan peserta ini ke dalam daftar antrean ujian resmi tanpa mereset peserta lainnya.
                </span>
              </label>
            </div>
          ) : (
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-400 leading-relaxed">
                <span className="text-slate-200 font-bold block mb-0.5">Mode Latihan Mandiri:</span>
                Identitas ini langsung digunakan pada sesi latihan Anda dan tercetak di lembar sertifikat hasil latihan.
              </div>
            </div>
          )}

          {/* Auto Start Timer Checkbox */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              id="autoStartTimer"
              checked={autoStartTimer}
              onChange={(e) => setAutoStartTimer(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500/20 bg-slate-900 cursor-pointer accent-blue-600"
            />
            <label htmlFor="autoStartTimer" className="text-xs text-slate-300 cursor-pointer select-none">
              <span className="font-bold text-white block">Mulai Stopwatch Pengerjaan (Time-Trial) Otomatis</span>
              <span className="text-[10px] text-slate-400">
                Waktu akan mulai dihitung begitu identitas disimpan untuk penilaian kecepatan kerja.
              </span>
            </label>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-2.5">
            <Award className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-200 leading-relaxed">
              Nama dan Instansi ini akan dicantumkan secara resmi pada <strong className="text-white">Lembar Penilaian</strong>, <strong className="text-white">Sertifikat Kelayakan PDF</strong>, dan <strong className="text-white">Papan Peringkat (Leaderboard)</strong>.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                onClose();
              }}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Batal / Nanti
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-900/40 transition-all flex items-center gap-2 cursor-pointer"
            >
              {autoStartTimer ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Simpan & Mulai Sesi Uji</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Simpan Data Peserta</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
