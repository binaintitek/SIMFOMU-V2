import { SplicingStep, TechnicianState } from '../types/fiber';
import { CommonErrorScenario, ActiveDetectedError } from '../types/errorScenarios';

export const COMMON_ERROR_CATALOG: Record<string, CommonErrorScenario> = {
  endface_contamination: {
    id: 'endface_contamination',
    code: 'ERR-CONTAM-01',
    title: 'Kontaminasi Ujung Serat (Endface Contamination)',
    category: 'contamination',
    step: 'splicing',
    severity: 'critical',
    symptom: 'Muncul partikel hitam mikron, bintik noda minyak sidik jari, atau bayangan residu alkohol IPA di penampang potong serat pada tampilan kamera mikroskop X/Y.',
    visualManifestation: 'Bintik partikel debu mikro (1-4µm) menempel di ujung kaca silika, membuat tepi core buram dan tidak jernih.',
    sensorTriggerSummary: 'Sensor kebersihan core mendeteksi partikel asing (Kebersihan < 85%) atau residu kimia belum menguap.',
    physicsImpact: 'Saat busur arc discharge 2000°C dinyalakan, partikel organik terbakar menjadi jelaga karbon atau rongga gas, membentuk gelembung mikro (bubble defect). Hal ini memicu hamburan Rayleigh masif dan refleksi balik Fresnel tinggi (Return Loss < 40 dB).',
    lossImpactDb: '+0.25 s.d +0.80 dB (Sangat melebihi batas Telkom Akses 0.05 dB)',
    regulatoryStandard: 'ITU-T G.652.D / Telkom Akses SOP-OFT-002: Permukaan ujung serat harus 100% bebas dari partikel dan minyak sebelum fusi.',
    sopCorrection: 'Lakukan pembersihan ulang (re-clean) menggunakan tisu bebas serat (Kimwipes) yang dibasahi alkohol Isopropil murni 99.8% dengan usapan searah, lalu keringkan dan lakukan pemotongan ulang (re-cleave).',
    preventionAdvice: 'Jangan pernah menyentuh serat optik yang telah dikupas dengan jari telanjang. Selalu biarkan alkohol IPA menguap sempurna (1-2 detik) sebelum memasang serat ke dalam V-groove.',
    actionButtonLabel: 'Bersihkan Ulang dengan Kimwipes & Alkohol IPA (SOP)',
    simulationButtonLabel: 'Simulasikan Kontaminasi Ujung Serat',
  },

  core_misalignment: {
    id: 'core_misalignment',
    code: 'ERR-ALIGN-02',
    title: 'Ketidaksejajaran Sumbu Inti (Core Axis Misalignment)',
    category: 'misalignment',
    step: 'splicing',
    severity: 'critical',
    symptom: 'Garis inti (core 9µm) serat kiri dan kanan pada tampilan mikroskop PAS tidak sejajar lurus (terjadi pergeseran lateral ΔX atau ΔY > 0.15µm).',
    visualManifestation: 'Garis merah penanda inti serat bergeser patah secara transversal, menghasilkan garis core yang terputus di titik temu.',
    sensorTriggerSummary: 'Sistem deteksi PAS (Profile Alignment System) membaca deviasi sumbu lateral melebihi ambang batas toleransi (Offset > 0.15µm).',
    physicsImpact: 'Berdasarkan formula Marcuse untuk serat Single-Mode, rugi transmisi meningkat secara kuadratik terhadap pergeseran lateral (L ~ 4.34 × (d/w)²). Cahaya laser dari core bocor ke cladding menjadi mode radiasi tak terpandu.',
    lossImpactDb: '+0.15 s.d +0.45 dB per sambungan (Redaman tinggi & sinyal drop)',
    regulatoryStandard: 'ITU-T G.652 / ISO/IEC 11801: Deviasi sumbu inti pada serat Single-Mode wajib < 0.10µm untuk memenuhi batas loss 0.05 dB.',
    sopCorrection: 'Jalankan fungsi PAS Auto-Alignment pada mesin splicer. Jika motor stepper gagal meluruskan, bersihkan alur V-groove dari ganjalan debu mikron dan periksa apakah serat duduk rata.',
    preventionAdvice: 'Pastikan serat diletakkan tepat di dasar parit V-groove dan klem penjepit serat (clamp) tertutup rapat tanpa menjepit jaket kabel.',
    actionButtonLabel: 'Jalankan PAS Auto-Alignment & Kalibrasi Sumbu',
    simulationButtonLabel: 'Simulasikan Ketidaksejajaran Sumbu (Misalignment)',
  },

  excessive_tension: {
    id: 'excessive_tension',
    code: 'ERR-TENS-03',
    title: 'Penarikan yang Berlebihan & Patah Tarik (Excessive Tension)',
    category: 'excessive_tension',
    step: 'splicing',
    severity: 'critical',
    symptom: 'Serat optik ditarik dengan gaya melebihi elastisitas silika kaca (beban uji tarik > 2.2N atau sentakan kabel), menyebabkan retak mikroskopis menjalar hingga serat patah putus.',
    visualManifestation: 'Kaca silika di area sambungan terbelah dua mendadak dengan serpihan pecahan (fiber snap), gap terbuka lebar > 50µm.',
    sensorTriggerSummary: 'Tension sensor membaca beban tarikan mekanis melampaui batas toleransi uji tarik (Proof Load > 2.2N).',
    physicsImpact: 'Kaca silika murni memiliki kekuatan tarik tinggi namun rapuh terhadap tegangan geser dan cacat mikro permukaan (Griffith crack criterion). Penarikan berlebih menyebabkan propagasi retak instan dan putusnya total kontinuitas cahaya (loss tak terhingga / Total Optical Break).',
    lossImpactDb: '∞ dB (Koneksi Optik Putus Total / Total Breakage)',
    regulatoryStandard: 'Telkom Akses & IEC 60794-1-2: Uji tarik mekanis pasca-fusi (proof test) dibatasi maksimal pada 1.96N - 2.15N (setara beban 200 gram) selama 1-2 detik.',
    sopCorrection: 'Serat yang telah patah tidak dapat diperbaiki. Wajib memotong ulang kedua sisi kabel dan mengulang proses penyambungan dari awal (Langkah 01 Stripping). Atur tension limiter mesin splicer pada 2.0N standar.',
    preventionAdvice: 'Gunakan selalu fungsi Proof Test otomatis mesin yang terkalibrasi pada 200g (2N). Jangan pernah menarik serat secara manual dengan tangan sebelum sambungan diberi perlindungan protection sleeve.',
    actionButtonLabel: 'Atur Beban Uji Tarik Aman Standar 2.0N (200g)',
    simulationButtonLabel: 'Simulasikan Penarikan Berlebihan (> 2.5N)',
  },

  cleave_angle_defect: {
    id: 'cleave_angle_defect',
    code: 'ERR-CLV-04',
    title: 'Sudut Potong Cacat & Miring (Tilted Cleave & Hackle)',
    category: 'cleave_defect',
    step: 'cleaving',
    severity: 'warning',
    symptom: 'Ujung permukaan potongan serat miring (> 1.0°) atau terdapat bibir retakan (lip/hackle) akibat tekanan bilah potong yang tidak presisi.',
    visualManifestation: 'Tepi potongan kaca tidak tegak lurus 90°, membentuk sudut tajam atau permukaan bergerigi tidak rata.',
    sensorTriggerSummary: 'Algoritma optik cleaver / splicer mendeteksi sudut potong melebihi ambang batas toleransi (Sudut > 1.0°).',
    physicsImpact: 'Sudut miring menyebabkan celah udara berbentuk baji (wedge gap) saat kedua serat dipertemukan. Saat arc discharge dinyalakan, silika meleleh tidak merata sehingga menghasilkan penyempitan (waist) atau pembengkakan lokal.',
    lossImpactDb: '+0.10 s.d +0.30 dB serta pantulan balik tinggi',
    regulatoryStandard: 'SOP Telkom Akses: Sudut cleave Single-Mode wajib ≤ 0.8° (toleransi maksimal absolut 1.0°).',
    sopCorrection: 'Putar bilah mata pisau cleaver (16-channel blade rotation) ke nomor indeks tajam berikutnya atau bersihkan bantalan karet penjepit cleaver, lalu potong ulang serat.',
    preventionAdvice: 'Tutup penutup cleaver dengan lembut dan tekan tuas potong dengan kecepatan konstan tanpa menghentak.',
    actionButtonLabel: 'Putar Posisi Mata Pisau & Cleave Ulang (SOP)',
    simulationButtonLabel: 'Simulasikan Sudut Potong Miring (> 1.2°)',
  },

  stripping_microcrack: {
    id: 'stripping_microcrack',
    code: 'ERR-STRIP-05',
    title: 'Goresan Cladding & Retak Mikro (Stripping Nick & Micro-Crack)',
    category: 'stripping_flaw',
    step: 'stripping',
    severity: 'warning',
    symptom: 'Kaca silika cladding 125µm tergores atau retak mikro akibat penggunaan lubang stripper yang salah atau penarikan tang dengan sudut miring.',
    visualManifestation: 'Goresan putih melintang pada permukaan cladding kaca silika, membuat serat rentan patah saat ditekuk.',
    sensorTriggerSummary: 'Inspeksi kualitas stripping mendeteksi status "nicked" atau gaya tarikan stripper > 12N.',
    physicsImpact: 'Goresan sedalam 1 mikron pada cladding dapat menurunkan kekuatan mekanis serat hingga 80%. Di bawah pengaruh tegangan lingkungan, retakan akan merambat (stress corrosion cracking) menyebabkan kegagalan jangka panjang.',
    lossImpactDb: '+0.05 s.d +0.20 dB (Potensi putus di dalam closure)',
    regulatoryStandard: 'ITU-T L.12 / SOP Telkom: Permukaan cladding kaca silika 125µm tidak boleh tersentuh atau tergores bilah logam stripper.',
    sopCorrection: 'Potong bagian kabel yang tergores, gunakan lubang tang no.3 khusus primary coating 250µm, dan tarik lurus sejajar sumbu serat tanpa memelintir tang.',
    preventionAdvice: 'Posisikan tang stripper tegak lurus terhadap kabel optik dan gunakan panduan panjang kupasan 30-35mm.',
    actionButtonLabel: 'Potong Ulang & Kupas dengan Lubang No.3 (SOP)',
    simulationButtonLabel: 'Simulasikan Goresan Tarikan Stripper Kasar',
  },
};

