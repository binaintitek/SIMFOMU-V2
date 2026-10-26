import React from 'react';
import { soundEffects } from '../utils/audio';
import { BookOpen, X, AlertCircle } from 'lucide-react';

interface DefectKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DefectKnowledgeModal: React.FC<DefectKnowledgeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const defects = [
    {
      title: 'Gelembung Udara (Bubble Defect)',
      symptom: 'Muncul rongga udara melingkar di tengah titik sambungan fusi.',
      cause: 'Debu mikro, minyak tangan, atau residu alkohol IPA yang belum menguap sempurna sebelum arc dilepaskan.',
      fix: 'Bersihkan ulang fiber dengan Kimwipes kering dan potong kembali (re-cleave).',
      lossImpact: 'Sangat tinggi (> 0.25 dB). Wajib dipotong ulang.',
    },
    {
      title: 'Penyempitan / Pinggang (Waist Defect)',
      symptom: 'Diameter kaca pada titik sambungan mengecil/menyempit dibanding 125μm normal.',
      cause: 'Arus arc discharge terlalu tinggi, durasi arc terlalu lama, atau feed motor terlalu lambat.',
      fix: 'Lakukan kalibrasi arc discharge (Arc Calibration) pada splicer.',
      lossImpact: 'Tinggi (0.10 - 0.20 dB). Melebihi batas Telkom.',
    },
    {
      title: 'Pembengkakan / Bulge (Thick Defect)',
      symptom: 'Diameter kaca pada titik sambungan membengkak membesar seperti bola.',
      cause: 'Forward feed motor mendorong fiber terlalu jauh ke dalam nyala api arc fusi.',
      fix: 'Kalibrasi motor stepper sumbu Z dan atur ulang gap awal serat.',
      lossImpact: 'Sedang - Tinggi (0.08 - 0.15 dB).',
    },
    {
      title: 'Sudut Miring (Tilted Cleave)',
      symptom: 'Permukaan ujung fiber miring (> 1.0°) atau terdapat bibir retakan (lip/hackle).',
      cause: 'Bilah pisau cleaver tumpul, kotor, atau fiber tidak dijepit rata pada karet penjepit.',
      fix: 'Putar posisi mata pisau cleaver (1-16 indeks) atau bersihkan karet bantalan penekan.',
      lossImpact: 'Tinggi (0.08 - 0.30 dB) dan reflektansi balik buruk.',
    },
    {
      title: 'Pergeseran Sumbu Inti (Core Offset)',
      symptom: 'Garis inti (core) merah 9μm antara fiber kiri dan kanan tidak sejajar lurus.',
      cause: 'Debu mengganjal pada lekukan V-Groove sehingga fiber tidak duduk sempurna.',
      fix: 'Bersihkan parit V-Groove menggunakan cotton bud yang dibasahi sedikit alkohol IPA 99%.',
      lossImpact: 'Sangat signifikan (setiap pergeseran 1μm menambah rugi daya ~0.2 dB).',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl p-6 sm:p-8 shadow-2xl relative my-8">
        <button
          onClick={() => {
            soundEffects.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-900/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Katalog Analisis Kerusakan Hasil Sambungan (Defect Guide)
            </h3>
            <p className="text-xs text-slate-400">
              Panduan Identifikasi &amp; Troubleshooting Cacat Splicing Berdasarkan SOP Telkom
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto pr-2">
          {defects.map((d, i) => (
            <div key={i} className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px]">
                    0{i + 1}
                  </span>
                  {d.title}
                </h4>
                <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  {d.lossImpact}
                </span>
              </div>
              <p className="text-slate-300">
                <span className="font-semibold text-slate-400">Ciri Visual:</span> {d.symptom}
              </p>
              <p className="text-slate-300">
                <span className="font-semibold text-amber-400">Penyebab:</span> {d.cause}
              </p>
              <p className="text-emerald-300">
                <span className="font-semibold text-emerald-400">Solusi Lapangan:</span> {d.fix}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-900/30 transition-colors"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
