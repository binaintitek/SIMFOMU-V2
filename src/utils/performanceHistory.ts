import { TechnicianState } from '../types/fiber';
import { calculateSpliceAccuracy, FIBER_SPECS } from './standards';

export interface PerformanceSessionRecord {
  id: string;
  traineeId: string;
  traineeName: string;
  sessionIndex: number;
  sessionLabel: string;
  timestamp: number;
  dateStr: string;
  totalScore: number;
  spliceLoss: number;
  strippingScore: number;
  cleaningScore: number;
  cleavingScore: number;
  splicingScore: number;
  heatingScore: number;
  cleaveAngle: number;
  durationSeconds: number;
  telkomCompliant: boolean;
  grade: string;
  fiberType: string;
  isCurrent?: boolean;
}

const STORAGE_PREFIX = 'optisim_tech_history_';

/**
 * Generates synthetic baseline progression data leading up to the current session.
 * This provides immediate educational value showing improvement curve even on first run.
 */
export function generateBaselineHistory(
  currentState: TechnicianState
): PerformanceSessionRecord[] {
  const evalData = calculateSpliceAccuracy(currentState);
  const loss = currentState.arcPerformed ? currentState.estimatedLoss : 0.02;
  const currentDuration = currentState.timeTrialDuration > 0 ? currentState.timeTrialDuration : 135;
  const avgCleaveAngle = Number(((currentState.leftCleaveAngle + currentState.rightCleaveAngle) / 2).toFixed(2));
  const currentTotal = evalData.total;

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;

  // Progression steps leading to current result
  const baselineSessions: PerformanceSessionRecord[] = [
    {
      id: `hist-base-1-${currentState.traineeId}`,
      traineeId: currentState.traineeId,
      traineeName: currentState.traineeName,
      sessionIndex: 1,
      sessionLabel: 'Sesi 1 (Pre-Test)',
      timestamp: now - dayMs * 3 - hourMs * 4,
      dateStr: new Date(now - dayMs * 3 - hourMs * 4).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      totalScore: Math.max(55, Math.min(72, Math.round(currentTotal * 0.70))),
      spliceLoss: Number(Math.min(0.12, loss + 0.06).toFixed(3)),
      strippingScore: 65,
      cleaningScore: 70,
      cleavingScore: 60,
      splicingScore: 68,
      heatingScore: 60,
      cleaveAngle: Number(Math.min(1.4, avgCleaveAngle + 0.8).toFixed(1)),
      durationSeconds: Math.round(currentDuration * 1.6),
      telkomCompliant: false,
      grade: 'C',
      fiberType: currentState.fiberType,
      isCurrent: false,
    },
    {
      id: `hist-base-2-${currentState.traineeId}`,
      traineeId: currentState.traineeId,
      traineeName: currentState.traineeName,
      sessionIndex: 2,
      sessionLabel: 'Sesi 2 (Latihan 1)',
      timestamp: now - dayMs * 2 - hourMs * 2,
      dateStr: new Date(now - dayMs * 2 - hourMs * 2).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      totalScore: Math.max(68, Math.min(82, Math.round(currentTotal * 0.82))),
      spliceLoss: Number(Math.min(0.08, loss + 0.03).toFixed(3)),
      strippingScore: 78,
      cleaningScore: 82,
      cleavingScore: 75,
      splicingScore: 80,
      heatingScore: 85,
      cleaveAngle: Number(Math.min(1.0, avgCleaveAngle + 0.4).toFixed(1)),
      durationSeconds: Math.round(currentDuration * 1.3),
      telkomCompliant: false,
      grade: 'B',
      fiberType: currentState.fiberType,
      isCurrent: false,
    },
    {
      id: `hist-base-3-${currentState.traineeId}`,
      traineeId: currentState.traineeId,
      traineeName: currentState.traineeName,
      sessionIndex: 3,
      sessionLabel: 'Sesi 3 (Simulasi)',
      timestamp: now - dayMs * 1 - hourMs * 1,
      dateStr: new Date(now - dayMs * 1 - hourMs * 1).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      totalScore: Math.max(76, Math.min(91, Math.round(currentTotal * 0.92))),
      spliceLoss: Number(Math.min(0.05, loss + 0.015).toFixed(3)),
      strippingScore: 86,
      cleaningScore: 90,
      cleavingScore: 88,
      splicingScore: 89,
      heatingScore: 92,
      cleaveAngle: Number(Math.min(0.7, avgCleaveAngle + 0.2).toFixed(1)),
      durationSeconds: Math.round(currentDuration * 1.1),
      telkomCompliant: true,
      grade: 'A',
      fiberType: currentState.fiberType,
      isCurrent: false,
    },
  ];

  return baselineSessions;
}

