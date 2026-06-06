export type LeaveType = 'CL' | 'SL' | 'EL';

export interface LeaveRecord {
  id: string;
  startDate: string;
  endDate: string;
  type: LeaveType;
  days: number;
  reason: string;
}

export interface AccrualBlock {
  index: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  creditDate: string; // YYYY-MM-DD
}

export interface LeaveBalances {
  CL: {
    available: number;
    credited: number;
    used: number;
  };
  SL: {
    available: number;
    credited: number;
    used: number;
  };
  EL: {
    available: number;
    credited: number;
    used: number;
    accruedBlocksCount: number;
    carryForwarded: number;
  };
}