/**
 * Real-time detection function that analyzes the current TechnicianState
 * and returns active detected errors for the active step.
 */
export function detectActiveErrors(
  state: TechnicianState,
  currentStep: SplicingStep
): ActiveDetectedError[] {
  const detected: ActiveDetectedError[] = [];

  // 1. Deteksi Kontaminasi Ujung Serat (Cleaning & Splicing)
  if (currentStep === 'splicing' || currentStep === 'cleaning') {
    const isContaminated = 
      state.leftCleanliness < 85 || 
      state.rightCleanliness < 85 || 
      state.defectType === 'bubble';

    if (isContaminated) {
      const minClean = Math.min(state.leftCleanliness, state.rightCleanliness);
      const isCritical = minClean < 60 || state.defectType === 'bubble';
      detected.push({
        id: 'active_endface_contamination',
        scenarioId: 'endface_contamination',
        code: 'ERR-CONTAM-01',
        title: 'Kontaminasi Ujung Serat (Endface Contamination)',
        category: 'contamination',
        step: currentStep,
        severity: isCritical ? 'critical' : 'warning',
        metricReadout: `Kebersihan: ${minClean}% (Standar Min: 90%)`,
        feedbackMessage: `Partikel debu mikro atau noda minyak terdeteksi pada penampang serat. ${
          state.defectType === 'bubble'
            ? 'Telah membentuk gelembung udara permanen (bubble defect) pada titik sambungan fusi.'
            : 'Jika fusi ditembakkan, partikel akan terbakar dan merusak inti silika.'
        }`,
        sopCorrection: 'Seka serat dengan Kimwipes & alkohol IPA 99.8% satu arah, lalu lakukan re-cleave sebelum menembakkan busur arc.',
        lossPenaltyDb: state.defectType === 'bubble' ? 0.45 : 0.22,
      });
    }
  }

  // 2. Deteksi Misalignment Sumbu Optik (Splicing)
  if (currentStep === 'splicing') {
    const offsetMagnitude = Math.sqrt(state.xOffset * state.xOffset + state.yOffset * state.yOffset);
    const isMisaligned = (!state.motorAligned && offsetMagnitude > 0.15) || state.defectType === 'offset' || offsetMagnitude > 0.25;

    if (isMisaligned) {
      detected.push({
        id: 'active_core_misalignment',
        scenarioId: 'core_misalignment',
        code: 'ERR-ALIGN-02',
        title: 'Ketidaksejajaran Sumbu Inti (Core Misalignment)',
        category: 'misalignment',
        step: currentStep,
        severity: offsetMagnitude > 0.4 || state.defectType === 'offset' ? 'critical' : 'warning',
        metricReadout: `Offset Inti: ΔX = ${state.xOffset.toFixed(2)}µm, ΔY = ${state.yOffset.toFixed(2)}µm (Total: ${offsetMagnitude.toFixed(2)}µm)`,
        feedbackMessage: `Inti serat (core 9µm) tidak berpusat lurus. Formula Marcuse memprediksi peningkatan redaman tajam akibat pancaran cahaya lolos ke lapisan cladding.`,
        sopCorrection: 'Tekan tombol "Auto Alignment (PAS)" agar motor stepper X-Y-Z menyelaraskan sumbu core ke offset < 0.08µm.',
        lossPenaltyDb: Number((0.18 * Math.pow(offsetMagnitude / 0.5, 2)).toFixed(2)),
      });
    }
  }

  // 3. Deteksi Penarikan yang Berlebihan (Splicing & Stripping)
  if (currentStep === 'splicing') {
    // Serat patah karena penarikan berlebih
    if (state.defectType === 'thick' || (state.arcPerformed && !state.spliceSuccess)) {
      detected.push({
        id: 'active_excessive_tension',
        scenarioId: 'excessive_tension',
        code: 'ERR-TENS-03',
        title: 'Penarikan Berlebihan / Putus Tarik (Excessive Tension Break)',
        category: 'excessive_tension',
        step: currentStep,
        severity: 'critical',
        metricReadout: 'Beban Uji Tarik > 2.2N (Tensile Over-Limit)',
        feedbackMessage: 'Serat silika mengalami patah tarik (tensile fracture) akibat beban melebihi ambang batas elastisitas mekanis.',
        sopCorrection: 'Batasi uji beban proof test pada 2.0N (~200g). Potong ulang kedua serat dan ulangi dari tahap stripping.',
        lossPenaltyDb: 99.9,
      });
    }
  }

  if (currentStep === 'stripping') {
    if (state.strippingQualityLeft === 'nicked' || state.strippingQualityRight === 'nicked') {
      const side = state.strippingQualityLeft === 'nicked' ? 'Kiri' : 'Kanan';
      detected.push({
        id: 'active_stripping_microcrack',
        scenarioId: 'stripping_microcrack',
        code: 'ERR-STRIP-05',
        title: `Goresan Kaca & Retak Mikro Serat ${side}`,
        category: 'stripping_flaw',
        step: 'stripping',
        severity: 'warning',
        metricReadout: 'Cladding Status: Nicked (Goresan Logam)',
        feedbackMessage: 'Lapisan cladding kaca tergores akibat penggunaan lubang stripper yang tidak sesuai atau tarikan bersudut miring.',
        sopCorrection: 'Potong bagian yang tergores dan gunakan lubang tang stripper No.3 (diameter 250µm). Tarik lurus searah kabel.',
        lossPenaltyDb: 0.15,
      });
    }
  }

  // 4. Deteksi Sudut Potong Miring (Cleaving & Splicing)
  if (currentStep === 'cleaving' || currentStep === 'splicing') {
    const maxAngle = Math.max(state.leftCleaveAngle, state.rightCleaveAngle);
    if (maxAngle > 1.0) {
      detected.push({
        id: 'active_cleave_angle_defect',
        scenarioId: 'cleave_angle_defect',
        code: 'ERR-CLV-04',
        title: 'Sudut Potong Cleaver Miring (> 1.0°)',
        category: 'cleave_defect',
        step: currentStep,
        severity: maxAngle > 1.5 ? 'critical' : 'warning',
        metricReadout: `Sudut Potong: ${maxAngle.toFixed(1)}° (Maksimal SOP: 0.8° - 1.0°)`,
        feedbackMessage: 'Penampang potongan serat membentuk sudut miring, mengakibatkan celah baji (wedge gap) saat difusi.',
        sopCorrection: 'Putar posisi mata pisau cleaver (1-16 index) dan bersihkan bantalan penjepit karet cleaver.',
        lossPenaltyDb: Number(((maxAngle - 0.8) * 0.25).toFixed(2)),
      });
    }
  }

  return detected;
}

