import { ParticipantRecord, ParticipantTestStatus } from '../types/fiber';

export const QUEUE_STORAGE_KEY = 'optisim_participant_queue_v3';

export const INITIAL_PARTICIPANT_QUEUE: ParticipantRecord[] = [];

export function loadParticipantQueue(): ParticipantRecord[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out legacy default mock participants
        const cleaned = parsed.filter(
          (p) =>
            p.traineeName !== 'Ahmad Rifai' &&
            p.traineeName !== 'Budi Santoso' &&
            p.traineeName !== 'Siti Rahmawati' &&
            p.traineeName !== 'Rizky Pratama' &&
            p.traineeName !== 'Fajar Nugraha'
        );
        return cleaned;
      }
    }
  } catch (err) {
    console.warn('Failed to read participant queue from localStorage:', err);
  }
  return [];
}

export function clearParticipantQueue(): ParticipantRecord[] {
  saveParticipantQueue([]);
  return [];
}

export function saveParticipantQueue(queue: ParticipantRecord[]): void {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('Failed to save participant queue to localStorage:', err);
  }
}

export function generateTraineeId(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `OPT-TK-${randomNum}`;
}

export function addParticipantToQueue(
  traineeName: string,
  traineeId?: string,
  companyOrInstitution?: string
): ParticipantRecord {
  const current = loadParticipantQueue();
  const newRecord: ParticipantRecord = {
    id: `pt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    traineeName: traineeName.trim(),
    traineeId: (traineeId && traineeId.trim()) ? traineeId.trim() : generateTraineeId(),
    companyOrInstitution: (companyOrInstitution && companyOrInstitution.trim())
      ? companyOrInstitution.trim()
      : 'PT Telkom Akses / Witel Regional',
    status: 'untested',
    durationSeconds: 0,
    createdAt: Date.now(),
  };

  const updated = [newRecord, ...current];
  saveParticipantQueue(updated);
  return newRecord;
}

export interface ParsedBatchCandidate {
  name: string;
  id: string;
  institution: string;
}

export function parseBatchParticipantsText(
  rawText: string,
  defaultInstitution: string = 'PT Telkom Akses / Witel Regional'
): ParsedBatchCandidate[] {
  if (!rawText.trim()) return [];

  const lines = rawText.split('\n');
  const results: ParsedBatchCandidate[] = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Remove leading numbering like "1.", "1 -", "1)"
    line = line.replace(/^\d+[\.\)\-]\s*/, '').trim();
    if (!line) continue;

    // Check if separated by comma, semicolon, or tab
    let delimiter = '';
    if (line.includes('\t')) delimiter = '\t';
    else if (line.includes(';')) delimiter = ';';
    else if (line.includes(',')) delimiter = ',';

    if (delimiter) {
      const parts = line.split(delimiter).map((p) => p.trim());
      const name = parts[0];
      const id = parts[1] || generateTraineeId();
      const inst = parts[2] || defaultInstitution;
      if (name) {
        results.push({
          name,
          id: id.startsWith('OPT-') ? id : (id ? id : generateTraineeId()),
          institution: inst,
        });
      }
    } else {
      // Just full name on the line
      results.push({
        name: line,
        id: generateTraineeId(),
        institution: defaultInstitution,
      });
    }
  }

  return results;
}

export function batchAddParticipantsToQueue(
  candidates: ParsedBatchCandidate[]
): ParticipantRecord[] {
  if (!candidates.length) return loadParticipantQueue();

  const current = loadParticipantQueue();
  const newRecords: ParticipantRecord[] = candidates.map((c, idx) => ({
    id: `pt-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
    traineeName: c.name,
    traineeId: c.id || generateTraineeId(),
    companyOrInstitution: c.institution,
    status: 'untested',
    durationSeconds: 0,
    createdAt: Date.now() + idx,
  }));

  const updated = [...current, ...newRecords];
  saveParticipantQueue(updated);
  return updated;
}

export function setParticipantActiveInQueue(participantId: string): ParticipantRecord[] {
  const current = loadParticipantQueue();
  const updated = current.map((p) => {
    if (p.id === participantId) {
      return {
        ...p,
        status: 'in_progress' as ParticipantTestStatus,
      };
    }
    // If another was in_progress but hadn't finished, revert to untested
    if (p.status === 'in_progress') {
      return {
        ...p,
        status: 'untested' as ParticipantTestStatus,
      };
    }
    return p;
  });
  saveParticipantQueue(updated);
  return updated;
}

export function markParticipantCompletedInQueue(
  traineeId: string,
  traineeName: string,
  data: {
    durationSeconds: number;
    totalScore: number;
    grade: 'A+' | 'A' | 'B' | 'C' | 'RE-EXAM';
    spliceLoss?: number;
    telkomCompliant?: boolean;
  }
): ParticipantRecord[] {
  const current = loadParticipantQueue();
  let matched = false;

  const updated = current.map((p) => {
    // Match by traineeId or by exact name
    if (p.traineeId === traineeId || p.traineeName.toLowerCase() === traineeName.toLowerCase()) {
      matched = true;
      return {
        ...p,
        status: 'completed' as ParticipantTestStatus,
        durationSeconds: data.durationSeconds,
        totalScore: data.totalScore,
        grade: data.grade,
        spliceLoss: data.spliceLoss,
        telkomCompliant: data.telkomCompliant ?? true,
        completedAt: Date.now(),
      };
    }
    return p;
  });

  // If not found in queue, add it as completed record
  if (!matched && traineeName.trim()) {
    updated.unshift({
      id: `pt-${Date.now()}`,
      traineeName,
      traineeId,
      companyOrInstitution: 'PT Telkom Akses / Witel Regional',
      status: 'completed',
      durationSeconds: data.durationSeconds,
      totalScore: data.totalScore,
      grade: data.grade,
      spliceLoss: data.spliceLoss,
      telkomCompliant: data.telkomCompliant ?? true,
      createdAt: Date.now(),
      completedAt: Date.now(),
    });
  }

  saveParticipantQueue(updated);
  return updated;
}

export function deleteParticipantFromQueue(id: string): ParticipantRecord[] {
  const current = loadParticipantQueue();
  const updated = current.filter((p) => p.id !== id);
  saveParticipantQueue(updated);
  return updated;
}

export function resetParticipantInQueue(id: string): ParticipantRecord[] {
  const current = loadParticipantQueue();
  const updated = current.map((p) => {
    if (p.id === id) {
      return {
        ...p,
        status: 'untested' as ParticipantTestStatus,
        durationSeconds: 0,
        totalScore: undefined,
        grade: undefined,
        spliceLoss: undefined,
        completedAt: undefined,
      };
    }
    return p;
  });
  saveParticipantQueue(updated);
  return updated;
}
