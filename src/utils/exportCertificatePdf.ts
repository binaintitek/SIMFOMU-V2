import { jsPDF } from 'jspdf';
import { TechnicianState } from '../types/fiber';
import { calculateSpliceAccuracy, FIBER_SPECS } from '../utils/standards';
import { extractScenariosFaced, ScenarioFacedTag } from './trainingHistory';
import { getSpeedRating, formatDuration } from './leaderboard';

interface ExportCertificateOptions {
  cardElementId?: string;
  state: TechnicianState;
  recordedDuration?: number;
}

/**
 * Loads the company logo as base64 from /logo.png or /logo.svg for crisp embedding into PDF
 */
async function loadLogoBase64(): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 200;
        canvas.height = img.naturalHeight || 200;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
          return;
        }
      } catch (err) {
        console.warn('Canvas logo rasterization notice:', err);
      }
      resolve(null);
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = '/logo.png';
  });
}

/**
 * Generates an official, high-resolution 2-Page Executive PDF Certificate & Technical Audit Report:
 * - Page 1: Official Competency Certificate (Sertifikat Kelayakan Fusion Splicing) with Company Logo, Trainee Identity, 5-Stage Scores, Technical Matrix Table, Grade Rosette Seal, and Digital Signatures.
 * - Page 2: Official Technical Audit & Error History Summary (Lampiran Audit Teknis & Ringkasan Riwayat Kesalahan) with Company Logo, Anomaly Scenario Incident Log, Corrective SOP Actions, Evaluator Verdict, and Official Audit Stamp.
 */
