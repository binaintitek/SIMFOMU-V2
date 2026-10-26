import { SplicingStep, TechnicianState } from './fiber';

export type ErrorScenarioCategory = 
  | 'contamination'
  | 'misalignment'
  | 'excessive_tension'
  | 'cleave_defect'
  | 'stripping_flaw';

export type ErrorSeverity = 'warning' | 'critical';

export interface CommonErrorScenario {
  id: string;
  code: string;
  title: string;
  category: ErrorScenarioCategory;
  step: SplicingStep;
  severity: ErrorSeverity;
  
  // Gejala & Tanda di Lapangan
  symptom: string;
  visualManifestation: string;
  sensorTriggerSummary: string;
  
  // Dampak Fisika Optik & Jaringan
  physicsImpact: string;
  lossImpactDb: string;
  
  // Standar & Regulasi
  regulatoryStandard: string; // e.g. "ITU-T G.652.D / Telkom Akses"
  
  // Rekomendasi SOP Perbaikan (Korektif)
  sopCorrection: string;
  preventionAdvice: string;
  
  // Action labels
  actionButtonLabel: string;
  simulationButtonLabel: string;
}

export interface ActiveDetectedError {
  id: string;
  scenarioId: string;
  code: string;
  title: string;
  category: ErrorScenarioCategory;
  step: SplicingStep;
  severity: ErrorSeverity;
  metricReadout: string; // e.g. "Kebersihan: 62% (Min 90%)" or "Offset Core: ΔX = 0.85µm"
  feedbackMessage: string;
  sopCorrection: string;
  lossPenaltyDb: number;
}
