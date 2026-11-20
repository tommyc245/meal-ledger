export function validateSummary(input) {
  if (!input || input.format !== 'meal-ledger-eaccounts-summary' || input.version !== 1 || !Array.isArray(input.locations) || !input.locations.length || input.locations.length > 500) throw new Error('Choose a Meal Ledger eAccounts summary JSON file.');
  const cents = value => Number.isSafeInteger(value) && Math.abs(value) <= 1000000000;
  const count = value => Number.isSafeInteger(value) && value >= 0 && value <= 1000000;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.from || '') || !/^\d{4}-\d{2}-\d{2}$/.test(input.through || '') || Number.isNaN(Date.parse(input.from)) || Number.isNaN(Date.parse(input.through)) || input.from > input.through) throw new Error('The summary needs a valid start and end date.');
  const locations = input.locations.map(row => {
    if (typeof row.name !== 'string' || !row.name.trim() || row.name.length > 100 || !count(row.purchases) || !cents(row.netCents)) throw new Error('A location row contains an invalid name, purchase count, or amount.');
    return { name: row.name.trim(), purchases: row.purchases, netCents: row.netCents };
  });
  if (!count(input.purchases) || !count(input.refundCount) || !count(input.sourceRows) || !cents(input.grossCents) || !cents(input.refundCents) || input.refundCents < 0 || !cents(input.netCents)) throw new Error('The summary totals are invalid.');
  if (locations.reduce((sum,row) => sum + row.purchases, 0) !== input.purchases || locations.reduce((sum,row) => sum + row.netCents, 0) !== input.netCents || input.grossCents - input.refundCents !== input.netCents) throw new Error('The location rows, gross charges, refunds, and totals do not reconcile.');
  if (input.sourceRows < input.purchases + input.refundCount) throw new Error('The reported source row count is too small.');
  return { format: input.format, version: 1, from: input.from, through: input.through, sourceRows: input.sourceRows, purchases: input.purchases, grossCents: input.grossCents, refundCount: input.refundCount, refundCents: input.refundCents, netCents: input.netCents, source: String(input.source || 'Imported eAccounts summary').slice(0, 400), excludes: (Array.isArray(input.excludes) ? input.excludes : []).filter(v => typeof v === 'string').map(v => v.slice(0,150)), locations };
}
export function rankedLocations(summary, sort = 'spend') {
  return [...summary.locations].sort((a,b) => (sort === 'visits' ? b.purchases - a.purchases : b.netCents - a.netCents) || a.name.localeCompare(b.name));
}
