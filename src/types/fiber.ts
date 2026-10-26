import { EquipmentHealthState } from './equipmentFailure';

export type SplicingStep = 
  | 'stripping'
  | 'cleaning'
  | 'cleaving'
  | 'splicing'
  | 'heating'
  | 'assessment';

export type FiberType = 'G652D_SM' | 'G657A_FTTH' | 'OM3_MM' | 'OM4_MM';

export type FiberMode = 'SM' | 'MM';

export type ParticipantTestStatus = 'untested' | 'in_progress' | 'completed';

export interface ParticipantRecord {
  id: string;
  traineeName: string;
  traineeId: string;
  companyOrInstitution: string;
  status: ParticipantTestStatus;
  durationSeconds?: number;
  totalScore?: number;
  grade?: 'A+' | 'A' | 'B' | 'C' | 'RE-EXAM';
  spliceLoss?: number;
  telkomCompliant?: boolean;
  createdAt: number;
  completedAt?: number;
}

export interface FiberSpecs {
  name: string;
  category: string;
  modeType: FiberMode; // 'SM' or 'MM'
  standardName: string; // e.g. 'ITU-T G.652.D' or 'ISO/IEC 11801 OM3'
  standardAuthority: string; // e.g. 'SOP Telkom Akses / ITU-T' or 'ISO/IEC 11801 & TIA-568'
  coreDiameter: number; // in microns (e.g. 9.0um, 8.6um, 50.0um)
  claddingDiameter: number; // 125um
  coatingDiameter: number; // 250um
  jacketDiameter: number; // 3.0mm or 2.0mm
  maxAllowedLoss: number; // 0.05 dB for SM, 0.10 dB for MM
  maxCleaveAngle: number; // 0.8° for SM, 1.2° for MM
  jacketColorHex: string;
  colorName: string;
  bufferColor: string;
  description: string;
  application: string;
  offsetSensitivity: 'Sangat Tinggi (8.6µm)' | 'Tinggi (9.0µm)' | 'Sedang (50µm core)';
}

export interface TechnicianState {
  traineeName: string;
  traineeId: string;
  companyOrInstitution: string;
  mode: 'training' | 'exam' | 'timetrial';
  fiberType: FiberType;
  soundEnabled: boolean;

  // Time-Trial Mode Tracking (Stripping to Heat Shrink)
  timeTrialDuration: number; // total elapsed time in seconds
  timeTrialStartTime: number | null; // timestamp when timer started
  timeTrialRunning: boolean; // whether the stopwatch is actively counting
  timeTrialCompleted: boolean; // whether heat shrink has completed
  
  // Step 1: Stripping
  leftStrippedLength: number; // mm (ideal: 30-35mm)
  rightStrippedLength: number;
  strippingQualityLeft: 'perfect' | 'nicked' | 'too_short' | 'too_long' | 'unstripped';
  strippingQualityRight: 'perfect' | 'nicked' | 'too_short' | 'too_long' | 'unstripped';

  // Step 2: Cleaning
  leftCleanliness: number; // 0 - 100%
  rightCleanliness: number; // 0 - 100%
  cleaningTechniqueCorrect: boolean;

  // Step 3: Cleaving
  leftCleaveAngle: number; // degrees (ideal < 0.8°)
  rightCleaveAngle: number; // degrees (ideal < 0.8°)
  leftCleaveLength: number; // mm (target 12-16mm)
  rightCleaveLength: number; // mm (target 12-16mm)
  cleaveBladeCondition: 'sharp' | 'worn';

  // Step 4: Splicing
  coverClosed: boolean;
  viewMode: 'X' | 'Y' | 'DUAL' | 'MACRO_3D';
  motorAligned: boolean;
  xOffset: number; // microns
  yOffset: number; // microns
  zGap: number; // microns (ideal: 10-15um)
  arcPerformed: boolean;
  tensionTested: boolean;
  estimatedLoss: number; // dB
  spliceSuccess: boolean;
  defectType: 'none' | 'bubble' | 'waist' | 'thick' | 'offset' | 'angle_fail';

  // Step 5: Heating
  sleevePositioned: boolean;
  heaterClosed: boolean;
  heatingProgress: number; // 0 - 100%
  heatingCompleted: boolean;

  // Final Assessment
  scores: {
    stripping: number; // 0 - 100
    cleaning: number;
    cleaving: number;
    splicing: number;
    heating: number;
    total: number;
    grade: 'A+' | 'A' | 'B' | 'C' | 'RE-EXAM';
    telkomCompliant: boolean;
  };

  // Dynamic Exam Difficulty & Step Timing / OTDR Tolerance
  dynamicDifficulty?: 'easy' | 'normal' | 'hard';
  maxAllowedLoss?: number; // Active OTDR dB tolerance threshold (overrides default spec)
  stepTimeLimitSeconds?: number; // Per-step time limit in seconds (e.g. 90s Easy, 25s Hard)
  stepTimeElapsed?: Partial<Record<SplicingStep, number>>; // Seconds spent on each step
  currentStepTime?: number; // Current active step duration in seconds
  isStepOvertime?: boolean; // Indicates if current step exceeded time limit

  // Resilience & Random Equipment Failure Simulation Module
  randomEquipmentFailureEnabled?: boolean;
  equipmentHealth?: EquipmentHealthState;

  // Training History & Scenarios Encountered Tracking
  encounteredScenarios?: string[];
}

export interface LeaderboardEntry {
  id: string;
  traineeName: string;
  traineeId: string;
  companyOrInstitution: string;
  fiberType: FiberType;
  totalScore: number; // 0 - 100
  spliceLoss: number; // in dB
  grade: 'A+' | 'A' | 'B' | 'C' | 'RE-EXAM';
  mode: 'training' | 'exam' | 'timetrial';
  durationSeconds: number; // total duration from stripping to heat shrink (in seconds)
  isTimeTrial?: boolean;
  telkomCompliant: boolean;
  strippingScore: number;
  cleaningScore: number;
  cleavingScore: number;
  splicingScore: number;
  heatingScore: number;
  cleaveAngleLeft: number;
  cleaveAngleRight: number;
  timestamp: number;
}
