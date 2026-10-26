import { LeaderboardEntry, TechnicianState } from '../types/fiber';
import { calculateSpliceAccuracy } from './standards';

const LEADERBOARD_STORAGE_KEY = 'optisim_leaderboard_data_v2';

export function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || isNaN(totalSeconds) || totalSeconds < 0) return '00:00';
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatDurationLong(totalSeconds: number): string {
  if (!totalSeconds || isNaN(totalSeconds) || totalSeconds < 0) return '0 detik';
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  if (mins === 0) return `${secs} detik`;
  if (secs === 0) return `${mins} menit`;
  return `${mins} menit ${secs} detik`;
}

export function getSpeedRating(seconds: number): { label: string; badge: string; color: string } {
  if (seconds <= 120) {
    return { label: 'Kilat (Speed Master)', badge: '⚡ < 2 Menit', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
  }
  if (seconds <= 180) {
    return { label: 'Sangat Cepat & Efisien', badge: '⚡ < 3 Menit', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  }
  if (seconds <= 240) {
    return { label: 'Standar Operasional (SOP)', badge: '⏱️ < 4 Menit', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
  }
  return { label: 'Butuh Optimasi Kecepatan', badge: '🐢 > 4 Menit', color: 'text-slate-400 bg-slate-800 border-slate-700' };
}

export const INITIAL_LEADERBOARD_ENTRIES: LeaderboardEntry[] = [
  {
    id: 'lb-seed-1',
    traineeName: 'Bambang Sudarsono',
    traineeId: 'OPT-TK-1082',
    companyOrInstitution: 'PT Telkom Akses Witel Jakarta Selatan',
    fiberType: 'G652D_SM',
    totalScore: 98,
    spliceLoss: 0.01,
    grade: 'A+',
    mode: 'timetrial',
    durationSeconds: 98, // 01:38
    isTimeTrial: true,
    telkomCompliant: true,
    strippingScore: 98,
    cleaningScore: 97,
    cleavingScore: 99,
    splicingScore: 98,
    heatingScore: 98,
    cleaveAngleLeft: 0.2,
    cleaveAngleRight: 0.3,
    timestamp: Date.now() - 1000 * 60 * 60 * 4, // 4 hours ago
  },
  {
    id: 'lb-seed-2',
    traineeName: 'Dwi Prasetyo',
    traineeId: 'OPT-TK-2941',
    companyOrInstitution: 'PT Telkom Akses Witel Surabaya',
    fiberType: 'G652D_SM',
    totalScore: 96,
    spliceLoss: 0.01,
    grade: 'A+',
    mode: 'timetrial',
    durationSeconds: 112, // 01:52
    isTimeTrial: true,
    telkomCompliant: true,
    strippingScore: 95,
    cleaningScore: 98,
    cleavingScore: 96,
    splicingScore: 97,
    heatingScore: 95,
    cleaveAngleLeft: 0.3,
    cleaveAngleRight: 0.3,
    timestamp: Date.now() - 1000 * 60 * 60 * 18, // 18 hours ago
  },
  {
    id: 'lb-seed-3',
    traineeName: 'Siti Rahmawati',
    traineeId: 'OPT-FTTH-4019',
    companyOrInstitution: 'Mitra OSP PT Telkom Regional IV Semarang',
    fiberType: 'G657A_FTTH',
    totalScore: 94,
    spliceLoss: 0.02,
    grade: 'A',
    mode: 'exam',
    durationSeconds: 135, // 02:15
    isTimeTrial: false,
    telkomCompliant: true,
    strippingScore: 92,
    cleaningScore: 95,
    cleavingScore: 94,
    splicingScore: 95,
    heatingScore: 94,
    cleaveAngleLeft: 0.4,
    cleaveAngleRight: 0.4,
    timestamp: Date.now() - 1000 * 60 * 60 * 28, // 1 day ago
  },
  {
    id: 'lb-seed-4',
    traineeName: 'Rian Kurniawan',
    traineeId: 'OPT-TK-5521',
    companyOrInstitution: 'PT Telkom Akses Witel Bandung',
    fiberType: 'G652D_SM',
    totalScore: 91,
    spliceLoss: 0.02,
    grade: 'A',
    mode: 'timetrial',
    durationSeconds: 124, // 02:04
    isTimeTrial: true,
    telkomCompliant: true,
    strippingScore: 90,
    cleaningScore: 92,
    cleavingScore: 91,
    splicingScore: 92,
    heatingScore: 90,
    cleaveAngleLeft: 0.5,
    cleaveAngleRight: 0.4,
    timestamp: Date.now() - 1000 * 60 * 60 * 42,
  },
  {
    id: 'lb-seed-5',
    traineeName: 'Fajar Nugroho',
    traineeId: 'OPT-IND-6302',
    companyOrInstitution: 'Subkontraktor Fiber OSP Indosat',
    fiberType: 'G652D_SM',
    totalScore: 88,
    spliceLoss: 0.03,
    grade: 'A',
    mode: 'training',
    durationSeconds: 165, // 02:45
    isTimeTrial: false,
    telkomCompliant: true,
    strippingScore: 86,
    cleaningScore: 90,
    cleavingScore: 89,
    splicingScore: 88,
    heatingScore: 87,
    cleaveAngleLeft: 0.6,
    cleaveAngleRight: 0.5,
    timestamp: Date.now() - 1000 * 60 * 60 * 60,
  },
  {
    id: 'lb-seed-6',
    traineeName: 'Hendro Wijaya',
    traineeId: 'OPT-PLN-7714',
    companyOrInstitution: 'PT Indonesia Comnets Plus (PLN Icon+)',
    fiberType: 'OM3_MM',
    totalScore: 84,
    spliceLoss: 0.04,
    grade: 'B',
    mode: 'exam',
    durationSeconds: 182, // 03:02
    isTimeTrial: false,
    telkomCompliant: true,
    strippingScore: 82,
    cleaningScore: 85,
    cleavingScore: 83,
    splicingScore: 86,
    heatingScore: 84,
    cleaveAngleLeft: 0.7,
    cleaveAngleRight: 0.6,
    timestamp: Date.now() - 1000 * 60 * 60 * 76,
  },
  {
    id: 'lb-seed-7',
    traineeName: 'Dimas Setiawan',
    traineeId: 'OPT-TK-8830',
    companyOrInstitution: 'PT Telkom Akses Witel Medan',
    fiberType: 'G657A_FTTH',
    totalScore: 74,
    spliceLoss: 0.06,
    grade: 'C',
    mode: 'training',
    durationSeconds: 215, // 03:35
    isTimeTrial: false,
    telkomCompliant: false,
    strippingScore: 75,
    cleaningScore: 78,
    cleavingScore: 68,
    splicingScore: 74,
    heatingScore: 75,
    cleaveAngleLeft: 0.9,
    cleaveAngleRight: 0.8,
    timestamp: Date.now() - 1000 * 60 * 60 * 96,
  },
];

export function getLeaderboardEntries(): LeaderboardEntry[] {
  if (typeof window === 'undefined') {
    return INITIAL_LEADERBOARD_ENTRIES;
  }
  try {
    const raw = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(INITIAL_LEADERBOARD_ENTRIES));
      return INITIAL_LEADERBOARD_ENTRIES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Normalize any older records lacking durationSeconds
      return parsed.map((item, idx) => ({
        ...item,
        durationSeconds: item.durationSeconds ?? (110 + idx * 15),
        isTimeTrial: item.isTimeTrial ?? (item.mode === 'timetrial'),
      }));
    }
    return INITIAL_LEADERBOARD_ENTRIES;
  } catch (err) {
    console.error('Failed to read leaderboard from localStorage:', err);
    return INITIAL_LEADERBOARD_ENTRIES;
  }
}

export function saveLeaderboardEntry(
  entry: Omit<LeaderboardEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: number }
): LeaderboardEntry {
  const entries = getLeaderboardEntries();
  const newEntry: LeaderboardEntry = {
    ...entry,
    durationSeconds: entry.durationSeconds || 120,
    isTimeTrial: entry.isTimeTrial ?? (entry.mode === 'timetrial'),
    id: entry.id || `lb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: entry.timestamp || Date.now(),
  };

  // Prepend new entry
  const updated = [newEntry, ...entries.filter((e) => e.id !== newEntry.id)];
  // Cap at 100 entries to prevent storage bloat
  const trimmed = updated.slice(0, 100);

  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(trimmed));
    }
  } catch (err) {
    console.error('Failed to save leaderboard entry to localStorage:', err);
  }

  return newEntry;
}

export function createLeaderboardEntryFromState(state: TechnicianState): LeaderboardEntry {
  const evalData = calculateSpliceAccuracy(state);
  const loss = state.arcPerformed ? state.estimatedLoss : 0.02;

  const durationSeconds = state.timeTrialDuration > 0
    ? state.timeTrialDuration
    : state.timeTrialStartTime
    ? Math.max(1, Math.round((Date.now() - state.timeTrialStartTime) / 1000))
    : 120;

  return {
    id: `lb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    traineeName: state.traineeName || 'Teknisi Tanpa Nama',
    traineeId: state.traineeId,
    companyOrInstitution: state.companyOrInstitution || 'PT Telkom Akses',
    fiberType: state.fiberType,
    totalScore: evalData.total,
    spliceLoss: Number(loss.toFixed(2)),
    grade: evalData.grade,
    mode: state.mode,
    durationSeconds,
    isTimeTrial: state.mode === 'timetrial' || state.timeTrialDuration > 0,
    telkomCompliant: evalData.telkomCompliant,
    strippingScore: evalData.strippingScore,
    cleaningScore: evalData.cleaningScore,
    cleavingScore: evalData.cleavingScore,
    splicingScore: evalData.splicingScore,
    heatingScore: evalData.heatingScore,
    cleaveAngleLeft: state.leftCleaveAngle,
    cleaveAngleRight: state.rightCleaveAngle,
    timestamp: Date.now(),
  };
}

