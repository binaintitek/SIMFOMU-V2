import { FiberSpecs, FiberType, TechnicianState } from '../types/fiber';

export const FIBER_SPECS: Record<FiberType, FiberSpecs> = {
  G652D_SM: {
    name: 'ITU-T G.652.D (Standard Single-Mode)',
    category: 'Backbone / OSP Telecommunication',
    modeType: 'SM',
    standardName: 'ITU-T G.652.D',
    standardAuthority: 'SOP Telkom Akses / ITU-T',
    coreDiameter: 9.0, // 9 um
    claddingDiameter: 125.0, // 125 um
    coatingDiameter: 250.0, // 250 um
    jacketDiameter: 3.0, // 3.0 mm
    maxAllowedLoss: 0.05, // Telkom standard: <= 0.05 dB per splice
    maxCleaveAngle: 0.8, // degrees
    jacketColorHex: '#eab308',
    colorName: 'Yellow Jacket (Kuning SM)',
    bufferColor: '#3b82f6', // Blue buffer
    description: 'Serat mode tunggal standar jaringan backbone telekomunikasi, metronet, dan kabel feeder.',
    application: 'Long-Haul Backbone, Feeder FTTH, Metro Transport',
    offsetSensitivity: 'Tinggi (9.0µm)',
  },
  G657A_FTTH: {
    name: 'ITU-T G.657.A2 (Bend-Insensitive SM)',
    category: 'FTTH Drop Cable / Access Network',
    modeType: 'SM',
    standardName: 'ITU-T G.657.A2',
    standardAuthority: 'SOP Telkom Akses / ITU-T',
    coreDiameter: 8.6,
    claddingDiameter: 125.0,
    coatingDiameter: 250.0,
    jacketDiameter: 2.0,
    maxAllowedLoss: 0.05,
    maxCleaveAngle: 0.8,
    jacketColorHex: '#1e293b',
    colorName: 'Black Drop Cable (Hitam FTTH)',
    bufferColor: '#10b981', // Green buffer
    description: 'Serat tahan tekukan radius kecil (R 7.5mm) khusus instalasi drop wire rumah pelanggan.',
    application: 'FTTH Drop Wire, Jalur Rumah/Pelanggan, Riser Gedung',
    offsetSensitivity: 'Sangat Tinggi (8.6µm)',
  },
  OM3_MM: {
    name: 'ISO/IEC 11801 OM3 (50/125 Laser-Optimized)',
    category: 'Data Center / Local Enterprise LAN',
    modeType: 'MM',
    standardName: 'ISO/IEC 11801 OM3',
    standardAuthority: 'ISO/IEC 11801 & TIA-568.3-D',
    coreDiameter: 50.0,
    claddingDiameter: 125.0,
    coatingDiameter: 250.0,
    jacketDiameter: 3.0,
    maxAllowedLoss: 0.10, // MM allowable loss standard: <= 0.10 dB
    maxCleaveAngle: 1.2,
    jacketColorHex: '#06b6d4',
    colorName: 'Aqua Jacket (Toska OM3 MM)',
    bufferColor: '#06b6d4',
    description: 'Serat multimode optimasi laser VCSEL 850nm untuk transmisi data 10G/40Gbps jarak pendek.',
    application: 'Data Center Interconnect, Server Racks, Enterprise LAN',
    offsetSensitivity: 'Sedang (50µm core)',
  },
  OM4_MM: {
    name: 'ISO/IEC 11801 OM4 (50/125 Ultra High-Bandwidth)',
    category: 'Cloud Datacenter / 40G-100G Fabric',
    modeType: 'MM',
    standardName: 'ISO/IEC 11801 OM4',
    standardAuthority: 'ISO/IEC 11801 & TIA-568.3-D',
    coreDiameter: 50.0,
    claddingDiameter: 125.0,
    coatingDiameter: 250.0,
    jacketDiameter: 3.0,
    maxAllowedLoss: 0.10,
    maxCleaveAngle: 1.2,
    jacketColorHex: '#ec4899',
    colorName: 'Erika Violet / Magenta (OM4 MM)',
    bufferColor: '#ec4899',
    description: 'Serat multimode lebar pita sangat tinggi (EMB 4700 MHz·km) untuk transmisi 40G/100G Ethernet.',
    application: 'Cloud Core Switch, High-Density SAN, Spine-Leaf Cluster',
    offsetSensitivity: 'Sedang (50µm core)',
  },
};

/**
 * Calculates realistic optical insertion loss (dB) based on:
 * - Cleave angle mismatch
 * - Lateral / Core offset (microns)
 * - Cleanliness / debris factor
 * - Arc parameters
 */
