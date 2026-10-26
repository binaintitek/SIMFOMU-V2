import React from 'react';
import { soundEffects } from '../utils/audio';
import { ShieldAlert, X, AlertTriangle, EyeOff, Flame, Zap, Trash2 } from 'lucide-react';

interface SafetyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SafetyGuideModal: React.FC<SafetyGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          onClick={() => {
            soundEffects.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-900/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Pedoman K3 Keselamatan Kerja Fiber Optik
            </h3>
            <p className="text-xs text-slate-400">
              Standar Operasional Prosedur (SOP) Keselamatan Kerja Teknisi Lapangan
            </p>
          </div>
        </div>

        {/* Safety Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6 text-xs">
          {/* Card 1: Fiber Shards */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Trash2 className="w-4 h-4" />
              <span>Bahaya Pecahan Serat Kaca</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Pecahan kaca 125μm transparan sangat mudah menusuk kulit dan masuk ke aliran darah. Selalu gunakan
              kotak limbah tertutup (fiber sharps bin) dan jangan pernah membuang potongan fiber ke lantai.
            </p>
          </div>

          {/* Card 2: Invisible Laser */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <EyeOff className="w-4 h-4" />
              <span>Sinar Laser Tak Kasat Mata</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Panjang gelombang 1310nm, 1490nm, dan 1550nm tidak terlihat oleh mata telanjang tetapi dapat
              merusak retina permanen. Jangan pernah menatap langsung ke ujung konektor atau serat aktif!
            </p>
          </div>

          {/* Card 3: Flammable IPA */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-blue-400 font-bold">
              <Flame className="w-4 h-4" />
              <span>Alkohol Isopropil 99% (IPA)</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              IPA 99% sangat mudah terbakar dan menguap. Jauhkan botol alkohol dari percikan busur listrik (arc)
              fusion splicer dan sumber api lainnya. Pastikan ventilasi ruangan memadai.
            </p>
          </div>

          {/* Card 4: High Voltage Arc */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-yellow-400 font-bold">
              <Zap className="w-4 h-4" />
              <span>Tegangan Tinggi Elektroda</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Elektroda splicer membangkitkan busur listrik bertegangan tinggi ribuan volt (2000°C). Jangan sentuh
              elektroda saat mesin beroperasi dan selalu pastikan wind protector cover tertutup rapat.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-900/30 transition-colors"
          >
            Saya Memahami Prosedur K3
          </button>
        </div>
      </div>
    </div>
  );
};
