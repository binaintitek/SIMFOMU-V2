import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  X, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw,
  Sparkles,
  ChevronRight,
  Settings,
  HelpCircle
} from 'lucide-react';
import { 
  loginAdmin, 
  setAdminPin, 
  resetAdminPinToDefault, 
  DEFAULT_ADMIN_PIN 
} from '../utils/adminAuth';
import { soundEffects } from '../utils/audio';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);

  // Change PIN states
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [changePinMsg, setChangePinMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg('');
      setSuccessMsg('');
      setIsChangingPin(false);
      setChangePinMsg(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmitLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!pin.trim()) {
      setErrorMsg('Silakan masukkan 4 digit PIN Admin.');
      soundEffects.playError();
      return;
    }

    const res = loginAdmin(pin);
    if (res.success) {
      soundEffects.playSuccessBeep();
      setSuccessMsg(res.message);
      setTimeout(() => {
        onLoginSuccess();
        onClose();
      }, 600);
    } else {
      soundEffects.playError();
      setErrorMsg(res.message);
    }
  };

  const handleKeypadPress = (val: string) => {
    soundEffects.playClick();
    setErrorMsg('');
    if (val === 'CLEAR') {
      setPin('');
    } else if (val === 'BACK') {
      setPin((prev) => prev.slice(0, -1));
    } else {
      if (pin.length < 8) {
        setPin((prev) => prev + val);
      }
    }
  };

  const handleQuickFillDefault = () => {
    soundEffects.playClick();
    setPin(DEFAULT_ADMIN_PIN);
    setErrorMsg('');
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePinMsg(null);

    if (newPin !== confirmNewPin) {
      soundEffects.playError();
      setChangePinMsg({ type: 'error', text: 'Konfirmasi PIN baru tidak sama.' });
      return;
    }

    const res = setAdminPin(newPin, oldPin);
    if (res.success) {
      soundEffects.playSuccessBeep();
      setChangePinMsg({ type: 'success', text: res.message });
      setOldPin('');
      setNewPin('');
      setConfirmNewPin('');
      setTimeout(() => {
        setIsChangingPin(false);
        setChangePinMsg(null);
      }, 1500);
    } else {
      soundEffects.playError();
      setChangePinMsg({ type: 'error', text: res.message });
    }
  };

  const handleResetPinDefault = () => {
    soundEffects.playClick();
    resetAdminPinToDefault();
    setChangePinMsg({ type: 'success', text: 'PIN berhasil direset ke default "1234".' });
    setOldPin('');
    setNewPin('');
    setConfirmNewPin('');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn font-sans">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative text-slate-200">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-slate-900 p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-950 border border-blue-400/40 flex items-center justify-center p-1 shadow-inner shrink-0">
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
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Login Admin / Penguji
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold border border-blue-400/30">
                  SMK INDUSTRI
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Otoritas Penguji Uji Kompetensi Telkom
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {!isChangingPin ? (
            <>
              {/* Info Banner */}
              <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-2xl text-xs text-slate-300 flex items-start gap-2.5">
                <KeyRound className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="text-white font-bold block mb-0.5">Akses Terlindungi Penguji:</span>
                  Admin berwenang mengelola antrean peserta, mengatur parameter soal ujian, serta mencetak rekapitulasi nilai seluruh peserta.
                </div>
              </div>

              {/* Form Input PIN */}
              <form onSubmit={handleSubmitLogin} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Masukkan PIN Admin:
                    </label>
                    <button
                      type="button"
                      onClick={handleQuickFillDefault}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
                      title="Isi otomatis dengan PIN default: 1234"
                    >
                      Default: 1234
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      ref={inputRef}
                      type={showPin ? 'text' : 'password'}
                      value={pin}
                      onChange={(e) => {
                        setPin(e.target.value);
                        setErrorMsg('');
                      }}
                      maxLength={10}
                      placeholder="Ketik 4 digit PIN..."
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-2xl px-4 py-3.5 text-center text-xl font-mono tracking-widest text-white placeholder:text-slate-600 focus:outline-hidden focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                    >
                      {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {errorMsg && (
                    <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5 animate-shake">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}
                </div>

                {/* Quick Touch Keypad for ease of use */}
                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleKeypadPress(digit)}
                      className="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-base font-mono font-bold text-white transition-colors border border-slate-700/60 active:scale-95"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('CLEAR')}
                    className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-rose-400 transition-colors border border-slate-800"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('0')}
                    className="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-base font-mono font-bold text-white transition-colors border border-slate-700/60 active:scale-95"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('BACK')}
                    className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-amber-400 transition-colors border border-slate-800"
                  >
                    ⌫ Hapus
                  </button>
                </div>

                {/* Action Submit */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      onClose();
                    }}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors border border-slate-700"
                  >
                    Batal (Mode Latihan)
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Login Penguji</span>
                  </button>
                </div>
              </form>

              {/* Bottom option to change PIN */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="text-slate-500">OptiSim Fiber v4.2 Security</span>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setIsChangingPin(true);
                  }}
                  className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 underline cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Ubah PIN Admin</span>
                </button>
              </div>
            </>
          ) : (
            /* Change PIN Sub-form */
            <form onSubmit={handleChangePinSubmit} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-blue-400" />
                  Ubah PIN Admin Baru
                </h4>
                <button
                  type="button"
                  onClick={() => setIsChangingPin(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ← Kembali
                </button>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">PIN Lama:</label>
                <input
                  type="password"
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="PIN saat ini (default: 1234)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">PIN Baru (min 4 digit):</label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Masukkan PIN baru"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Konfirmasi PIN Baru:</label>
                <input
                  type="password"
                  value={confirmNewPin}
                  onChange={(e) => setConfirmNewPin(e.target.value)}
                  placeholder="Ulangi PIN baru"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  required
                />
              </div>

              {changePinMsg && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center gap-1.5 ${
                    changePinMsg.type === 'success'
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                      : 'bg-rose-950/60 text-rose-400 border border-rose-800'
                  }`}
                >
                  {changePinMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{changePinMsg.text}</span>
                </div>
              )}

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetPinDefault}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700"
                  title="Kembalikan PIN ke 1234"
                >
                  Reset Default
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors shadow-md"
                >
                  Simpan PIN Baru
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
