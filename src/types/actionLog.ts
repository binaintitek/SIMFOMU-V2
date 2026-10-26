import { SplicingStep } from './fiber';

export type LogSeverity = 'info' | 'success' | 'warning' | 'error';

export interface ActionLogItem {
  id: string;
  timestamp: string; // e.g. "14:22:05"
  rawTime?: number;
  step: SplicingStep;
  message: string;
  detail?: string;
  severity: LogSeverity;
  dataBadge?: string; // e.g. "30mm", "0.4°", "0.02 dB"
}

export type AddActionLogFn = (
  message: string,
  options?: {
    step?: SplicingStep;
    severity?: LogSeverity;
    detail?: string;
    dataBadge?: string;
  }
) => void;
