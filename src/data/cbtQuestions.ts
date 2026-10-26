import { CBTQuestion, CBTSessionResult, CBTTraineeComparison } from '../types/cbt';

export const PRE_TEST_QUESTIONS: CBTQuestion[] = [
  {
    id: 'pre-01',
    question: 'Berapakah ukuran diameter inti (core) dan selubung (cladding) serat optik single-mode standar ITU-T G.652.D yang umum digunakan pada jaringan FTTH Telkom Akses?',
    options: [
      'A. Core 50 µm / Cladding 125 µm',
      'B. Core 9 µm / Cladding 125 µm',
      'C. Core 62.5 µm / Cladding 125 µm',
      'D. Core 9 µm / Cladding 250 µm'
    ],
    correctAnswer: 1, // B
    explanation: 'Standar ITU-T G.652.D mendefinisikan serat optik single-mode memiliki diameter inti (core) nominal ~9 µm (mode field diameter ~9.2 µm pada 1310nm) dan diameter selubung (cladding) kaca 125 µm.',
    category: 'dasar-fiber',
    referenceStd: 'ITU-T G.652.D / STEL-L-040'
  },
  {
    id: 'pre-02',
    question: 'Pada tang kupas fiber optik tiga lubang (Miller Stripper CFS-3), apakah fungsi lubang terkecil (lubang ke-3 pada ujung)?',
    options: [
      'A. Mengupas outer jacket kabel drop wire ukuran 2.0 - 3.0 mm',
      'B. Memotong kawat penguat (steel wire messenger)',
      'C. Mengupas lapisan akrilat (coating) 250 µm menjadi bare fiber 125 µm',
      'D. Mengupas loose buffer tube ukuran 900 µm'
    ],
    correctAnswer: 2, // C
    explanation: 'Miller Stripper CFS-3 memiliki 3 lubang: Lubang 1 (terbesar) untuk jacket 1.6-3.0 mm; Lubang 2 untuk tight buffer 900 µm; Lubang 3 (ujung) untuk mengupas coating akrilat 250 µm menjadi kaca murni (cladding) 125 µm tanpa mencakar kaca.',
    category: 'preparasi',
    referenceStd: 'SOP Stripping Telkom Akses'
  },
  {
    id: 'pre-03',
    question: 'Berapakah panjang pengupasan outer coating 250 µm yang direkomendasikan sebelum pemotongan menggunakan precision cleaver?',
    options: [
      'A. 5 - 10 mm',
      'B. 15 - 20 mm',
      'C. 30 - 35 mm',
      'D. 60 - 75 mm'
    ],
    correctAnswer: 2, // C
    explanation: 'SOP Telkom Akses merekomendasikan panjang pengupasan coating 30 - 35 mm agar serat cukup panjang untuk diseka alkohol 99.8%, ditempatkan pada fiber guide cleaver (cleave length 10-16 mm), dan menyisakan ruang pelindung sleeve.',
    category: 'preparasi',
    referenceStd: 'Telkom QA Standard'
  },
  {
    id: 'pre-04',
    question: 'Cairan pembersih apakah yang wajib digunakan untuk membersihkan bare fiber setelah pengupasan dan sebelum dipotong cleaver?',
    options: [
      'A. Air mineral steril',
      'B. Alkohol Isopropil (IPA) dengan kemurnian minimal 99.8%',
      'C. Bensin / Aseton industri pelarut cat',
      'D. Minyak pelumas mesin silikon'
    ],
    correctAnswer: 1, // B
    explanation: 'Wajib menggunakan Isopropyl Alcohol (IPA) dengan kadar kemurnian minimal 99.8% (electronic grade) yang bebas residu minyak dan cepat menguap. Alkohol berkadar air tinggi (<90%) meninggalkan uap air yang menyebabkan gelembung saat splicing.',
    category: 'preparasi',
    referenceStd: 'K3 & SOP Pembersihan Fiber'
  },
  {
    id: 'pre-05',
    question: 'Berapakah batas toleransi sudut pemotongan (cleave angle) yang diizinkan pada fusion splicer modern untuk menghasilkan sambungan redaman rendah?',
    options: [
      'A. Maksimal ≤ 1.0° - 1.2°',
      'B. Maksimal ≤ 5.0°',
      'C. Boleh hingga 8.0° untuk semua jenis konektor',
      'D. Sudut potong tidak berpengaruh terhadap redaman'
    ],
    correctAnswer: 0, // A
    explanation: 'Batas toleransi cleave angle pada fusion splicer Telkom Akses adalah ≤ 1.0° (toleransi maksimal splicer 1.2°). Jika sudut > 1.2°, mesin akan memberikan peringatan cleave error dan serat harus dipotong ulang.',
    category: 'cleaving',
    referenceStd: 'ITU-T G.652.D / Splice Criteria'
  },
  {
    id: 'pre-06',
    question: 'Teknologi apakah yang digunakan oleh fusion splicer modern untuk mendeteksi profil inti dan menyelaraskan serat optik secara otomatis pada sumbu X dan Y?',
    options: [
      'A. Ultrasonic Laser Scanning',
      'B. Profile Alignment System (PAS) dengan kamera mikroskop digital',
      'C. Mechanical Gauge Micrometer',
      'D. Infrared Thermal Sensor'
    ],
    correctAnswer: 1, // B
    explanation: 'PAS (Profile Alignment System) menggunakan kolimasi cahaya dan sepasang kamera CMOS mikroskop digital pada sumbu X dan Y untuk mendeteksi pembiasan cahaya melalui core dan cladding sehingga inti serat disejajarkan dengan akurasi sub-mikron.',
    category: 'splicing',
    referenceStd: 'Teknologi Splicer Core Alignment'
  },
  {
    id: 'pre-07',
    question: 'Berdasarkan standar Telkom Akses dan STEL-L-040, berapakah batas maksimum nilai redaman (splice loss) yang diperbolehkan untuk satu titik sambungan fusion?',
    options: [
      'A. 0.05 dB',
      'B. 0.20 dB',
      'C. 0.50 dB',
      'D. 1.00 dB'
    ],
    correctAnswer: 0, // A
    explanation: 'Standar penerimaan kualitas sambungan fusion splicing di lingkungan Telkom Akses (STEL-L-040) mensyaratkan splice loss maksimal 0.05 dB per sambungan (dengan target teknisi ≤ 0.02 dB). Nilai di atas 0.05 dB wajib disambung ulang.',
    category: 'splicing',
    referenceStd: 'STEL-L-040 Telkom Indonesia'
  },
  {
    id: 'pre-08',
    question: 'Apakah penyebab utama timbulnya cacat gelembung udara (Bubble Defect) di dalam titik lebur sambungan fiber optik?',
    options: [
      'A. Arus peleburan (arc current) terlalu dingin',
      'B. Ujung serat kotor karena sisa debu atau cairan alkohol yang belum menguap saat peleburan',
      'C. Serat terlalu panjang menjorok ke dalam V-groove',
      'D. Batang stainless steel sleeve terlalu tebal'
    ],
    correctAnswer: 1, // B
    explanation: 'Gelembung udara (bubble) terjadi bila ujung serat masih basah oleh sisa alkohol IPA saat arc menyala, atau ada partikel kotoran/debu organik yang terbakar seketika dan memerangkap gas di antara lelehan kaca.',
    category: 'splicing',
    referenceStd: 'Troubleshooting Splice Defect'
  },
  {
    id: 'pre-09',
    question: 'Berapakah beban uji tarik mekanis (Proof Test) otomatis yang diberikan mesin splicer sesaat setelah penyambungan selesai?',
    options: [
      'A. 0.2 Newton (sekitar 20 gram)',
      'B. 2.0 Newton (sekitar 200 gram force)',
      'C. 15 Newton (sekitar 1.5 kg)',
      'D. 50 Newton (sekitar 5 kg)'
    ],
    correctAnswer: 1, // B
    explanation: 'Mesin fusion splicer secara otomatis melakukan tensile proof test sebesar 1.96 N hingga 2.25 N (sekitar 2.0 Newton / ~200 gf) untuk memastikan kekuatan mekanis sambungan sebelum dikeluarkan dari clamp.',
    category: 'splicing',
    referenceStd: 'Telkom Akses QA Standard'
  },
  {
    id: 'pre-10',
    question: 'Apakah komponen penting di dalam Protection Sleeve (Heat Shrink Sleeve 60mm) yang berfungsi mencegah serat optik tertekuk patah setelah dipanaskan?',
    options: [
      'A. Kawat tembaga penghantar panas',
      'B. Batang penguat baja nirkarat (Stainless Steel Strength Member Rod)',
      'C. Tabung aluminium berlubang',
      'D. Karet elastis silikon'
    ],
    correctAnswer: 1, // B
    explanation: 'Protection sleeve terdiri dari tabung polyolefin luar (heat shrinkable), tabung bagian dalam hot-melt EVA adhesive, dan batang kawat baja nirkarat (stainless steel rod) yang memberikan rigiditas mekanik agar kaca tidak melengkung/patah.',
    category: 'splicing',
    referenceStd: 'Spesifikasi Protection Sleeve'
  }
];