/**
 * Builds the current session record from live TechnicianState.
 */
export function createCurrentSessionRecord(
  currentState: TechnicianState,
  sessionIndex: number = 4
): PerformanceSessionRecord {
  const evalData = calculateSpliceAccuracy(currentState);
  const loss = currentState.arcPerformed ? currentState.estimatedLoss : 0.02;
  const currentDuration = currentState.timeTrialDuration > 0 ? currentState.timeTrialDuration : 115;
  const avgCleaveAngle = Number(((currentState.leftCleaveAngle + currentState.rightCleaveAngle) / 2).toFixed(2));

  return {
    id: `curr-session-${currentState.traineeId}-${Date.now()}`,
    traineeId: currentState.traineeId,
    traineeName: currentState.traineeName,
    sessionIndex,
    sessionLabel: `Sesi ${sessionIndex} (Uji Sekarang)`,
    timestamp: Date.now(),
    dateStr: 'Hari Ini (Aktif)',
    totalScore: evalData.total,
    spliceLoss: Number(loss.toFixed(3)),
    strippingScore: evalData.strippingScore,
    cleaningScore: evalData.cleaningScore,
    cleavingScore: evalData.cleavingScore,
    splicingScore: evalData.splicingScore,
    heatingScore: evalData.heatingScore,
    cleaveAngle: avgCleaveAngle > 0 ? avgCleaveAngle : 0.3,
    durationSeconds: currentDuration,
    telkomCompliant: evalData.telkomCompliant,
    grade: evalData.grade,
    fiberType: currentState.fiberType,
    isCurrent: true,
  };
}

/**
 * Loads all historical records for a technician, appending the current live session at the end.
 */
export function getTechnicianPerformanceHistory(
  currentState: TechnicianState
): PerformanceSessionRecord[] {
  if (typeof window === 'undefined') {
    const baselines = generateBaselineHistory(currentState);
    const current = createCurrentSessionRecord(currentState, baselines.length + 1);
    return [...baselines, current];
  }

  try {
    const key = `${STORAGE_PREFIX}${currentState.traineeId}`;
    const raw = localStorage.getItem(key);
    let pastRecords: PerformanceSessionRecord[] = [];

    if (raw) {
      pastRecords = JSON.parse(raw);
    }

    // If no past records saved yet, generate realistic baseline progression
    if (!Array.isArray(pastRecords) || pastRecords.length === 0) {
      pastRecords = generateBaselineHistory(currentState);
      localStorage.setItem(key, JSON.stringify(pastRecords));
    }

    // Always append the live current session at the tail
    const currentRecord = createCurrentSessionRecord(currentState, pastRecords.length + 1);
    return [...pastRecords, currentRecord];
  } catch (err) {
    console.error('Failed to load technician history:', err);
    const baselines = generateBaselineHistory(currentState);
    return [...baselines, createCurrentSessionRecord(currentState, baselines.length + 1)];
  }
}

/**
 * Saves a new completed session to the technician's permanent history.
 */
export function recordCompletedSession(currentState: TechnicianState): PerformanceSessionRecord {
  const history = getTechnicianPerformanceHistory(currentState);
  // Filter out any prior temporary "isCurrent" records
  const pastOnly = history.filter((h) => !h.isCurrent);
  const newIndex = pastOnly.length + 1;
  const newRecord: PerformanceSessionRecord = {
    ...createCurrentSessionRecord(currentState, newIndex),
    id: `saved-${currentState.traineeId}-${Date.now()}`,
    sessionLabel: `Sesi ${newIndex} (Selesai)`,
    dateStr: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    isCurrent: false,
  };

  const updated = [...pastOnly, newRecord];
  try {
    if (typeof window !== 'undefined') {
      const key = `${STORAGE_PREFIX}${currentState.traineeId}`;
      localStorage.setItem(key, JSON.stringify(updated));
    }
  } catch (err) {
    console.error('Failed to persist session record:', err);
  }

  return newRecord;
}

/**
 * Clears custom history back to standard baseline.
 */
export function resetTechnicianHistory(traineeId: string): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`${STORAGE_PREFIX}${traineeId}`);
    }
  } catch (err) {
    console.error('Failed to reset history:', err);
  }
}
