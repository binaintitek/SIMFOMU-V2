import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ParticipantRecord, SplicingStep, TechnicianState } from './types/fiber';
import { ActionLogItem, AddActionLogFn } from './types/actionLog';
import { Header } from './components/Header';
import { StepNavigation } from './components/StepNavigation';
import { AccuracySidebar } from './components/AccuracySidebar';
import { Footer } from './components/Footer';
import { StrippingStage } from './components/stages/StrippingStage';
import { CleaningStage } from './components/stages/CleaningStage';
import { CleavingStage } from './components/stages/CleavingStage';
import { FusionSplicerStage } from './components/stages/FusionSplicerStage';
import { HeatShrinkStage } from './components/stages/HeatShrinkStage';
import { AssessmentCertificate } from './components/stages/AssessmentCertificate';
import { SafetyGuideModal } from './components/SafetyGuideModal';
import { DefectKnowledgeModal } from './components/DefectKnowledgeModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { OTDRModal } from './components/OTDRModal';
import { ParticipantModal } from './components/ParticipantModal';
import { ParticipantQueueModal } from './components/ParticipantQueueModal';
import { QuickStartTutorial } from './components/QuickStartTutorial';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AccessRestrictedModal } from './components/AccessRestrictedModal';
import { ExamSettingsModal } from './components/ExamSettingsModal';
import { ExamRecapPrintModal } from './components/ExamRecapPrintModal';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { EquipmentFailureHUD } from './components/EquipmentFailureHUD';
import { ErrorFeedbackBanner } from './components/ErrorFeedbackBanner';
import { ErrorScenarioModal } from './components/ErrorScenarioModal';
import { TrainingHistoryModal } from './components/TrainingHistoryModal';
import { CBTModal } from './components/CBTModal';
import { 
  isAdminLoggedIn, 
  logoutAdmin, 
  getExamSettings, 
  ExamSettings 
} from './utils/adminAuth';
import { soundEffects } from './utils/audio';
import { 
  loadParticipantQueue, 
  setParticipantActiveInQueue, 
  markParticipantCompletedInQueue 
} from './utils/participantQueue';
import { calculateSpliceAccuracy, checkStepPassingCriteria, RESET_PROGRESS_STATE } from './utils/standards';

const STEP_ORDER_ARRAY: SplicingStep[] = ['stripping', 'cleaning', 'cleaving', 'splicing', 'heating', 'assessment'];

const getInitialParticipant = () => {
  try {
    const saved = localStorage.getItem('optisim_participant_info');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.traineeName && parsed.traineeName !== 'Ahmad Rifai') {
        return {
          traineeName: parsed.traineeName,
          traineeId: parsed.traineeId || '',
          companyOrInstitution: parsed.companyOrInstitution || '',
        };
      }
    }
  } catch (e) {
    // fallback
  }
  return {
    traineeName: '',
    traineeId: '',
    companyOrInstitution: '',
  };
};

const initialParticipant = getInitialParticipant();

const INITIAL_LOGS: ActionLogItem[] = [
  {
    id: 'log-init-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    step: 'stripping',
    severity: 'success',
    message: 'Kabel berhasil dikupas 32mm (serat kiri)',
    dataBadge: '32mm',
    detail: 'Pengupasan primary coating 250µm menggunakan stripper 3-hole hole no.3 selesai presisi.',
  },
  {
    id: 'log-init-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    step: 'cleaning',
    severity: 'success',
    message: 'Pembersihan serat kiri selesai: Kebersihan 95%',
    dataBadge: '95%',
    detail: 'Penyekaan satu arah dengan tisu Kimwipes berpelarut alkohol 99.8% IPA berhasil.',
  },
  {
    id: 'log-init-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 1).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    step: 'cleaving',
    severity: 'success',
    message: 'Sudut potong 0.4 derajat (serat kiri)',
    dataBadge: '0.4°',
    detail: 'Pemotongan presisi tinggi menggunakan precision cleaver pada posisi mistar 16mm.',
  },
];

