import { SplicingStep } from './fiber';

export type EquipmentFailureType = 
  | 'low_battery'
  | 'dull_cleaver'
  | 'dirty_electrode'
  | 'dusty_vgroove'
  | 'heater_fault';

export type FailureProbability = 'low' | 'medium' | 'high' | 'always';

export interface ActiveEquipmentIncident {
  id: string;
  type: EquipmentFailureType;
  title: string;
  description: string;
  code: string;
  sopInstruction: string;
  stepTriggered: SplicingStep;
  mitigationButtonLabel: string;
  timestamp: number;
}

export interface EquipmentHealthState {
  splicerBatteryLevel: number; // 0 - 100%
  splicerIsCharging: boolean;
  cleaverBladePosition: number; // 1 - 16
  cleaverBladeCondition: 'sharp' | 'worn';
  electrodesCondition: 'clean' | 'oxidized';
  vGrooveCondition: 'clean' | 'dusty';
  heaterCondition: 'ready' | 'fault';
  activeFailure: ActiveEquipmentIncident | null;
  resolvedFailuresCount: number;
}