export function calculateSpliceAccuracy(state: TechnicianState) {
  const spec = FIBER_SPECS[state.fiberType];

  // 1. Stripping score
  const leftStripIdeal = Math.abs(state.leftStrippedLength - 32) <= 4;
  const rightStripIdeal = Math.abs(state.rightStrippedLength - 32) <= 4;
  let strippingScore = 100;
  if (!leftStripIdeal) strippingScore -= 20;
  if (!rightStripIdeal) strippingScore -= 20;
  if (state.strippingQualityLeft === 'nicked') strippingScore -= 35;
  if (state.strippingQualityRight === 'nicked') strippingScore -= 35;
  strippingScore = Math.max(10, Math.min(100, strippingScore));

  // 2. Cleanliness score
  const avgClean = (state.leftCleanliness + state.rightCleanliness) / 2;
  const cleaningScore = Math.round(avgClean);

  // 3. Cleaving score
  // For SM: strict tolerance <= 0.8° (ideal < 0.5°). Penalty starts above 0.5°
  // For MM: relaxed tolerance <= 1.2° (ideal < 0.7°). Penalty starts above 0.7°
  const isSingleMode = spec.modeType === 'SM';
  const angleThreshold = isSingleMode ? 0.5 : 0.7;
  const angleWeight = isSingleMode ? 40 : 25;
  const leftAnglePenalty = Math.max(0, (state.leftCleaveAngle - angleThreshold) * angleWeight);
  const rightAnglePenalty = Math.max(0, (state.rightCleaveAngle - angleThreshold) * angleWeight);
  let cleavingScore = Math.round(100 - leftAnglePenalty - rightAnglePenalty);
  cleavingScore = Math.max(15, Math.min(100, cleavingScore));

  // 4. Splicing calculation (Realistic ITU-T & ISO/IEC Splice Loss Models)
  // Base intrinsic silica loss:
  const baseLoss = isSingleMode ? 0.008 : 0.014;

  // Lateral core offset loss:
  // Offset distance d in microns
  const offsetDistance = Math.sqrt(state.xOffset * state.xOffset + state.yOffset * state.yOffset);

  let offsetLoss = 0;
  if (isSingleMode) {
    // Single-Mode Marcuse formula: L ~ 4.34 * (d / w)^2 where w ~ 4.8 um
    // High sensitivity to sub-micron misalignment
    offsetLoss = 0.18 * Math.pow(offsetDistance / 0.5, 2);
  } else {
    // Multi-Mode graded-index formula: Core diameter is 50um (a = 25um).
    // Lateral offset has ~4x less impact per micron because core area is 30x larger
    offsetLoss = 0.045 * Math.pow(offsetDistance / 0.5, 1.4);
  }

  // Angle mismatch loss:
  // SM has lower numerical aperture (NA ~ 0.12), making it sensitive to angular deviation
  // MM has higher numerical aperture (NA ~ 0.20), providing a wider acceptance cone
  const angleSensitivity = isSingleMode ? 0.016 : 0.009;
  const angleLoss = angleSensitivity * (state.leftCleaveAngle + state.rightCleaveAngle);

  // Dirt & residue penalty:
  const dirtFactor = isSingleMode ? 0.002 : 0.0025;
  const dirtLoss = avgClean < 95 ? (100 - avgClean) * dirtFactor : 0;

  let computedLoss = baseLoss + offsetLoss + angleLoss + dirtLoss;
  computedLoss = Number(computedLoss.toFixed(2));
  if (computedLoss < 0.01) computedLoss = 0.01;

  // Active loss tolerance (incorporating dynamic difficulty setting from ExamSettings if specified)
  const activeMaxLoss = typeof state.maxAllowedLoss === 'number' && state.maxAllowedLoss > 0 
    ? state.maxAllowedLoss 
    : spec.maxAllowedLoss;

  // Splicing score relative to activeMaxLoss (e.g. 0.02 dB for Hard vs 0.08 dB for Easy)
  let splicingScore = Math.round(100 - (computedLoss / activeMaxLoss) * 35);
  if (computedLoss <= activeMaxLoss * 0.4) splicingScore = 98;
  else if (computedLoss <= activeMaxLoss) splicingScore = 90;
  else if (computedLoss <= activeMaxLoss * 1.5) splicingScore = 75;
  else splicingScore = Math.max(20, Math.round(100 - (computedLoss / activeMaxLoss) * 80));

  // 5. Heating score
  let heatingScore = state.heatingCompleted ? (state.sleevePositioned ? 100 : 70) : 30;

  // Total weighted score
  const total = Math.round(
    strippingScore * 0.15 +
    cleaningScore * 0.20 +
    cleavingScore * 0.25 +
    splicingScore * 0.30 +
    heatingScore * 0.10
  );

  let grade: 'A+' | 'A' | 'B' | 'C' | 'RE-EXAM' = 'RE-EXAM';
  const excellentLoss = activeMaxLoss * 0.6;
  const passLoss = activeMaxLoss;
  const warnLoss = activeMaxLoss * 1.5;

  if (total >= 92 && computedLoss <= excellentLoss) grade = 'A+';
  else if (total >= 82 && computedLoss <= passLoss) grade = 'A';
  else if (total >= 70 && computedLoss <= warnLoss) grade = 'B';
  else if (total >= 55) grade = 'C';
  else grade = 'RE-EXAM';

  const telkomCompliant = computedLoss <= activeMaxLoss && state.tensionTested;

  return {
    strippingScore,
    cleaningScore,
    cleavingScore,
    splicingScore,
    heatingScore,
    computedLoss,
    total,
    grade,
    telkomCompliant,
    isSingleMode,
    maxAllowedLoss: activeMaxLoss,
    standardName: spec.standardName,
    standardAuthority: spec.standardAuthority,
    offsetLoss: Number(offsetLoss.toFixed(3)),
    angleLoss: Number(angleLoss.toFixed(3)),
    dirtLoss: Number(dirtLoss.toFixed(3)),
  };
}

