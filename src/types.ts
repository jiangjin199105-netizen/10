export interface DrawRecord {
  period: string;
  result: number[] | string;
  time: string;
  sum?: number;
  bigSmall?: string;
  oddEven?: string;
}

export interface MacroConfig {
  numCoords: Record<number, string>;
  keypadCoords: Record<number, string>;
  keypadClear: string;
  keypadConfirm: string;
  amountInput: string;
  submitBet: string;
  betSteps: number[];
}

export interface AppSettings {
  macroHelper: boolean;
  macroConfig?: MacroConfig;
  autoRefreshInterval: number;
  bettingRounds: 4 | 6 | 9 | 12;
  predictionLogic: 'logic1' | 'logic2' | 'logic3' | 'logic4' | 'logic5';
}

export interface Recommendation {
  period: string; // The period being predicted
  basedOnPeriod: string; // The latest period used for analysis
  recommendedNumbers: number[];
  status: 'pending' | 'won' | 'lost';
  actualChampion?: number;
  patternType: string;
  createTime: number;
  bettingStep: number; // Current step in the betting sequence (e.g., 1-4 or 1-6)
  profit?: number;
}
