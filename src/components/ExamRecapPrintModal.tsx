import React, { useRef } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  X, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Building, 
  UserCheck, 
  ShieldCheck,
  FileCheck,
  Zap,
  Filter
} from 'lucide-react';
import { ParticipantRecord } from '../types/fiber';
import { getExamSettings } from '../utils/adminAuth';
import { exportParticipantResultsToExcel } from '../utils/excelParticipantUtils';
import { formatDuration } from '../utils/leaderboard';
import { soundEffects } from '../utils/audio';

interface ExamRecapPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  queue: ParticipantRecord[];
}

export const ExamRecapPrintModal: React.FC<ExamRecapPrintModalProps> = ({
  isOpen,
  onClose,
  queue,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const examSettings = getExamSettings();
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (!isOpen) return null;

  const testedParticipants = queue.filter((p) => p.status === 'completed');
  const passCount = testedParticipants.filter((p) => (p.totalScore || 0) >= 70 && (p.spliceLoss || 0) <= 0.05).length;
  const failCount = testedParticipants.length - passCount;
  const passRate = testedParticipants.length > 0 ? Math.round((passCount / testedParticipants.length) * 100) : 0;

  const avgScore = testedParticipants.length > 0
    ? Math.round(testedParticipants.reduce((acc, curr) => acc + (curr.totalScore || 0), 0) / testedParticipants.length)
    : 0;

  const avgLoss = testedParticipants.length > 0
    ? (testedParticipants.reduce((acc, curr) => acc + (curr.spliceLoss || 0), 0) / testedParticipants.length).toFixed(3)
    : '0.000';

  const handlePrint = () => {
    soundEffects.playClick();
    window.print();
  };

  const handleExportExcel = () => {
    soundEffects.playClick();
    exportParticipantResultsToExcel(queue);
  };

  const handleExportCSV = () => {
    soundEffects.playClick();
    const headers = ['No', 'NIK/ID', 'Nama Lengkap', 'Instansi', 'Status', 'Durasi (detik)', 'Skor', 'Loss (dB)', 'Grade', 'Kelayakan'];
    const rows = queue.map((p, idx) => [
      idx + 1,
      p.traineeId,
      `"${p.traineeName}"`,
      `"${p.companyOrInstitution}"`,
      p.status,
      p.durationSeconds || 0,
      p.totalScore || 0,
      p.spliceLoss || 0,
      p.grade || '-',
      p.telkomCompliant ? 'LULUS (MEMENUHI SYARAT)' : 'BELUM MEMENUHI'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Nilai_${examSettings.batchTitle.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn font-sans">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden relative text-slate-200 my-4 max-h-[95vh] flex flex-col">
        {/* Modal Toolbar (Hidden during browser print) */}
        <div className="bg-slate-950 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Rekapitulasi Nilai Ujian Kompetensi
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-400/30">
                  OFFICIAL RECAP
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Lembar Rekap Hasil Pengujian Resmi Splicing Fiber Optik Telkom
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              title="Unduh file Excel (.xlsx) dengan formating resmi"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
              title="Unduh format CSV"
            >
              CSV
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Print</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playClick();
                onClose();
              }}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Sheet Document Container */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-950 flex-1">
          <div 
            ref={printAreaRef}
            id="official-exam-recap-sheet"
            className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-xl max-w-4xl mx-auto border border-slate-300 print:shadow-none print:border-none print:p-0 print:m-0"
          >
            {/* Kop Surat Resmi */}
            <div className="border-b-2 border-slate-900 pb-4 mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img 
                  src="/logo.svg" 
                  alt="Logo SMK Industri" 
                  className="w-14 h-14 object-contain shrink-0 drop-shadow-xs"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/logo.png';
                  }}
                />
                <div>
                  <div className="text-[10px] font-black tracking-widest text-blue-900 uppercase font-mono">
                    SMK INDUSTRI • JURUSAN TEKNIK JARINGAN & TELEKOMUNIKASI
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase font-serif">
                    LEMBAGA SERTIFIKASI KOMPETENSI TEKNISI FIBER OPTIK
                  </h2>
                  <p className="text-xs text-slate-600 font-semibold">
                    Standar Operasional Telkom Akses / FTTH Indonesia • ITU-T G.652.D Compliance
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Sistem Penilaian Fusion Splicer Presisi Tinggi OptiSim Pro
                  </p>
                </div>
              </div>
              <div className="text-right text-xs">
                <span className="font-bold text-slate-800 block">DOKUMEN PENILAIAN</span>
                <span className="font-mono text-slate-500 text-[11px]">No: RKP-FBR-{Date.now().toString().slice(-6)}</span>
              </div>
            </div>

            {/* Exam Batch Meta Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs mb-5">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Judul Gelombang:</span>
                <span className="font-bold text-slate-900">{examSettings.batchTitle}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Asesor / Penguji:</span>
                <span className="font-bold text-slate-900">{examSettings.examinerName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Tanggal Ujian:</span>
                <span className="font-bold text-slate-900">{currentDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Standar Kelulusan:</span>
                <span className="font-bold text-emerald-800">Skor ≥ 70% & Loss ≤ 0.05dB</span>
              </div>
            </div>

            {/* Statistics Summary Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
              <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl text-center">
                <span className="text-[10px] text-blue-700 block font-bold uppercase">Total Peserta</span>
                <span className="text-xl font-bold font-mono text-blue-900">{queue.length}</span>
              </div>
              <div className="bg-slate-100 border border-slate-200 p-2.5 rounded-xl text-center">
                <span className="text-[10px] text-slate-600 block font-bold uppercase">Selesai Uji</span>
                <span className="text-xl font-bold font-mono text-slate-900">{testedParticipants.length}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-center">
                <span className="text-[10px] text-emerald-700 block font-bold uppercase">Lulus Ujian</span>
                <span className="text-xl font-bold font-mono text-emerald-900">{passCount}</span>
              </div>
              <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-center">
                <span className="text-[10px] text-rose-700 block font-bold uppercase">Belum Lulus</span>
                <span className="text-xl font-bold font-mono text-rose-900">{failCount}</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-center">
                <span className="text-[10px] text-amber-700 block font-bold uppercase">Rata-rata Skor</span>
                <span className="text-xl font-bold font-mono text-amber-900">{avgScore}%</span>
              </div>
            </div>

            {/* Main Participant Score Table */}
            <div className="overflow-x-auto border border-slate-300 rounded-xl mb-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold text-[11px]">
                    <th className="p-2 text-center border-r border-slate-700 w-10">No</th>
                    <th className="p-2 border-r border-slate-700">NIK / ID Teknisi</th>
                    <th className="p-2 border-r border-slate-700">Nama Lengkap</th>
                    <th className="p-2 border-r border-slate-700">Instansi / Unit</th>
                    <th className="p-2 text-center border-r border-slate-700">Durasi</th>
                    <th className="p-2 text-center border-r border-slate-700">Loss (dB)</th>
                    <th className="p-2 text-center border-r border-slate-700">Skor</th>
                    <th className="p-2 text-center border-r border-slate-700">Grade</th>
                    <th className="p-2 text-center">Hasil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {queue.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-slate-400 italic">
                        Belum ada data peserta yang terdaftar pada antrean ujian.
                      </td>
                    </tr>
                  ) : (
                    queue.map((p, idx) => {
                      const isPass = (p.totalScore || 0) >= 70 && (p.spliceLoss || 0) <= 0.05 && p.status === 'completed';
                      return (
                        <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="p-2 text-center font-mono border-r border-slate-200 text-slate-600">
                            {idx + 1}
                          </td>
                          <td className="p-2 font-mono font-semibold border-r border-slate-200 text-slate-800 whitespace-nowrap">
                            {p.traineeId}
                          </td>
                          <td className="p-2 font-bold border-r border-slate-200 text-slate-900">
                            {p.traineeName}
                          </td>
                          <td className="p-2 text-[11px] border-r border-slate-200 text-slate-600 max-w-[150px] truncate">
                            {p.companyOrInstitution}
                          </td>
                          <td className="p-2 text-center font-mono border-r border-slate-200 text-slate-700 whitespace-nowrap">
                            {p.durationSeconds ? formatDuration(p.durationSeconds) : '-'}
                          </td>
                          <td className="p-2 text-center font-mono font-bold border-r border-slate-200">
                            {p.spliceLoss !== undefined ? (
                              <span className={p.spliceLoss <= 0.05 ? 'text-emerald-700' : 'text-rose-600'}>
                                {p.spliceLoss.toFixed(2)} dB
                              </span>
                            ) : '-'}
                          </td>
                          <td className="p-2 text-center font-mono font-bold border-r border-slate-200">
                            {p.totalScore !== undefined ? `${p.totalScore}%` : '-'}
                          </td>
                          <td className="p-2 text-center font-mono font-bold border-r border-slate-200">
                            {p.grade || '-'}
                          </td>
                          <td className="p-2 text-center">
                            {p.status === 'completed' ? (
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                  isPass
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                                }`}
                              >
                                {isPass ? 'LULUS' : 'MENGULANG'}
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500">
                                BELUM UJI
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Official Assessor & Supervisor Signatures Block */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-300 text-xs">
              <div className="text-center">
                <p className="text-slate-500 mb-14">
                  Mengetahui,<br />
                  <strong>Supervisor Pelatihan Jaringan Akses</strong>
                </p>
                <div className="w-48 h-0.5 bg-slate-400 mx-auto mb-1"></div>
                <p className="font-bold text-slate-800">NIP: 19820415 200801 1 004</p>
              </div>

              <div className="text-center">
                <p className="text-slate-500 mb-14">
                  Ditetapkan di Jakarta, {currentDate}<br />
                  <strong>Asesor Penguji Uji Kompetensi</strong>
                </p>
                <div className="w-48 h-0.5 bg-slate-400 mx-auto mb-1"></div>
                <p className="font-bold text-slate-800">{examSettings.examinerName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
