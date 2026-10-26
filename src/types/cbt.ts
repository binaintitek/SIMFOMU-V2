export type CBTTestType = 'pre-test' | 'post-test';

export interface CBTQuestion {
  id: string;
  question: string;
  options: string[]; // 4 choices (A, B, C, D)
  correctAnswer: number; // 0 for A, 1 for B, 2 for C, 3 for D
  explanation: string; // Detailed SOP explanation in field operations
  category: 'dasar-fiber' | 'preparasi' | 'cleaving' | 'splicing' | 'k3-safety' | 'otdr-troubleshooting';
  referenceStd?: string; // e.g., 'ITU-T G.652.D', 'STEL-L-040 Telkom', 'Telkom Akses QA'
}

export interface CBTAnswerRecord {
  questionId: string;
  selectedAnswer: number; // -1 if unanswered, 0..3 for options
  isCorrect: boolean;
}

export interface CBTSessionResult {
  sessionId: string;
  participantName: string;
  participantId: string;
  testType: CBTTestType;
  score: number; // Scale 0 - 100
  correctCount: number;
  totalQuestions: number;
  answers: CBTAnswerRecord[];
  durationSeconds: number;
  completedAt: string; // ISO string
  formattedDate: string;
}

export interface CBTTraineeComparison {
  participantName: string;
  preTestScore: number | null;
  postTestScore: number | null;
  scoreDelta: number | null; // postTestScore - preTestScore
  hasPreTest: boolean;
  hasPostTest: boolean;
  lastPreTestDate?: string;
  lastPostTestDate?: string;
}
