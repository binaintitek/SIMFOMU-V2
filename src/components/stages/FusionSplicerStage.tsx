import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SplicingStep, TechnicianState } from '../../types/fiber';
import { AddActionLogFn } from '../../types/actionLog';
import { 
  FIBER_SPECS, 
  calculateSpliceAccuracy, 
  STEP_METADATA, 
  checkStepPassingCriteria, 
  RESET_PROGRESS_STATE 
} from '../../utils/standards';
import { soundEffects } from '../../utils/audio';
import { 
  Zap, 
  Check, 
  ArrowRight, 
  AlertTriangle, 
  Sliders, 
  Maximize2, 
  Eye, 
  Activity, 
  ShieldCheck, 
  RefreshCw,
  Flame,
  Sparkles,
  Lock,
  AlertOctagon,
  XCircle,
  RotateCcw,
  X,
  Radio,
  BatteryLow,
  BatteryCharging,
  Wrench,
  Plug,
  ShieldAlert
} from 'lucide-react';
import { MacroFusionArcVisualizer } from '../MacroFusionArcVisualizer';
import { RealToolButton } from '../RealToolPreviewCard';
import { getExamSettings } from '../../utils/adminAuth';
import { 
  checkShouldTriggerFailure, 
  resolveEquipmentIncident, 
  DEFAULT_EQUIPMENT_HEALTH, 
  createManualIncident 
} from '../../utils/equipmentFailureService';

interface FusionSplicerStageProps {
  state: TechnicianState;
  updateState: (updates: Partial<TechnicianState>) => void;
  onNextStep: () => void;
  addActionLog?: AddActionLogFn;
  onSelectStep?: (step: SplicingStep) => void;
  onResetToStart?: (reason?: string) => void;
  unlockedIndex?: number;
  currentStepIndex?: number;
}

interface FailureModalInfo {
  isOpen: boolean;
  errorType: 'fiber_broken' | 'cleave_angle' | 'arc_failure' | 'custom';
  title: string;
  message: string;
  code: string;
}

