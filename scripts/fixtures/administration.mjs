// Entirely fictitious. No production credentials or source workbooks.
export const fixturePepper = 'fictitious-administration-test-pepper-2026-only';
export const fixtureEncryptionKey = 'b7'.repeat(32);
export const fixtureCode = 'Fictief-bestuur-2026!';
export async function fixture() {
  const { codeDigest } = await import('../../lib/portal/workbook.ts');
  const snapshot = { schema: 1, digest: 'a'.repeat(64), importedAt: '2026-11-01T12:00:00Z', requestedDate: '2026-11-01', warnings: ["Fictieve lokale controleomgeving"],
    members: [], positions: [], transactions: [], fundHistory: [], totalUnitsByFund: { 1: 20, 2: 20, 3: 20 },
    unitLedger: { version: 1, asOf: { 1: '2026-11-01', 2: '2026-11-01', 3: '2026-11-01' } },
    cash: [1, 2, 3].map(fund => ({ fund, ingEur: 1000, ingAsOf: '2026-11-01', brokerEur: 2000, brokerUsd: 500, brokerCad: 0, brokerAsOf: '2026-11-01', otherEur: 0, otherAsOf: '2026-11-01' })),
    ledger: { bank: [], broker: [], members: [] } };
  for (const fund of [1, 2, 3]) {
    snapshot.positions.push({ fund, ticker: 'DEMO', name: 'Fictief aandeel', quantity: 10, currency: 'EUR', exchange: 'Euronext Amsterdam', isin: '', marketSymbol: 'DEMO.XAMS', tradingViewSymbol: 'EURONEXT:DEMO', sector: 'Industrie' });
    for (const i of [1, 2]) {
      const id = `F${fund}-00${i}`, role = i === 1 && fund < 3 ? 'Hoofdbestuurder' : 'Lid';
      snapshot.members.push({ key: `${fund}:${id}`, id, name: `Fictief ${role} ${fund}-${i}`, fund, role, allowedFunds: role === 'Hoofdbestuurder' ? [1, 2, 3] : [fund], active: true, loginDigest: codeDigest(id, fixtureCode, fixturePepper), participation: .5, firstEntry: '2026-10-01', lastTransaction: '2026-10-01', sourceValue: 1000, deposits: 1000, withdrawals: 0 });
      snapshot.transactions.push({ fund, memberId: id, date: '2026-10-01', amount: 1000, nav: 100, units: 10, source: 'Fictieve beginstand' });
    }
  }
  return snapshot;
}
