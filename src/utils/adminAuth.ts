import { EquipmentFailureType, FailureProbability } from '../types/equipmentFailure';

export type DynamicDifficulty = 'easy' | 'normal' | 'hard';

export interface ExamSettings {
  examMode: 'practice' | 'exam';
  batchTitle: string;
  examinerName: string;
  timeLimitMinutes: number; // 0 = unlimited / regular stopwatch, 3, 5, 8, 10
  difficultyLevel: 'standard' | 'intermediate' | 'challenge';
  cleaverBladePreset: 'sharp' | 'worn';
  initialCleaveAngle: number; // e.g. 0.4 standard vs 1.1 worn
  maxAllowedLoss: number; // 0.05 standard vs 0.02 strict
  injectDefectType: 'none' | 'bubble' | 'waist' | 'thick' | 'offset' | 'angle_fail';
  strictStandards: boolean;
  // Dynamic difficulty configurations
  dynamicDifficulty: DynamicDifficulty;
  stepTimeLimitSeconds: number; // time limit in seconds per workflow step (e.g. Easy: 90s, Normal: 50s, Hard: 25s)
  otdrToleranceDb: number; // dynamic dB tolerance on OTDR results (e.g. Easy: 0.08 dB, Normal: 0.05 dB, Hard: 0.02 dB)
  // Random Equipment Failure Module (Pelatihan Ketangguhan Teknisi)
  randomEquipmentFailureEnabled: boolean;
  failureProbability: FailureProbability;
  activeFailureTypes: EquipmentFailureType[];
}

export const DEFAULT_ADMIN_PIN = '1234';

const STORAGE_PIN_KEY = 'optisim_admin_pin_v1';
const STORAGE_AUTH_KEY = 'optisim_admin_session_auth_v1';
const STORAGE_EXAM_SETTINGS_KEY = 'optisim_exam_settings_v1';

export const DEFAULT_EXAM_SETTINGS: ExamSettings = {
  examMode: 'practice',
  batchTitle: 'Uji Kompetensi Splicing Fiber Optik - Gelombang I',
  examinerName: 'Asesor Penguji Uji Kompetensi Telkom',
  timeLimitMinutes: 0, // Default 0 (Free play stopwatch)
  difficultyLevel: 'standard',
  cleaverBladePreset: 'sharp',
  initialCleaveAngle: 0.4,
  maxAllowedLoss: 0.05,
  injectDefectType: 'none',
  strictStandards: false,
  dynamicDifficulty: 'normal',
  stepTimeLimitSeconds: 50,
  otdrToleranceDb: 0.05,
  // Random Equipment Failure defaults
  randomEquipmentFailureEnabled: false,
  failureProbability: 'medium',
  activeFailureTypes: ['low_battery', 'dull_cleaver', 'dirty_electrode', 'dusty_vgroove', 'heater_fault'],
};

export function getAdminPin(): string {
  try {
    const saved = localStorage.getItem(STORAGE_PIN_KEY);
    if (saved && saved.trim().length >= 4) {
      return saved.trim();
    }
  } catch (e) {
    console.warn('Error reading admin pin from storage', e);
  }
  return DEFAULT_ADMIN_PIN;
}

export function setAdminPin(newPin: string, currentPin: string): { success: boolean; message: string } {
  const activePin = getAdminPin();
  if (currentPin !== activePin) {
    return { success: false, message: 'PIN Admin saat ini tidak sesuai.' };
  }
  if (!newPin || newPin.length < 4) {
    return { success: false, message: 'PIN baru minimal terdiri dari 4 digit.' };
  }
  try {
    localStorage.setItem(STORAGE_PIN_KEY, newPin.trim());
    return { success: true, message: 'PIN Admin berhasil diperbarui.' };
  } catch (e) {
    return { success: false, message: 'Gagal menyimpan PIN ke penyimpanan lokal.' };
  }
}

export function resetAdminPinToDefault(): void {
  try {
    localStorage.removeItem(STORAGE_PIN_KEY);
  } catch (e) {
    // ignore
  }
}

export function isAdminLoggedIn(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_AUTH_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

export function loginAdmin(enteredPin: string): { success: boolean; message: string } {
  const correctPin = getAdminPin();
  if (enteredPin.trim() === correctPin) {
    try {
      sessionStorage.setItem(STORAGE_AUTH_KEY, 'true');
    } catch (e) {
      // ignore
    }
    return { success: true, message: 'Login Admin / Penguji berhasil!' };
  }
  return { success: false, message: 'PIN Admin yang Anda masukkan salah. Default PIN: 1234' };
}

export function logoutAdmin(): void {
  try {
    sessionStorage.removeItem(STORAGE_AUTH_KEY);
  } catch (e) {
    // ignore
  }
}

export function getExamSettings(): ExamSettings {
  try {
    const raw = localStorage.getItem(STORAGE_EXAM_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const settings: ExamSettings = { ...DEFAULT_EXAM_SETTINGS, ...parsed };
      if (!settings.otdrToleranceDb && settings.maxAllowedLoss) {
        settings.otdrToleranceDb = settings.maxAllowedLoss;
      }
      if (!settings.dynamicDifficulty) {
        settings.dynamicDifficulty = settings.maxAllowedLoss <= 0.03 ? 'hard' : (settings.maxAllowedLoss >= 0.08 ? 'easy' : 'normal');
      }
      if (!settings.stepTimeLimitSeconds) {
        settings.stepTimeLimitSeconds = settings.dynamicDifficulty === 'hard' ? 25 : (settings.dynamicDifficulty === 'easy' ? 90 : 50);
      }
      return settings;
    }
  } catch (e) {
    console.warn('Failed to parse exam settings', e);
  }
  return { ...DEFAULT_EXAM_SETTINGS };
}

export function saveExamSettings(settings: ExamSettings): void {
  try {
    localStorage.setItem(STORAGE_EXAM_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save exam settings', e);
  }
}