/**
 * Injects a specific error scenario into the TechnicianState
 */
export function injectErrorScenario(
  scenarioId: string,
  currentState: TechnicianState
): Partial<TechnicianState> {
  switch (scenarioId) {
    case 'endface_contamination':
      return {
        leftCleanliness: 45,
        rightCleanliness: 50,
        cleaningTechniqueCorrect: false,
        defectType: 'bubble',
        estimatedLoss: 0.48,
        spliceSuccess: false,
      };

    case 'core_misalignment':
      return {
        motorAligned: false,
        xOffset: 0.75, // significantly above 0.10um
        yOffset: 0.60,
        zGap: 28,
        defectType: 'offset',
        estimatedLoss: 0.38,
      };

    case 'excessive_tension':
      return {
        arcPerformed: true,
        tensionTested: false,
        spliceSuccess: false,
        defectType: 'thick',
        estimatedLoss: 9.99,
      };

    case 'cleave_angle_defect':
      return {
        leftCleaveAngle: 1.6,
        rightCleaveAngle: 1.4,
        cleaveBladeCondition: 'worn',
        defectType: 'angle_fail',
        estimatedLoss: 0.28,
      };

    case 'stripping_microcrack':
      return {
        strippingQualityLeft: 'nicked',
        strippingQualityRight: 'nicked',
        estimatedLoss: 0.22,
      };

    default:
      return {};
  }
}

