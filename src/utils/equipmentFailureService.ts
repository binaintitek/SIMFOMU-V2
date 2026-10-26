import { EquipmentFailureType, ActiveEquipmentIncident, EquipmentHealthState, FailureProbability } from '../types/equipmentFailure';
import { ExamSettings } from './adminAuth';
import { SplicingStep } from '../types/fiber';
import { soundEffects } from './audio';

export const DEFAULT_EQUIPMENT_HEALTH: EquipmentHealthState = {
  splicerBatteryLevel: 95,
  splicerIsCharging: false,
  cleaverBladePosition: 1,
  cleaverBladeCondition: 'sharp',
  electrodesCondition: 'clean',
  vGrooveCondition: 'clean',
  heaterCondition: 'ready',
  activeFailure: null,
  resolvedFailuresCount: 0,
};

export interface FailureDefinition {
  type: EquipmentFailureType;
  title: string;
  code: string;
  description: string;
  symptom: string;
  sopInstruction: string;
  mitigationButtonLabel: string;
  applicableSteps: SplicingStep[];
}

export const FAILURE_CATALOG: Record<EquipmentFailureType, FailureDefinition> = {
  low_battery: {
    type: 'low_battery',
    title: 'Daya Baterai Splicer Kritis (< 10%)',
    code: 'ALM-PWR-04',
    description: 'Tegangan baterai lithium splicer drop di bawah batas aman untuk pelepasan busur arc 2000°C.',
    symptom: 'Layar LCD splicer menampilkan indikator baterai merah berkedip. Proses fusi otomatis diblokir sistem proteksi untuk mencegah sambungan putus di tengah fusi.',
    sopInstruction: 'SOP Lapangan: Segera hubungkan kabel adaptor charger DC 12V ke port power splicer untuk melanjutkan operasional tanpa membatalkan pekerjaan.',
    mitigationButtonLabel: '🔌 Hubungkan Adaptor Charger DC 12V',
    applicableSteps: ['splicing', 'heating'],
  },
  dull_cleaver: {
    type: 'dull_cleaver',
    title: 'Mata Pisau Cleaver Tumpul (Dull Blade)',
    code: 'ALM-CLV-16',
    description: 'Bilah intan cleaver pada posisi saat ini mengalami keausan mikroskopis, menghasilkan sudut potong miring (> 1.2°) atau ujung kaca retak.',
    symptom: 'Inspeksi mikroskop cleaver mendeteksi sudut potong tidak memenuhi standar SOP Telkom (harus ≤ 0.8°). Fusi akan menghasilkan loss redaman tinggi.',
    sopInstruction: 'SOP Maintenance Cleaver: Buka kunci penahan dengan kunci L hex key, putar roda mata pisau ke posisi nomor berikutnya (1-16), lalu kencangkan kembali.',
    mitigationButtonLabel: '🔧 Putar Posisi Mata Pisau Cleaver',
    applicableSteps: ['cleaving'],
  },
  dirty_electrode: {
    type: 'dirty_electrode',
    title: 'Elektroda Tungsten Teroksidasi / Jelaga Silika',
    code: 'ALM-ARC-12',
    description: 'Terjadi penumpukan deposit silika terbakar pada ujung jarum elektroda fusi akibat penggunaan berulang.',
    symptom: 'Percikan busur arc discharge tidak merata (arc flutter/sputter), menyebabkan pembentukan gelembung udara mikro pada titik pelelehan kaca.',
    sopInstruction: 'SOP Pemeliharaan: Jalankan fitur pembersihan otomatis elektroda (Electrode Auto-Clean) dan lakukan kalibrasi daya busur (Arc Power Calibration).',
    mitigationButtonLabel: '⚡ Auto-Clean & Kalibrasi Arc Elektroda',
    applicableSteps: ['splicing'],
  },
  dusty_vgroove: {
    type: 'dusty_vgroove',
    title: 'V-Groove Berdebu / Motor PAS Axis Terhambat',
    code: 'ALM-PAS-08',
    description: 'Alur presisi V-groove terganjal partikel debu halus sehingga serat tidak berada tepat di sumbu optik tengah.',
    symptom: 'Motor penjajaran PAS (Profile Alignment System) gagal mencapai titik fokus X-Y seimbang, batas koreksi motor terlampaui.',
    sopInstruction: 'SOP Kebersihan: Buka pelindung angin (wind cover), gunakan kuas pembersih mikro yang dibasahi alkohol isopropil 99% untuk menyapu alur V-groove.',
    mitigationButtonLabel: '🧹 Bersihkan Alur V-Groove (Kuas Alkohol 99%)',
    applicableSteps: ['splicing'],
  },
  heater_fault: {
    type: 'heater_fault',
    title: 'Proteksi Termal Oven Trip (Sensor Overheat)',
    code: 'ALM-OVEN-02',
    description: 'Sensor suhu heater oven mendeteksi suhu melebihi ambang batas keselamatan termal proteksi 220°C.',
    symptom: 'Pemanasan oven proteksi sleeve mendadak berhenti di tengah siklus penciutan, lampu indikator heater berkedip amber peringatan.',
    sopInstruction: 'SOP Penanganan: Buka penutup heater oven selama 3 detik untuk melepas panas berlebih, lalu tekan tombol Reset Proteksi Termal Oven.',
    mitigationButtonLabel: '🔄 Reset Proteksi Termal Oven',
    applicableSteps: ['heating'],
  },
};

