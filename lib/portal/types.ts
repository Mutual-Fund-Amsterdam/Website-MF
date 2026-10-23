export type FundNumber = 1 | 2 | 3;
export type MemberTransaction = { fund: FundNumber; memberId: string; date: string; amount: number; nav: number; units: number; source: string };
export type FundHistoryPoint = { fund: FundNumber; date: string; nav: number; totalUnits: number };
export type FundValuePoint = { fund: FundNumber; date: string; nav: number; fundValue: number; coverage?: "verified" | "indicative" };
export type RiskMetrics = { asOf: string | null; sharpe: number | null; volatility: number | null; beta: number | null; maxDrawdown: number | null };

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
  marketSymbol?: string;
  sector?: string;
};

export type PricePoint = { date: string; close: number; adjustedClose?: number };
export type FxRate = { currency: string; perEuro: number; date: string };

export type DailyQuote = {
  symbol: string;
  exchange: string;
  currency: string;
  close: number;
  date: string;
};

export type DailyQuotes = {
  fetchedAt: string;
  prices: Record<string, DailyQuote>;
  history?: Record<string, PricePoint[]>;
  historyBackfilled?: string[];
  historyKeys?: string[];
  historyResolution?: "daily";
  historyAttemptedAt?: Record<string,string>;
  historyBackfillIssues?: string[];
  historyUpdatedAt?: string;
  dailyHistoryWindows?: Record<string,string>;
  benchmark?: { name: "S&P 500"; points: PricePoint[]; latest: PricePoint | null };
  fx?: Partial<Record<string, FxRate>>;
  eurUsdHistory?: PricePoint[];
  estrHistory?: PricePoint[];
  fxHistory?: Record<string, PricePoint[]>;
  fxHistoryKeys?: string[];
  historicalInstruments?: Position[];
  callBudget?: { month: string; used: number; limit: number; reserve: number };
};

export type Cash = {
  extraBalances?: Record<string,{amount:number;date:string}>;
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
  input?: {version:2|3;cutoff:string;events:Record<string,string>};
  schema: 1;
  digest: string;
  importedAt: string;
  requestedDate: string | null;
  members: Member[];
  positions: Position[];
  cash: Cash[];
  transactions?: MemberTransaction[];
  fundHistory?: FundHistoryPoint[];
  totalUnitsByFund?: Record<FundNumber, number>;
  risk?: Partial<Record<FundNumber, RiskMetrics>>;
  warnings: string[];
  ledger?: import("./ledger").ReconstructionLedger;
  ledgerStorage?: import("./ledger").LedgerStorage;
};

export type ImportSummary = {
  members: Record<FundNumber, number>;
  positions: Record<FundNumber, number>;
  cashDates: Record<FundNumber, string | null>;
  participationTotals: Record<FundNumber, number>;
  warnings: string[];
};
