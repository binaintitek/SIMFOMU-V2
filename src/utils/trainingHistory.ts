import { TechnicianState } from '../types/fiber';
import { calculateSpliceAccuracy, FIBER_SPECS } from './standards';
import { formatDuration } from './leaderboard';

export type ScenarioCategory = 
  | 'contamination'
  | 'misalignment'
  | 'excessive_tension'
  | 'cleave_defect'
  | 'stripping_flaw'
  | 'equipment_failure'
  | 'sop_compliant';

export interface ScenarioFacedTag {
  id: string;
  name: string;
  category: ScenarioCategory;
  severity: 'normal' | 'warning' | 'critical';
  details: string;
  sopCorrection?: string;
}

export interface TrainingSessionRecord {
  id: string;
  traineeId: string;
  traineeName: string;
  companyOrInstitution: string;
  mode: 'training' | 'exam' | 'timetrial';
  fiberType: string;
  timestamp: number;
  dateFormatted: string;
  timeFormatted: string;
  durationSeconds: number; // Waktu yang dihabiskan (detik)
  durationFormatted: string; // mm:ss
  
  // Skor Akurasi
  accuracyScore: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'RE-EXAM';
  telkomCompliant: boolean;
  estimatedLoss: number; // in dB
  
  // Rincian Nilai per Tahap (Accuracy Score Breakdown)
  scoreBreakdown: {
    stripping: number;
    cleaning: number;
    cleaving: number;
    splicing: number;
    heating: number;
  };

  // Parameter Fisik & Optik
  cleaveAngleAvg: number; // degrees
  coreOffset: number; // microns
  cleanlinessAvg: number; // percentage
  tensileStatus: 'pass_2.0N' | 'over_tension_fail' | 'untested';
  
  // Skenario yang Dihadapi
  scenariosFaced: ScenarioFacedTag[];
  
  // Ringkasan Evaluasi
  summaryNotes: string;
  examinerNotes?: string;
}

export interface ProgressAnalytics {
  totalSessions: number;
  passedSessions: number;
  failedSessions: number;
  passRatePercentage: number;
  averageScore: number;
  averageDurationSeconds: number;
  averageLoss: number;
  initialScore: number;
  latestScore: number;
  scoreImprovement: number; // latestScore - initialScore
  lossImprovement: number; // initialLoss - latestLoss (reduction is positive)
  durationReductionSeconds: number; // initialDuration - latestDuration
  scenarioFrequencyMap: Record<string, { count: number; category: ScenarioCategory; name: string }>;
  competencyAverages: {
    stripping: number;
    cleaning: number;
    cleaving: number;
    splicing: number;
    heating: number;
  };
}

const STORAGE_KEY = 'optisim_training_history_v2';

/**
 * Mendeteksi dan mengekstrak semua skenario kesalahan atau anomali yang dihadapi selama sesi
 */