/**
 * Applies standard operating procedure (SOP) fix to resolve an injected or detected error
 */
export function applySopFix(
  scenarioId: string,
  currentState: TechnicianState
): Partial<TechnicianState> {
  switch (scenarioId) {
    case 'endface_contamination':
      return {
        leftCleanliness: 100,
        rightCleanliness: 100,
        cleaningTechniqueCorrect: true,
        defectType: 'none',
        estimatedLoss: 0.02,
        spliceSuccess: currentState.arcPerformed ? true : currentState.spliceSuccess,
      };

    case 'core_misalignment':
      return {
        motorAligned: true,
        xOffset: 0.03,
        yOffset: 0.02,
        zGap: 12,
        defectType: 'none',
        estimatedLoss: 0.02,
      };

    case 'excessive_tension':
      // Reset to safe tension limit
      return {
        tensionTested: true,
        spliceSuccess: true,
        defectType: 'none',
        estimatedLoss: 0.02,
      };

    case 'cleave_angle_defect':
      return {
        leftCleaveAngle: 0.4,
        rightCleaveAngle: 0.3,
        cleaveBladeCondition: 'sharp',
        defectType: 'none',
        estimatedLoss: 0.02,
      };

    case 'stripping_microcrack':
      return {
        leftStrippedLength: 32,
        rightStrippedLength: 32,
        strippingQualityLeft: 'perfect',
        strippingQualityRight: 'perfect',
      };

    default:
      return {
        defectType: 'none',
      };
  }
}