export const POST_TEST_QUESTIONS: CBTQuestion[] = [
  {
    id: 'post-01',
    question: 'Jika saat proses penyambungan layar splicer menampilkan galat "Motor Step Overrun" atau "Fiber Not Detected in X/Y View", tindakan awal apakah yang paling tepat?',
    options: [
      'A. Menambah arus pelepasan busur (Arc Current) ke nilai maksimum 100 mA',
      'B. Mengganti elektroda splicer secara langsung tanpa kalibrasi',
      'C. Membersihkan alur presisi V-groove dan kaca cermin/lensa mikroskop menggunakan cotton bud kering berujung runcing dengan sedikit IPA 99.8%',
      'D. Menekan tombol reset paksa berkali-kali'
    ],
    correctAnswer: 2, // C
    explanation: 'Debu mikro atau serpihan coating yang mengendap pada alur V-groove mengangkat serat dari posisi fokus kamera, menyebabkan motor stepper berputar melebihi batas batas travel. Pembersihan V-groove dengan cotton bud dan alkohol 99.8% adalah mitigasi lini pertama.',
    category: 'splicing',
    referenceStd: 'Equipment Maintenance Manual'
  },
  {
    id: 'post-02',
    question: 'Berdasarkan model Marcuse untuk sambungan serat single-mode G.652.D, berapakah perkiraan penalti redaman (splice loss) jika terjadi deviasi sumbu inti (core axial offset) sebesar 0.5 µm?',
    options: [
      'A. Sekitar 0.001 dB (diabaikan)',
      'B. Sekitar 0.04 - 0.06 dB (mendekati batas toleransi maksimal Telkom)',
      'C. Pasti di atas 2.50 dB',
      'D. Redaman menjadi negatif (gain)'
    ],
    correctAnswer: 1, // B
    explanation: 'Persamaan Marcuse menyatakan loss akibat lateral misalignment: Loss(dB) ≈ 4.343 * (d / w)^2, di mana w adalah Mode Field Radius (~4.6 µm). Untuk offset d = 0.5 µm, loss berkisar 0.051 dB, yang langsung berada di batas kritis standar Telkom (0.05 dB).',
    category: 'splicing',
    referenceStd: 'Formula Marcuse & Teori Transmisi Serat'
  },
  {
    id: 'post-03',
    question: 'Serat sering patah spontan di dalam tabung pelindung saat proses pemanasan oven (heating). Apakah penyebab teknis paling umum dari fenomena ini?',
    options: [
      'A. Tang stripper ditarik miring sehingga mata pisau membentur dan menggores (nicked) permukaan cladding kaca',
      'B. Suhu pemanas oven terlalu dingin (hanya 80°C)',
      'C. Menggunakan alkohol dengan konsentrasi terlalu tinggi',
      'D. Panjang kupasan coating terlalu pendek'
    ],
    correctAnswer: 0, // A
    explanation: 'Sudut tang stripper yang ditarik miring (>45°) menyebabkan mata pisau baja menyentuh selubung kaca dan meninggalkan goresan mikroskopis (nicked/micro-crack). Saat terkena pemanasan dan kontraksi lem sleeve, micro-crack ini merambat dan mematahkan serat.',
    category: 'preparasi',
    referenceStd: 'Analisis Cacat Mekanik Telkom QA'
  },
  {
    id: 'post-04',
    question: 'Ketika tegangan baterai sirkuit splicer mengalami drop drastis di bawah 10.8 V pada pengoperasian lapangan, efek apakah yang langsung terjadi pada hasil sambungan?',
    options: [
      'A. Warna display monitor berubah menjadi hitam putih',
      'B. Pelepasan arc discharge tidak stabil sehingga pelelehan kaca tidak sempurna (incomplete fusion / cold splice) dan redaman melonjak',
      'C. Serat optik tertarik keluar dari klem otomatis',
      'D. Pisau cleaver menjadi tumpul seketika'
    ],
    correctAnswer: 1, // B
    explanation: 'Tegangan baterai yang drop menyebabkan inverter tegangan tinggi (HV arc generator) gagal mempertahankan kestabilan plasma busur. Akibatnya temperatur lebur (<1900°C) tidak tercapai, menghasilkan sambungan dingin (cold splice) dengan garis batas tebal dan redaman tinggi.',
    category: 'splicing',
    referenceStd: 'Power Management Fusion Splicer'
  },
  {
    id: 'post-05',
    question: 'Manakah urutan Standar Operasional Prosedur (SOP) end-to-end yang paling tepat dan tidak boleh dibalik dalam proses penyambungan kabel drop core?',
    options: [
      'A. Cleaving -> Stripping -> Memasang Sleeve -> Cleaning -> Splicing -> Heating',
      'B. Memasang Protection Sleeve -> Stripping Coating -> Cleaning IPA 99.8% -> Cleaving -> Loading V-Groove -> Splicing -> Proof Test -> Heating Oven',
      'C. Stripping Coating -> Cleaving -> Splicing -> Memasang Protection Sleeve -> Cleaning',
      'D. Splicing -> Cleaning -> Cleaving -> Memasang Sleeve -> Heating'
    ],
    correctAnswer: 1, // B
    explanation: 'Protection sleeve WAJIB dimasukkan terlebih dahulu sebelum serat dikupas atau dibersihkan. Jika lupa memasukkan sleeve di awal, sambungan yang telah selesai harus dipotong kembali karena sleeve tidak dapat dimasukkan melewati titik sambungan utuh.',
    category: 'splicing',
    referenceStd: 'SOP End-to-End Telkom Akses'
  },
  {
    id: 'post-06',
    question: 'Pada pembacaan kurva jejak OTDR (Optical Time-Domain Reflectometer), sebuah titik event menunjukkan lonjakan pantulan runcing tinggi (Fresnel reflection) yang diikuti dasar grafik tanpa kelanjutan sinyal. Apakah interpretasi dari event tersebut?',
    options: [
      'A. Sambungan fusion splice dengan redaman sangat baik (<0.01 dB)',
      'B. Titik ujung serat terbuka / konektor patah / kabel putus total (Open / Break Fault)',
      'C. Sambungan mekanik berkualitas tinggi',
      'D. Bending ringan di dalam closure'
    ],
    correctAnswer: 1, // B
    explanation: 'Refleksi Fresnel tinggi tanpa kelanjutan kurva backscatter (noise floor drop) menandakan antarmuka kaca-ke-udara, yaitu ujung serat terputus total (open connector / break / fiber end cut).',
    category: 'otdr-troubleshooting',
    referenceStd: 'Interpretasi Event Trace OTDR'
  },
  {
    id: 'post-07',
    question: 'Kapan teknisi wajib menjalankan fungsi kalibrasi busur listrik (Arc Calibration / Stabilize Electrodes) pada fusion splicer?',
    options: [
      'A. Cukup satu kali seumur hidup mesin',
      'B. Saat terjadi perubahan elevasi ketinggian, tekanan udara, suhu/kelembaban drastis, atau setelah penggantian elektroda baru',
      'C. Hanya jika mesin mengalami korsleting listrik',
      'D. Setiap kali memotong serat dengan cleaver'
    ],
    correctAnswer: 1, // B
    explanation: 'Kerapatan udara dan kelembaban lingkungan memengaruhi intensitas plasma busur api. Arc Calibration wajib dilakukan setiap awal shift kerja, saat berpindah lokasi kerja dengan suhu/ketinggian berbeda, dan setelah mengganti pasangan elektroda.',
    category: 'splicing',
    referenceStd: 'Daily Calibration Maintenance'
  },
  {
    id: 'post-08',
    question: 'Jika pisau pemotong cleaver 16-channel menghasilkan sudut potong (cleave angle) konsisten >1.5° atau menghasilkan ujung bergerigi (hackle), langkah perbaikan yang tepat adalah:',
    options: [
      'A. Mengetuk mata pisau cleaver dengan palu kecil',
      'B. Melonggarkan baut pengunci mata pisau dan memutar pisau bundar ke posisi/channel angka berikutnya (misal dari posisi 1 ke 2)',
      'C. Merendam cleaver ke dalam oli pelumas',
      'D. Menambah tekanan jari sekuat tenaga saat memotong'
    ],
    correctAnswer: 1, // B
    explanation: 'Mata pisau cleaver bundar memiliki 16 channel posisi potong yang masing-masing berdaya pakai sekitar 1.000 - 3.000 potongan. Jika sudah aus, kendurkan sekrup pengunci dan putar blade ke nomor indeks channel berikutnya.',
    category: 'cleaving',
    referenceStd: 'Cleaver Blade Maintenance Guide'
  },
  {
    id: 'post-09',
    question: 'Sesuai prosedur K3 Telekomunikasi, bagaimanakah cara penanganan potongan sisa kaca serat optik (fiber scrap) di area kerja yang benar?',
    options: [
      'A. Ditiup dari meja kerja agar bersih',
      'B. Dikumpulkan dengan pinset atau perekat dan dimasukkan ke dalam wadah khusus berpenutup rapat (Fiber Scrap Waste Bin) bertanda K3',
      'C. Dibuang sembarangan ke lantai atau tempat sampah terbuka biasa',
      'D. Diusap langsung dengan telapak tangan kosong'
    ],
    correctAnswer: 1, // B
    explanation: 'Potongan kaca serat optik berdiameter 125 µm sangat tajam dan transparan, mudah menembus pori-pori kulit atau pembuluh darah yang dapat menyebabkan peradangan serius. Scrap harus ditampung dalam wadah berpenutup rapat bertanda limbah tajam B3.',
    category: 'k3-safety',
    referenceStd: 'Pedoman K3 Telkom Akses'
  },
  {
    id: 'post-10',
    question: 'Saat menata serat di dalam kaset tray OJC (Optical Joint Closure), berapakah batas radius lengkung (bending radius) minimum yang diizinkan agar tidak terjadi redaman macro-bending?',
    options: [
      'A. Minimal 5 mm',
      'B. Minimal 10 mm',
      'C. Minimal 30 mm (3 cm)',
      'D. Bebas dilipat tanpa batasan'
    ],
    correctAnswer: 2, // C
    explanation: 'Standar ITU-T G.652.D dan Telkom mensyaratkan batas radius tekukan minimum pada tray penataan serat adalah 30 mm (diameter putaran 60 mm). Radius di bawah 30 mm menyebabkan kebocoran sinyal (macro-bending loss) signifikan terutama pada panjang gelombang 1550 nm dan 1625 nm.',
    category: 'otdr-troubleshooting',
    referenceStd: 'ITU-T G.652.D Bending Radius'
  }
];

