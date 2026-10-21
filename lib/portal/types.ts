export type FundNumber = 1 | 2 | 3;

export type Member = {
  key: string;
  id: string;
  name: string;
  fund: FundNumber;
  role: string;
  allowedFunds: FundNumber[];
  active: boolean;
  loginDigest: string;
  participation: number | null;
  firstEntry: string | null;
  lastTransaction: string | null;
  sourceValue: number | null;
  deposits: number | null;
  withdrawals: number | null;
};

export type Position = {
  fund: FundNumber;
  ticker: string;
  name: string;
  quantity: number;
  currency: string;
  exchange: string;
  isin: string;
  tradingViewSymbol: string;
};

export type Cash = {
  fund: FundNumber;
  ingEur: number | null;
  ingAsOf: string | null;
  brokerEur: number | null;
  brokerUsd: number | null;
  brokerCad: number | null;
  brokerAsOf: string | null;
  otherEur: number | null;
  otherAsOf: string | null;
};

export type Snapshot = {
  schema: 1;
  digest: string;
  importedAt: string;
  requestedDate: string | null;
  members: Member[];
  positions: Position[];
  cash: Cash[];
  warnings: string[];
};

export type ImportSummary = {
  members: Record<FundNumber, number>;
  positions: Record<FundNumber, number>;
  cashDates: Record<FundNumber, string | null>;
  participationTotals: Record<FundNumber, number>;
  warnings: string[];
};
