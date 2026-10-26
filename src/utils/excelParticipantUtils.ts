import * as XLSX from 'xlsx';
import { ParticipantRecord } from '../types/fiber';
import { generateTraineeId, ParsedBatchCandidate } from './participantQueue';

/**
 * Downloads a clean, formatted Excel (.xlsx) template for participant roster upload.
 */
export function downloadExcelTemplate(filename = 'Template_Peserta_Uji_Splicing.xlsx'): void {
  // Sheet 1: Data template
  const templateRows = [
    {
      'No': 1,
      'Nama Lengkap': 'Rudi Hermawan',
      'NIK / ID Teknisi': 'OPT-TK-1001',
      'Instansi / Perusahaan': 'PT Telkom Akses Witel Jakarta Barat',
    },
    {
      'No': 2,
      'Nama Lengkap': 'Dewi Anggraini',
      'NIK / ID Teknisi': 'OPT-TK-1002',
      'Instansi / Perusahaan': 'PT Telkom Akses Witel Bandung',
    },
    {
      'No': 3,
      'Nama Lengkap': 'Bagas Prasetya',
      'NIK / ID Teknisi': '', // Boleh kosong, otomatis digenerate ID
      'Instansi / Perusahaan': 'Mitra OSP FTTH Telkom Surabaya',
    },
    {
      'No': 4,
      'Nama Lengkap': 'Indah Permatasari',
      'NIK / ID Teknisi': '',
      'Instansi / Perusahaan': 'SMK Telkom Malang / Vokasi Jaringan',
    },
  ];

  const wsData = XLSX.utils.json_to_sheet(templateRows);

  // Styling: column widths
  wsData['!cols'] = [
    { wch: 8 },  // No
    { wch: 30 }, // Nama Lengkap
    { wch: 22 }, // NIK / ID Teknisi
    { wch: 40 }, // Instansi / Perusahaan
  ];

  // Sheet 2: Petunjuk Pengisian
  const instructionRows = [
    {
      'Kolom': 'No',
      'Keterangan': 'Nomor urut peserta (opsional).',
      'Contoh': '1, 2, 3',
    },
    {
      'Kolom': 'Nama Lengkap',
      'Keterangan': 'Nama teknisi / peserta uji kompetensi (Wajib diisi).',
      'Contoh': 'Rudi Hermawan',
    },
    {
      'Kolom': 'NIK / ID Teknisi',
      'Keterangan': 'Nomor Induk Karyawan atau ID Teknisi. Jika dikosongkan, sistem akan otomatis membuat ID unik bertipe OPT-TK-XXXX.',
      'Contoh': 'OPT-TK-1001 atau Kosongkan',
    },
    {
      'Kolom': 'Instansi / Perusahaan',
      'Keterangan': 'Nama Witel, Mitra OSP, SMK, atau Perusahaan. Jika dikosongkan akan menggunakan instansi default.',
      'Contoh': 'PT Telkom Akses Witel Jakarta Barat',
    },
  ];

  const wsInstructions = XLSX.utils.json_to_sheet(instructionRows);
  wsInstructions['!cols'] = [
    { wch: 24 },
    { wch: 60 },
    { wch: 35 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsData, 'Daftar Peserta');
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Petunjuk Pengisian');

  // Trigger download
  XLSX.writeFile(wb, filename);
}

/**
 * Downloads a clean CSV template as alternative format.
 */
export function downloadCsvTemplate(filename = 'Template_Peserta_Uji_Splicing.csv'): void {
  const csvContent = 
    `No,Nama Lengkap,NIK / ID Teknisi,Instansi / Perusahaan\n` +
    `1,Rudi Hermawan,OPT-TK-1001,PT Telkom Akses Witel Jakarta Barat\n` +
    `2,Dewi Anggraini,OPT-TK-1002,PT Telkom Akses Witel Bandung\n` +
    `3,Bagas Prasetya,,Mitra OSP FTTH Telkom Surabaya\n` +
    `4,Indah Permatasari,,SMK Telkom Malang / Vokasi Jaringan\n`;

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ParseExcelResult {
  success: boolean;
  candidates: ParsedBatchCandidate[];
  fileName: string;
  totalRowsFound: number;
  warnings: string[];
  error?: string;
}

/**
 * Parses uploaded Excel (.xlsx, .xls) or CSV file with intelligent column mapping and validation.
 */
export async function parseExcelOrCsvFile(
  file: File,
  defaultInstitution: string = 'PT Telkom Akses / Witel Regional'
): Promise<ParseExcelResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          resolve({
            success: false,
            candidates: [],
            fileName: file.name,
            totalRowsFound: 0,
            warnings: [],
            error: 'File kosong atau tidak dapat dibaca.',
          });
          return;
        }

        const workbook = XLSX.read(buffer, { type: 'array' });
        
        // Pick the first sheet or sheet named 'Daftar Peserta'
        const sheetName = workbook.SheetNames.find((s) => s.toLowerCase().includes('peserta')) || workbook.SheetNames[0];
        if (!sheetName) {
          resolve({
            success: false,
            candidates: [],
            fileName: file.name,
            totalRowsFound: 0,
            warnings: [],
            error: 'Tidak ditemukan lembar kerja (worksheet) pada file Excel.',
          });
          return;
        }

        const worksheet = workbook.Sheets[sheetName];
        // Read as 2D array to accurately detect header row
        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rawRows || rawRows.length === 0) {
          resolve({
            success: false,
            candidates: [],
            fileName: file.name,
            totalRowsFound: 0,
            warnings: [],
            error: 'Lembar kerja Excel kosong.',
          });
          return;
        }

        // Find header row by matching column names
        let headerRowIdx = -1;
        let nameColIdx = -1;
        let idColIdx = -1;
        let instColIdx = -1;

        for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
          const row = rawRows[r];
          if (!Array.isArray(row)) continue;

          for (let c = 0; c < row.length; c++) {
            const cellVal = String(row[c] || '').trim().toLowerCase();
            if (
              cellVal === 'nama lengkap' || 
              cellVal === 'nama peserta' || 
              cellVal === 'nama' || 
              cellVal === 'name' || 
              cellVal === 'teknisi'
            ) {
              nameColIdx = c;
              headerRowIdx = r;
            } else if (
              cellVal.includes('nik') || 
              cellVal.includes('id teknisi') || 
              cellVal === 'id' || 
              cellVal === 'trainee id' ||
              cellVal === 'no id' ||
              cellVal === 'nomor id'
            ) {
              idColIdx = c;
            } else if (
              cellVal.includes('instansi') || 
              cellVal.includes('perusahaan') || 
              cellVal.includes('company') || 
              cellVal.includes('institution') ||
              cellVal.includes('witel') ||
              cellVal.includes('mitra')
            ) {
              instColIdx = c;
            }
          }

          if (nameColIdx !== -1) {
            break; // found the header row
          }
        }

        // If no explicit header row detected, fallback to standard column indices
        let startDataRow = 0;
        if (headerRowIdx !== -1) {
          startDataRow = headerRowIdx + 1;
        } else {
          // Check if row 0 looks like header or data
          const firstRow = rawRows[0] || [];
          const firstCell = String(firstRow[0] || '').toLowerCase();
          if (firstCell.includes('no') || firstCell.includes('nama')) {
            startDataRow = 1;
          }
          // Default heuristic: Col 0 = No (or Name), Col 1 = Name, Col 2 = ID, Col 3 = Instansi
          if (firstRow.length >= 4) {
            nameColIdx = 1;
            idColIdx = 2;
            instColIdx = 3;
          } else if (firstRow.length >= 3) {
            nameColIdx = 0;
            idColIdx = 1;
            instColIdx = 2;
          } else {
            nameColIdx = 0;
            idColIdx = -1;
            instColIdx = 1;
          }
        }

        const candidates: ParsedBatchCandidate[] = [];
        const warnings: string[] = [];

        for (let r = startDataRow; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || !Array.isArray(row)) continue;

          const rawName = nameColIdx !== -1 ? String(row[nameColIdx] || '').trim() : '';
          // Skip empty rows or header duplicate repeats
          if (!rawName) continue;
          if (
            rawName.toLowerCase() === 'nama lengkap' ||
            rawName.toLowerCase() === 'nama' ||
            rawName.toLowerCase().startsWith('contoh') ||
            rawName.toLowerCase().includes('petunjuk')
          ) {
            continue;
          }

          let rawId = idColIdx !== -1 ? String(row[idColIdx] || '').trim() : '';
          let rawInst = instColIdx !== -1 ? String(row[instColIdx] || '').trim() : '';

          if (!rawId) {
            rawId = generateTraineeId();
          }

          if (!rawInst) {
            rawInst = defaultInstitution;
          }

          candidates.push({
            name: rawName,
            id: rawId.startsWith('OPT-') ? rawId : (rawId ? rawId : generateTraineeId()),
            institution: rawInst,
          });
        }

        if (candidates.length === 0) {
          resolve({
            success: false,
            candidates: [],
            fileName: file.name,
            totalRowsFound: 0,
            warnings: [],
            error: 'Tidak ditemukan data nama peserta yang valid di file ini. Pastikan kolom "Nama Lengkap" terisi.',
          });
          return;
        }

        resolve({
          success: true,
          candidates,
          fileName: file.name,
          totalRowsFound: candidates.length,
          warnings,
        });
      } catch (err: any) {
        console.error('Failed to parse file:', err);
        resolve({
          success: false,
          candidates: [],
          fileName: file.name,
          totalRowsFound: 0,
          warnings: [],
          error: `Gagal membaca file: ${err?.message || 'Format tidak didukung.'}`,
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        candidates: [],
        fileName: file.name,
        totalRowsFound: 0,
        warnings: [],
        error: 'Terjadi kesalahan saat membaca file dari sistem.',
      });
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Exports current participant roster and results to a formatted Excel file.
 */
export function exportParticipantResultsToExcel(
  queue: ParticipantRecord[],
  filename = 'Laporan_Uji_Splicing_OptiSim.xlsx'
): void {
  const exportData = queue.map((p, idx) => {
    const statusLabel = 
      p.status === 'completed'
        ? 'Selesai'
        : p.status === 'in_progress'
        ? 'Sedang Uji'
        : 'Belum Uji';

    const durationText = p.durationSeconds ? `${p.durationSeconds}s` : '-';
    const scoreText = p.totalScore !== undefined ? p.totalScore : '-';
    const gradeText = p.grade || '-';
    const lossText = p.spliceLoss !== undefined ? `${p.spliceLoss.toFixed(2)} dB` : '-';
    const compliantText = 
      p.telkomCompliant === true
        ? 'LULUS (≤ 0.05 dB)'
        : p.telkomCompliant === false
        ? 'RE-EXAM (> 0.05 dB)'
        : '-';

    const completedTime = p.completedAt ? new Date(p.completedAt).toLocaleString('id-ID') : '-';

    return {
      'No': idx + 1,
      'Nama Teknisi': p.traineeName,
      'NIK / ID Teknisi': p.traineeId,
      'Instansi / Perusahaan': p.companyOrInstitution,
      'Status Uji': statusLabel,
      'Durasi Pengerjaan': durationText,
      'Total Skor': scoreText,
      'Grade SOP': gradeText,
      'Redaman Splice': lossText,
      'Standar Telkom': compliantText,
      'Waktu Selesai': completedTime,
    };
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 18 },
    { wch: 36 },
    { wch: 14 },
    { wch: 18 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
    { wch: 22 },
    { wch: 22 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Hasil Uji Splicing');
  XLSX.writeFile(wb, filename);
}