const CBT_STORAGE_KEY = 'optisim_cbt_history';

export function loadCBTHistory(): CBTSessionResult[] {
  try {
    const raw = localStorage.getItem(CBT_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CBTSessionResult[];
  } catch (err) {
    console.error('Failed to load CBT history from localStorage:', err);
    return [];
  }
}

export function saveCBTResult(result: CBTSessionResult): void {
  try {
    const history = loadCBTHistory();
    // Add new result at beginning
    const updated = [result, ...history];
    // Keep max 50 recent records
    if (updated.length > 50) {
      updated.splice(50);
    }
    localStorage.setItem(CBT_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save CBT result to localStorage:', err);
  }
}

export function getTraineeCBTComparison(participantName: string): CBTTraineeComparison {
  const history = loadCBTHistory();
  // Filter for this participant (case insensitive match)
  const normName = participantName.trim().toLowerCase();
  const participantSessions = history.filter(
    (s) => s.participantName.trim().toLowerCase() === normName
  );

  const preTest = participantSessions.find((s) => s.testType === 'pre-test');
  const postTest = participantSessions.find((s) => s.testType === 'post-test');

  const preScore = preTest ? preTest.score : null;
  const postScore = postTest ? postTest.score : null;

  let delta: number | null = null;
  if (preScore !== null && postScore !== null) {
    delta = postScore - preScore;
  }

  return {
    participantName,
    preTestScore: preScore,
    postTestScore: postScore,
    scoreDelta: delta,
    hasPreTest: preTest !== undefined,
    hasPostTest: postTest !== undefined,
    lastPreTestDate: preTest?.formattedDate,
    lastPostTestDate: postTest?.formattedDate,
  };
}