export function deleteLeaderboardEntry(id: string): LeaderboardEntry[] {
  const current = getLeaderboardEntries();
  const updated = current.filter((item) => item.id !== id);
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.error('Failed to update leaderboard in localStorage:', err);
  }
  return updated;
}

export function resetLeaderboard(): LeaderboardEntry[] {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(INITIAL_LEADERBOARD_ENTRIES));
    }
  } catch (err) {
    console.error('Failed to reset leaderboard:', err);
  }
  return INITIAL_LEADERBOARD_ENTRIES;
}

export function exportLeaderboardToCSV(entries: LeaderboardEntry[]) {
  const headers = [
    'Peringkat',
    'Nama Teknisi',
    'ID Registrasi',
    'Instansi / Perusahaan',
    'Tipe Fiber',
    'Mode Uji',
    'Durasi (MM:SS)',
    'Durasi (Detik)',
    'Skor Total (%)',
    'Estimasi Loss (dB)',
    'Grade',
    'Standar Telkom',
    'Skor Stripping (%)',
    'Skor Cleaning (%)',
    'Skor Cleaving (%)',
    'Skor Splicing (%)',
    'Skor Heating (%)',
    'Sudut Cleave Kiri (°)',
    'Sudut Cleave Kanan (°)',
    'Waktu Selesai',
  ];

  const rows = entries.map((e, idx) => [
    idx + 1,
    `"${e.traineeName.replace(/"/g, '""')}"`,
    `"${e.traineeId}"`,
    `"${e.companyOrInstitution.replace(/"/g, '""')}"`,
    e.fiberType,
    e.mode === 'timetrial' ? 'Time-Trial' : e.mode === 'exam' ? 'Ujian' : 'Latihan',
    `"${formatDuration(e.durationSeconds || 0)}"`,
    e.durationSeconds || 0,
    e.totalScore,
    e.spliceLoss.toFixed(2),
    e.grade,
    e.telkomCompliant ? 'LULUS' : 'TIDAK LULUS',
    e.strippingScore,
    e.cleaningScore,
    e.cleavingScore,
    e.splicingScore,
    e.heatingScore,
    e.cleaveAngleLeft.toFixed(1),
    e.cleaveAngleRight.toFixed(1),
    new Date(e.timestamp).toLocaleString('id-ID'),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `optisim_leaderboard_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