export function extractScenariosFaced(state: TechnicianState): ScenarioFacedTag[] {
  const scenarios: ScenarioFacedTag[] = [];

  // 1. Kontaminasi Ujung Serat (Endface Contamination / Gelembung Bubble)
  const minClean = Math.min(state.leftCleanliness, state.rightCleanliness);
  const hasContamination = minClean < 85 || state.defectType === 'bubble';
  if (hasContamination) {
    const isCritical = minClean < 60 || state.defectType === 'bubble';
    scenarios.push({
      id: 'scen-contamination',
      name: 'Kontaminasi Ujung Serat (Endface Contamination)',
      category: 'contamination',
      severity: isCritical ? 'critical' : 'warning',
      details: state.defectType === 'bubble'
        ? `Terdapat cacat gelembung udara (bubble defect) akibat partikel terbakar saat arc.`
        : `Kebersihan serat ${minClean}% (ambang batas minimum SOP Telkom: 85%).`,
      sopCorrection: 'Seka ulang dengan Kimwipes dan alkohol IPA 99.8% satu arah, lalu cleave ulang.',
    });
  }

  // 2. Ketidaksejajaran Sumbu Inti (Core Misalignment)
  const offsetMagnitude = Math.sqrt(state.xOffset * state.xOffset + state.yOffset * state.yOffset);
  const hasMisalignment = (!state.motorAligned && offsetMagnitude > 0.15) || state.defectType === 'offset' || offsetMagnitude > 0.25;
  if (hasMisalignment) {
    scenarios.push({
      id: 'scen-misalignment',
      name: 'Ketidaksejajaran Sumbu Inti (Core Misalignment)',
      category: 'misalignment',
      severity: offsetMagnitude > 0.4 || state.defectType === 'offset' ? 'critical' : 'warning',
      details: `Deviasi sumbu optik ΔX=${state.xOffset.toFixed(2)}µm, ΔY=${state.yOffset.toFixed(2)}µm (Total: ${offsetMagnitude.toFixed(2)}µm).`,
      sopCorrection: 'Jalankan PAS Auto-Alignment motor stepper splicer untuk memposisikan offset < 0.10µm.',
    });
  }

  // 3. Penarikan yang Berlebihan (Excessive Tension / Tensile Break)
  const hasTensileBreak = state.defectType === 'thick' || (state.arcPerformed && !state.spliceSuccess && state.tensionTested);
  if (hasTensileBreak) {
    scenarios.push({
      id: 'scen-tension',
      name: 'Penarikan Berlebihan / Patah Tarik (Excessive Tension)',
      category: 'excessive_tension',
      severity: 'critical',
      details: 'Serat optik putus saat uji tarik (Proof Load > 2.2N). Ambang elastisitas kaca silika terlampaui.',
      sopCorrection: 'Batasi gaya tarik kalibrasi proof test pada 2.0N (200g). Potong dan sambung ulang dari awal.',
    });
  }

  // 4. Goresan Cladding Stripper (Stripping Flaw)
  if (state.strippingQualityLeft === 'nicked' || state.strippingQualityRight === 'nicked') {
    const side = state.strippingQualityLeft === 'nicked' && state.strippingQualityRight === 'nicked'
      ? 'Kiri & Kanan'
      : state.strippingQualityLeft === 'nicked' ? 'Kiri' : 'Kanan';
    scenarios.push({
      id: 'scen-stripping-nick',
      name: 'Goresan Cladding / Retak Mikro Stripper',
      category: 'stripping_flaw',
      severity: 'warning',
      details: `Permukaan silika serat ${side} tergores bilah logam stripper akibat sudut tarikan miring.`,
      sopCorrection: 'Gunakan lubang tang No.3 khusus 250µm coating, tarik lurus tanpa memelintir tang.',
    });
  }

  // 5. Cacat Sudut Potong Miring (Cleave Angle Defect)
  const maxCleaveAngle = Math.max(state.leftCleaveAngle, state.rightCleaveAngle);
  const spec = FIBER_SPECS[state.fiberType] || FIBER_SPECS.G652D_SM;
  if (maxCleaveAngle > spec.maxCleaveAngle) {
    scenarios.push({
      id: 'scen-cleave-angle',
      name: 'Sudut Potong Miring / Cacat Cleaver',
      category: 'cleave_defect',
      severity: maxCleaveAngle > 1.2 ? 'critical' : 'warning',
      details: `Sudut potong ujung serat ${maxCleaveAngle.toFixed(1)}° melampaui batas maksimal SOP ${spec.maxCleaveAngle}°.`,
      sopCorrection: 'Putar bilah mata pisau cleaver (blade rotation) ke indeks berikutnya dan bersihkan rubber pad.',
    });
  }

  // 6. Kegagalan Perangkat / Alat (Equipment Failure)
  if (state.equipmentHealth?.activeFailure) {
    const fail = state.equipmentHealth.activeFailure;
    scenarios.push({
      id: `scen-eq-${fail.type}`,
      name: `Gangguan Alat: ${fail.title}`,
      category: 'equipment_failure',
      severity: fail.type === 'low_battery' || fail.type === 'heater_fault' ? 'critical' : 'warning',
      details: fail.description,
      sopCorrection: fail.sopInstruction || fail.mitigationButtonLabel,
    });
  }

  // 7. Cacat Bentuk Sambungan Lainnya
  if (state.defectType === 'waist') {
    scenarios.push({
      id: 'scen-defect-waist',
      name: 'Penciutan Pinggang Sambungan (Waist Defect)',
      category: 'misalignment',
      severity: 'warning',
      details: 'Arus busur arc terlalu tinggi atau feed amount kurang sehingga titik leleh silika menyusut.',
      sopCorrection: 'Kalibrasi arc discharge power dan bersihkan alur V-groove.',
    });
  } else if (state.defectType === 'angle_fail') {
    scenarios.push({
      id: 'scen-defect-angle-fail',
      name: 'Gagal Sudut Pertemuan Fusi (Angle Fail)',
      category: 'cleave_defect',
      severity: 'critical',
      details: 'Celah sudut temu serat kiri dan kanan melebihi batas fusi motor stepper.',
      sopCorrection: 'Potong ulang kedua serat dengan presisi cleaver.',
    });
  }

  // 8. Custom / Explicitly Encountered Scenarios
  if (Array.isArray(state.encounteredScenarios)) {
    for (const tag of state.encounteredScenarios) {
      if (!scenarios.some(s => s.name === tag || s.id === tag)) {
        scenarios.push({
          id: `custom-${Math.random().toString(36).substring(2, 7)}`,
          name: tag,
          category: 'misalignment',
          severity: 'warning',
          details: 'Skenario disimulasikan secara aktif oleh pengguna / penguji.',
        });
      }
    }
  }

  // Jika tidak ada skenario kesalahan sama sekali dan nilai bagus:
  if (scenarios.length === 0) {
    scenarios.push({
      id: 'scen-normal-sop',
      name: 'SOP Standar Presisi Terpenuhi (Normal)',
      category: 'sop_compliant',
      severity: 'normal',
      details: 'Semua tahapan pengerjaan (stripping, cleaning, cleaving, splicing, heating) sesuai regulasi Telkom Akses.',
    });
  }

  return scenarios;
}