export const STEP_METADATA = [
  {
    id: 'stripping',
    number: '01',
    title: 'Stripping Fiber',
    sub: 'Kupas buffer & coating 30-35mm',
    tool: 'Miller Stripper CFS-3',
    instruction: 'Gunakan lubang kedua (900μm) lalu ketiga (250μm) pada tang Miller. Jangan sampai menggores (nicking) kaca inti.',
  },
  {
    id: 'cleaning',
    number: '02',
    title: 'Cleaning Core',
    sub: 'Bersihkan residu IPA 99%',
    tool: 'Kimwipes & Isopropyl Alcohol 99%',
    instruction: 'Lipat tisu Kimwipes, basahi dengan alkohol 99%, jepit fiber lembut dan tarik 1 arah ke ujung hingga berbunyi mencicit.',
  },
  {
    id: 'cleaving',
    number: '03',
    title: 'Fiber Cleaving',
    sub: 'Potong presisi sudut 90°',
    tool: 'High Precision Cleaver (FC-6S)',
    instruction: 'Posisikan fiber pada skala 12-16mm di atas V-groove cleaver, tutup klem, dorong bilah intan, lalu buka penutup.',
  },
  {
    id: 'splicing',
    number: '04',
    title: 'Fusion Splicing',
    sub: 'Penyelarasan core & Arc Arc discharge',
    tool: 'Core Alignment Fusion Splicer',
    instruction: 'Letakkan kedua ujung pada V-Groove (jangan sampai menabrak elektroda), tutup penutup angin, lakukan alignment dan ARC.',
  },
  {
    id: 'heating',
    number: '05',
    title: 'Protection Sleeve',
    sub: 'Pemanasan sleeve pelindung 60mm',
    tool: 'Built-in Tube Heater (200°C)',
    instruction: 'Geser protection sleeve tepat di tengah titik sambungan bare fiber, pindahkan ke heater oven, kunci klem pemanas.',
  },
  {
    id: 'assessment',
    number: '06',
    title: 'Hasil & Evaluasi',
    sub: 'Sertifikat & Uji Akurasi Telkom',
    tool: 'Optical Loss / QC Certifier',
    instruction: 'Analisis redaman (dB), sudut potong, uji kekuatan tarik mekanis (tension test 2.0N), dan cetak lembar kerja kompetensi.',
  },
];

/**
 * Strict Step Passing Criteria Evaluation (SOP Telkom & Fusion Splicer Standard)
 * 1. Stripping: Serat Kiri & Kanan berstatus TERKUPAS (30-35mm)
 * 2. Cleaning: Kebersihan core mencapai 100%
 * 3. Cleaving: Sudut potong kedua serat <= 1.0°
 * 4. Splicing: Proses PAS alignment & Arc discharge selesai
 * 5. Protection Sleeve: Heat oven selesai dipanaskan
 */
export interface StepPassingCriteria {
  isStep0Passed: boolean; // 01 Stripping
  isStep1Passed: boolean; // 02 Cleaning
  isStep2Passed: boolean; // 03 Cleaving
  isStep3Passed: boolean; // 04 Splicing
  isStep4Passed: boolean; // 05 Protection Sleeve
  unlockedIndex: number;  // Highest unlocked step index (0-5)
  details: {
    stripping: { passed: boolean; message: string };
    cleaning: { passed: boolean; message: string };
    cleaving: { passed: boolean; message: string };
    splicing: { passed: boolean; message: string };
    heating: { passed: boolean; message: string };
  };
}