const INITIAL_STATE: TechnicianState = {
  traineeName: initialParticipant.traineeName,
  traineeId: initialParticipant.traineeId,
  companyOrInstitution: initialParticipant.companyOrInstitution,
  mode: 'training',
  fiberType: 'G652D_SM',
  soundEnabled: true,

  // Left fiber pre-prepped partially for smooth onboarding; right fiber to be done or both can be tested
  leftStrippedLength: 32,
  rightStrippedLength: 0,
  strippingQualityLeft: 'perfect',
  strippingQualityRight: 'unstripped',

  leftCleanliness: 95,
  rightCleanliness: 0,
  cleaningTechniqueCorrect: true,

  leftCleaveAngle: 0.4,
  rightCleaveAngle: 0.3,
  leftCleaveLength: 16,
  rightCleaveLength: 0,
  cleaveBladeCondition: 'sharp',

  coverClosed: true,
  viewMode: 'X',
  motorAligned: false,
  xOffset: 0.22,
  yOffset: 0.18,
  zGap: 20,
  arcPerformed: false,
  tensionTested: false,
  estimatedLoss: 0.02,
  spliceSuccess: false,
  defectType: 'none',

  sleevePositioned: false,
  heaterClosed: false,
  heatingProgress: 0,
  heatingCompleted: false,

  scores: {
    stripping: 90,
    cleaning: 85,
    cleaving: 92,
    splicing: 95,
    heating: 0,
    total: 82,
    grade: 'A',
    telkomCompliant: true,
  },

  // Time-Trial tracking: Default STANDBY (DO NOT auto-start on load)
  timeTrialDuration: 0,
  timeTrialStartTime: null,
  timeTrialRunning: false,
  timeTrialCompleted: false,
};