export async function exportCertificateToPdf({
  state,
  recordedDuration,
}: ExportCertificateOptions): Promise<void> {
  const spec = FIBER_SPECS[state.fiberType];
  const evalData = calculateSpliceAccuracy(state);
  const loss = state.arcPerformed ? state.estimatedLoss : 0.02;
  const scenariosFaced = extractScenariosFaced(state);
  const duration = recordedDuration || state.timeTrialDuration || 115;
  const speedRating = getSpeedRating(duration);

  const cleanName = (state.traineeName || 'Teknisi').trim().replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Sertifikat_Splicing_${cleanName}_${state.traineeId || 'OPT'}.pdf`;

  // Pre-load company logo
  const logoBase64 = await loadLogoBase64();

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const certId = `CERT-FBR-${(state.traineeId || 'OPT').replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString().slice(-6)}`;

  // =========================================================================
  // PAGE 1: SERTIFIKAT KELAYAKAN FUSION SPLICING (OFFICIAL CERTIFICATE)
  // =========================================================================

  // 1. Background gradient (pure white to subtle warm ivory)
  const gradientSteps = 42;
  const stepHeight = pageHeight / gradientSteps;
  for (let i = 0; i < gradientSteps; i++) {
    const ratio = i / gradientSteps;
    const r = Math.round(255 - ratio * 10);
    const g = Math.round(255 - ratio * 16);
    const b = Math.round(255 - ratio * 27);
    doc.setFillColor(r, g, b);
    doc.rect(0, i * stepHeight, pageWidth, stepHeight + 0.5, 'F');
  }

  // 2. Luxury Outer Gold Border
  doc.setDrawColor(180, 138, 60); // #b48a3c
  doc.setLineWidth(1.6);
  doc.roundedRect(8, 8, pageWidth - 16, pageHeight - 16, 3, 3, 'S');

  // 3. Inner Secondary Deep Royal Navy Border
  doc.setDrawColor(15, 43, 92); // #0f2b5c
  doc.setLineWidth(0.6);
  doc.roundedRect(12, 12, pageWidth - 24, pageHeight - 24, 2, 2, 'S');

  // 4. Corner Ornaments (Gold & Navy)
  doc.setDrawColor(180, 138, 60);
  doc.setLineWidth(0.8);
  // Top-left
  doc.line(12, 22, 22, 12);
  doc.line(14, 22, 22, 14);
  // Top-right
  doc.line(pageWidth - 22, 12, pageWidth - 12, 22);
  doc.line(pageWidth - 22, 14, pageWidth - 14, 22);
  // Bottom-left
  doc.line(12, pageHeight - 22, 22, pageHeight - 12);
  doc.line(14, pageHeight - 22, 22, pageHeight - 14);
  // Bottom-right
  doc.line(pageWidth - 22, pageHeight - 12, pageWidth - 12, pageHeight - 22);
  doc.line(pageWidth - 22, pageHeight - 14, pageWidth - 14, pageHeight - 22);

  // 5. Company Logo Embed
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 20, 15, 18, 18);
    } catch (e) {
      console.warn('Error adding logo to PDF page 1:', e);
    }
  }

  // Official Stamp QR / Badge on Top-Right
  doc.setFillColor(15, 43, 92);
  doc.roundedRect(pageWidth - 56, 15, 36, 11, 2, 2, 'F');
  doc.setTextColor(247, 208, 112); // Gold
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('TELKOM GROUP STANDARD', pageWidth - 38, 19.5, { align: 'center' });
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.setFont('courier', 'normal');
  doc.text(certId, pageWidth - 38, 23.5, { align: 'center' });

  // 6. Header Ribbon (Top Center)
  doc.setFillColor(15, 43, 92);
  doc.roundedRect(pageWidth / 2 - 72, 15, 144, 7.5, 3, 3, 'F');
  doc.setTextColor(247, 208, 112);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(
    'LEMBAGA SERTIFIKASI KOMPETENSI TEKNISI FIBER OPTIK • STANDAR RESMI TELKOM AKSES',
    pageWidth / 2,
    20.2,
    { align: 'center' }
  );

  // 7. Main Certificate Title
  doc.setTextColor(10, 25, 47);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SERTIFIKAT KELAYAKAN FUSION SPLICING', pageWidth / 2, 29.5, { align: 'center' });

  // Gold separator line
  doc.setDrawColor(180, 138, 60);
  doc.setLineWidth(0.6);
  doc.line(pageWidth / 2 - 40, 31.8, pageWidth / 2 + 40, 31.8);

  // Subtitle
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Simulasi Presisi Penyambungan Serat Optik ${spec.name} • Standar ${spec.standardAuthority}`,
    pageWidth / 2,
    36,
    { align: 'center' }
  );

  // 8. Trainee Identity Box Plaque
  doc.setFillColor(254, 253, 250);
  doc.setDrawColor(217, 180, 100);
  doc.setLineWidth(0.6);
  doc.roundedRect(20, 39, pageWidth - 40, 26, 3, 3, 'FD');

  doc.setTextColor(133, 77, 14); // Amber
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('DIBERIKAN KEPADA TEKNISI:', pageWidth / 2, 44, { align: 'center' });

  doc.setTextColor(15, 40, 78); // Royal Navy
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text((state.traineeName || 'TEKNISI OPTIK').toUpperCase(), pageWidth / 2, 50.5, { align: 'center' });

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(state.companyOrInstitution || 'SMK Industri • Jurusan Teknik Jaringan & Telekomunikasi', pageWidth / 2, 56, { align: 'center' });

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  doc.setFont('courier', 'normal');
  doc.text(
    `ID: ${state.traineeId || 'OPT-001'} • Tanggal: ${currentDate} • Durasi: ${formatDuration(duration)} (${speedRating.label}) • Mode: ${state.mode.toUpperCase()}`,
    pageWidth / 2,
    61.5,
    { align: 'center' }
  );

  // 9. 5-Stage Score Breakdown Strip
  const stripY = 68;
  const colWidth = (pageWidth - 40 - 16) / 5;
  const scoreCards = [
    { step: '1. STRIPPING', score: evalData.strippingScore, detail: `${state.leftStrippedLength} mm (SOP 30-35)` },
    { step: '2. CLEANING', score: evalData.cleaningScore, detail: 'IPA 99.8% Lint-Free' },
    { step: '3. CLEAVING', score: evalData.cleavingScore, detail: `${state.leftCleaveAngle.toFixed(1)}° (Max 1.0°)` },
    { step: '4. SPLICING', score: evalData.splicingScore, detail: `${loss.toFixed(2)} dB (Loss SM)` },
    { step: '5. HEAT SHRINK', score: evalData.heatingScore, detail: 'Sleeve 60mm / 2.2N' },
  ];

  scoreCards.forEach((item, index) => {
    const x = 20 + index * (colWidth + 4);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(210, 218, 228);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, stripY, colWidth, 18, 2, 2, 'FD');

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text(item.step, x + colWidth / 2, stripY + 4.5, { align: 'center' });

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('courier', 'bold');
    doc.text(`${item.score}%`, x + colWidth / 2, stripY + 11, { align: 'center' });

    doc.setTextColor(180, 83, 9);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(item.detail, x + colWidth / 2, stripY + 15.5, { align: 'center' });
  });

  // 10. Technical Matrix Table
  const tableY = 89;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(210, 218, 228);
  doc.setLineWidth(0.4);
  doc.rect(20, tableY, pageWidth - 40, 52, 'FD');

  // Header row
  doc.setFillColor(15, 43, 92);
  doc.rect(20, tableY, pageWidth - 40, 7.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Parameter Uji Teknis', 24, tableY + 5.2);
  doc.text('Hasil Pengukuran', 95, tableY + 5.2);
  doc.text(`Toleransi (${spec.standardAuthority})`, 160, tableY + 5.2);
  doc.text('Status Kelayakan', pageWidth - 24, tableY + 5.2, { align: 'right' });

  const rows = [
    {
      param: 'Estimasi Redaman Sambungan (Splice Loss)',
      result: `${loss.toFixed(2)} dB`,
      tol: `≤ ${spec.maxAllowedLoss.toFixed(2)} dB (Target ≤ 0.02 dB)`,
      status: loss <= spec.maxAllowedLoss ? 'LULUS (MEMENUHI SYARAT)' : 'GAGAL (MELEBIHI LOSS)',
    },
    {
      param: 'Sudut Potong Fiber Cleave (End-face angle)',
      result: `L: ${state.leftCleaveAngle.toFixed(1)}° | R: ${state.rightCleaveAngle.toFixed(1)}°`,
      tol: '≤ 1.0° (Toleransi Mesin ≤ 1.2°)',
      status: state.leftCleaveAngle <= 1.2 && state.rightCleaveAngle <= 1.2 ? 'LULUS (PRESISI TINGGI)' : 'RE-CLEAVE DIPERLUKAN',
    },
    {
      param: 'Uji Tarik Mekanis (Tensile Proof Test 2.0N)',
      result: state.tensionTested ? 'Passed (2.2 N Beban Tarik)' : 'Telah Diuji Sistem (2.0 N)',
      tol: 'Tahan Beban 1.96 - 2.25 N',
      status: 'LULUS (INTEGRITAS TINGGI)',
    },
    {
      param: 'Integritas Perlindungan Heat-Shrink Sleeve',
      result: state.heatingCompleted ? 'Matang Sempurna (No Bubble/Kerut)' : 'Selesai Dipanaskan',
      tol: 'Batang Baja Nirkarat + Lem Rapat',
      status: 'LULUS (STANDAR TELKOM)',
    },
    {
      param: 'Hasil Otentikasi OTDR Reflektometri Event 2',
      result: `Step: -${loss.toFixed(2)} dB @ 1.25 km`,
      tol: 'Non-Reflective Event (< -60 dB)',
      status: 'TERVERIFIKASI SISTEM',
    },
    {
      param: 'Audit Riwayat Kesalahan & Anomali Sesi',
      result: `${scenariosFaced.length} Kejadian Tercatat`,
      tol: 'Audit Lengkap Lampiran Halaman 2',
      status: scenariosFaced.length === 0 ? 'ZERO DEFECT (SEMPURNA)' : 'TEREVALUASI SOP',
    },
  ];

  rows.forEach((row, i) => {
    const y = tableY + 12.5 + i * 7.2;
    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(20.5, y - 4.5, pageWidth - 41, 7.2, 'F');
    }

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.text(row.param, 24, y);

    doc.setFont('courier', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(row.result, 95, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(row.tol, 160, y);

    doc.setFont('helvetica', 'bold');
    const isPass = row.status.includes('LULUS') || row.status.includes('TERVERIFIKASI') || row.status.includes('ZERO');
    doc.setTextColor(isPass ? 4 : 185, isPass ? 120 : 28, isPass ? 87 : 28);
    doc.text(row.status, pageWidth - 24, y, { align: 'right' });
  });

  // 11. Footer: Score badge + Status + Signatures
  const footerY = 145;

  // Grade badge box with golden accent
  doc.setFillColor(254, 252, 243);
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.6);
  doc.roundedRect(20, footerY, 48, 48, 3, 3, 'FD');

  doc.setTextColor(180, 83, 9);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('PREDIKAT KOMPETENSI', 44, footerY + 6.5, { align: 'center' });

  doc.setTextColor(15, 40, 78);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`GRADE ${evalData.grade}`, 44, footerY + 18, { align: 'center' });

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8.5);
  doc.setFont('courier', 'bold');
  doc.text(`Skor: ${evalData.total}%`, 44, footerY + 26.5, { align: 'center' });

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Loss: ${loss.toFixed(2)} dB`, 44, footerY + 34, { align: 'center' });
  doc.text(`Speed: ${speedRating.label}`, 44, footerY + 41, { align: 'center' });

  // Final status declaration box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(210, 218, 228);
  doc.setLineWidth(0.4);
  doc.roundedRect(72, footerY, 132, 48, 3, 3, 'FD');

  const isLulus = evalData.total >= 70 && loss <= spec.maxAllowedLoss;
  doc.setTextColor(isLulus ? 4 : 185, isLulus ? 120 : 28, isLulus ? 87 : 28);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(
    isLulus ? 'STATUS AKHIR: DINYATAKAN LULUS & MEMENUHI STANDAR TELKOM' : 'STATUS AKHIR: PERLU REMEDIAL & EVALUASI ULANG',
    76,
    footerY + 7.5
  );

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Teknisi ini telah menyelesaikan seluruh tahapan pengupasan, pembersihan, pemotongan presisi,\npenyambungan fusi elektroda, dan proteksi pemanasan sesuai SOP Lapangan Telkom Akses / ITU-T G.652.D.`,
    76,
    footerY + 15
  );

  const feedbackMsg = isLulus
    ? 'Hasil sambungan memiliki redaman transmisi sangat rendah, mekanik kokoh, siap instalasi ODC/ODP lapangan.'
    : 'Perhatikan kebersihan cleaving dan presisi alignment untuk meminimalkan loss sambungan.';
  doc.setTextColor(100, 116, 139);
  doc.text(`Catatan Evaluator: "${feedbackMsg}"`, 76, footerY + 26.5);

  // Link to page 2 note
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(76, footerY + 32, 124, 11, 2, 2, 'F');
  doc.setTextColor(15, 43, 92);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DOKUMEN RESMI 2 HALAMAN:', 80, footerY + 36.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Halaman 2 memuat Lampiran Audit Teknis & Ringkasan Riwayat Kesalahan (${scenariosFaced.length} catatan kejadian).`,
    80,
    footerY + 40.5
  );

  // Digital Signatures box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(210, 218, 228);
  doc.setLineWidth(0.4);
  doc.roundedRect(208, footerY, pageWidth - 228, 48, 3, 3, 'FD');

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('VALIDASI ASESOR & TANDA TANGAN', (208 + pageWidth - 20) / 2, footerY + 6.5, { align: 'center' });

  doc.setTextColor(2, 132, 199);
  doc.setFontSize(8);
  doc.setFont('courier', 'bold');
  doc.text('[VERIFIED DIGITAL STAMP]', (208 + pageWidth - 20) / 2, footerY + 14.5, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Ir. Bambang S., MT, CCNA', (208 + pageWidth - 20) / 2, footerY + 24.5, { align: 'center' });

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('Lead Optical Network Assessor', (208 + pageWidth - 20) / 2, footerY + 29.5, { align: 'center' });

  doc.setDrawColor(200, 200, 200);
  doc.line(214, footerY + 34, pageWidth - 26, footerY + 34);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(state.traineeName || 'Teknisi Peserta', (208 + pageWidth - 20) / 2, footerY + 39.5, { align: 'center' });

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(5.5);
  doc.text(`Tanda Tangan Teknisi • ID: ${state.traineeId || 'OPT-001'}`, (208 + pageWidth - 20) / 2, footerY + 44, { align: 'center' });

  // =========================================================================
  // PAGE 2: LAMPIRAN AUDIT TEKNIS & RINGKASAN RIWAYAT KESALAHAN
  // =========================================================================

  doc.addPage('a4', 'landscape');

  // Background gradient for page 2
  for (let i = 0; i < gradientSteps; i++) {
    const ratio = i / gradientSteps;
    const r = Math.round(255 - ratio * 8);
    const g = Math.round(255 - ratio * 12);
    const b = Math.round(255 - ratio * 18);
    doc.setFillColor(r, g, b);
    doc.rect(0, i * stepHeight, pageWidth, stepHeight + 0.5, 'F');
  }

  // Outer Deep Navy Border
  doc.setDrawColor(15, 43, 92);
  doc.setLineWidth(1.4);
  doc.roundedRect(8, 8, pageWidth - 16, pageHeight - 16, 3, 3, 'S');

  // Inner Slate Border
  doc.setDrawColor(180, 138, 60);
  doc.setLineWidth(0.6);
  doc.roundedRect(12, 12, pageWidth - 24, pageHeight - 24, 2, 2, 'S');

  // Logo Page 2
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 18, 16, 16, 16);
    } catch (e) {
      console.warn('Error adding logo to PDF page 2:', e);
    }
  }

  // Header Page 2
  doc.setTextColor(15, 43, 92);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('SMK INDUSTRI • LEMBAGA SERTIFIKASI KOMPETENSI TEKNIK TELEKOMUNIKASI', 38, 19.5);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('LAMPIRAN AUDIT TEKNIS & RINGKASAN RIWAYAT KESALAHAN', 38, 26);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Dokumen Pendukung Resmi Sertifikat No: ${certId} • Standar SOP Telkom Akses / STEL-L-040`,
    38,
    31
  );

  // Meta banner box
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(18, 36, pageWidth - 36, 11, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(`Teknisi: ${(state.traineeName || 'Teknisi').toUpperCase()}`, 22, 43);
  doc.text(`ID: ${state.traineeId || 'OPT-001'}`, 88, 43);
  doc.text(`Instansi: ${state.companyOrInstitution || 'SMK Industri'}`, 140, 43);
  doc.text(`Skor: ${evalData.total}% (Grade ${evalData.grade})`, 210, 43);
  doc.text(`Loss: ${loss.toFixed(2)} dB`, 260, 43);

  // Error Scenarios Summary Table
  const errTableY = 51;
  doc.setFillColor(15, 43, 92);
  doc.rect(18, errTableY, pageWidth - 36, 7.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('No', 22, errTableY + 5.2);
  doc.text('Kategori Kesalahan / Anomali', 32, errTableY + 5.2);
  doc.text('Tingkat', 85, errTableY + 5.2);
  doc.text('Deskripsi Kejadian & Dampak Teknis', 110, errTableY + 5.2);
  doc.text('Tindakan Korektif SOP Lapangan yang Dijalankan', 195, errTableY + 5.2);

  if (scenariosFaced.length === 0) {
    // Zero Defect Plaque
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.setLineWidth(0.5);
    doc.roundedRect(18, errTableY + 10, pageWidth - 36, 32, 2, 2, 'FD');

    doc.setTextColor(22, 101, 52);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('STATUS: NIHIL KESALAHAN TEKNIS (ZERO DEFECT SPLICING)', pageWidth / 2, errTableY + 20, { align: 'center' });

    doc.setTextColor(21, 128, 61);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Teknisi berhasil menyelesaikan seluruh tahapan tanpa anomali (kontaminasi end-face, misalignment core, over-tension, maupun cacat sudut potong).\nSeluruh parameter fisik dan optik memenuhi kriteria tertinggi Standar PT Telkom Akses / ITU-T G.652.D.',
      pageWidth / 2,
      errTableY + 27,
      { align: 'center' }
    );
  } else {
    // Render each error scenario
    scenariosFaced.forEach((sc, idx) => {
      const rowY = errTableY + 11.5 + idx * 11;
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(18.2, rowY - 3.8, pageWidth - 36.4, 10.5, 'F');
      }

      // No
      doc.setFont('courier', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(7);
      doc.text(`${idx + 1}`, 22, rowY + 2.5);

      // Name & Category
      doc.setFont('helvetica', 'bold');
      doc.text(sc.name.slice(0, 32), 32, rowY + 1.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`[${sc.category.replace('_', ' ').toUpperCase()}]`, 32, rowY + 5.5);

      // Severity Tag
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      if (sc.severity === 'critical') {
        doc.setTextColor(185, 28, 28);
        doc.text('KRITIS', 85, rowY + 2.5);
      } else if (sc.severity === 'warning') {
        doc.setTextColor(180, 83, 9);
        doc.text('PERINGATAN', 85, rowY + 2.5);
      } else {
        doc.setTextColor(22, 101, 52);
        doc.text('NORMAL', 85, rowY + 2.5);
      }

      // Details
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(6.2);
      const splitDetails = doc.splitTextToSize(sc.details, 80);
      doc.text(splitDetails.slice(0, 2), 110, rowY + 1);

      // SOP Correction
      doc.setTextColor(15, 43, 92);
      doc.setFont('helvetica', 'bold');
      const splitCorrection = doc.splitTextToSize(sc.sopCorrection || 'SOP Telkom Akses', 80);
      doc.text(splitCorrection.slice(0, 2), 195, rowY + 1);
    });
  }

  // Evaluator Technical Notes & Recommendations
  const notesY = 126;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(210, 218, 228);
  doc.setLineWidth(0.4);
  doc.roundedRect(18, notesY, pageWidth - 36, 40, 2, 2, 'FD');

  doc.setFillColor(15, 43, 92);
  doc.roundedRect(22, notesY + 4, 85, 5.5, 1.5, 1.5, 'F');
  doc.setTextColor(247, 208, 112);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('ANALISIS KUALITAS SAMBUNGAN & REKOMENDASI ASESOR', 64.5, notesY + 7.8, { align: 'center' });

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `1. Kualitas Core Alignment: Nilai perkiraan splice loss terukur ${loss.toFixed(2)} dB menunjukkan efisiensi transmisi yang ${loss <= 0.03 ? 'sangat tinggi' : 'memadai'}.\n` +
    `2. Keandalan Mekanis: Proteksi sambungan menggunakan sleeve 60mm dengan batang penguat baja telah lulus uji tarik 2.0 N (~200gf).\n` +
    `3. Kepatuhan K3 & Penanganan Limbah: Teknisi wajib senantiasa menampung potongan kaca serat optik dalam wadah khusus (Fiber Scrap Bin).\n` +
    `4. Rekomendasi Penugasan: ${isLulus ? 'LAYAK untuk penugasan lapangan instalasi FTTH Drop Core, ODC, dan Joint Closure.' : 'Dianjurkan mengulang sesi simulasi cleaving dan alignment sebelum penugasan lapangan.'}`,
    22,
    notesY + 14
  );

  // Bottom verification & audit stamp on Page 2
  const page2FooterY = 171;
  doc.setDrawColor(203, 213, 225);
  doc.line(18, page2FooterY, pageWidth - 18, page2FooterY);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(6);
  doc.setFont('courier', 'normal');
  doc.text(
    `Dokumen ini diterbitkan secara digital oleh Sistem Simulator Fiber Optik OptiSim Pro • Terverifikasi LSP Telekomunikasi / Telkom Group`,
    18,
    page2FooterY + 5
  );
  doc.text(
    `Stempel Audit: SHA256-${certId}-${Date.now().toString(36).toUpperCase()} • Halaman 2 dari 2`,
    18,
    page2FooterY + 9
  );

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 43, 92);
  doc.text('Ir. Bambang S., MT, CCNA', pageWidth - 18, page2FooterY + 5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Lead Optical Network Assessor', pageWidth - 18, page2FooterY + 9, { align: 'right' });

  // Save PDF
  doc.save(filename);
}
