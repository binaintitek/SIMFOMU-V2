import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  UserCheck, 
  Building2, 
  GraduationCap, 
  Target, 
  ShieldCheck, 
  Sparkles, 
  Globe, 
  Mail, 
  MapPin, 
  Cpu, 
  Award,
  CheckCircle2,
  Camera,
  Upload,
  RotateCcw,
  ZoomIn
} from 'lucide-react';

interface DeveloperInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Constant pointing directly to foto ku.PNG.png in public directory
const HARDCODED_DEFAULT_PHOTO = '/foto%20ku.PNG.png';

export const DeveloperInfoModal: React.FC<DeveloperInfoModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Always default strictly to the uploaded photo without alteration
  const [currentPhoto, setCurrentPhoto] = useState<string>(() => {
    try {
      const uploaded = localStorage.getItem('optisim_user_custom_photo');
      if (uploaded && uploaded.startsWith('data:image/')) {
        return uploaded;
      }
    } catch {
      // Ignored
    }
    return HARDCODED_DEFAULT_PHOTO;
  });

  const [showFullPhoto, setShowFullPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showFullPhoto) {
          setShowFullPhoto(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, showFullPhoto]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setCurrentPhoto(base64);
        try {
          localStorage.setItem('optisim_user_custom_photo', base64);
        } catch (err) {
          console.warn('Failed to save dev photo to localStorage', err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetPhoto = () => {
    setCurrentPhoto(HARDCODED_DEFAULT_PHOTO);
    try {
      localStorage.removeItem('optisim_user_custom_photo');
      localStorage.removeItem('optisim_uploaded_dev_photo');
      localStorage.removeItem('optisim_dev_photo');
    } catch (err) {
      console.warn('Failed to remove dev photo from localStorage', err);
    }
  };

  if (!isOpen) return null;

  // Active photo source is currentPhoto (strictly defaults to HARDCODED_DEFAULT_PHOTO)
  const activePhotoSrc = currentPhoto || HARDCODED_DEFAULT_PHOTO;
  const isCustomPhoto = currentPhoto !== HARDCODED_DEFAULT_PHOTO;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="developer-modal-title"
    >
      <div 
        className="relative w-full max-w-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-950/50 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Top Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-amber-400" />

        {/* Close Button at top-right */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup jendela informasi pengembang"
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all shadow-md cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
          {/* Header Tag */}
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Profil Perancang Aplikasi
            </span>
            <span className="text-xs text-slate-500 font-mono">
              OptiSim Pro v1.0
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left Column: Portrait Photo & Badges (5 cols on desktop) */}
            <div className="md:col-span-5 flex flex-col items-center text-center">
              <div className="relative group">
                {/* Subtle outer glow ring */}
                <div className="absolute -inset-1 bg-gradient-to-tr from-cyan-500/40 via-blue-500/30 to-amber-500/30 rounded-3xl blur-sm opacity-60 transition duration-300"></div>
                
                {/* Photo frame: exact aspect ratio matching uploaded image (861x1193), NO cropping, NO dark gradient overlays */}
                <div 
                  className="relative w-48 sm:w-56 aspect-[861/1193] rounded-2xl overflow-hidden border-2 border-cyan-400/60 bg-slate-950 shadow-xl cursor-pointer flex items-center justify-center p-0.5"
                  onClick={() => setShowFullPhoto(true)}
                  title="Klik untuk melihat foto asli ukuran penuh"
                >
                  <img
                    src={activePhotoSrc}
                    alt="Foto Asli Perancang: Achmad Mawardi S.Kom"
                    className="w-full h-full object-contain block mx-auto rounded-xl"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = HARDCODED_DEFAULT_PHOTO;
                    }}
                  />
                </div>
              </div>

              {/* Architectural role badge placed clearly below the photo, not obstructing it */}
              <div className="mt-3 px-3 py-1 rounded-full bg-slate-900/90 border border-cyan-500/40 text-xs font-bold text-cyan-300 shadow-sm">
                Lead Simulator Architect
              </div>

              {/* Hidden file input for uploading custom photo */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />

              {/* Photo action controls below the photo */}
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFullPhoto(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  Lihat Ukuran Penuh
                </button>
                <span className="text-slate-600 text-xs">•</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white hover:underline cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Ganti Foto
                </button>
                {isCustomPhoto && (
                  <>
                    <span className="text-slate-600 text-xs">•</span>
                    <button
                      type="button"
                      onClick={handleResetPhoto}
                      title="Kembalikan foto ke bawaan resmi"
                      className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:underline cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  </>
                )}
              </div>

              {/* Status Verification Badge */}
              <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-3 py-1 rounded-full font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Verified Educator &amp; Developer
              </div>
            </div>

            {/* Right Column: Key Details & Institution (7 cols on desktop) */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <h2 
                  id="developer-modal-title" 
                  className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2"
                >
                  Achmad Mawardi S.Kom
                </h2>
                <p className="text-cyan-400 font-semibold text-sm mt-0.5 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
                  Perancang &amp; Pengembang OptiSim Fiber Pro
                </p>
              </div>

              {/* Instansi / Afiliasi Card */}
              <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Building2 className="w-3.5 h-3.5" />
                  Instansi / Afiliasi:
                </div>
                <p className="text-base font-bold text-white flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-400 shrink-0" />
                  SMKS Muhammadiyah Sampit
                </p>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                  Kotawaringin Timur, Kalimantan Tengah
                </p>
              </div>

              {/* Deskripsi Singkat Tujuan Pengembangan */}
              <div className="bg-blue-950/20 rounded-2xl border border-blue-500/30 p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-300 uppercase tracking-wider">
                  <Target className="w-3.5 h-3.5 text-cyan-400" />
                  Tujuan Pengembangan Simulator:
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Dirancang secara khusus sebagai <strong className="text-white font-semibold">media simulasi interaktif presisi tinggi</strong> yang digunakan sebelum siswa maupun teknisi melakukan <strong className="text-cyan-300 font-semibold">praktik dan uji kompetensi langsung</strong> dengan perangkat fusion splicer dan cleaver yang sesungguhnya.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-[11px] text-slate-300">
                    <span className="text-amber-400 font-bold block">✓ Efisiensi &amp; Keamanan</span>
                    Mencegah kerusakan alat asli &amp; pemborosan kabel optik.
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-[11px] text-slate-300">
                    <span className="text-cyan-400 font-bold block">✓ Standar Industri</span>
                    Kesesuaian SOP Telkom Group &amp; ITU-T G.652D.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info / Contact Strip */}
          <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
              <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Kontak / Korespondensi:</span>
                <span className="text-slate-300 font-mono">binaintitek@gmail.com</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
              <Globe className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Lembaga Pendidikan:</span>
                <span className="text-slate-300 font-medium">SMKS Muhammadiyah Sampit</span>
              </div>
            </div>
          </div>

          {/* Copyright & Action Buttons */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="text-[11px] text-slate-500">
              <p className="font-semibold text-slate-400">OptiSim Fiber Pro v1.0 • Edisi Laboratorium Vokasi</p>
              <p>© {new Date().getFullYear()} Achmad Mawardi S.Kom • Hak Cipta Dilindungi Undang-Undang</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-900/30 cursor-pointer active:scale-95"
            >
              Tutup Informasi
            </button>
          </div>
        </div>
      </div>

      {/* High-Resolution Full Photo Lightbox */}
      {showFullPhoto && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-lg animate-in fade-in duration-200"
          onClick={() => setShowFullPhoto(false)}
        >
          <div 
            className="relative max-w-lg w-full bg-slate-900 border-2 border-cyan-500/60 rounded-3xl overflow-hidden shadow-2xl shadow-cyan-950"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-white">Foto Asli Perancang (Resolusi Penuh)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowFullPhoto(false)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 flex flex-col items-center">
              <div className="w-full flex items-center justify-center rounded-2xl overflow-hidden border border-cyan-400/40 bg-slate-900/50 p-1">
                <img
                  src={activePhotoSrc}
                  alt="Foto Asli Perancang: Achmad Mawardi S.Kom"
                  className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl block mx-auto"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = HARDCODED_DEFAULT_PHOTO;
                  }}
                />
              </div>
              <div className="mt-3 text-center">
                <h4 className="text-base font-extrabold text-white">Achmad Mawardi S.Kom</h4>
                <p className="text-xs text-cyan-400 font-medium">SMKS Muhammadiyah Sampit • Kalimantan Tengah</p>
                <p className="text-[11px] text-slate-400 mt-1">Lead Architect &amp; Developer OptiSim Fiber Pro</p>
              </div>
            </div>

            <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFullPhoto(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