/**
 * Membuat catatan sesi pelatihan lengkap dari live TechnicianState
 */
export function createTrainingSessionRecord(state: TechnicianState): TrainingSessionRecord {
  const evalData = calculateSpliceAccuracy(state);
  const loss = state.arcPerformed ? state.estimatedLoss : 0.02;
  const duration = state.timeTrialDuration > 0
    ? state.timeTrialDuration
    : state.timeTrialStartTime
    ? Math.max(15, Math.round((Date.now() - state.timeTrialStartTime) / 1000))
    : 110;

  const scenariosFaced = extractScenariosFaced(state);
  const avgCleaveAngle = Number(((state.leftCleaveAngle + state.rightCleaveAngle) / 2).toFixed(2));
  const offsetMagnitude = Number(Math.sqrt(state.xOffset * state.xOffset + state.yOffset * state.yOffset).toFixed(2));
  const avgCleanliness = Math.round((state.leftCleanliness + state.rightCleanliness) / 2);

  let tensileStatus: 'pass_2.0N' | 'over_tension_fail' | 'untested' = 'untested';
  if (state.tensionTested) {
    tensileStatus = (state.defectType === 'thick' || !state.spliceSuccess) ? 'over_tension_fail' : 'pass_2.0N';
  }

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Buat ringkasan catatan evaluasi
  let summaryNotes = '';
  if (evalData.grade === 'A+' || evalData.grade === 'A') {
    summaryNotes = `Kinerja unggul (${evalData.total}/100). Redaman transmisi ${loss.toFixed(3)} dB memenuhi spesifikasi Telkom Akses (<0.05 dB). Waktu pengerjaan ${formatDuration(duration)} efisien.`;
  } else if (evalData.grade === 'B') {
    summaryNotes = `Kinerja memuaskan (${evalData.total}/100), namun terdapat catatan teknis pada tahap ${
      evalData.cleavingScore < 80 ? 'cleaving sudut potong' : evalData.cleaningScore < 80 ? 'kebersihan endface' : 'alignment sumbu fusi'
    }. Perlu peningkatan kestabilan SOP.`;
  } else {
    summaryNotes = `Perlu pengulangan latihan (${evalData.total}/100 - Grade ${evalData.grade}). Terjadi ${
      scenariosFaced.find(s => s.severity === 'critical')?.name || 'kendala teknis'
    }. Ikuti SOP korektif sebelum uji kompetensi berikutnya.`;
  }

  return {
    id: `train-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    traineeId: state.traineeId || 'TEK-001',
    traineeName: state.traineeName || 'Teknisi Peserta',
    companyOrInstitution: state.companyOrInstitution || 'SMK Industri / Telkom Akses',
    mode: state.mode || 'training',
    fiberType: state.fiberType || 'G652D_SM',
    timestamp: Date.now(),
    dateFormatted,
    timeFormatted,
    durationSeconds: duration,
    durationFormatted: formatDuration(duration),
    accuracyScore: evalData.total,
    grade: evalData.grade,
    telkomCompliant: evalData.telkomCompliant,
    estimatedLoss: Number(loss.toFixed(3)),
    scoreBreakdown: {
      stripping: evalData.strippingScore,
      cleaning: evalData.cleaningScore,
      cleaving: evalData.cleavingScore,
      splicing: evalData.splicingScore,
      heating: evalData.heatingScore,
    },
    cleaveAngleAvg: avgCleaveAngle > 0 ? avgCleaveAngle : 0.35,
    coreOffset: offsetMagnitude,
    cleanlinessAvg: avgCleanliness > 0 ? avgCleanliness : 90,
    tensileStatus,
    scenariosFaced,
    summaryNotes,
  };
}

/**
 * Memuat riwayat sesi pelatihan dari LocalStorage
 */
export function loadTrainingHistory(): TrainingSessionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return generateSampleHistoryIfEmpty();
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return generateSampleHistoryIfEmpty();
    }
    return parsed;
  } catch (e) {
    console.error('Error loading training history:', e);
    return generateSampleHistoryIfEmpty();
  }
}

/**
 * Menyimpan sesi pelatihan baru ke LocalStorage
 */
export function saveTrainingSession(record: TrainingSessionRecord): TrainingSessionRecord[] {
  const currentHistory = loadTrainingHistory();
  // Cegah duplikasi ID
  const filtered = currentHistory.filter(item => item.id !== record.id);
  // Simpan record baru di posisi paling atas (terbaru)
  const updated = [record, ...filtered];
  
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    console.error('Failed to save training session:', e);
  }

  return updated;
}

/**
 * Menghapus satu sesi dari riwayat
 */
export function deleteTrainingSession(sessionId: string): TrainingSessionRecord[] {
  const current = loadTrainingHistory();
  const updated = current.filter(item => item.id !== sessionId);
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    console.error('Failed to delete training session:', e);
  }
  return updated;
}

/**
 * Menghapus seluruh riwayat pelatihan
 */
export function clearTrainingHistory(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to clear training history:', e);
  }
}

/**
 * Menghitung analisis progres dan tren kemajuan pelatihan
 */
export function calculateProgressAnalytics(sessions: TrainingSessionRecord[]): ProgressAnalytics {
  if (!sessions || sessions.length === 0) {
    return {
      totalSessions: 0,
      passedSessions: 0,
      failedSessions: 0,
      passRatePercentage: 0,
      averageScore: 0,
      averageDurationSeconds: 0,
      averageLoss: 0,
      initialScore: 0,
      latestScore: 0,
      scoreImprovement: 0,
      lossImprovement: 0,
      durationReductionSeconds: 0,
      scenarioFrequencyMap: {},
      competencyAverages: {
        stripping: 0,
        cleaning: 0,
        cleaving: 0,
        splicing: 0,
        heating: 0,
      },
    };
  }

  const totalSessions = sessions.length;
  const passedSessions = sessions.filter(s => s.telkomCompliant).length;
  const failedSessions = totalSessions - passedSessions;
  const passRatePercentage = Math.round((passedSessions / totalSessions) * 100);

  const totalScore = sessions.reduce((acc, s) => acc + s.accuracyScore, 0);
  const averageScore = Math.round(totalScore / totalSessions);

  const totalDuration = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const averageDurationSeconds = Math.round(totalDuration / totalSessions);

  const totalLoss = sessions.reduce((acc, s) => acc + s.estimatedLoss, 0);
  const averageLoss = Number((totalLoss / totalSessions).toFixed(3));

  // Chronological order (oldest to newest)
  const chrono = [...sessions].sort((a, b) => a.timestamp - b.timestamp);
  const initial = chrono[0];
  const latest = chrono[chrono.length - 1];

  const initialScore = initial.accuracyScore;
  const latestScore = latest.accuracyScore;
  const scoreImprovement = latestScore - initialScore;

  const initialLoss = initial.estimatedLoss;
  const latestLoss = latest.estimatedLoss;
  const lossImprovement = Number((initialLoss - latestLoss).toFixed(3));

  const durationReductionSeconds = initial.durationSeconds - latest.durationSeconds;

  // Frekuensi skenario yang dihadapi
  const scenarioFrequencyMap: Record<string, { count: number; category: ScenarioCategory; name: string }> = {};
  for (const session of sessions) {
    for (const sc of session.scenariosFaced) {
      if (!scenarioFrequencyMap[sc.name]) {
        scenarioFrequencyMap[sc.name] = {
          count: 0,
          category: sc.category,
          name: sc.name,
        };
      }
      scenarioFrequencyMap[sc.name].count += 1;
    }
  }

  // Rata-rata per kompetensi tahap
  const competencyAverages = {
    stripping: Math.round(sessions.reduce((acc, s) => acc + s.scoreBreakdown.stripping, 0) / totalSessions),
    cleaning: Math.round(sessions.reduce((acc, s) => acc + s.scoreBreakdown.cleaning, 0) / totalSessions),
    cleaving: Math.round(sessions.reduce((acc, s) => acc + s.scoreBreakdown.cleaving, 0) / totalSessions),
    splicing: Math.round(sessions.reduce((acc, s) => acc + s.scoreBreakdown.splicing, 0) / totalSessions),
    heating: Math.round(sessions.reduce((acc, s) => acc + s.scoreBreakdown.heating, 0) / totalSessions),
  };

  return {
    totalSessions,
    passedSessions,
    failedSessions,
    passRatePercentage,
    averageScore,
    averageDurationSeconds,
    averageLoss,
    initialScore,
    latestScore,
    scoreImprovement,
    lossImprovement,
    durationReductionSeconds,
    scenarioFrequencyMap,
    competencyAverages,
  };
}

/**
 * Membuat data riwayat awal yang mendemonstrasikan progres nyata dari kesalahan menuju kemahiran
 */
export function generateSampleHistoryIfEmpty(): TrainingSessionRecord[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;

  const sampleSessions: TrainingSessionRecord[] = [
    {
      id: 'sample-session-1',
      traineeId: 'TEK-2024-001',
      traineeName: 'Ahmad Rifai',
      companyOrInstitution: 'SMK Industri / Telkom Akses',
      mode: 'training',
      fiberType: 'G652D_SM',
      timestamp: now - dayMs * 3 - hourMs * 4,
      dateFormatted: new Date(now - dayMs * 3 - hourMs * 4).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      timeFormatted: '09:15',
      durationSeconds: 195,
      durationFormatted: '03:15',
      accuracyScore: 64,
      grade: 'C',
      telkomCompliant: false,
      estimatedLoss: 0.125,
      scoreBreakdown: {
        stripping: 62,
        cleaning: 55,
        cleaving: 60,
        splicing: 70,
        heating: 73,
      },
      cleaveAngleAvg: 1.3,
      coreOffset: 0.42,
      cleanlinessAvg: 60,
      tensileStatus: 'untested',
      scenariosFaced: [
        {
          id: 'scen-contamination',
          name: 'Kontaminasi Ujung Serat (Endface Contamination)',
          category: 'contamination',
          severity: 'critical',
          details: 'Kebersihan serat hanya 60%. Ditemukan debu silika dan noda alkohol IPA belum kering.',
          sopCorrection: 'Seka ulang dengan Kimwipes & alkohol IPA 99.8% satu arah.',
        },
        {
          id: 'scen-cleave-angle',
          name: 'Sudut Potong Miring / Cacat Cleaver',
          category: 'cleave_defect',
          severity: 'warning',
          details: 'Sudut cleave 1.3° melebihi ambang batas toleransi SOP Telkom (0.8°).',
          sopCorrection: 'Putar bilah mata pisau cleaver ke indeks tajam berikutnya.',
        },
        {
          id: 'scen-stripping-nick',
          name: 'Goresan Cladding / Retak Mikro Stripper',
          category: 'stripping_flaw',
          severity: 'warning',
          details: 'Kaca silika tergores akibat penggunaan lubang stripper yang salah.',
          sopCorrection: 'Gunakan lubang tang No.3 khusus 250µm coating.',
        },
      ],
      summaryNotes: 'Sesi Pre-Test: Menghadapi kontaminasi ujung serat parah dan sudut potong miring. Redaman 0.125 dB belum memenuhi standar Telkom Akses.',
    },
    {
      id: 'sample-session-2',
      traineeId: 'TEK-2024-001',
      traineeName: 'Ahmad Rifai',
      companyOrInstitution: 'SMK Industri / Telkom Akses',
      mode: 'training',
      fiberType: 'G652D_SM',
      timestamp: now - dayMs * 2 - hourMs * 2,
      dateFormatted: new Date(now - dayMs * 2 - hourMs * 2).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      timeFormatted: '11:40',
      durationSeconds: 155,
      durationFormatted: '02:35',
      accuracyScore: 78,
      grade: 'B',
      telkomCompliant: false,
      estimatedLoss: 0.068,
      scoreBreakdown: {
        stripping: 80,
        cleaning: 85,
        cleaving: 78,
        splicing: 74,
        heating: 82,
      },
      cleaveAngleAvg: 0.7,
      coreOffset: 0.28,
      cleanlinessAvg: 85,
      tensileStatus: 'pass_2.0N',
      scenariosFaced: [
        {
          id: 'scen-misalignment',
          name: 'Ketidaksejajaran Sumbu Inti (Core Misalignment)',
          category: 'misalignment',
          severity: 'warning',
          details: 'Offset sumbu lateral ΔX=0.22µm, ΔY=0.18µm. Motor stepper butuh kalibrasi alur V-groove.',
          sopCorrection: 'Jalankan PAS Auto-Alignment motor stepper splicer.',
        },
      ],
      summaryNotes: 'Sesi Latihan 1: Progres signifikan pada pembersihan dan sudut cleave (0.7°). Menghadapi deviasi sumbu core (0.28µm). Redaman mendekati batas 0.05 dB.',
    },
    {
      id: 'sample-session-3',
      traineeId: 'TEK-2024-001',
      traineeName: 'Ahmad Rifai',
      companyOrInstitution: 'SMK Industri / Telkom Akses',
      mode: 'exam',
      fiberType: 'G652D_SM',
      timestamp: now - dayMs * 1 - hourMs * 1,
      dateFormatted: new Date(now - dayMs * 1 - hourMs * 1).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      timeFormatted: '14:20',
      durationSeconds: 122,
      durationFormatted: '02:02',
      accuracyScore: 92,
      grade: 'A',
      telkomCompliant: true,
      estimatedLoss: 0.024,
      scoreBreakdown: {
        stripping: 94,
        cleaning: 95,
        cleaving: 92,
        splicing: 90,
        heating: 90,
      },
      cleaveAngleAvg: 0.35,
      coreOffset: 0.06,
      cleanlinessAvg: 95,
      tensileStatus: 'pass_2.0N',
      scenariosFaced: [
        {
          id: 'scen-normal-sop',
          name: 'SOP Standar Presisi Terpenuhi (Normal)',
          category: 'sop_compliant',
          severity: 'normal',
          details: 'Semua tahapan pengupasan, pembersihan, pemotongan, dan fusi presisi tanpa kendala teknis.',
        },
      ],
      summaryNotes: 'Sesi Ujian Simulasi: Hasil sangat memuaskan (92/100). Redaman optik 0.024 dB (Lulus Telkom Akses <0.05 dB). Waktu 2 menit 2 detik.',
    },
  ];

  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleSessions));
    }
  } catch (e) {
    // safe fallback
  }

  return sampleSessions;
}

/**
 * Ekspor seluruh data riwayat pelatihan ke berkas CSV terstruktur
 */
export function exportHistoryToCSV(sessions: TrainingSessionRecord[]): void {
  if (typeof window === 'undefined' || !sessions || sessions.length === 0) return;

  const headers = [
    'ID Sesi',
    'Tanggal',
    'Waktu',
    'Nama Teknisi',
    'ID Teknisi',
    'Institusi / Perusahaan',
    'Mode',
    'Tipe Kabel Fiber',
    'Skor Akurasi Total',
    'Grade',
    'Lulus Standar Telkom',
    'Estimasi Loss (dB)',
    'Durasi (Detik)',
    'Durasi Format',
    'Skor Stripping',
    'Skor Cleaning',
    'Skor Cleaving',
    'Skor Splicing',
    'Skor Heating',
    'Rata-rata Sudut Cleave (°)',
    'Offset Core (µm)',
    'Rata-rata Kebersihan (%)',
    'Status Uji Tarik (Tensile)',
    'Skenario yang Dihadapi',
    'Catatan Evaluasi',
  ];

  const rows = sessions.map(s => {
    const scenariosText = s.scenariosFaced.map(sc => `${sc.name} (${sc.details})`).join(' | ');
    return [
      `"${s.id}"`,
      `"${s.dateFormatted}"`,
      `"${s.timeFormatted}"`,
      `"${s.traineeName.replace(/"/g, '""')}"`,
      `"${s.traineeId}"`,
      `"${s.companyOrInstitution.replace(/"/g, '""')}"`,
      `"${s.mode.toUpperCase()}"`,
      `"${s.fiberType}"`,
      s.accuracyScore,
      `"${s.grade}"`,
      s.telkomCompliant ? 'YA' : 'TIDAK',
      s.estimatedLoss,
      s.durationSeconds,
      `"${s.durationFormatted}"`,
      s.scoreBreakdown.stripping,
      s.scoreBreakdown.cleaning,
      s.scoreBreakdown.cleaving,
      s.scoreBreakdown.splicing,
      s.scoreBreakdown.heating,
      s.cleaveAngleAvg,
      s.coreOffset,
      s.cleanlinessAvg,
      `"${s.tensileStatus}"`,
      `"${scenariosText.replace(/"/g, '""')}"`,
      `"${s.summaryNotes.replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Riwayat_Pelatihan_Fiber_Optik_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