export function checkStepPassingCriteria(state: TechnicianState): StepPassingCriteria {
  // Step 01 (Stripping): Serat Kiri & Kanan berstatus TERKUPAS (30-35mm)
  const leftStrippedOk = state.leftStrippedLength >= 30 && state.leftStrippedLength <= 35 && state.strippingQualityLeft !== 'unstripped' && state.strippingQualityLeft !== 'nicked';
  const rightStrippedOk = state.rightStrippedLength >= 30 && state.rightStrippedLength <= 35 && state.strippingQualityRight !== 'unstripped' && state.strippingQualityRight !== 'nicked';
  const isStep0Passed = leftStrippedOk && rightStrippedOk;

  // Step 02 (Cleaning): Kebersihan core mencapai 100%
  const leftCleanOk = state.leftCleanliness >= 100;
  const rightCleanOk = state.rightCleanliness >= 100;
  const isStep1Passed = isStep0Passed && leftCleanOk && rightCleanOk;

  // Step 03 (Cleaving): Sudut potong kedua serat <= 1.0°
  const leftCleaveOk = state.leftCleaveLength > 0 && state.leftCleaveAngle <= 1.0;
  const rightCleaveOk = state.rightCleaveLength > 0 && state.rightCleaveAngle <= 1.0;
  const isStep2Passed = isStep1Passed && leftCleaveOk && rightCleaveOk;

  // Step 04 (Splicing): Proses PAS alignment & Arc discharge selesai
  const alignmentOk = state.motorAligned;
  const arcOk = state.arcPerformed;
  const isStep3Passed = isStep2Passed && alignmentOk && arcOk;

  // Step 05 (Protection Sleeve): Heat oven selesai dipanaskan
  const heatingOk = state.heatingCompleted;
  const isStep4Passed = isStep3Passed && heatingOk;

  let unlockedIndex = 0;
  if (isStep0Passed) unlockedIndex = 1;
  if (isStep1Passed) unlockedIndex = 2;
  if (isStep2Passed) unlockedIndex = 3;
  if (isStep3Passed) unlockedIndex = 4;
  if (isStep4Passed) unlockedIndex = 5;

  return {
    isStep0Passed,
    isStep1Passed,
    isStep2Passed,
    isStep3Passed,
    isStep4Passed,
    unlockedIndex,
    details: {
      stripping: {
        passed: isStep0Passed,
        message: isStep0Passed
          ? 'Serat kiri & kanan terkupas sempurna (30-35mm)'
          : `Kiri: ${state.leftStrippedLength || 0}mm, Kanan: ${state.rightStrippedLength || 0}mm (Target 30-35mm, bebas goresan)`,
      },
      cleaning: {
        passed: isStep1Passed,
        message: isStep1Passed
          ? 'Kebersihan kedua inti serat mencapai 100%'
          : `Kiri: ${state.leftCleanliness || 0}%, Kanan: ${state.rightCleanliness || 0}% (Target 100%)`,
      },
      cleaving: {
        passed: isStep2Passed,
        message: isStep2Passed
          ? 'Sudut potong kedua serat presisi <= 1.0°'
          : `Kiri: ${state.leftCleaveAngle || 0}°, Kanan: ${state.rightCleaveAngle || 0}° (Batas toleransi <= 1.0°)`,
      },
      splicing: {
        passed: isStep3Passed,
        message: isStep3Passed
          ? 'PAS motor alignment & Arc discharge selesai'
          : `Alignment: ${alignmentOk ? 'Selesai' : 'Belum'}, Arc: ${arcOk ? 'Selesai' : 'Belum'}`,
      },
      heating: {
        passed: isStep4Passed,
        message: isStep4Passed
          ? 'Sleeve pemanas (heat oven) selesai dipanaskan'
          : `Status oven heater: ${heatingOk ? 'Selesai' : 'Belum dipanaskan'}`,
      },
    },
  };
}

/**
 * Reset payload for critical failure handling
 * Resets all progress flags (isStripped, isCleaned, isCleaved, splicing, heating) to initial default
 */
export const RESET_PROGRESS_STATE: Partial<TechnicianState> = {
  leftStrippedLength: 0,
  rightStrippedLength: 0,
  strippingQualityLeft: 'unstripped',
  strippingQualityRight: 'unstripped',
  leftCleanliness: 0,
  rightCleanliness: 0,
  cleaningTechniqueCorrect: false,
  leftCleaveAngle: 0,
  rightCleaveAngle: 0,
  leftCleaveLength: 0,
  rightCleaveLength: 0,
  motorAligned: false,
  xOffset: 0.28,
  yOffset: 0.35,
  zGap: 24,
  arcPerformed: false,
  tensionTested: false,
  estimatedLoss: 0,
  spliceSuccess: false,
  defectType: 'none',
  sleevePositioned: false,
  heaterClosed: false,
  heatingProgress: 0,
  heatingCompleted: false,
};

