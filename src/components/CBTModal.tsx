import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  BookOpen,
  FileText,
  ShieldCheck,
  Zap,
  ArrowRight,
  Trash2,
  Sparkles,
  Trophy,
  Info
} from 'lucide-react';
import { CBTTestType, CBTQuestion, CBTSessionResult, CBTAnswerRecord } from '../types/cbt';
import { PRE_TEST_QUESTIONS, POST_TEST_QUESTIONS, loadCBTHistory, saveCBTResult, getTraineeCBTComparison } from '../data/cbtQuestions';
import { soundEffects } from '../utils/audio';

interface CBTModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantName?: string;
  participantId?: string;
  onSessionLogged?: (result: CBTSessionResult) => void;
}

export const CBTModal: React.FC<CBTModalProps> = ({
  isOpen,
  onClose,
  participantName = 'Teknisi Fiber Optik',
  participantId = 'FO-TECH-01',
  onSessionLogged,
}) => {
  // Modal View States: 'selection' | 'taking' | 'result' | 'history'
  const [view, setView] = useState<'selection' | 'taking' | 'result' | 'history'>('selection');
  const [activeTestType, setActiveTestType] = useState<CBTTestType>('pre-test');
  
  // Test Taking State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState<boolean>(false);

  // Completed Session Result for Review
  const [lastResult, setLastResult] = useState<CBTSessionResult | null>(null);

  // History state for the history tab
  const [historyList, setHistoryList] = useState<CBTSessionResult[]>([]);

  // Active question set based on activeTestType
  const questions: CBTQuestion[] = useMemo(() => {
    return activeTestType === 'pre-test' ? PRE_TEST_QUESTIONS : POST_TEST_QUESTIONS;
  }, [activeTestType]);

  // Load history when modal opens or view changes
  useEffect(() => {
    if (isOpen) {
      setHistoryList(loadCBTHistory());
    }
  }, [isOpen, view]);

  // Timer effect
  useEffect(() => {
    let timer: any = null;
    if (isTimerRunning && view === 'taking') {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTimerRunning, view]);

  if (!isOpen) return null;

  // Comparison for the current participant
  const currentComparison = getTraineeCBTComparison(participantName);

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Start test handler
  const handleStartTest = (type: CBTTestType) => {
    soundEffects.playClick();
    setActiveTestType(type);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setElapsedSeconds(0);
    setIsTimerRunning(true);
    setShowConfirmFinish(false);
    setView('taking');
  };

  // Select an answer option
  const handleSelectOption = (optionIndex: number) => {
    soundEffects.playClick();
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionIndex,
    }));
  };

  // Complete & Calculate Score
  const handleFinishTest = () => {
    soundEffects.playClick();
    setIsTimerRunning(false);

    let correctCount = 0;
    const answerRecords: CBTAnswerRecord[] = questions.map((q, idx) => {
      const selected = userAnswers[idx] !== undefined ? userAnswers[idx] : -1;
      const isCorrect = selected === q.correctAnswer;
      if (isCorrect) correctCount++;
      return {
        questionId: q.id,
        selectedAnswer: selected,
        isCorrect,
      };
    });

    const score = Math.round((correctCount / questions.length) * 100);

    const now = new Date();
    const formattedDate = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const result: CBTSessionResult = {
      sessionId: `CBT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      participantName: participantName || 'Teknisi Fiber Optik',
      participantId: participantId || 'FO-TECH-01',
      testType: activeTestType,
      score,
      correctCount,
      totalQuestions: questions.length,
      answers: answerRecords,
      durationSeconds: elapsedSeconds,
      completedAt: now.toISOString(),
      formattedDate,
    };

    saveCBTResult(result);
    setLastResult(result);
    setHistoryList(loadCBTHistory());

    if (score >= 70) {
      soundEffects.playSuccessBeep();
    } else {
      soundEffects.playError();
    }

    if (onSessionLogged) {
      onSessionLogged(result);
    }

    setShowConfirmFinish(false);
    setView('result');
  };

  // Clear history
  const handleClearHistory = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus seluruh riwayat CBT?')) {
      localStorage.removeItem('optisim_cbt_history');
      setHistoryList([]);
      soundEffects.playClick();
    }
  };

  const currentQ = questions[currentQuestionIndex];
  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-cyan-950/40 text-slate-100 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-wide text-white flex items-center gap-2">
                  OptiSim CBT
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-semibold uppercase tracking-wider">
                    Computer Based Test
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Sistem Evaluasi Standar Kompetensi Fiber Optik Telkom Akses / ITU-T G.652.D
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {view !== 'taking' && (
              <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs">
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    setView('selection');
                  }}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    view === 'selection' || view === 'result'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Daftar Ujian
                </button>
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    setView('history');
                  }}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    view === 'history'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Riwayat ({historyList.length})
                </button>
              </div>
            )}

            <button
              onClick={() => {
                soundEffects.playClick();
                if (view === 'taking') {
                  if (window.confirm('Ujian sedang berlangsung. Keluar sekarang akan membatalkan sesi ujian ini?')) {
                    setIsTimerRunning(false);
                    onClose();
                  }
                } else {
                  onClose();
                }
              }}
              className="cursor-pointer p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
          
          {/* VIEW 1: SELECTION MENU */}
          {view === 'selection' && (
            <div className="space-y-6">
              {/* Trainee Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center font-bold text-blue-300">
                    {participantName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Peserta Ujian Aktif</div>
                    <div className="text-base font-bold text-white flex items-center gap-2">
                      {participantName}
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                        {participantId}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trainee Progress Comparison Quick Card */}
                <div className="flex items-center gap-4 text-xs bg-slate-900/80 px-3.5 py-2 rounded-lg border border-slate-700/50">
                  <div>
                    <span className="text-slate-400 block">Pre-Test:</span>
                    <span className="font-bold font-mono text-cyan-400 text-sm">
                      {currentComparison.preTestScore !== null ? `${currentComparison.preTestScore} Poin` : 'Belum'}
                    </span>
                  </div>
                  <div className="w-px h-6 bg-slate-700" />
                  <div>
                    <span className="text-slate-400 block">Post-Test:</span>
                    <span className="font-bold font-mono text-emerald-400 text-sm">
                      {currentComparison.postTestScore !== null ? `${currentComparison.postTestScore} Poin` : 'Belum'}
                    </span>
                  </div>
                  {currentComparison.scoreDelta !== null && (
                    <>
                      <div className="w-px h-6 bg-slate-700" />
                      <div>
                        <span className="text-slate-400 block">Kemajuan:</span>
                        <span className={`font-black font-mono text-sm flex items-center gap-1 ${
                          currentComparison.scoreDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          <TrendingUp className="w-3.5 h-3.5" />
                          {currentComparison.scoreDelta >= 0 ? `+${currentComparison.scoreDelta}` : currentComparison.scoreDelta} Poin
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Mode Selection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* 1. Pre-Test (Free Test) */}
                <div className="relative group rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-cyan-500/30 hover:border-cyan-400 p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-cyan-950/50">
                  <div className="absolute top-4 right-4">
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-bold uppercase tracking-wider">
                      Uji Kemampuan Awal
                    </span>
                  </div>

                  <div>
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-105 transition-transform">
                      <Zap className="w-6 h-6" />
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                      🚀 Pre-Test (Free Test)
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      Digunakan peserta sebelum memulai pelatihan untuk mengukur pemahaman awal mengenai standar single-mode ITU-T G.652.D, penggunaan tang Miller Stripper CFS-3, cairan IPA 99.8%, batas toleransi sudut potong cleaver, dan batas redaman Telkom Akses.
                    </p>

                    <div className="space-y-2 text-xs text-slate-400 mb-6 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span>Jumlah Pertanyaan:</span>
                        <span className="font-bold text-white font-mono">10 Soal Pilihan Ganda</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Standar Rujukan:</span>
                        <span className="font-bold text-cyan-300 font-mono">ITU-T G.652.D / STEL-L-040</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Passing Grade:</span>
                        <span className="font-bold text-emerald-400 font-mono">70 / 100</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartTest('pre-test')}
                    className="cursor-pointer w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group-hover:gap-3"
                  >
                    <span>Mulai Pre-Test Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 2. Post-Test (Evaluasi Akhir) */}
                <div className="relative group rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-amber-500/30 hover:border-amber-400 p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-amber-950/50">
                  <div className="absolute top-4 right-4">
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold uppercase tracking-wider">
                      Evaluasi Kompetensi Akhir
                    </span>
                  </div>

                  <div>
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-105 transition-transform">
                      <Trophy className="w-6 h-6" />
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                      🏆 Post-Test (Evaluasi Akhir)
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      Evaluasi komprehensif setelah menyelesaikan simulasi splicing: troubleshooting V-groove & PAS alignment, analisis penalti lateral Marcuse, mitigasi nicked fiber, deteksi voltage drop busur api, urutan SOP end-to-end, dan pembacaan event trace OTDR.
                    </p>

                    <div className="space-y-2 text-xs text-slate-400 mb-6 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span>Jumlah Pertanyaan:</span>
                        <span className="font-bold text-white font-mono">10 Soal Analisis Kasus</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Standar Rujukan:</span>
                        <span className="font-bold text-amber-300 font-mono">Telkom QA & OTDR Diagnostics</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Pengukuran Kemajuan:</span>
                        <span className="font-bold text-emerald-400 font-mono">Otomatis Bandingkan vs Pre-Test</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartTest('post-test')}
                    className="cursor-pointer w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group-hover:gap-3"
                  >
                    <span>Mulai Post-Test Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>

              {/* Informational Guidance Note */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
                <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-200">SOP Pelaksanaan Ujian CBT:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-400">
                    <li>Peserta dianjurkan menyelesaikan Pre-Test sebelum melatih teknik splicing pada simulator.</li>
                    <li>Setelah menguasai prosedur stripping, cleaving, dan arc fusion, selesaikan Post-Test untuk melihat selisih peningkatan poin (score delta).</li>
                    <li>Seluruh riwayat ujian tersimpan dan dapat ditinjau untuk sertifikasi kompetensi teknisi.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: TEST IN PROGRESS (TAKING) */}
          {view === 'taking' && currentQ && (
            <div className="space-y-5">
              {/* Top Status Bar: Test info, Timer, Progress */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/70">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${
                    activeTestType === 'pre-test'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {activeTestType === 'pre-test' ? '🚀 Pre-Test (Free Test)' : '🏆 Post-Test (Evaluasi Akhir)'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Soal <strong className="text-white font-mono">{currentQuestionIndex + 1}</strong> dari {questions.length}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Timer */}
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 rounded-lg border border-slate-700 text-slate-200 text-xs font-mono font-bold">
                    <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>{formatTime(elapsedSeconds)}</span>
                  </div>

                  {/* Answered Counter */}
                  <div className="text-xs text-slate-300 font-mono">
                    Dijawab: <span className="text-emerald-400 font-bold">{answeredCount}</span>/{questions.length}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>

              {/* Question Palette Buttons (1-10) */}
              <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950/60 rounded-xl border border-slate-800 justify-center">
                {questions.map((_, idx) => {
                  const isAnswered = userAnswers[idx] !== undefined;
                  const isCurrent = idx === currentQuestionIndex;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        soundEffects.playClick();
                        setCurrentQuestionIndex(idx);
                      }}
                      className={`cursor-pointer w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center font-mono ${
                        isCurrent
                          ? 'ring-2 ring-cyan-400 bg-cyan-600 text-white shadow-md'
                          : isAnswered
                          ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                          : 'bg-slate-800/80 border border-slate-700 text-slate-400 hover:bg-slate-700'
                      }`}
                      title={`Soal ${idx + 1}: ${isAnswered ? 'Sudah dijawab' : 'Belum dijawab'}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Question Card */}
              <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/80 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 rounded bg-slate-700/60 text-slate-300 font-semibold uppercase tracking-wider">
                    Kategori: {currentQ.category}
                  </span>
                  {currentQ.referenceStd && (
                    <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono text-[11px]">
                      {currentQ.referenceStd}
                    </span>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                  {currentQ.question}
                </h3>

                {/* Options List */}
                <div className="space-y-2.5 pt-2">
                  {currentQ.options.map((optionText, optIdx) => {
                    const isSelected = userAnswers[currentQuestionIndex] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(optIdx)}
                        className={`cursor-pointer w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-md ring-1 ring-cyan-500/50'
                            : 'bg-slate-900/70 border-slate-700/70 hover:bg-slate-800/70 text-slate-200'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 transition-colors ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 font-black'
                            : 'bg-slate-800 border border-slate-700 text-slate-400'
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </div>
                        <span className="text-sm leading-relaxed">{optionText.substring(3)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation & Action Bar */}
              <div className="flex items-center justify-between pt-2">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => {
                    soundEffects.playClick();
                    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
                  }}
                  className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    currentQuestionIndex === 0
                      ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>

                <div className="flex items-center gap-2">
                  {currentQuestionIndex < questions.length - 1 ? (
                    <button
                      onClick={() => {
                        soundEffects.playClick();
                        setCurrentQuestionIndex((prev) => prev + 1);
                      }}
                      className="cursor-pointer px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow flex items-center gap-1.5"
                    >
                      <span>Selanjutnya</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowConfirmFinish(true)}
                      className="cursor-pointer px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all shadow-md flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Selesaikan Ujian</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Confirm Finish Modal Overlay */}
              {showConfirmFinish && (
                <div className="p-4 rounded-xl bg-amber-950/70 border border-amber-500/50 text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                    <div className="text-xs">
                      {answeredCount < questions.length ? (
                        <span>
                          Perhatian: Anda baru menjawab <strong>{answeredCount}</strong> dari {questions.length} soal. Masih ada {questions.length - answeredCount} soal kosong!
                        </span>
                      ) : (
                        <span>
                          Semua {questions.length} soal telah dijawab. Apakah Anda yakin ingin mengunci jawaban dan menghitung skor?
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setShowConfirmFinish(false)}
                      className="cursor-pointer px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                    >
                      Kembali Periksa
                    </button>
                    <button
                      onClick={handleFinishTest}
                      className="cursor-pointer px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow"
                    >
                      Ya, Selesaikan
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: RESULT & PERFORMANCE COMPARISON */}
          {view === 'result' && lastResult && (
            <div className="space-y-6">
              
              {/* Score Summary Banner */}
              <div className={`p-6 rounded-2xl border text-center relative overflow-hidden ${
                lastResult.score >= 70
                  ? 'bg-gradient-to-b from-emerald-950/60 to-slate-900 border-emerald-500/40 shadow-emerald-950/30'
                  : 'bg-gradient-to-b from-rose-950/60 to-slate-900 border-rose-500/40 shadow-rose-950/30'
              } shadow-xl`}>
                
                <div className="flex justify-center mb-3">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                    lastResult.score >= 70
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}>
                    {lastResult.score >= 70 ? (
                      <Award className="w-8 h-8" />
                    ) : (
                      <AlertCircle className="w-8 h-8" />
                    )}
                  </div>
                </div>

                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Hasil Evaluasi {lastResult.testType === 'pre-test' ? '🚀 Pre-Test (Free Test)' : '🏆 Post-Test (Evaluasi Akhir)'}
                </div>
                
                <div className="text-4xl sm:text-5xl font-black font-mono text-white mb-2">
                  {lastResult.score} <span className="text-xl text-slate-400 font-normal">/ 100</span>
                </div>

                <p className="text-sm font-semibold mb-4">
                  {lastResult.score >= 80 ? (
                    <span className="text-emerald-400">KOMPETENSI SANGAT MEMUASKAN (TELKOM COMPLIANT)</span>
                  ) : lastResult.score >= 70 ? (
                    <span className="text-teal-400">LULUS STANDAR MINIMUM TEKNISI</span>
                  ) : (
                    <span className="text-rose-400">BELUM MEMENUHI STANDAR KELULUSAN TELKOM (PERLU REMEDIAL)</span>
                  )}
                </p>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-2 max-w-md mx-auto text-xs bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <div>
                    <div className="text-slate-400">Jawaban Benar</div>
                    <div className="font-bold text-emerald-400 font-mono text-sm mt-0.5">
                      {lastResult.correctCount} / {lastResult.totalQuestions}
                    </div>
                  </div>
                  <div className="border-x border-slate-800">
                    <div className="text-slate-400">Waktu Pengerjaan</div>
                    <div className="font-bold text-cyan-300 font-mono text-sm mt-0.5">
                      {formatTime(lastResult.durationSeconds)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Akurasi Soal</div>
                    <div className="font-bold text-purple-400 font-mono text-sm mt-0.5">
                      {Math.round((lastResult.correctCount / lastResult.totalQuestions) * 100)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* COMPETENCY DELTA COMPARISON (PRE vs POST) */}
              {lastResult.testType === 'post-test' && currentComparison.preTestScore !== null && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-cyan-950/50 border border-emerald-500/40">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white">
                      Analisis Peningkatan Kompetensi (Pre-Test vs Post-Test)
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mt-3">
                    <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-700/60">
                      <span className="text-slate-400 block">Skor Kemampuan Awal (Pre-Test):</span>
                      <span className="text-base font-bold font-mono text-cyan-400 mt-0.5 block">
                        {currentComparison.preTestScore} Poin
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-700/60">
                      <span className="text-slate-400 block">Skor Evaluasi Akhir (Post-Test):</span>
                      <span className="text-base font-bold font-mono text-emerald-400 mt-0.5 block">
                        {lastResult.score} Poin
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900/90 rounded-lg border border-emerald-500/40 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block">Pertumbuhan Kemampuan:</span>
                        <div className={`text-lg font-black font-mono flex items-center gap-1 mt-0.5 ${
                          (lastResult.score - currentComparison.preTestScore) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          <TrendingUp className="w-4 h-4" />
                          {(lastResult.score - currentComparison.preTestScore) >= 0
                            ? `+${lastResult.score - currentComparison.preTestScore} Poin`
                            : `${lastResult.score - currentComparison.preTestScore} Poin`}
                        </div>
                      </div>
                      <div className="text-[10px] px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase">
                        {(lastResult.score - currentComparison.preTestScore) > 0 ? 'Peningkatan Nyata' : 'Tetap/Remedial'}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mt-3 italic">
                    {(lastResult.score - currentComparison.preTestScore) > 0
                      ? 'Selamat! Sesi simulasi splicing berhasil meningkatkan pemahaman teknis dan kesiapan Anda dalam SOP Telkom Akses.'
                      : 'Pertahankan disiplin operasional, review materi SOP cleaving, V-groove cleaning, dan OTDR di bawah ini.'}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      soundEffects.playClick();
                      setView('selection');
                    }}
                    className="cursor-pointer px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Pilih Mode Ujian Lain</span>
                  </button>

                  {lastResult.testType === 'pre-test' && (
                    <button
                      onClick={() => handleStartTest('post-test')}
                      className="cursor-pointer px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Lanjut ke Post-Test Evaluasi</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    soundEffects.playClick();
                    onClose();
                  }}
                  className="cursor-pointer px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow"
                >
                  Tutup & Lanjut Simulasi Splicing
                </button>
              </div>

              {/* Detailed Review Section */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-sm font-bold text-white">
                    Tinjauan Jawaban & Pembahasan Teknis SOP Lapangan
                  </h4>
                </div>

                <div className="space-y-4">
                  {questions.map((q, idx) => {
                    const ansRec = lastResult.answers[idx];
                    const isCorrect = ansRec?.isCorrect ?? false;
                    const selectedIdx = ansRec?.selectedAnswer ?? -1;

                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-xl border ${
                          isCorrect
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : 'bg-rose-950/20 border-rose-500/30'
                        } space-y-3`}
                      >
                        <div className="flex items-start justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 font-mono">
                            <span className="font-bold text-slate-300">Soal {idx + 1}</span>
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                              {q.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 font-bold">
                            {isCorrect ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Benar (+10 Poin)
                              </span>
                            ) : (
                              <span className="text-rose-400 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" /> Salah (0 Poin)
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm font-semibold text-slate-200">
                          {q.question}
                        </p>

                        {/* Options comparison */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {q.options.map((optText, optIdx) => {
                            const isUserChoice = selectedIdx === optIdx;
                            const isCorrectChoice = q.correctAnswer === optIdx;

                            let cardClass = 'bg-slate-900/60 border-slate-800 text-slate-400';
                            if (isCorrectChoice) {
                              cardClass = 'bg-emerald-950/50 border-emerald-500/60 text-emerald-200 font-semibold';
                            } else if (isUserChoice && !isCorrect) {
                              cardClass = 'bg-rose-950/50 border-rose-500/60 text-rose-200 font-semibold';
                            }

                            return (
                              <div
                                key={optIdx}
                                className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${cardClass}`}
                              >
                                <span>{optText}</span>
                                {isCorrectChoice && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold shrink-0">
                                    Kunci Jawaban
                                  </span>
                                )}
                                {isUserChoice && !isCorrect && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold shrink-0">
                                    Jawaban Anda
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation Box */}
                        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Penjelasan Teknis & SOP Operasional:</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed">
                            {q.explanation}
                          </p>
                          {q.referenceStd && (
                            <div className="text-[11px] text-slate-400 pt-0.5 font-mono">
                              Referensi: {q.referenceStd}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: CBT HISTORY */}
          {view === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Riwayat Sesi Ujian CBT</h3>
                  <p className="text-xs text-slate-400">
                    Daftar evaluasi kompetensi mandiri yang telah diselesaikan oleh peserta.
                  </p>
                </div>

                {historyList.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-500/30 flex items-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Riwayat</span>
                  </button>
                )}
              </div>

              {historyList.length === 0 ? (
                <div className="p-10 text-center rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-300">Belum Ada Riwayat Ujian</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Mulai kerjakan Pre-Test atau Post-Test untuk mencatat skor kemampuan dan melacak peningkatan kompetensi teknisi.
                  </p>
                  <button
                    onClick={() => {
                      soundEffects.playClick();
                      setView('selection');
                    }}
                    className="cursor-pointer px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold"
                  >
                    Mulai Ujian Sekarang
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyList.map((item) => (
                    <div
                      key={item.sessionId}
                      className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/70 hover:border-slate-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          item.score >= 70
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}>
                          {item.score}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              item.testType === 'pre-test'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}>
                              {item.testType === 'pre-test' ? 'Pre-Test' : 'Post-Test'}
                            </span>
                            <span className="text-xs font-bold text-white">{item.participantName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3 font-mono">
                            <span>ID: {item.participantId}</span>
                            <span>•</span>
                            <span>{item.correctCount}/{item.totalQuestions} Benar</span>
                            <span>•</span>
                            <span>{formatTime(item.durationSeconds)}</span>
                            <span>•</span>
                            <span>{item.formattedDate}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          soundEffects.playClick();
                          setActiveTestType(item.testType);
                          setLastResult(item);
                          setView('result');
                        }}
                        className="cursor-pointer px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold self-end sm:self-center transition-all"
                      >
                        Tinjau Jawaban
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
