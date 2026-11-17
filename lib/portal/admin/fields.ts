import type { BookingInput } from "./model";
const fields: Record<string, string[]> = {
  cash: ["bank", "currency", "amount"], trade: ["ticker", "side", "quantity", "price", "fee", "settlementCurrency", "rate", "newStock"],
  stock: ["ticker", "name", "exchange", "currency", "sector"], join: ["name", "amount", "nav"],
  close: ["member"], deposit: ["member", "amount", "nav"], withdraw: ["member", "amount", "nav"],
  exit: ["member", "nav"], switch: ["member", "amount", "nav", "targetFund", "targetNav"], code: ["member"],
  history: ["ticker", "side", "quantity", "price", "currency", "broker"], quote: ["ticker", "price"],
};
export function normalizeInput(input: BookingInput): BookingInput {
  const allowed = ["type", "fund", "date", ...(fields[input.type] || []), ...(input.type === "trade" && input.newStock === "1" ? fields.stock : [])];
  return Object.fromEntries(allowed.filter(k => input[k] !== undefined && input[k] !== "").map(k => [k, input[k]]));
}
