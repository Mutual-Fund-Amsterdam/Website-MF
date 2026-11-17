import type { Member, Position, Snapshot } from "../types";

export type Instrument = Omit<Position, "fund" | "quantity">;
export type HistoryMember = { name: string; fund: number | null; period: string; source: string };
export type BookingInput = Record<string, string>;
export type Booking = {
  id: string;
  requestHash?: string;
  input: BookingInput;
  actor: string;
  at: string;
  label: string;
  member?: Member;
  destination?: Member;
  loginDigest?: string;
};
export type Administration = {
  schema: 1;
  audit: { id: string; actor: string; at: string; label: string }[];
  revision: string;
  baseDigest: string;
  base: Snapshot;
  bookings: Booking[];
  catalog: Instrument[];
  archive: HistoryMember[];
  updatedAt: string | null;
};
export type AdminView = {
  revision: string;
  baseDigest: string;
  publishedDigest: string;
  updatedAt: string | null;
  members: Omit<Member, "loginDigest">[];
  positions: Position[];
  cash: Snapshot["cash"];
  transactions: NonNullable<Snapshot["transactions"]>;
  trades: { date: string; fund: number; symbol: string; kind: string; quantity: number | null }[];
  units: Snapshot["totalUnitsByFund"];
  catalog: Instrument[];
  archive: HistoryMember[];
  bookings: { id: string; actor: string; at: string; label: string }[];
  audit: { id: string; actor: string; at: string; label: string }[];
};
export class AdminError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}
export const today = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Amsterdam" }).format(new Date());
export const labels: Record<string, string> = {
  cash: "Cashstand invoeren", trade: "Aandelentransactie", stock: "Aandeel toevoegen",
  join: "Lid inschrijven", close: "Lidmaatschap beëindigen", deposit: "Inleg boeken",
  withdraw: "Opname boeken", exit: "Volledig belang uitbetalen", switch: "Fondswissel",
  code: "Nieuwe lidcode uitgeven", history: "Historische transactie toevoegen",
  quote: "Slotkoers invoeren",
};