export default function App() {
  const [currentStep, setCurrentStep] = useState<SplicingStep>('stripping');
  const [state, setState] = useState<TechnicianState>(INITIAL_STATE);
  const [logs, setLogs] = useState<ActionLogItem[]>(INITIAL_LOGS);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'metrics' | 'logs'>('metrics');
  const [isSafetyOpen, setIsSafetyOpen] = useState<boolean>(false);
  const [isDefectsOpen, setIsDefectsOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isOTDROpen, setIsOTDROpen] = useState<boolean>(false);
  const [isErrorScenarioModalOpen, setIsErrorScenarioModalOpen] = useState<boolean>(false);
  const [isTrainingHistoryOpen, setIsTrainingHistoryOpen] = useState<boolean>(false);
  const [isCBTOpen, setIsCBTOpen] = useState<boolean>(false);

  // Auto-show Participant Registration Modal on first application open
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('optisim_has_registered');
    } catch (e) {
      return true;
    }
  });

  // Participant Queue State (Roster & Multi-Candidate Queue)
  const [participantQueue, setParticipantQueue] = useState<ParticipantRecord[]>(() => {
    return loadParticipantQueue();
  });
  const [activeParticipantId, setActiveParticipantId] = useState<string | undefined>(() => {
    const queue = loadParticipantQueue();
    const inProg = queue.find((p) => p.status === 'in_progress');
    if (inProg) return inProg.id;
    const match = queue.find((p) => p.traineeId === initialParticipant.traineeId);
    return match?.id;
  });
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);

  // Interactive Quick Start Tutorial State
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);

  const handleOpenTutorial = () => {
    setIsTutorialOpen(true);
    addActionLog('Tutorial interaktif Quick Start dibuka', {
      step: currentStep,
      severity: 'info',
      dataBadge: 'Quick Start',
      detail: 'Panduan visual interaktif memandu setiap langkah penyambungan dengan highlight tombol.',
    });
  };

  const handleCloseTutorial = () => {
    setIsTutorialOpen(false);
  };

  // Mode Malam Lapangan (High-Contrast OLED Black for Low-Light Field Work)
  const [isNightMode, setIsNightMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('optisim_night_mode') === 'true';
    } catch {
      return false;
    }
  });

  // Admin Authentication & Access Mode (Practice / Free Play vs Official Exam)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => isAdminLoggedIn());
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [isExamSettingsOpen, setIsExamSettingsOpen] = useState<boolean>(false);
  const [isExamRecapOpen, setIsExamRecapOpen] = useState<boolean>(false);
  const [isRestrictedModalOpen, setIsRestrictedModalOpen] = useState<boolean>(false);
  const [restrictedFeatureInfo, setRestrictedFeatureInfo] = useState<{ name: string; description?: string }>({
    name: 'Fitur Otoritas Penguji / Admin',
    description: '',
  });

  const handleLoginAdminSuccess = () => {
    setIsAdmin(true);
    addActionLog('🔐 Mode Penguji / Admin Aktif', {
      step: currentStep,
      severity: 'success',
      dataBadge: 'ADMIN ON',
      detail: 'Admin berhasil masuk dengan PIN valid. Akses penuh ke antrean peserta, parameter soal ujian, dan cetak rekapitulasi nilai aktif.',
    });
  };

  const handleLogoutAdmin = () => {
    logoutAdmin();
    setIsAdmin(false);
    setIsExamSettingsOpen(false);
    setIsExamRecapOpen(false);
    setIsQueueOpen(false);
    addActionLog('🚪 Logout Admin: Beralih ke Mode Latihan Bebas', {
      step: currentStep,
      severity: 'info',
      dataBadge: 'PRACTICE',
      detail: 'Sesi penguji ditutup. Aplikasi kembali ke Mode Latihan (Free Play).',
    });
  };

  const handleRestrictedFeatureClick = (featureName: string, description?: string) => {
    setRestrictedFeatureInfo({
      name: featureName,
      description,
    });
    setIsRestrictedModalOpen(true);
  };

  const handleApplyExamSettings = (settings: ExamSettings) => {
    addActionLog(`⚙️ Parameter Soal Ujian Diterapkan: ${settings.batchTitle}`, {
      step: currentStep,
      severity: 'info',
      dataBadge: settings.difficultyLevel.toUpperCase(),
      detail: `Mode: ${settings.examMode === 'exam' ? 'Ujian Resmi' : 'Latihan'} | Penguji: ${settings.examinerName} | Batas Waktu: ${settings.timeLimitMinutes > 0 ? settings.timeLimitMinutes + ' Menit' : 'Bebas'} | Injeksi Defect: ${settings.injectDefectType}`,
    });
  };

  const handleToggleNightMode = () => {
    soundEffects.playClick();
    setIsNightMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('optisim_night_mode', String(next));
      } catch {
        // Ignored
      }
      return next;
    });
    addActionLog(
      !isNightMode
        ? 'Mode Malam Lapangan diaktifkan (OLED High-Contrast)'
        : 'Mode Standar diaktifkan',
      {
        step: currentStep,
        severity: 'info',
        dataBadge: !isNightMode ? 'Night Mode ON' : 'Standard UI',
        detail: !isNightMode
          ? 'Skema warna beralih ke ultra-high contrast true black untuk kenyamanan mata teknisi di lingkungan minim cahaya.'
          : 'Skema warna kembali ke tema default slate-950.',
      }
    );
  };

  // Active stopwatch for time-trial / workflow duration (accumulates precise seconds and tracks step time limit)
  useEffect(() => {
    if (!state.timeTrialRunning || state.timeTrialCompleted) {
      return;
    }

    const timer = setInterval(() => {
      setState((prev) => {
        if (!prev.timeTrialRunning || prev.timeTrialCompleted) {
          return prev;
        }
        const nextStepTime = (prev.currentStepTime || 0) + 1;
        const limit = prev.stepTimeLimitSeconds;
        const isOvertime = Boolean(limit && nextStepTime > limit);

        return {
          ...prev,
          timeTrialDuration: prev.timeTrialDuration + 1,
          currentStepTime: nextStepTime,
          isStepOvertime: isOvertime,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state.timeTrialRunning, state.timeTrialCompleted]);

  // Otomatis pause/stop timer saat peserta menyelesaikan seluruh tahapan atau masuk ke modul sertifikat
  useEffect(() => {
    if (currentStep === 'assessment') {
      if (state.timeTrialRunning) {
        updateState({
          timeTrialRunning: false,
          timeTrialCompleted: true,
        });
        addActionLog('Sesi pengerjaan tuntas: Stopwatch otomatis dihentikan', {
          step: 'assessment',
          severity: 'info',
          dataBadge: `${state.timeTrialDuration}s Total`,
          detail: 'Waktu durasi terekam resmi pada Lembar Sertifikat Hasil & Papan Peringkat.',
        });
      }

      // Mark participant as completed in queue with latest score and duration
      if (state.traineeName) {
        const evalData = calculateSpliceAccuracy(state);
        const updated = markParticipantCompletedInQueue(state.traineeId, state.traineeName, {
          durationSeconds: state.timeTrialDuration,
          totalScore: evalData.total,
          grade: evalData.grade,
          spliceLoss: state.arcPerformed ? state.estimatedLoss : 0.02,
          telkomCompliant: evalData.telkomCompliant,
        });
        setParticipantQueue(updated);
      }
    }
  }, [currentStep, state.timeTrialRunning, state.timeTrialDuration, state.traineeId, state.traineeName, state.arcPerformed, state.estimatedLoss]);

  // Handler: Select & Start Testing Candidate from Queue
  const handleSelectParticipant = (candidate: ParticipantRecord) => {
    soundEffects.playSuccessBeep();
    const updatedQueue = setParticipantActiveInQueue(candidate.id);
    setParticipantQueue(updatedQueue);
    setActiveParticipantId(candidate.id);

    try {
      localStorage.setItem('optisim_participant_info', JSON.stringify({
        traineeName: candidate.traineeName,
        traineeId: candidate.traineeId,
        companyOrInstitution: candidate.companyOrInstitution,
      }));
    } catch (e) {
      // safe
    }

    // Reset simulator and put stopwatch in Standby (00:00) per requirement
    setState((prev) => ({
      ...INITIAL_STATE,
      fiberType: prev.fiberType,
      mode: prev.mode,
      soundEnabled: prev.soundEnabled,
      traineeName: candidate.traineeName,
      traineeId: candidate.traineeId,
      companyOrInstitution: candidate.companyOrInstitution,
      leftStrippedLength: 0,
      rightStrippedLength: 0,
      strippingQualityLeft: 'unstripped',
      strippingQualityRight: 'unstripped',
      leftCleanliness: 0,
      rightCleanliness: 0,
      cleaningTechniqueCorrect: true,
      leftCleaveAngle: 0,
      rightCleaveAngle: 0,
      leftCleaveLength: 0,
      rightCleaveLength: 0,
      coverClosed: false,
      motorAligned: false,
      xOffset: 0,
      yOffset: 0,
      zGap: 0,
      arcPerformed: false,
      tensionTested: false,
      spliceSuccess: false,
      defectType: 'none',
      heatingCompleted: false,
      heatingProgress: 0,
      sleevePositioned: false,
      // Standby timer 00:00
      timeTrialStartTime: null,
      timeTrialDuration: 0,
      timeTrialRunning: false,
      timeTrialCompleted: false,
      currentStepTime: 0,
      isStepOvertime: false,
    }));

    setCurrentStep('stripping');

    addActionLog(`Peserta aktif diganti: ${candidate.traineeName} (${candidate.traineeId})`, {
      step: 'stripping',
      severity: 'info',
      dataBadge: '00:00 Standby',
      detail: `Identitas teknisi ${candidate.companyOrInstitution} berhasil diaktifkan ke simulator. Timer dalam kondisi STANDBY (00:00). Silakan klik tombol START untuk mulai mengukur durasi pengerjaan.`,
    });
  };

  const handleNextParticipant = () => {
    const nextCandidate = participantQueue.find((p) => p.status === 'untested') || participantQueue[0];
    if (nextCandidate) {
      handleSelectParticipant(nextCandidate);
    } else {
      setIsQueueOpen(true);
    }
  };

  const handleQueueUpdated = (updated: ParticipantRecord[]) => {
    setParticipantQueue(updated);
  };

  // Stopwatch Controls
  const handleStartTimer = () => {
    soundEffects.playClick();
    if (state.timeTrialCompleted) {
      updateState({
        timeTrialRunning: true,
        timeTrialCompleted: false,
        timeTrialDuration: 0,
        timeTrialStartTime: Date.now(),
      });
    } else {
      updateState({
        timeTrialRunning: true,
        timeTrialStartTime: state.timeTrialStartTime || Date.now(),
      });
    }
    addActionLog('Stopwatch sesi pengerjaan dimulai (START)', {
      step: currentStep,
      severity: 'info',
      dataBadge: 'Timer Aktif',
      detail: 'Penghitungan durasi presisi per peserta sedang berlangsung.',
    });
  };

  const handleToggleTimer = () => {
    if (state.timeTrialRunning) {
      soundEffects.playClick();
      updateState({ timeTrialRunning: false });
      addActionLog('Stopwatch dijeda sementara (PAUSE)', {
        step: currentStep,
        severity: 'warning',
        dataBadge: `${state.timeTrialDuration}s`,
      });
    } else {
      handleStartTimer();
    }
  };

  const handleResetTimer = () => {
    soundEffects.playClick();
    updateState({
      timeTrialDuration: 0,
      timeTrialStartTime: null,
      timeTrialRunning: false,
      timeTrialCompleted: false,
      currentStepTime: 0,
      isStepOvertime: false,
    });
    addActionLog('Stopwatch di-reset ke 00:00 (RESET TIMER)', {
      step: currentStep,
      severity: 'info',
      dataBadge: '00:00',
      detail: 'Durasi waktu dikembalikan ke nol tanpa memuat ulang simulator.',
    });
  };

  const addActionLog: AddActionLogFn = (message, options) => {
    const newLog: ActionLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      rawTime: Date.now(),
      step: options?.step || currentStep,
      severity: options?.severity || 'info',
      message,
      dataBadge: options?.dataBadge,
      detail: options?.detail,
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const updateState = (updates: Partial<TechnicianState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleReset = () => {
    soundEffects.playClick();
    if (confirm('Mulai ulang simulasi dari kabel awal? Seluruh progres akan di-reset.')) {
      setState({
        ...INITIAL_STATE,
        traineeName: state.traineeName,
        traineeId: state.traineeId || `OPT-TK-${Math.floor(1000 + Math.random() * 9000)}`,
        companyOrInstitution: state.companyOrInstitution,
        leftStrippedLength: 0,
        rightStrippedLength: 0,
        leftCleanliness: 0,
        rightCleanliness: 0,
        leftCleaveLength: 0,
        rightCleaveLength: 0,
        arcPerformed: false,
        spliceSuccess: false,
        tensionTested: false,
        heatingCompleted: false,
        heatingProgress: 0,
        sleevePositioned: false,
        timeTrialStartTime: null,
        timeTrialDuration: 0,
        timeTrialRunning: false,
        timeTrialCompleted: false,
        currentStepTime: 0,
        isStepOvertime: false,
      });
      setLogs([
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          step: 'stripping',
          severity: 'info',
          message: 'Sesi simulasi baru dimulai ulang (Reset Uji)',
          detail: 'Seluruh parameter kabel dikembalikan ke kondisi awal untuk pelatihan baru.',
        },
      ]);
      setCurrentStep('stripping');
    }
  };

  const criteria = checkStepPassingCriteria(state);
  const unlockedIndex = criteria.unlockedIndex;
  const currentStepIndex = STEP_ORDER_ARRAY.indexOf(currentStep);

  const handleStepChange = (next: SplicingStep) => {
    const nextIndex = STEP_ORDER_ARRAY.indexOf(next);
    // 1. Strict Step Locking: block access if next step is not yet unlocked
    if (nextIndex > unlockedIndex) {
      soundEffects.playError();
      return;
    }

    soundEffects.playClick();
    if (next !== currentStep) {
      setState((prev) => {
        const stepDuration = prev.currentStepTime || 0;
        return {
          ...prev,
          stepTimeElapsed: {
            ...prev.stepTimeElapsed,
            [currentStep]: stepDuration,
          },
          currentStepTime: 0,
          isStepOvertime: false,
        };
      });
      setCurrentStep(next);
    }
  };

  const handleCriticalFailureReset = (reason?: string) => {
    soundEffects.playError();
    updateState(RESET_PROGRESS_STATE);
    setCurrentStep('stripping');
    addActionLog?.('Penanganan Kegagalan: Seluruh progress di-reset ke Langkah 01 (Stripping)', {
      step: 'stripping',
      severity: 'error',
      detail: reason || 'Kriteria kelulusan SOP tidak terpenuhi atau terjadi kerusakan serat kritis.',
    });
  };

  const goToNextStep = (next: SplicingStep) => {
    handleStepChange(next);
  };

  return (
    <div className={`w-screen h-screen ${isNightMode ? 'bg-black text-slate-100 theme-night-mode' : 'bg-slate-950 text-slate-200'} flex flex-col overflow-hidden font-sans select-none transition-colors duration-300`}>
      {/* Header */}
      <Header
        state={state}
        updateState={updateState}
        onReset={handleReset}
        onOpenSafety={() => setIsSafetyOpen(true)}
        onOpenDefects={() => setIsDefectsOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenOTDR={() => setIsOTDROpen(true)}
        onToggleActionLog={() => {
          if (currentStep === 'assessment') {
            setCurrentStep('splicing');
          }
          setActiveSidebarTab((prev) => (prev === 'logs' ? 'metrics' : 'logs'));
        }}
        actionLogsCount={logs.length}
        onOpenParticipantModal={() => setIsParticipantModalOpen(true)}
        onOpenQueueModal={() => setIsQueueOpen(true)}
        participantQueueCount={participantQueue.length}
        onToggleTimer={handleToggleTimer}
        onResetTimer={handleResetTimer}
        isNightMode={isNightMode}
        onToggleNightMode={handleToggleNightMode}
        onOpenTutorial={handleOpenTutorial}
        isTutorialActive={isTutorialOpen}
        isAdmin={isAdmin}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onLogoutAdmin={handleLogoutAdmin}
        onOpenExamSettings={() => setIsExamSettingsOpen(true)}
        onOpenExamRecap={() => setIsExamRecapOpen(true)}
        onOpenErrorScenarios={() => setIsErrorScenarioModalOpen(true)}
        onOpenTrainingHistory={() => setIsTrainingHistoryOpen(true)}
        onOpenCBT={() => setIsCBTOpen(true)}
        onRestrictedFeatureClick={handleRestrictedFeatureClick}
      />

      {/* Main Simulation Stage Body */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Workflow Steps Navigation */}
        <StepNavigation
          currentStep={currentStep}
          onSelectStep={(s) => handleStepChange(s)}
          state={state}
          unlockedIndex={unlockedIndex}
          currentStepIndex={currentStepIndex}
        />

        {/* Center Stage Workspace with Smooth Motion Fade Transition */}
        <div className="flex-1 flex flex-col overflow-hidden relative min-w-0 h-full">
          {/* Global Active Equipment Failure HUD (Resilience Training Module) */}
          <EquipmentFailureHUD 
            state={state} 
            updateState={updateState} 
            addActionLog={addActionLog} 
          />

          {/* Real-Time Common Error Detection & Diagnostic Feedback Banner */}
          <ErrorFeedbackBanner
            state={state}
            updateState={updateState}
            currentStep={currentStep}
            addActionLog={addActionLog}
            onOpenScenarioModal={() => setIsErrorScenarioModalOpen(true)}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col overflow-hidden h-full w-full"
            >
              {currentStep === 'stripping' && (
                <StrippingStage
                  state={state}
                  updateState={updateState}
                  onNextStep={() => goToNextStep('cleaning')}
                  addActionLog={addActionLog}
                />
              )}

              {currentStep === 'cleaning' && (
                <CleaningStage
                  state={state}
                  updateState={updateState}
                  onNextStep={() => goToNextStep('cleaving')}
                  addActionLog={addActionLog}
                />
              )}

              {currentStep === 'cleaving' && (
                <CleavingStage
                  state={state}
                  updateState={updateState}
                  onNextStep={() => goToNextStep('splicing')}
                  addActionLog={addActionLog}
                />
              )}

              {currentStep === 'splicing' && (
                <FusionSplicerStage
                  state={state}
                  updateState={updateState}
                  onNextStep={() => goToNextStep('heating')}
                  addActionLog={addActionLog}
                  onSelectStep={handleStepChange}
                  onResetToStart={handleCriticalFailureReset}
                  unlockedIndex={unlockedIndex}
                  currentStepIndex={currentStepIndex}
                />
              )}

              {currentStep === 'heating' && (
                <HeatShrinkStage
                  state={state}
                  updateState={updateState}
                  onNextStep={() => goToNextStep('assessment')}
                  addActionLog={addActionLog}
                />
              )}

              {currentStep === 'assessment' && (
                <AssessmentCertificate
                  state={state}
                  onRestart={handleReset}
                  onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
                  onOpenQueueModal={() => setIsQueueOpen(true)}
                  onNextParticipant={handleNextParticipant}
                  hasMoreParticipants={participantQueue.some((p) => p.status === 'untested')}
                  isAdmin={isAdmin}
                  onRestrictedFeatureClick={handleRestrictedFeatureClick}
                  onOpenExamRecap={() => setIsExamRecapOpen(true)}
                  onOpenTrainingHistory={() => setIsTrainingHistoryOpen(true)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Accuracy Sidebar (Only shown if not full certificate view) */}
        {currentStep !== 'assessment' && (
          <AccuracySidebar
            state={state}
            updateState={updateState}
            onGoToAssessment={() => handleStepChange('assessment')}
            onReset={handleReset}
            onOpenOTDR={() => setIsOTDROpen(true)}
            logs={logs}
            onClearLogs={() => setLogs([])}
            activeSidebarTab={activeSidebarTab}
            setActiveSidebarTab={setActiveSidebarTab}
            onToggleTimer={handleToggleTimer}
            onResetTimer={handleResetTimer}
            onOpenTrainingHistory={() => setIsTrainingHistoryOpen(true)}
          />
        )}
      </main>

      {/* Footer Status Bar */}
      <Footer 
        state={state} 
        updateState={updateState} 
        onReset={handleReset} 
        latestLogMessage={logs[0]?.message}
        onOpenLog={() => {
          if (currentStep === 'assessment') {
            handleStepChange('splicing');
          }
          setActiveSidebarTab('logs');
        }}
      />

      {/* Participant Registration Modal */}
      <ParticipantModal
        isOpen={isParticipantModalOpen}
        onClose={() => setIsParticipantModalOpen(false)}
        state={state}
        updateState={updateState}
        onStartSession={handleStartTimer}
        isAdmin={isAdmin}
        onOpenQueueModal={() => {
          setIsParticipantModalOpen(false);
          setIsQueueOpen(true);
        }}
        onQueueUpdated={() => {
          setParticipantQueue(loadParticipantQueue());
        }}
      />

      {/* Participant Queue Modal (Roster, Batch Add, One-by-One Testing) */}
      <ParticipantQueueModal
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        queue={participantQueue}
        activeParticipantId={activeParticipantId}
        onSelectParticipant={handleSelectParticipant}
        onQueueUpdated={handleQueueUpdated}
      />

      {/* Admin Authentication & Exam Control Modals */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleLoginAdminSuccess}
      />

      <AccessRestrictedModal
        isOpen={isRestrictedModalOpen}
        onClose={() => setIsRestrictedModalOpen(false)}
        onOpenLoginAdmin={() => {
          setIsRestrictedModalOpen(false);
          setIsAdminLoginOpen(true);
        }}
        featureName={restrictedFeatureInfo.name}
        featureDescription={restrictedFeatureInfo.description}
      />

      <ExamSettingsModal
        isOpen={isExamSettingsOpen}
        onClose={() => setIsExamSettingsOpen(false)}
        state={state}
        updateState={updateState}
        onApplySettings={handleApplyExamSettings}
      />

      <ExamRecapPrintModal
        isOpen={isExamRecapOpen}
        onClose={() => setIsExamRecapOpen(false)}
        queue={participantQueue}
      />

      {/* Modals */}
      <SafetyGuideModal isOpen={isSafetyOpen} onClose={() => setIsSafetyOpen(false)} />
      <DefectKnowledgeModal isOpen={isDefectsOpen} onClose={() => setIsDefectsOpen(false)} />
      <ErrorScenarioModal
        isOpen={isErrorScenarioModalOpen}
        onClose={() => setIsErrorScenarioModalOpen(false)}
        state={state}
        updateState={updateState}
        onNavigateStep={(s) => handleStepChange(s)}
        addActionLog={addActionLog}
      />
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        currentState={state}
      />
      <OTDRModal
        isOpen={isOTDROpen}
        onClose={() => setIsOTDROpen(false)}
        state={state}
      />
      <TrainingHistoryModal
        isOpen={isTrainingHistoryOpen}
        onClose={() => setIsTrainingHistoryOpen(false)}
        currentState={state}
        onSessionLogged={() => {
          addActionLog('Sesi latihan dicatat ke Sistem Riwayat Pelatihan', {
            step: currentStep,
            severity: 'success',
            dataBadge: 'HISTORY SAVED',
            detail: `Skor: ${state.scores?.total || 90} | Waktu: ${state.timeTrialDuration}s | Skenario tercatat`,
          });
        }}
      />
      <CBTModal
        isOpen={isCBTOpen}
        onClose={() => setIsCBTOpen(false)}
        participantName={state.traineeName}
        participantId={state.traineeId}
        onSessionLogged={(res) => {
          addActionLog(`Ujian CBT ${res.testType === 'pre-test' ? 'Pre-Test' : 'Post-Test'} selesai`, {
            step: currentStep,
            severity: res.score >= 70 ? 'success' : 'warning',
            dataBadge: `${res.score}/100`,
            detail: `Peserta: ${res.participantName} | Benar: ${res.correctCount}/${res.totalQuestions} | Waktu: ${res.durationSeconds}s`,
          });
        }}
      />

      {/* Interactive Quick Start Tutorial Overlay & HUD */}
      <QuickStartTutorial
        isOpen={isTutorialOpen}
        onClose={handleCloseTutorial}
        currentStep={currentStep}
        onSelectStep={(s) => handleStepChange(s)}
      />

      {/* PWA Service Worker Offline Indicator & Remote Field Diagnostics */}
      <OfflineIndicator />
    </div>
  );
}
