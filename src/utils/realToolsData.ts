import { SplicingStep } from '../types/fiber';

export interface RealToolInfo {
  stepId: SplicingStep;
  stepNumber: string;
  toolName: string;
  subtitle: string;
  brandModel: string;
  category: string;
  imageUrl: string;
  altText: string;
  badge: string;
  badgeColor: string;
  description: string;
  keyIndicators: {
    label: string;
    description: string;
    badge: string;
  }[];
  technicalSpecs: {
    label: string;
    value: string;
  }[];
  sopTip: string;
  safetyTip: string;
  safetyGuidelines: string[];
}

export const REAL_TOOLS_DATA: Record<SplicingStep, RealToolInfo> = {
  stripping: {
    stepId: 'stripping',
    stepNumber: '01',
    toolName: 'Miller Stripper CFS-3',
    subtitle: '3-Hole Precision Optical Fiber Stripper',
    brandModel: 'Ripley Miller / CFS-3 Professional',
    category: 'Alat Pengupasan Serat Optik',
    imageUrl: '/tools/miller_stripper.jpg',
    altText: 'Foto Riil Tang Miller Stripper CFS-3 dengan 3 Lubang Presisi',
    badge: '3-Hole Precision Notch',
    badgeColor: 'amber',
    description:
      'Tang pengupas kabel serat optik dengan 3 notch lubang kalibrasi presisi pabrik tanpa perlu penyetelan manual, dirancang agar tidak menggores (nicking) kaca inti.',
    keyIndicators: [
      {
        label: 'Notch 1 (Terluar)',
        description: 'Mengupas jacket luar kabel 1.6 mm s/d 3.0 mm',
        badge: 'Jacket 2-3mm',
      },
      {
        label: 'Notch 2 (Tengah)',
        description: 'Mengupas buffer tube / loose tube 600 μm s/d 900 μm',
        badge: 'Buffer 900μm',
      },
      {
        label: 'Notch 3 (Terdalam)',
        description: 'Mengupas lapisan acrylate coating 250 μm ke bare fiber 125 μm',
        badge: 'Coating 250μm',
      },
    ],
    technicalSpecs: [
      { label: 'Material Pisau', value: 'Laser-Hardened Carbon Steel' },
      { label: 'Target Bare Fiber', value: '125 μm Cladding Kaca' },
      { label: 'Gagang', value: 'Ergonomic TPR Yellow Handle' },
      { label: 'Panjang Kupasan SOP', value: '30 - 35 mm' },
    ],
    sopTip:
      'Posisikan tang pada sudut 30°-45° saat menarik coating 250μm. Lakukan dalam tarikan halus satu kali tanpa memelintir agar inti kaca tidak retak mikro.',
    safetyTip:
      'Kenakan kacamata pelindung K3 (Safety Glasses). Tarikan kabel yang putus mendadak dapat melontarkan serpihan kaca tajam ke arah mata.',
    safetyGuidelines: [
      'Gunakan hanya lubang terkecil (Notch 3) untuk acrylate 250µm; jangan memaksa kabel tebal masuk.',
      'Dilarang memotong kawat messenger atau benang aramid dengan stripper kaca ini karena akan merusak kalibrasi presisi lubang.',
      'Posisikan jari selalu di belakang pelindung gagang TPR anti-slip.'
    ],
  },

  cleaning: {
    stepId: 'cleaning',
    stepNumber: '02',
    toolName: 'Lint-Free Wipes & IPA 99%',
    subtitle: 'Kimwipes Delicate Task Wipers & Isopropyl Alcohol',
    brandModel: 'Kimtech Science Kimwipes & ESD Solvent Dispenser',
    category: 'Pembersih Residu Kaca Inti Optik',
    imageUrl: '/tools/cleaning_ipa_wipes.jpg',
    altText: 'Foto Riil Kimwipes Bebas Serat dan Botol Pompa Isopropyl Alcohol 99%',
    badge: 'Lint-Free & 99.9% Purity',
    badgeColor: 'emerald',
    description:
      'Kombinasi tisu pembersih bebas serat (lint-free) dan cairan pembersih pelarut Isopropyl Alcohol murni 99.9% untuk melarutkan residu minyak, debu mikro, dan sisa polimer coating.',
    keyIndicators: [
      {
        label: 'Kimwipes Tissue',
        description: 'Bahan selulosa khusus bebas serat (lint-free) yang tidak meninggalkan benang mikro',
        badge: 'Lint-Free 100%',
      },
      {
        label: 'Botol Pompa IPA ESD',
        description: 'Dispenser solvent anti-statis dengan katup one-touch anti-evaporasi',
        badge: 'ESD Dispenser',
      },
      {
        label: 'Kemurnian IPA 99.9%',
        description: 'Bebas air (<0.1%) agar mengering seketika tanpa meninggalkan noda uap air',
        badge: 'Purity 99.9%',
      },
    ],
    technicalSpecs: [
      { label: 'Kadar Alkohol', value: 'IPA ≥ 99.8% Medical / Optical Grade' },
      { label: 'Residu Partikel', value: '< 0.001% (Zero Lint)' },
      { label: 'Arah Usapan', value: '1 Arah (Pangkal ke Ujung Serat)' },
      { label: 'Indikator Bersih', value: 'Bunyi "Squeak" / Berdecit Nyaring' },
    ],
    sopTip:
      'Jepit serat dengan lipatan tisu yang dibasahi IPA 99%. Usap hanya dalam SATU arah menuju ujung serat. Dilarang mengusap bolak-balik karena akan mengontaminasi ulang kaca.',
    safetyTip:
      'Zat kimia Isopropyl Alcohol 99.9% sangat mudah menyala (Flammable Liquid). Jauhkan dari percikan api, puntung rokok, dan busur listrik splicer.',
    safetyGuidelines: [
      'Gunakan sarung tangan nitril ESD untuk mencegah kontak kulit langsung dan transfer minyak alami jari ke kaca.',
      'Usap hanya satu arah dari pangkal ke ujung; jangan sentuh bare fiber yang telah steril.',
      'Tutup rapat katup dispenser IPA setelah pemakaian untuk meminimalkan inhalasi uap alkohol.'
    ],
  },

  cleaving: {
    stepId: 'cleaving',
    stepNumber: '03',
    toolName: 'High Precision Fiber Cleaver',
    subtitle: 'Diamond/Tungsten Blade Optical Cleaver (FC-6S)',
    brandModel: 'Sumitomo FC-6S / Fujikura CT-50 Compatible',
    category: 'Pemotong Presisi Serat Optik',
    imageUrl: '/tools/fiber_cleaver.jpg',
    altText: 'Foto Riil Fiber Cleaver Presisi Tinggi dengan Penunjuk Posisi Pisau dan Mistar',
    badge: 'Ultra-Low Angle Cleave (<0.5°)',
    badgeColor: 'cyan',
    description:
      'Alat pemotong presisi sudut tegak lurus (90°) menggunakan bilah pisau tungsten carbide berputar 16-posisi, menghasilkan permukaan potong datar tanpa burr atau shatter.',
    keyIndicators: [
      {
        label: 'Bilah Pisau Intan/Tungsten',
        description: 'Circular rotary blade 16 posisi dengan ketajaman pemotongan hingga 48.000 core',
        badge: '16-Position Blade',
      },
      {
        label: 'Mistar Penuntun (Scale 10-16mm)',
        description: 'Panduan panjang kupasan presisi untuk single fiber (standar Telkom 12-16 mm)',
        badge: 'Scale 10-16mm',
      },
      {
        label: 'Klem Penjepit Karet (Fiber Clamp)',
        description: 'Penahan serat berbahan karet sintetis agar serat tidak slip saat digores',
        badge: 'Anti-Slip Clamp',
      },
    ],
    technicalSpecs: [
      { label: 'Diameter Serat', value: '125 μm Cladding' },
      { label: 'Sudut Potong Khas', value: '< 0.5° (Batas Telkom ≤ 0.8°)' },
      { label: 'Panjang Potong', value: '10 s/d 16 mm (Drop Cable 16mm)' },
      { label: 'Masa Pakai Bilah', value: '3.000 kali per posisi x 16 posisi' },
    ],
    sopTip:
      'Jangan menekan serat secara paksa. Biarkan pisau menggores ringan lalu bantalan karet mematahkan kaca secara tegak lurus. Segera buang potongan kaca ke fiber scrap collector.',
    safetyTip:
      'BAHAYA MAKSI SERPIHAN KACA (Optical Fiber Shards): Potongan serat 125µm setipis jarum mikro dapat menembus kulit, masuk pembuluh darah, atau merusak kornea mata!',
    safetyGuidelines: [
      'Gunakan pinset antistatis untuk mengambil sisa potongan serat kaca.',
      'Wajib buang setiap potongan serat ke Fiber Scrap Collector tertutup (jangan dibuang sembarangan ke lantai).',
      'Jangan sekali-kali menyentuh mata pisau putar tungsten carbide dengan tangan kosong.'
    ],
  },

  splicing: {
    stepId: 'splicing',
    stepNumber: '04',
    toolName: 'Fusion Splicer Chamber & Electrodes',
    subtitle: 'Core-to-Core Alignment Splicing Engine',
    brandModel: 'Fujikura 90S+ / Sumitomo Z2C Standard',
    category: 'Mesin Penyambung Peleburan Busur Listrik',
    imageUrl: '/tools/splicer_chamber.jpg',
    altText: 'Foto Riil Kamar Splicing Internal Mesin Splicer: V-Groove, Elektroda Arc, dan Lensa Alignment',
    badge: 'Core Alignment & Micro-Arc',
    badgeColor: 'blue',
    description:
      'Kompartemen peleburan inti serat optik presisi sub-mikron, dilengkapi elektroda busur plasma discharge, alur V-groove safir, dan dual kamera optik mikroskopis arah sumbu X dan Y.',
    keyIndicators: [
      {
        label: 'Elektroda Arc Discharge',
        description: 'Sepasang elektroda tungsten yang memercikkan busur plasma bersuhu ±2.000°C',
        badge: 'Arc Electrodes',
      },
      {
        label: 'Precision V-Groove',
        description: 'Alur V presisi safir untuk menstabilkan posisi serat sebelum alignment motorik',
        badge: 'Sapphire V-Groove',
      },
      {
        label: 'Dual CCD Camera Lens (X/Y)',
        description: 'Lensa mikroskop resolusi tinggi pembaca kontur core dan cladding dari dua sudut pandang',
        badge: 'X/Y Optical Lens',
      },
    ],
    technicalSpecs: [
      { label: 'Metode Alignment', value: 'PAS (Profile Alignment System) Core' },
      { label: 'Suhu Arc Plasma', value: '± 1.800°C - 2.200°C' },
      { label: 'Estimasi Redaman Khas', value: '0.01 s/d 0.02 dB (SM G.652.D)' },
      { label: 'Uji Tarik Otomatis', value: 'Tension Test 1.96 N - 2.25 N' },
    ],
    sopTip:
      'Pastikan ujung serat optik berada tepat di antara pusat elektroda dan ujung V-groove tanpa saling bersentuhan sebelum tombol SET / ARC ditekan.',
    safetyTip:
      'BAHAYA TEGANGAN TINGGI & PANAS PLASMA (>2.000V & 2.000°C). Elektroda arc menghasilkan percikan busur plasma intensitas tinggi saat proses fusing.',
    safetyGuidelines: [
      'Pastikan penutup angin (wind protector cover) tertutup rapat sebelum memicu arc discharge.',
      'Dilarang menyentuh elektroda tungsten saat unit dinyalakan atau proses fusing berjalan.',
      'Hindari mengoperasikan splicer di lingkungan bergas atau beruap gas yang mudah meledak.'
    ],
  },

  heating: {
    stepId: 'heating',
    stepNumber: '05',
    toolName: 'Protection Sleeve & Oven Heater',
    subtitle: '60mm Steel-Reinforced Heat Shrink Tube & Built-in Heater',
    brandModel: 'Standard Telecom Splice Sleeve 60mm & Splicer Oven',
    category: 'Selongsong Pelindung Mekanis & Oven Pemanas',
    imageUrl: '/tools/protection_sleeve.jpg',
    altText: 'Foto Riil Selongsong Protection Sleeve 60mm dan Kompartemen Oven Heater Splicer',
    badge: 'Stainless Rod & 200°C Oven',
    badgeColor: 'purple',
    description:
      'Tabung proteksi sambungan berisi kawat penguat stainless steel dan perekat panas (EVA hot-melt), dipanaskan di dalam oven splicer untuk mengembalikan kekuatan mekanis sambungan.',
    keyIndicators: [
      {
        label: 'Kawat Penguat (Stainless Rod)',
        description: 'Batang baja tahan karat 1.2mm pencegah pembengkokan atau tekukan di titik sambungan',
        badge: 'Stainless Rod',
      },
      {
        label: 'Hot Melt Inner Tube (EVA)',
        description: 'Lapisan lilin adhesif termoplastik yang meleleh merata membungkus sambungan serat',
        badge: 'Inner Hot-Melt',
      },
      {
        label: 'Oven Heater Slot (200°C)',
        description: 'Slot pemanas klem otomatis dengan siklus penyusutan termal cepat 15 - 25 detik',
        badge: 'Fast Oven Slot',
      },
    ],
    technicalSpecs: [
      { label: 'Panjang Sleeve', value: '60 mm (Standar Luar Ruang/ODC)' },
      { label: 'Diameter Pasca Panas', value: '± 2.5 - 3.0 mm' },
      { label: 'Suhu Pemanasan', value: '180°C - 220°C' },
      { label: 'Waktu Pemanasan', value: '18 - 25 Detik Otomatis' },
    ],
    sopTip:
      'Posisikan sambungan bare fiber tepat di tengah batang baja (panjang 60mm) sebelum dimasukkan ke oven. Pastikan tidak ada gelembung udara di dalam tabung setelah pemanasan selesai.',
    safetyTip:
      'BAHAYA PERMUKAAN PANAS (Hot Surface 200°C). Selongsong sleeve dan pelat oven mencapai suhu 180°C–220°C pasca pemanasan.',
    safetyGuidelines: [
      'Jangan menyentuh sleeve panas dengan jari telanjang; gunakan cooling tray untuk pendinginan hingga mengeras sempurna.',
      'Pastikan batang penguat stainless steel menopang tepat di bagian bare fiber agar tidak patah lentur.',
      'Periksa tidak ada gelembung udara terjebak di dalam sleeve sebelum kabel dipindahkan ke splice tray.'
    ],
  },

  assessment: {
    stepId: 'assessment',
    stepNumber: '06',
    toolName: 'OTDR (Optical Time-Domain Reflectometer)',
    subtitle: 'Field Fiber Network Certifier & Event Analyzer',
    brandModel: 'EXFO FTB / VIAVI SmartOTDR / Yokogawa AQ1210',
    category: 'Alat Ukur Redaman & Analisis Jejak Reflektansi',
    imageUrl: '/tools/otdr_display.jpg',
    altText: 'Foto Riil Layar Alat OTDR Lapangan Menampilkan Kurva Trace Gelombang dan Nilai Redaman dB',
    badge: 'Trace Graph & Loss Analyzer',
    badgeColor: 'emerald',
    description:
      'Instrumen diagnostik optik fisik untuk memverifikasi kualitas sambungan, mengukur nilai insertion loss (dB), event reflektansi, serta kontinuitas link serat optik end-to-end.',
    keyIndicators: [
      {
        label: 'Kurva Jejak Refleksi (Trace Graph)',
        description: 'Grafik penurunan daya (dB vs Jarak km) yang memperlihatkan titik sambung (splice event)',
        badge: 'Backscatter Curve',
      },
      {
        label: 'Nilai Redaman Sambungan (dB)',
        description: 'Pengukuran akurat insertion loss per sambungan (standar Telkom Akses ≤ 0.05 dB)',
        badge: 'Splice Loss dB',
      },
      {
        label: 'Panjang Gelombang Uji (1310/1550nm)',
        description: 'Uji transmisi dual-wavelength untuk mendeteksi tekukan makro (macro-bending)',
        badge: '1310 & 1550 nm',
      },
    ],
    technicalSpecs: [
      { label: 'Dynamic Range', value: '32 dB s/d 42 dB' },
      { label: 'Event Dead Zone (EDZ)', value: '≤ 0.8 meter' },
      { label: 'Toleransi Telkom SM', value: 'Maksimal ≤ 0.05 dB / Sambungan' },
      { label: 'Format Ekspor Uji', value: 'Standard Bellcore/Telcordia .SOR' },
    ],
    sopTip:
      'Sambungan dinyatakan LULUS sertifikasi Telkom jika nilai redaman pada OTDR ≤ 0.05 dB pada panjang gelombang 1310nm dan 1550nm serta tidak memiliki reflektansi abnormal.',
    safetyTip:
      'BAHAYA RADIASI LASER KELAS 1M / 3R: Radiasi cahaya laser inframerah (1310nm/1550nm) tidak kasat mata dan berdaya tembus tinggi. Jangan menatap langsung ke lubang port laser!',
    safetyGuidelines: [
      'Jangan menatap ujung konektor serat saat terhubung ke port keluaran laser aktif OTDR.',
      'Gunakan pelindung tutup debu (dust cap) saat port optik instrumen tidak digunakan.',
      'Pastikan link serat optik tidak sedang memancarkan sinyal aktif dari perangkat OLT/ONU lain sebelum uji OTDR.'
    ],
  },
};