export const FusionSplicerStage: React.FC<FusionSplicerStageProps> = ({
  state,
  updateState,
  onNextStep,
  addActionLog,
  onSelectStep,
  onResetToStart,
  unlockedIndex: propUnlockedIndex,
  currentStepIndex: propCurrentStepIndex,
}) => {
  const [isAligning, setIsAligning] = useState<boolean>(false);
  const [isArcing, setIsArcing] = useState<boolean>(false);
  const [arcGlow, setArcGlow] = useState<boolean>(false);
  const [isPullTesting, setIsPullTesting] = useState<boolean>(false);
  const [isFiberSnapped, setIsFiberSnapped] = useState<boolean>(false);
  const [tensionMode, setTensionMode] = useState<'standard' | 'excessive'>('standard');
  const [statusMessage, setStatusMessage] = useState<string>(
    state.arcPerformed ? 'SPLICING COMPLETE' : 'FIBERS LOADED IN V-GROOVE'
  );

  // 1. Strict Step Locking: State tracking unlockedIndex & currentStepIndex
  const criteria = checkStepPassingCriteria(state);
  const [unlockedIndex, setUnlockedIndex] = useState<number>(
    propUnlockedIndex !== undefined ? propUnlockedIndex : criteria.unlockedIndex
  );
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(
    propCurrentStepIndex !== undefined ? propCurrentStepIndex : 3
  );

  // Failure Handling states
  const [failureModal, setFailureModal] = useState<FailureModalInfo | null>(null);
  const [failureToast, setFailureToast] = useState<{ show: boolean; message: string } | null>(null);
  const [showFailureSimMenu, setShowFailureSimMenu] = useState<boolean>(false);

  useEffect(() => {
    if (propUnlockedIndex !== undefined) {
      setUnlockedIndex(propUnlockedIndex);
    } else {
      setUnlockedIndex(criteria.unlockedIndex);
    }
  }, [criteria.unlockedIndex, propUnlockedIndex]);

  useEffect(() => {
    if (propCurrentStepIndex !== undefined) {
      setCurrentStepIndex(propCurrentStepIndex);
    }
  }, [propCurrentStepIndex]);

  // Step 4 Passing Criteria: PAS alignment & Arc discharge completed
  const isStep4Passed = criteria.isStep3Passed; // motorAligned && arcPerformed (and previous steps passed)

  // 3. Failure Handling: Trigger critical error
  const triggerCriticalFailure = (
    errorType: 'fiber_broken' | 'cleave_angle' | 'arc_failure' | 'custom',
    customTitle?: string,
    customMessage?: string
  ) => {
    soundEffects.playError();

    let title = 'GAGAL KRITIKAL: Kegagalan Arc Discharge';
    let message = 'Percikan arc elektroda plasma 2000°C gagal menyatukan inti kaca secara konsentris. Terjadi defek struktural fusi.';
    let code = 'ERR_ARC_DISCHARGE_FAILURE';

    if (errorType === 'cleave_angle') {
      title = 'GAGAL KRITIKAL: Sudut Potong Serat > 1.0°';
      message = `Sudut potong salah satu serat (Kiri: ${state.leftCleaveAngle.toFixed(1)}°, Kanan: ${state.rightCleaveAngle.toFixed(1)}°) melampaui batas toleransi maksimum 1.0°. Sesuai SOP Telkom & ITU-T G.652, proses fusi dilarang karena memicu pantulan tinggi (optical return loss) dan risiko pelelehan tidak simetris.`;
      code = 'ERR_CLEAVE_ANGLE_EXCEEDED';
    } else if (errorType === 'fiber_broken') {
      title = 'GAGAL KRITIKAL: Serat Patah (Fiber Fracture)';
      message = 'Serat optik mengalami retak mikro / patah fisik pada V-groove penjepit atau akibat uji tegangan mekanis 2.2N. Serat rusak permanen dan harus dipotong ulang.';
      code = 'ERR_FIBER_FRACTURE_BROKEN';
    } else if (errorType === 'arc_failure') {
      title = 'GAGAL KRITIKAL: Kegagalan Arc Discharge';
      message = 'Terjadi kegagalan busur elektroda (arc flashover / gelembung udara pada titik leleh). Serat hangus atau sambungan cacat permanen.';
      code = 'ERR_ARC_DISCHARGE_FAILURE';
    }

    if (customTitle) title = customTitle;
    if (customMessage) message = customMessage;

    setFailureModal({
      isOpen: true,
      errorType,
      title,
      message,
      code,
    });

    setFailureToast({
      show: true,
      message: `${title}: Mengulang dari Langkah 01 (Stripping)`,
    });

    setTimeout(() => {
      setFailureToast(null);
    }, 6000);

    addActionLog?.(`Kegagalan kritikal fusi: ${title}`, {
      step: 'splicing',
      severity: 'error',
      dataBadge: code,
      detail: message,
    });
  };

  // Failure Handling: Reset all progress state variables and return to step 01
  const handleAcknowledgeFailure = () => {
    setFailureModal(null);
    setFailureToast(null);

    // 3b. Reset seluruh state progress kelulusan ke nilai default
    updateState(RESET_PROGRESS_STATE);

    // 3c. Kembalikan currentStepIndex dan unlockedIndex ke 0 (Langkah 01 - Stripping)
    setCurrentStepIndex(0);
    setUnlockedIndex(0);

    if (onResetToStart) {
      onResetToStart('Reset seluruh progres akibat kegagalan kritikal fusi');
    }
    if (onSelectStep) {
      onSelectStep('stripping');
    }
  };

  const spec = FIBER_SPECS[state.fiberType];
  const evaluation = calculateSpliceAccuracy(state);

  // Toggle wind protector cover
  const handleToggleCover = () => {
    soundEffects.playClick();
    const next = !state.coverClosed;
    updateState({ coverClosed: next });
    if (!next && isArcing) {
      setIsArcing(false);
      setArcGlow(false);
    }
    addActionLog?.(next ? 'Wind protector cover ditutup rapat' : 'Wind protector cover dibuka', {
      step: 'splicing',
      severity: 'info',
      detail: next ? 'Ruang elektroda terlindung dari hembusan angin dan debu sekitar.' : 'Tutup dibuka untuk inspeksi fisik atau peletakan serat.',
    });
  };

  // Equipment Troubleshooting handlers
  const handlePlugCharger = () => {
    soundEffects.playToolFixed();
    const currentHealth = state.equipmentHealth || DEFAULT_EQUIPMENT_HEALTH;
    const nextHealth = resolveEquipmentIncident(currentHealth, 'low_battery');
    updateState({
      equipmentHealth: {
        ...nextHealth,
        splicerBatteryLevel: 98,
        splicerIsCharging: true,
      },
    });
    setStatusMessage('CHARGER CONNECTED (12V DC) - BATT 98% READY');
    addActionLog?.('[KETANGGUHAN TEKNISI] Adaptor charger DC 12V berhasil dihubungkan', {
      step: 'splicing',
      severity: 'success',
      dataBadge: 'DC 12V 98%',
      detail: 'Splicer dialiri daya listrik eksternal. Penguncian arc discharge dinonaktifkan, mesin siap beroperasi normal.',
    });
  };

  const handleCleanElectrodes = () => {
    soundEffects.playArcDischarge(0.6);
    soundEffects.playToolFixed();
    const currentHealth = state.equipmentHealth || DEFAULT_EQUIPMENT_HEALTH;
    const nextHealth = resolveEquipmentIncident(currentHealth, 'dirty_electrode');
    updateState({
      equipmentHealth: nextHealth,
      defectType: state.defectType === 'bubble' ? 'none' : state.defectType,
    });
    setStatusMessage('AUTO-CLEAN ARC & STABILIZATION COMPLETE');
    addActionLog?.('[KETANGGUHAN TEKNISI] Siklus auto-clean & kalibrasi arc elektroda selesai', {
      step: 'splicing',
      severity: 'success',
      dataBadge: 'Arc Calibrated',
      detail: 'Lapisan oksida pada ujung elektroda tungsten telah dibersihkan melalui plasma burn. Karakteristik percikan arc kembali stabil.',
    });
  };

  const handleCleanVGroove = () => {
    soundEffects.playToolFixed();
    const currentHealth = state.equipmentHealth || DEFAULT_EQUIPMENT_HEALTH;
    const nextHealth = resolveEquipmentIncident(currentHealth, 'dusty_vgroove');
    updateState({
      equipmentHealth: nextHealth,
      motorAligned: false,
    });
    setStatusMessage('V-GROOVE CLEANED - ALUR PRESISI SIAP ALIGNMENT');
    addActionLog?.('[KETANGGUHAN TEKNISI] Alur V-Groove dibersihkan dengan kuas alkohol 99.8% IPA', {
      step: 'splicing',
      severity: 'success',
      dataBadge: 'V-Groove Clean',
      detail: 'Partikel debu mikro pada V-groove kiri dan kanan telah dibersihkan. Sumbu core serat dapat bergerak bebas dalam batas PAS.',
    });
  };

  // Auto Core Alignment sequence
  const handleAutoAlign = () => {
    if (!state.coverClosed) {
      soundEffects.playError();
      setStatusMessage('ERROR: TUTUP WIND PROTECTOR COVER TERLEBIH DAHULU!');
      addActionLog?.('Peringatan: Upaya alignment gagal karena wind cover masih terbuka', {
        step: 'splicing',
        severity: 'warning',
        detail: 'Sensor keselamatan splicer memblokir gerakan motor jika penutup belum dikunci.',
      });
      return;
    }

    // Equipment failure check: dusty v-groove
    const examSettings = getExamSettings();
    const currentHealth = state.equipmentHealth || DEFAULT_EQUIPMENT_HEALTH;
    const dustyIncident = checkShouldTriggerFailure(examSettings, currentHealth, 'splicing', 'dusty_vgroove');

    if (dustyIncident || currentHealth.vGrooveCondition === 'dusty') {
      soundEffects.playEquipmentAlarm();
      setStatusMessage('ERROR: V-GROOVE DUST ERROR - MOTOR PAS LIMIT REACHED!');
      if (dustyIncident) {
        updateState({
          equipmentHealth: {
            ...currentHealth,
            activeFailure: dustyIncident,
            vGrooveCondition: 'dusty',
          },
          motorAligned: false,
        });
      }
      addActionLog?.('[ANOMALI ALAT] V-Groove berdebu: Motor alignment PAS gagal mengunci sumbu core', {
        step: 'splicing',
        severity: 'error',
        dataBadge: 'ERR-PAS-LIMIT',
        detail: 'Partikel debu mikro pada dudukan V-groove menghalangi pergerakan motor stepper. Lakukan pembersihan V-groove menggunakan kuas alkohol IPA 99.8%.',
      });
      return;
    }

    setIsAligning(true);
    setStatusMessage('ALIGNING MOTORS (PAS) - DETECTING CORES...');
    soundEffects.playMotorStep();

    const alignInterval = setInterval(() => {
      soundEffects.playMotorStep();
    }, 250);

    setTimeout(() => {
      clearInterval(alignInterval);
      setIsAligning(false);
      updateState({
        motorAligned: true,
        xOffset: 0.04, // under 0.1 um is optimal
        yOffset: 0.02,
        zGap: 12, // 12 microns gap
      });
      setStatusMessage('CORE ALIGNED (100%) - READY FOR ARC DISCHARGE');
      soundEffects.playSuccessBeep();

      addActionLog?.('Penjajaran sumbu inti serat optik (PAS Core Alignment) sukses', {
        step: 'splicing',
        severity: 'success',
        dataBadge: 'Offset 0.06µm',
        detail: 'Motor stepper X-Y menyelaraskan posisi core serat optik. Sumbu terpusat dengan celah gap 12µm.',
      });
    }, 1400);
  };

  // Manual jog adjustment
  const handleManualJog = (axis: 'x' | 'y', delta: number) => {
    soundEffects.playClick();
    if (axis === 'x') {
      const next = Math.max(0, Math.min(1.5, state.xOffset + delta));
      updateState({ xOffset: Number(next.toFixed(2)), motorAligned: next < 0.1 });
    } else {
      const next = Math.max(0, Math.min(1.5, state.yOffset + delta));
      updateState({ yOffset: Number(next.toFixed(2)), motorAligned: next < 0.1 });
    }
  };

  // High Voltage Arc Discharge
  const handlePerformArc = () => {
    if (!state.coverClosed) {
      soundEffects.playError();
      setStatusMessage('ERROR: TUTUP WIND COVER DEMI KEAMANAN ARC DISCHARGE!');
      return;
    }

    // Equipment failure check: low battery
    const examSettings = getExamSettings();
    const currentHealth = state.equipmentHealth || DEFAULT_EQUIPMENT_HEALTH;
    const batteryIncident = checkShouldTriggerFailure(examSettings, currentHealth, 'splicing', 'low_battery');

    if (batteryIncident || currentHealth.splicerBatteryLevel < 10) {
      soundEffects.playBatteryWarning();
      setStatusMessage('LOW BATTERY (< 10%): ARC DISCHARGE DIBLOKIR. HUBUNGKAN CHARGER!');
      if (batteryIncident) {
        updateState({
          equipmentHealth: {
            ...currentHealth,
            activeFailure: batteryIncident,
            splicerBatteryLevel: 7,
            splicerIsCharging: false,
          },
        });
      }
      addActionLog?.('[ANOMALI ALAT] Tegangan baterai splicer kritis (< 10%): Arc discharge diblokir sistem', {
        step: 'splicing',
        severity: 'error',
        dataBadge: 'BATT < 10%',
        detail: 'Sistem proteksi internal mencegah arc discharge saat baterai di bawah ambang batas aman demi menghindari pelepasan plasma tidak tuntas.',
      });
      return;
    }

    // Equipment failure check: dirty/oxidized electrode
    const electrodeIncident = checkShouldTriggerFailure(examSettings, currentHealth, 'splicing', 'dirty_electrode');
    if (electrodeIncident || currentHealth.electrodesCondition === 'oxidized') {
      soundEffects.playEquipmentAlarm();
      setStatusMessage('WARNING: ARC FLUTTER - ELEKTRODA TEROKSIDASI!');
      if (electrodeIncident) {
        updateState({
          equipmentHealth: {
            ...currentHealth,
            activeFailure: electrodeIncident,
            electrodesCondition: 'oxidized',
          },
          defectType: 'bubble',
        });
      }
    }

    // 3. Failure Handling Check: Cleave angle > 1.0°
    if (state.leftCleaveAngle > 1.0 || state.rightCleaveAngle > 1.0) {
      triggerCriticalFailure('cleave_angle');
      return;
    }

    // 3. Failure Handling Check: Endface contamination (< 80% cleanliness)
    if (state.leftCleanliness < 80 || state.rightCleanliness < 80) {
      soundEffects.playContaminationWarning();
      updateState({ defectType: 'bubble', spliceSuccess: false });
      triggerCriticalFailure(
        'arc_failure',
        'GAGAL KRITIKAL: Kontaminasi Ujung Serat Memicu Cacat Gelembung (Bubble Defect)',
        `Partikel debu mikro atau minyak pada ujung serat (Kebersihan: ${Math.min(state.leftCleanliness, state.rightCleanliness)}%) terbakar oleh plasma 2000°C menghasilkan gelembung udara permanen. Sambungan cacat dan wajib dibersihkan ulang dengan Kimwipes + IPA 99.8% serta dipotong ulang.`
      );
      return;
    }

    // 3. Failure Handling Check: Severe lateral misalignment (> 0.35um unaligned)
    const currentOffsetMag = Math.sqrt(state.xOffset * state.xOffset + state.yOffset * state.yOffset);
    if (!state.motorAligned && currentOffsetMag > 0.35) {
      soundEffects.playError();
      updateState({ defectType: 'offset', spliceSuccess: false });
      triggerCriticalFailure(
        'arc_failure',
        'GAGAL KRITIKAL: Ketidaksejajaran Sumbu Inti (Core Misalignment)',
        `Offset sumbu inti sebesar ${currentOffsetMag.toFixed(2)}µm melebihi batas toleransi. Sambungan fusi dengan sumbu meleset menyebabkan redaman tinggi (> 0.35 dB) dan sinar laser bocor ke cladding. Jalankan fungsi Auto Alignment (PAS) sebelum menembakkan busur arc.`
      );
      return;
    }

    // 3. Failure Handling Check: Severe defect / bubble
    if (state.defectType === 'bubble') {
      triggerCriticalFailure(
        'arc_failure',
        'GAGAL KRITIKAL: Cacat Gelembung Udara pada Titik Fusi',
        'Terjadi rongga udara mikro (bubble defect) di dalam silika cair akibat kontaminasi inti atau elektroda teroksidasi. Sambungan fusi cacat permanen.'
      );
      return;
    }

    setIsArcing(true);
    setArcGlow(true);
    setStatusMessage('ARC DISCHARGE ACTIVE (2000°C PLASMA FUSION)...');
    soundEffects.playArcDischarge(1.5);
    addActionLog?.('Pelepasan busur elektroda (Arc Discharge) diaktifkan', {
      step: 'splicing',
      severity: 'info',
      detail: 'Percikan busur listrik tegangan tinggi melelehkan kaca silika pada suhu ~2000°C.',
    });

    setTimeout(() => {
      setArcGlow(false);
      setStatusMessage('EVALUATING SPLICE LOSS...');

      setTimeout(() => {
        setIsArcing(false);

        // Compute loss based on accuracy
        const calculated = calculateSpliceAccuracy(state);
        updateState({
          arcPerformed: true,
          spliceSuccess: true,
          estimatedLoss: calculated.computedLoss,
        });

        const isOk = calculated.computedLoss <= spec.maxAllowedLoss;
        setStatusMessage(`SPLICE SUCCESS: ${calculated.computedLoss.toFixed(2)} dB (PASS TELKOM G.652)`);
        soundEffects.playSuccessBeep();

        addActionLog?.(`Arc discharge selesai: Estimasi redaman ${calculated.computedLoss.toFixed(2)} dB`, {
          step: 'splicing',
          severity: isOk ? 'success' : 'error',
          dataBadge: `${calculated.computedLoss.toFixed(2)} dB`,
          detail: isOk
            ? `Penyambungan fusi selesai sempurna memenuhi regulasi ITU-T G.652 (Loss ≤ ${spec.maxAllowedLoss} dB).`
            : `Loss sambungan ${calculated.computedLoss.toFixed(2)} dB melampaui standar toleransi.`,
        });
      }, 700);
    }, 1500);
  };

  // Re-clean endface handler inside splicer
  const handleCleanEndfaceInSplicer = () => {
    soundEffects.playWipeSqueak();
    updateState({
      leftCleanliness: 100,
      rightCleanliness: 100,
      defectType: state.defectType === 'bubble' ? 'none' : state.defectType,
    });
    setStatusMessage('END-FACES RE-CLEANED: 100% CONTAMINATION FREE');
    addActionLog?.('Membersihkan ulang penampang serat optik menggunakan Kimwipes + Alkohol IPA', {
      step: 'splicing',
      severity: 'success',
      dataBadge: 'CLEAN 100%',
      detail: 'Partikel debu mikro dan noda minyak pada penampang serat berhasil diseka bersih sesuai SOP Telkom Akses.',
    });
  };

  // Tension proof test (2.0N standard vs > 2.2N excessive pull)
  const handleTensionTest = (forceLevel: 'standard' | 'excessive' = tensionMode) => {
    if (!state.arcPerformed) {
      soundEffects.playError();
      return;
    }

    if (forceLevel === 'excessive') {
      setIsPullTesting(true);
      setStatusMessage('OVER-TENSION TEST: APPLYING 4.0N MECHANICAL TENSION (> 2.2N LIMIT)...');
      soundEffects.playMotorStep();

      setTimeout(() => {
        setIsPullTesting(false);
        setIsFiberSnapped(true);
        soundEffects.playGlassSnap();
        updateState({
          spliceSuccess: false,
          tensionTested: false,
          defectType: 'thick',
          estimatedLoss: 9.99,
        });

        triggerCriticalFailure(
          'fiber_broken',
          'GAGAL KRITIKAL: Serat Patah Akibat Penarikan Berlebihan (Excessive Tension 4.0N)',
          'Gaya tarik 4.0N melampaui batas elastisitas silika kaca telanjang (Tensile Fracture Limit > 2.2N). Sambungan optik patah seketika (Fiber Snap). Standar Telkom Akses & IEC 60794 membatasi beban uji tarik mekanis pada 1.96N - 2.15N (setara beban 200 gram) selama 1-2 detik.'
        );
      }, 700);
      return;
    }

    // Failure simulation if defective
    if (state.defectType === 'thick' || state.defectType === 'bubble' || state.defectType === 'offset') {
      soundEffects.playGlassSnap();
      setIsFiberSnapped(true);
      triggerCriticalFailure(
        'fiber_broken',
        'GAGAL KRITIKAL: Serat Patah saat Uji Tarik Mekanis 2.2N',
        'Sambungan fusi tidak memiliki kekuatan mekanis standar akibat cacat pelelehan inti silika. Serat putus saat diberi tegangan 2.2N.'
      );
      return;
    }

    setIsPullTesting(true);
    setStatusMessage('PULL TEST: APPLYING 2.0N MECHANICAL TENSION...');
    soundEffects.playMotorStep();

    setTimeout(() => {
      setIsPullTesting(false);
      updateState({ tensionTested: true });
      setStatusMessage('TENSION TEST: 2.0N PASSED (JOINT MECHANICALLY SECURE)');
      soundEffects.playSuccessBeep();

      addActionLog?.('Uji tarik mekanis (Tension Proof Test 2.0N / 200g) berhasil lulus', {
        step: 'splicing',
        severity: 'success',
        dataBadge: '2.0N PASS',
        detail: 'Kekuatan fisik sambungan terbukti kokoh dan tahan terhadap tarikan mekanis lapangan sesuai standar Telkom Akses.',
      });
    }, 900);
  };

  // Reset Splicer
  const handleResetSplice = () => {
    soundEffects.playClick();
    setIsFiberSnapped(false);
    updateState({
      arcPerformed: false,
      spliceSuccess: false,
      tensionTested: false,
      motorAligned: false,
      xOffset: 0.28,
      yOffset: 0.35,
      zGap: 24,
    });
    setStatusMessage('FIBERS RELOADED IN V-GROOVE');
    addActionLog?.('Parameter fusion splicer di-reset ulang', {
      step: 'splicing',
      severity: 'info',
      detail: 'Serat dikalibrasi ulang dalam V-groove untuk percobaan sambungan baru.',
    });
  };

  return (
    <div className="flex-1 bg-slate-950 p-4 sm:p-6 flex flex-col relative overflow-y-auto">
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      ></div>

      {/* 3. Floating Failure Toast */}
      <AnimatePresence>
        {failureToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 right-4 z-50 max-w-md bg-rose-950/95 border-2 border-rose-500 text-rose-100 p-4 rounded-2xl shadow-2xl flex items-start gap-3 backdrop-blur-md"
          >
            <AlertOctagon className="w-6 h-6 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
            <div className="flex-1">
              <h5 className="font-bold text-sm text-rose-200">Pemberitahuan Kegagalan Fusi</h5>
              <p className="text-xs text-rose-300/90 mt-0.5">{failureToast.message}</p>
            </div>
            <button
              onClick={() => setFailureToast(null)}
              className="text-rose-400 hover:text-rose-200 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Critical Failure Modal */}
      <AnimatePresence>
        {failureModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-6 shadow-2xl shadow-rose-950/60 flex flex-col gap-4 text-slate-100 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 animate-pulse" />

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 text-rose-400">
                  <AlertOctagon className="w-7 h-7 animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {failureModal.code}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      SOP TELKOM G.652
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-rose-400 mt-1">
                    {failureModal.title}
                  </h3>
                </div>
              </div>

              <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <p>{failureModal.message}</p>
                <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-amber-300/90 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Konsekuensi Kegagalan:</strong> Sesuai SOP teknisi fiber optik, serat yang mengalami cacat kritis harus dibuang. Seluruh status progress (isStripped, isCleaned, isCleaved, splicing) akan di-reset, dan Anda dikembalikan ke <strong>Langkah 01 (Stripping Fiber)</strong>.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleAcknowledgeFailure}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset &amp; Ulangi Dari Langkah 01 (Stripping)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 1. Strict Step Locking Navigation Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 mb-3 flex items-center justify-between flex-wrap gap-2 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Alur Kerja Splicer (Strict Step Locking)
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
            Level Akses: {unlockedIndex + 1} / 6
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {STEP_METADATA.map((st, idx) => {
            const isUnlocked = idx <= unlockedIndex;
            const isActive = idx === currentStepIndex;

            return (
              <button
                key={st.id}
                disabled={!isUnlocked}
                onClick={() => {
                  if (!isUnlocked) return;
                  soundEffects.playClick();
                  onSelectStep?.(st.id as SplicingStep);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  !isUnlocked
                    ? 'opacity-50 cursor-not-allowed bg-slate-950/60 border border-slate-800 text-slate-500'
                    : isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 border border-blue-400/40'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/60'
                }`}
                title={
                  !isUnlocked
                    ? `Langkah ${st.number} (${st.title}) terkunci 🔒. Penuhi kriteria langkah sebelumnya.`
                    : st.title
                }
              >
                {!isUnlocked ? (
                  <Lock className="w-3 h-3 text-slate-500" />
                ) : (
                  <span className="text-[10px] font-mono opacity-80">{st.number}</span>
                )}
                <span className="truncate max-w-[85px] sm:max-w-none">{st.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Strict Step Locking Prerequisite Alert (If Steps 1, 2, or 3 not completed) */}
      {unlockedIndex < 3 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 bg-amber-950/30 border border-amber-500/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200 shadow-xl"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-2">
                <span>Langkah 04 Terkunci: Kriteria SOP Belum Lengkap</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200">
                  Strict Locking Active
                </span>
              </h4>
              <p className="text-[11px] text-amber-200/80 mt-1">
                Sesuai aturan Penguncian Langkah Ketat, Anda harus menyelesaikan:
              </p>
              <div className="flex flex-wrap gap-2 mt-2 text-[10px] font-mono">
                <span
                  className={`px-2 py-0.5 rounded border ${
                    criteria.isStep0Passed
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  }`}
                >
                  Langkah 01 (Stripping 30-35mm): {criteria.isStep0Passed ? '✓ Lulus' : '✗ Belum Terkupas'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded border ${
                    criteria.isStep1Passed
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  }`}
                >
                  Langkah 02 (Cleaning 100%): {criteria.isStep1Passed ? '✓ Lulus' : `✗ ${Math.min(state.leftCleanliness, state.rightCleanliness)}%`}
                </span>
                <span
                  className={`px-2 py-0.5 rounded border ${
                    criteria.isStep2Passed
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  }`}
                >
                  Langkah 03 (Cleaving ≤ 1.0°): {criteria.isStep2Passed ? '✓ Lulus' : `✗ > 1.0°`}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                soundEffects.playClick();
                onSelectStep?.('stripping');
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
            >
              Ke Langkah 01 (Stripping)
            </button>
          </div>
        </motion.div>
      )}

      {/* 3. Failure Handling & Equipment Diagnostic Simulation Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 mb-3 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span className="font-semibold text-slate-300 text-[11px]">
            Simulasi Kegagalan &amp; Respon Ketangguhan (Failure Handling):
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => triggerCriticalFailure('fiber_broken')}
            className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-bold transition-colors flex items-center gap-1"
            title="Simulasikan serat patah saat dijepit atau ditarik"
          >
            <span>💥 Serat Patah</span>
          </button>
          <button
            onClick={() => triggerCriticalFailure('arc_failure')}
            className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold transition-colors flex items-center gap-1"
            title="Simulasikan kegagalan arc discharge / gelembung silika"
          >
            <span>⚡ Gagal Arc</span>
          </button>
          <button
            onClick={() => triggerCriticalFailure('cleave_angle')}
            className="px-2 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-bold transition-colors flex items-center gap-1"
            title="Simulasikan sudut potong cleaving melampaui 1.0°"
          >
            <span>📐 Sudut &gt; 1.0°</span>
          </button>

          <span className="text-slate-700 mx-0.5">|</span>

          {/* Skenario Kesalahan Umum (User Request Feature) */}
          <button
            onClick={() => {
              soundEffects.playContaminationWarning();
              updateState({
                leftCleanliness: 45,
                rightCleanliness: 50,
                defectType: 'bubble',
              });
              setStatusMessage('DETEKSI: KONTAMINASI UJUNG SERAT (DEBU / MINYAK)');
            }}
            className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 text-[10px] font-bold transition-colors flex items-center gap-1"
            title="Simulasikan kontaminasi debu mikro & minyak pada penampang serat"
          >
            <span>🧪 Kontaminasi Serat</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              updateState({
                motorAligned: false,
                xOffset: 0.85,
                yOffset: 0.70,
                defectType: 'offset',
              });
              setStatusMessage('DETEKSI: MISALIGNMENT SUMBU INTI (ΔX 0.85µm, ΔY 0.70µm)');
            }}
            className="px-2 py-1 rounded bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-200 text-[10px] font-bold transition-colors flex items-center gap-1"
            title="Simulasikan deviasi sumbu inti melebihi batas 0.10µm"
          >
            <span>📐 Misalignment</span>
          </button>

          <button
            onClick={() => {
              handleTensionTest('excessive');
            }}
            className="px-2 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-200 text-[10px] font-bold transition-colors flex items-center gap-1"
            title="Simulasikan penarikan berlebihan melebihi batas elastisitas 2.2N"
          >
            <span>💥 Tarik Berlebih (&gt;2.2N)</span>
          </button>

          <span className="text-slate-700 mx-0.5">|</span>

          {/* Random Equipment Failure Quick Triggers */}
          <button
            onClick={() => {
              soundEffects.playBatteryWarning();
              const incident = createManualIncident('low_battery', 'splicing');
              const currentHealth = state.equipmentHealth || DEFAULT_EQUIPMENT_HEALTH;
              updateState({
                equipmentHealth: {
                  ...currentHealth,
                  activeFailure: incident,
                  splicerBatteryLevel: 7,
                  splicerIsCharging: false,
                },
              });
              setStatusMessage('ANOMALI ALAT: BATERAI DROP (< 10%) - CHARGER DIBUTUHKAN');
            }}
            className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[10px] font-bold transition-colors flex items-center gap-1"
            title="Simulasikan baterai drop di bawah 10%"
          >
            <BatteryLow className="w-3 h-3" />
            <span>🪫 Baterai Drop</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playEquipmentAlarm();
              const incident = createManualIncident('dirty_electrode', 'splicing');
              const currentHealth = state.equipmentHealth || DEFAULT_EQUIPMENT_HEALTH;
              updateState({
                equipmentHealth: {
                  ...currentHealth,
                  activeFailure: incident,
                  electrodesCondition: 'oxidized',
                },
                defectType: 'bubble',
              });
              setStatusMessage('ANOMALI ALAT: ELEKTRODA TEROKSIDASI - ARC FLUTTER');
            }}
            className="px-2 py-1 rounded bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/40 text-yellow-300 text-[10px] font-bold transition-colors flex items-center gap-1"
            title="Simulasikan elektroda tungsten teroksidasi"
          >
            <Zap className="w-3 h-3" />
            <span>⚡ Elektroda Aus</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playEquipmentAlarm();
              const incident = createManualIncident('dusty_vgroove', 'splicing');
              const currentHealth = state.equipmentHealth || DEFAULT_EQUIPMENT_HEALTH;
              updateState({
                equipmentHealth: {
                  ...currentHealth,
                  activeFailure: incident,
                  vGrooveCondition: 'dusty',
                },
                motorAligned: false,
              });
              setStatusMessage('ANOMALI ALAT: ALUR V-GROOVE BERDEBU - MOTOR PAS LIMIT');
            }}
            className="px-2 py-1 rounded bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold transition-colors flex items-center gap-1"
            title="Simulasikan debu pada alur V-groove"
          >
            <Sparkles className="w-3 h-3" />
            <span>🧹 V-Groove Debu</span>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col z-10">
        {/* Splicer Screen Header (LCD Monitor UI) */}
        <div className="h-12 border-b border-slate-800 bg-slate-800/60 flex items-center px-4 sm:px-6 justify-between flex-wrap gap-2">
          {/* Camera View Mode Selection */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-bold">
              <button
                onClick={() => {
                  soundEffects.playClick();
                  updateState({ viewMode: 'X' });
                }}
                className={`px-2.5 py-1 rounded transition-colors ${
                  state.viewMode === 'X'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                CORE X (Horizontal)
              </button>
              <button
                onClick={() => {
                  soundEffects.playClick();
                  updateState({ viewMode: 'Y' });
                }}
                className={`px-2.5 py-1 rounded transition-colors ${
                  state.viewMode === 'Y'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                CORE Y (Vertical)
              </button>
              <button
                onClick={() => {
                  soundEffects.playClick();
                  updateState({ viewMode: 'DUAL' });
                }}
                className={`px-2.5 py-1 rounded transition-colors ${
                  state.viewMode === 'DUAL'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                DUAL X+Y
              </button>
              <button
                onClick={() => {
                  soundEffects.playClick();
                  updateState({ viewMode: 'MACRO_3D' });
                }}
                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                  state.viewMode === 'MACRO_3D'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'text-amber-400 hover:text-amber-200'
                }`}
                title="Tampilkan simulasi 3D proses pelelehan kaca silika saat arc"
              >
                <Flame className="w-3 h-3" />
                MACRO 3D (Pelelehan)
              </button>
            </div>

            {/* Wind Cover Toggle */}
            <button
              id="btn-toggle-cover"
              onClick={handleToggleCover}
              className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                state.coverClosed
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              Wind Cover: {state.coverClosed ? 'Tertutup (Aman)' : 'Terbuka (Warning)'}
            </button>

            {/* Real Tool Button */}
            <RealToolButton currentStep="splicing" />
          </div>

          {/* Machine Status Ticker */}
          <div className="flex items-center gap-3">
            <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              STATUS: {statusMessage}
            </div>
            <button
              onClick={handleResetSplice}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded text-xs"
              title="Reset simulasi penyambungan"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Machine Hardware Health Bar (Splicer Battery, Electrodes, V-Groove) */}
        {(() => {
          const health = state.equipmentHealth || DEFAULT_EQUIPMENT_HEALTH;
          const isBatteryLow = health.splicerBatteryLevel < 15;
          const isElectrodesDirty = health.electrodesCondition === 'oxidized';
          const isVGrooveDusty = health.vGrooveCondition === 'dusty';
          const hasAnomaly = isBatteryLow || isElectrodesDirty || isVGrooveDusty;

          return (
            <div className={`px-4 py-1.5 border-b text-[11px] font-mono flex items-center justify-between flex-wrap gap-2 transition-colors ${
              hasAnomaly 
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-200' 
                : 'bg-slate-950/60 border-slate-800 text-slate-400'
            }`}>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Battery Gauge */}
                <div className="flex items-center gap-1.5">
                  {health.splicerIsCharging ? (
                    <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  ) : isBatteryLow ? (
                    <BatteryLow className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  ) : (
                    <span className="text-emerald-400">🔋</span>
                  )}
                  <span>Baterai:</span>
                  <span className={`font-bold ${isBatteryLow ? 'text-rose-400' : 'text-slate-200'}`}>
                    {health.splicerBatteryLevel}% {health.splicerIsCharging && '(DC IN)'}
                  </span>
                  {isBatteryLow && (
                    <button
                      type="button"
                      onClick={handlePlugCharger}
                      className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 ml-1 cursor-pointer"
                    >
                      <Plug className="w-3 h-3" />
                      <span>Sambung Charger</span>
                    </button>
                  )}
                </div>

                <span className="text-slate-700 hidden sm:inline">•</span>

                {/* Electrodes Status */}
                <div className="flex items-center gap-1.5">
                  <Zap className={`w-3.5 h-3.5 ${isElectrodesDirty ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>Elektroda:</span>
                  <span className={`font-bold ${isElectrodesDirty ? 'text-amber-400' : 'text-slate-200'}`}>
                    {isElectrodesDirty ? 'Teroksidasi (Aus)' : 'Bersih (Norm)'}
                  </span>
                  {isElectrodesDirty && (
                    <button
                      type="button"
                      onClick={handleCleanElectrodes}
                      className="px-2 py-0.5 rounded bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 ml-1 cursor-pointer"
                    >
                      <span>Auto Clean</span>
                    </button>
                  )}
                </div>

                <span className="text-slate-700 hidden sm:inline">•</span>

                {/* V-Groove Status */}
                <div className="flex items-center gap-1.5">
                  <Sparkles className={`w-3.5 h-3.5 ${isVGrooveDusty ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>V-Groove:</span>
                  <span className={`font-bold ${isVGrooveDusty ? 'text-rose-400' : 'text-slate-200'}`}>
                    {isVGrooveDusty ? 'Berdebu (Limit)' : 'Presisi'}
                  </span>
                  {isVGrooveDusty && (
                    <button
                      type="button"
                      onClick={handleCleanVGroove}
                      className="px-2 py-0.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 ml-1 cursor-pointer"
                    >
                      <span>Bersihkan V-Groove</span>
                    </button>
                  )}
                </div>
              </div>

              {hasAnomaly && (
                <div className="text-[10px] text-amber-300 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>Tindakan SOP Diperlukan</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Central High-Magnification Optical Chamber or Macro 3D View */}
        {state.viewMode === 'MACRO_3D' ? (
          <div className="flex-1 flex flex-col p-3 bg-slate-950 overflow-y-auto">
            <MacroFusionArcVisualizer
              state={state}
              isArcingActive={isArcing}
              onTriggerArc={handlePerformArc}
              variant="inline"
            />
          </div>
        ) : (
          <div className="flex-1 flex relative bg-slate-950 overflow-hidden">
            {/* Inspeksi Pelelehan Makro 3D floating quick button */}
            <button
              onClick={() => {
                soundEffects.playClick();
                updateState({ viewMode: 'MACRO_3D' });
              }}
              className="absolute top-4 right-4 z-20 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded-xl text-[10px] font-bold flex items-center gap-1.5 backdrop-blur transition-all shadow-xl hover:border-amber-400 cursor-pointer group"
              title="Lihat simulasi mikroskopis 3D proses pelelehan dan fusi termal kaca silika"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Inspeksi Makro 3D Pelelehan</span>
            </button>

            {/* Crosshairs & Reticle Grid */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-blue-500/20 z-0"></div>
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-blue-500/20 z-0"></div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-72 h-44 border border-dashed border-blue-400/40 rounded-lg"></div>
            </div>

            {/* Tungsten Electrodes (Top & Bottom Spark Points) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center z-10 pointer-events-none">
              <div className="w-3 h-12 bg-gradient-to-b from-slate-600 via-slate-400 to-slate-200 rounded-b shadow-lg border border-slate-700"></div>
              <div className="w-1.5 h-3 bg-amber-400 rounded-b shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div>
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center z-10 pointer-events-none">
              <div className="w-1.5 h-3 bg-amber-400 rounded-t shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div>
              <div className="w-3 h-12 bg-gradient-to-t from-slate-600 via-slate-400 to-slate-200 rounded-t shadow-lg border border-slate-700"></div>
            </div>

            {/* Alignment HUD Banner & Scanning Beam */}
            <AnimatePresence>
              {isAligning && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 bg-slate-900/95 border border-cyan-500/50 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 backdrop-blur pointer-events-none"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    >
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    </motion.div>
                    <span className="text-[10px] font-mono font-bold text-cyan-200 tracking-wide">
                      PAS MOTOR ALIGNMENT (X-Y-Z STEPPING)
                    </span>
                    <span className="flex gap-1 items-center">
                      <motion.span
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ repeat: Infinity, duration: 0.4, delay: 0 }}
                        className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                      />
                      <motion.span
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ repeat: Infinity, duration: 0.4, delay: 0.15 }}
                        className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                      />
                      <motion.span
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ repeat: Infinity, duration: 0.4, delay: 0.3 }}
                        className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                      />
                    </span>
                  </motion.div>

                  {/* Laser Scanning Beam sweeping across gap */}
                  <motion.div
                    initial={{ x: -140, opacity: 0 }}
                    animate={{ x: 140, opacity: [0, 0.85, 0.85, 0] }}
                    transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                    className="absolute top-1/4 bottom-1/4 left-1/2 w-1 bg-gradient-to-b from-transparent via-cyan-400 to-transparent pointer-events-none z-20 shadow-[0_0_15px_#22d3ee]"
                  />
                </>
              )}
            </AnimatePresence>

            {/* Splicing Fiber Stage (Left & Right Fibers approaching center) */}
            <div className="flex-1 flex items-center justify-center relative z-10 px-8">
              {/* Left Fiber Assembly */}
              <motion.div
                className="flex items-center"
                animate={
                  isPullTesting
                    ? { x: -3, y: 0 }
                    : state.arcPerformed
                    ? { x: 1, y: 0 }
                    : isAligning
                    ? {
                        x: [0, 3, 2, 6, 5, 8],
                        y: [state.yOffset * 10, -6, 5, -3, 2, 0.3],
                      }
                    : {
                        x: state.motorAligned ? 8 : 0,
                        y: state.yOffset * 10,
                      }
                }
                transition={
                  isAligning
                    ? {
                        duration: 1.4,
                        ease: 'easeInOut',
                        times: [0, 0.2, 0.35, 0.6, 0.8, 1],
                      }
                    : {
                        type: 'spring',
                        stiffness: 300,
                        damping: 24,
                      }
                }
              >
                {/* Left V-Groove clamp block */}
                <div className="w-28 sm:w-44 h-16 bg-gradient-to-r from-slate-800 to-slate-700 rounded-l border border-slate-600 shadow-2xl relative flex flex-col justify-center pl-3">
                  <div className="flex items-center justify-between pr-3">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                      V-Groove L
                    </span>
                    {isAligning && (
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 0.3 }}
                        className="text-[8px] font-mono text-cyan-400 font-bold flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                        PAS-L
                      </motion.span>
                    )}
                  </div>
                  <div className="text-[8px] font-mono text-slate-500 mt-0.5">
                    Motor: {isAligning ? 'STEPPING...' : state.motorAligned ? 'ALIGNED' : 'STANDBY'}
                  </div>
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-slate-600 border-r border-slate-500"></div>
                </div>

                {/* Left Bare Glass Fiber Tip (125um cladding with 9um core inside) */}
                <div className="w-36 sm:w-52 h-14 bg-gradient-to-b from-slate-700 via-sky-300/40 to-slate-700 border-y border-sky-400/50 relative shadow-inner flex items-center">
                  {/* Single-mode core centerline */}
                  <motion.div
                    className="h-1 bg-red-500/90 w-full shadow-[0_0_6px_rgba(239,68,68,0.9)]"
                    animate={{
                      opacity: state.motorAligned ? 1 : 0.8,
                      boxShadow: state.motorAligned
                        ? '0 0 8px rgba(239,68,68,1)'
                        : '0 0 4px rgba(239,68,68,0.7)',
                    }}
                    transition={{ duration: 0.3 }}
                  />
                  {/* Glass reflections */}
                  <div className="absolute top-1 left-0 right-0 h-1 bg-white/40 rounded-full"></div>
                  {/* Left Cleave Cut Face (Molten incandescent effect when arcing) */}
                  <div
                    className={`absolute right-0 top-0 bottom-0 transition-all ${
                      arcGlow
                        ? 'w-2.5 bg-amber-300 shadow-[0_0_14px_#f59e0b,0_0_24px_#ef4444] animate-pulse rounded-r'
                        : 'w-1 bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]'
                    }`}
                  ></div>

                  {/* Dust / Oil Contamination Artifacts */}
                  {(state.leftCleanliness < 85 || state.defectType === 'bubble') && (
                    <div className="absolute right-0.5 top-2 bottom-2 w-2.5 pointer-events-none z-20 flex flex-col justify-around items-end">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_#f59e0b] animate-ping" />
                      <div className="w-1 h-1 rounded-full bg-amber-300 shadow-[0_0_2px_#f59e0b]" />
                      <div className="w-1.5 h-1 rounded-full bg-slate-900 border border-amber-400" />
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Center Gap & Fusion Arc Plasma Flash */}
              <div className="w-8 h-20 flex items-center justify-center relative shrink-0">
                {arcGlow && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                    {/* Blinding plasma spark */}
                    <div className="w-14 h-14 bg-blue-300 rounded-full blur-xs animate-ping"></div>
                    <div className="w-8 h-8 bg-white rounded-full shadow-[0_0_30px_#60a5fa,0_0_60px_#3b82f6]"></div>
                    {/* High voltage sparks */}
                    <div className="w-1 h-20 bg-gradient-to-b from-amber-300 via-white to-amber-300 animate-pulse"></div>
                  </div>
                )}

                {/* Fused Silica Joint line after arc */}
                {state.arcPerformed && !arcGlow && (
                  <div className="w-1 h-14 bg-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.9)] relative flex items-center justify-center">
                    <div className="w-1.5 h-1 bg-red-400 shadow-[0_0_4px_red]"></div>
                  </div>
                )}

                {!state.arcPerformed && !arcGlow && (
                  <motion.div
                    key={state.motorAligned ? 'aligned' : 'gap'}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`text-[9px] font-mono px-1 py-0.5 rounded border transition-colors ${
                      state.motorAligned
                        ? 'text-emerald-400 bg-emerald-950/80 border-emerald-500/40'
                        : 'text-blue-400/70 bg-slate-950/80 border-blue-500/20'
                    }`}
                  >
                    {state.motorAligned ? '12μm' : '24μm'}
                  </motion.div>
                )}
              </div>

              {/* Right Fiber Assembly */}
              <motion.div
                className="flex items-center"
                animate={
                  isPullTesting
                    ? { x: 3, y: 0 }
                    : state.arcPerformed
                    ? { x: -1, y: 0 }
                    : isAligning
                    ? {
                        x: [0, -3, -2, -6, -5, -8],
                        y: [-state.yOffset * 10, 6, -5, 3, -2, -0.3],
                      }
                    : {
                        x: state.motorAligned ? -8 : 0,
                        y: -state.yOffset * 10,
                      }
                }
                transition={
                  isAligning
                    ? {
                        duration: 1.4,
                        ease: 'easeInOut',
                        times: [0, 0.2, 0.35, 0.6, 0.8, 1],
                      }
                    : {
                        type: 'spring',
                        stiffness: 300,
                        damping: 24,
                      }
                }
              >
                {/* Right Bare Glass Fiber Tip */}
                <div className="w-36 sm:w-52 h-14 bg-gradient-to-b from-slate-700 via-sky-300/40 to-slate-700 border-y border-sky-400/50 relative shadow-inner flex items-center">
                  {/* Single-mode core centerline */}
                  <motion.div
                    className="h-1 bg-red-500/90 w-full shadow-[0_0_6px_rgba(239,68,68,0.9)]"
                    animate={{
                      opacity: state.motorAligned ? 1 : 0.8,
                      boxShadow: state.motorAligned
                        ? '0 0 8px rgba(239,68,68,1)'
                        : '0 0 4px rgba(239,68,68,0.7)',
                    }}
                    transition={{ duration: 0.3 }}
                  />
                  {/* Glass reflections */}
                  <div className="absolute top-1 left-0 right-0 h-1 bg-white/40 rounded-full"></div>
                  {/* Right Cleave Cut Face (Molten incandescent effect when arcing) */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 transition-all ${
                      arcGlow
                        ? 'w-2.5 bg-amber-300 shadow-[0_0_14px_#f59e0b,0_0_24px_#ef4444] animate-pulse rounded-l'
                        : 'w-1 bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]'
                    }`}
                  ></div>

                  {/* Dust / Oil Contamination Artifacts */}
                  {(state.rightCleanliness < 85 || state.defectType === 'bubble') && (
                    <div className="absolute left-0.5 top-2 bottom-2 w-2.5 pointer-events-none z-20 flex flex-col justify-around items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_#f59e0b] animate-ping" />
                      <div className="w-1 h-1 rounded-full bg-amber-300 shadow-[0_0_2px_#f59e0b]" />
                      <div className="w-1.5 h-1 rounded-full bg-slate-900 border border-amber-400" />
                    </div>
                  )}
                </div>

                {/* Right V-Groove clamp block */}
                <div className="w-28 sm:w-44 h-16 bg-gradient-to-l from-slate-800 to-slate-700 rounded-r border border-slate-600 shadow-2xl relative flex flex-col justify-center pr-3">
                  <div className="flex items-center justify-between pl-3">
                    {isAligning && (
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 0.3 }}
                        className="text-[8px] font-mono text-cyan-400 font-bold flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                        PAS-R
                      </motion.span>
                    )}
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-semibold ml-auto">
                      V-Groove R
                    </span>
                  </div>
                  <div className="text-[8px] font-mono text-slate-500 mt-0.5 text-right pl-3">
                    Motor: {isAligning ? 'STEPPING...' : state.motorAligned ? 'ALIGNED' : 'STANDBY'}
                  </div>
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-slate-600 border-l border-slate-500"></div>
                </div>
              </motion.div>

              {/* Fiber Snap / Broken Silica Visual Alert */}
              {isFiberSnapped && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                  <div className="px-4 py-2 bg-rose-950/95 border-2 border-rose-500 text-rose-200 font-mono text-xs font-black rounded-2xl shadow-2xl animate-pulse flex items-center gap-2 backdrop-blur">
                    <AlertOctagon className="w-4 h-4 text-rose-400" />
                    <span>💥 FIBER SNAP: SERAT PATAH (BEBAN TARIK &gt; 2.2N)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Center Top Misalignment Warning Banner */}
            {!state.motorAligned && (state.xOffset > 0.1 || state.yOffset > 0.1) && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-rose-950/90 border border-rose-500/60 text-rose-300 text-[10px] font-mono font-bold flex items-center gap-2 shadow-xl backdrop-blur">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                <span>MISALIGNMENT: ΔX={state.xOffset.toFixed(2)}µm, ΔY={state.yOffset.toFixed(2)}µm</span>
                <button
                  onClick={handleAutoAlign}
                  disabled={isAligning || state.arcPerformed}
                  className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-bold cursor-pointer"
                >
                  Auto PAS
                </button>
              </div>
            )}

            {/* Center Bottom Contamination Warning Banner */}
            {(state.leftCleanliness < 85 || state.rightCleanliness < 85) && !state.arcPerformed && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-full bg-amber-950/95 border border-amber-500/60 text-amber-200 text-[10px] font-mono font-bold flex items-center gap-2.5 shadow-2xl backdrop-blur">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>KONTAMINASI UJUNG SERAT ({Math.min(state.leftCleanliness, state.rightCleanliness)}%)</span>
                <button
                  onClick={handleCleanEndfaceInSplicer}
                  className="px-2.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[9px] font-bold cursor-pointer transition-colors"
                >
                  Seka Kimwipes + IPA
                </button>
              </div>
            )}

            {/* Left Bottom HUD: Live Offset Telemetry */}
            <div className="absolute bottom-4 left-6 flex flex-col gap-1.5 z-20">
              <div className="px-3 py-1 bg-black/60 backdrop-blur border border-slate-700 rounded text-[10px] font-mono text-slate-300">
                X-Offset: <span className="text-blue-400 font-bold">{state.xOffset}μm</span>
              </div>
              <div className="px-3 py-1 bg-black/60 backdrop-blur border border-slate-700 rounded text-[10px] font-mono text-slate-300">
                Y-Offset: <span className="text-blue-400 font-bold">{state.yOffset}μm</span>
              </div>
              <div className="px-3 py-1 bg-black/60 backdrop-blur border border-slate-700 rounded text-[10px] font-mono text-slate-300">
                Gap: <span className="text-emerald-400 font-bold">{state.zGap}μm</span>
              </div>
            </div>

            {/* Right Bottom HUD: Result Loss Display */}
            {state.arcPerformed && (
              <div className="absolute bottom-4 right-6 bg-black/80 backdrop-blur border border-emerald-500/40 px-4 py-2 rounded-xl flex items-center gap-3 z-20 shadow-2xl">
                <div>
                  <p className="text-[9px] text-slate-400 uppercase">Estimated Splice Loss</p>
                  <p className="text-xl font-mono font-bold text-emerald-400">
                    {state.estimatedLoss.toFixed(2)}{' '}
                    <span className="text-xs text-emerald-600">dB</span>
                  </p>
                </div>
                <div className="w-px h-8 bg-slate-700"></div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase">Kesesuaian SOP</p>
                  <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> LULUS G.652
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Machine Physical Keypad & Controls Bar */}
        <div className="h-24 bg-slate-900 border-t border-slate-800 flex items-center px-4 sm:px-8 gap-4 sm:gap-6 justify-between flex-wrap">
          {/* Alignment Controls */}
          <div className="flex items-center gap-2">
            <motion.button
              id="btn-auto-align"
              onClick={handleAutoAlign}
              disabled={isAligning || isArcing || state.arcPerformed}
              whileHover={!isAligning && !state.arcPerformed ? { scale: 1.02 } : {}}
              whileTap={!isAligning && !state.arcPerformed ? { scale: 0.98 } : {}}
              className={`px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all border ${
                isAligning
                  ? 'bg-blue-600/30 text-blue-300 border-blue-400/60 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                  : state.motorAligned
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              } disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed`}
            >
              <motion.div
                animate={isAligning ? { rotate: 360 } : { rotate: 0 }}
                transition={isAligning ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
              >
                <Activity className={`w-4 h-4 ${isAligning ? 'text-cyan-300' : state.motorAligned ? 'text-emerald-400' : 'text-blue-400'}`} />
              </motion.div>
              {isAligning ? 'Menyelaraskan Core...' : state.motorAligned ? 'Core Terjajar (PAS)' : 'Auto Alignment'}
            </motion.button>

            {/* Manual Jog Micro Adjusters */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-[10px]">
              <span className="text-slate-500 px-1 font-mono">Micro Jog:</span>
              <button
                onClick={() => handleManualJog('y', -0.05)}
                disabled={state.arcPerformed}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded"
              >
                Y-
              </button>
              <button
                onClick={() => handleManualJog('y', 0.05)}
                disabled={state.arcPerformed}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded"
              >
                Y+
              </button>
              <button
                onClick={() => handleManualJog('x', -0.05)}
                disabled={state.arcPerformed}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded"
              >
                X-
              </button>
              <button
                onClick={() => handleManualJog('x', 0.05)}
                disabled={state.arcPerformed}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded"
              >
                X+
              </button>
            </div>
          </div>

          {/* Center Progress or Arc Status */}
          <div className="flex-1 max-w-xs h-2.5 bg-slate-800 rounded-full overflow-hidden hidden md:block">
            <div
              className={`h-full transition-all duration-300 ${
                isArcing
                  ? 'bg-amber-400 w-full animate-pulse shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                  : state.arcPerformed
                  ? 'bg-emerald-500 w-full'
                  : state.motorAligned
                  ? 'bg-blue-500 w-3/4'
                  : 'bg-slate-700 w-1/4'
              }`}
            ></div>
          </div>

          {/* Main Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Tension Test Controls */}
            {state.arcPerformed && (
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => {
                    setTensionMode('standard');
                    handleTensionTest('standard');
                  }}
                  disabled={isPullTesting}
                  className="px-3 sm:px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Uji tarik mekanis 2.0N (~200g) sesuai standar Telkom Akses & ITU-T"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  {isPullTesting && tensionMode === 'standard' ? 'Testing 2.0N...' : 'Uji Tarik 2.0N (SOP)'}
                </button>

                <button
                  onClick={() => {
                    setTensionMode('excessive');
                    handleTensionTest('excessive');
                  }}
                  disabled={isPullTesting}
                  className="px-2.5 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                  title="Simulasikan penarikan berlebihan (> 2.2N) yang mematahkan silika telanjang"
                >
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                  <span>Tarik Berlebih (4.0N)</span>
                </button>
              </div>
            )}

            {/* ARC SPLICING BIG BUTTON */}
            <button
              id="btn-perform-arc"
              onClick={handlePerformArc}
              disabled={isArcing || isAligning || state.arcPerformed}
              className={`px-6 sm:px-8 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xl uppercase tracking-widest flex items-center gap-2 ${
                state.arcPerformed
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-400 text-white shadow-blue-900/50 cursor-pointer animate-pulse'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-300" />
              {isArcing ? 'Menembakkan ARC...' : state.arcPerformed ? 'Fusi Selesai' : 'SET / ARC'}
            </button>

            {/* 1. Next Step Button with Strict Step Locking */}
            <button
              id="btn-next-to-heating"
              onClick={() => {
                if (!isStep4Passed) return;
                soundEffects.playClick();
                onNextStep();
              }}
              disabled={!isStep4Passed}
              className={`px-4 sm:px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
                isStep4Passed
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed bg-slate-900 border border-slate-800 text-slate-500 shadow-none'
              }`}
              title={
                !isStep4Passed
                  ? 'Langkah 05 Terkunci 🔒: Proses PAS Alignment dan Arc Discharge harus diselesaikan terlebih dahulu.'
                  : 'Lanjut ke Langkah 05: Protection Sleeve & Heating Oven'
              }
            >
              {!isStep4Passed ? (
                <>
                  <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Langkah 05 Terkunci</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Langkah 05:</span> Sleeve &amp; Heater
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