const PROBABILITY_WEIGHTS: Record<FailureProbability, number> = {
  low: 0.20,
  medium: 0.45,
  high: 0.70,
  always: 1.00,
};

/**
 * Check whether a random equipment failure should trigger on the current step
 */
export function checkShouldTriggerFailure(
  settings: ExamSettings,
  currentHealth: EquipmentHealthState,
  step: SplicingStep,
  candidateType?: EquipmentFailureType
): ActiveEquipmentIncident | null {
  if (!settings.randomEquipmentFailureEnabled) {
    return null;
  }

  // Do not trigger another failure if one is currently unresolved
  if (currentHealth.activeFailure) {
    return null;
  }

  const allowedTypes = settings.activeFailureTypes || [
    'low_battery',
    'dull_cleaver',
    'dirty_electrode',
    'dusty_vgroove',
    'heater_fault',
  ];

  if (allowedTypes.length === 0) return null;

  // Filter types suitable for current step
  const eligibleTypes = allowedTypes.filter((type) => {
    const def = FAILURE_CATALOG[type];
    return def && def.applicableSteps.includes(step);
  });

  if (eligibleTypes.length === 0) return null;

  const targetType = candidateType && eligibleTypes.includes(candidateType)
    ? candidateType
    : eligibleTypes[Math.floor(Math.random() * eligibleTypes.length)];

  const threshold = PROBABILITY_WEIGHTS[settings.failureProbability || 'medium'] ?? 0.45;
  const roll = Math.random();

  if (roll <= threshold || settings.failureProbability === 'always') {
    const def = FAILURE_CATALOG[targetType];
    return {
      id: `incident_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: targetType,
      title: def.title,
      description: def.description,
      code: def.code,
      sopInstruction: def.sopInstruction,
      stepTriggered: step,
      mitigationButtonLabel: def.mitigationButtonLabel,
      timestamp: Date.now(),
    };
  }

  return null;
}

/**
 * Manually instantiate an incident for immediate testing from Admin panel
 */
export function createManualIncident(
  type: EquipmentFailureType,
  step: SplicingStep = 'splicing'
): ActiveEquipmentIncident {
  const def = FAILURE_CATALOG[type] || FAILURE_CATALOG.low_battery;
  return {
    id: `incident_manual_${Date.now()}`,
    type,
    title: def.title,
    description: def.description,
    code: def.code,
    sopInstruction: def.sopInstruction,
    stepTriggered: step,
    mitigationButtonLabel: def.mitigationButtonLabel,
    timestamp: Date.now(),
  };
}

/**
 * Resolve an active incident and update equipment health
 */
export function resolveEquipmentIncident(
  prevHealth: EquipmentHealthState,
  type: EquipmentFailureType
): EquipmentHealthState {
  soundEffects.playToolFixed();

  const nextHealth: EquipmentHealthState = {
    ...prevHealth,
    activeFailure: null,
    resolvedFailuresCount: (prevHealth.resolvedFailuresCount || 0) + 1,
  };

  switch (type) {
    case 'low_battery':
      nextHealth.splicerBatteryLevel = 98;
      nextHealth.splicerIsCharging = true;
      break;

    case 'dull_cleaver':
      // Rotate blade position to next channel (1-16)
      nextHealth.cleaverBladePosition = (prevHealth.cleaverBladePosition % 16) + 1;
      nextHealth.cleaverBladeCondition = 'sharp';
      break;

    case 'dirty_electrode':
      nextHealth.electrodesCondition = 'clean';
      break;

    case 'dusty_vgroove':
      nextHealth.vGrooveCondition = 'clean';
      break;

    case 'heater_fault':
      nextHealth.heaterCondition = 'ready';
      break;
  }

  return nextHealth;
}
