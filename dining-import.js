import { validateSummary } from './eaccounts-model.js';
const key = value => String(value || '').replace(/^\uFEFF/,'').toLowerCase().replace(/[^a-z0-9]/g,'');

export function parseDelimited(text) {
  const source = String(text).replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
  const firstLines = source.split('\n').slice(0,20).join('\n');
  const delimiter = firstLines.includes('\t') ? '\t' : firstLines.split(';').length > firstLines.split(',').length ? ';' : ',';
  const rows = []; let row = [], field = '', quoted = false;
  for (let i=0;i<source.length;i++) {
    const char=source[i];
    if (char==='"') {
      if (quoted && source[i+1]==='"') { field+='"';i++; }
      else if (quoted || !field.trim()) quoted=!quoted;
      else field+=char;
    } else if (!quoted && (char===delimiter || char==='\n')) {
      row.push(field.trim());field='';
      if (char==='\n') { if(row.some(Boolean))rows.push(row);row=[]; }
    } else field+=char;
    if (rows.length>100000) throw new Error('Use a file with fewer than 100,000 rows.');
  }
  if (quoted) throw new Error('A quoted CSV value is unfinished. Try exporting the file again.');
  row.push(field.trim());if(row.some(Boolean))rows.push(row);
  return rows;
}
export function normalizeLocation(value) {
  const clean=String(value||'').trim().replace(/\s+[A-Z]{2,8}(?:Web|Reg)\d+\w*$/i,'').replace(/\s+PCWS\d+$/i,'').replace(/\s+/g,' ').trim();
  const aliases={gingerandsoy:'Ginger and Soy',gingersoy:'Ginger and Soy',devilskrafthouse:'Devils Krafthouse',thedevilskrafthouse:'Devils Krafthouse',tandoor:'Tandor',tandor:'Tandor',twinnies:'Twinnies',redmango:'Red Mango',gothicgrill:'Gothic Grill',ilforno:'Il Forno',itsthyme:'Its Thyme',chefskitchen:'Chefs Kitchen',beyublue:'Beyu Blue'};
  return aliases[key(clean)] || clean;
}
function parseDate(value) {
  const text=String(value||'').trim();
  const iso=text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s]|$)/),us=text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s|$)/);
  const parts=iso?[+iso[1],+iso[2],+iso[3]]:us?[+us[3],+us[1],+us[2]]:null;
  if(!parts)return null;
  const [year,month,day]=parts,date=new Date(Date.UTC(year,month-1,day));
  if(year<1990||year>2100||date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return null;
  return date.toISOString().slice(0,10);
}
function parseCents(value) {
  const text=String(value||'').trim();
  if(/\b(?:EUR|GBP|CAD|AUD|JPY)\b|[€£¥]/i.test(text))throw new Error('Use a history export with amounts in USD.');
  const number=text.replace(/\bUSD\b/ig,'').replace(/[$,\s()]/g,'');
  if(!/^[+-]?\d+(?:\.\d{1,2})?$/.test(number))return null;
  const cents=Math.round(Math.abs(Number(number))*100);
  return Number.isSafeInteger(cents)&&cents<=1000000000?cents:null;
}
export function parseDiningImport(text) {
  if(String(text).trim().startsWith('{'))return {summary:validateSummary(JSON.parse(text)),ignoredRows:0};
  const rows=parseDelimited(text),headers={date:['datetime','date','transactiondate','transactiondatetime'],location:['location','merchant','restaurant'],type:['transactiontype','type'],amount:['amount','transactionamount'],account:['accountname','account']};
  const index=rows.findIndex(row=>['date','location','type','amount'].every(name=>row.some(cell=>headers[name].includes(key(cell)))));
  if(index<0)throw new Error('Include the table headings: Date/Time, Location, Transaction Type, and Amount. A copied eAccounts table works too.');
  const columns=Object.fromEntries(Object.entries(headers).map(([name,values])=>[name,rows[index].findIndex(cell=>values.includes(key(cell)))]));
  const locations=new Map(),dates=[];let purchases=0,grossCents=0,refundCount=0,refundCents=0,ignoredRows=0,sourceRows=0;
  for(const row of rows.slice(index+1)) {
    if(!row.some(Boolean))continue;
    if(headers.date.includes(key(row[columns.date]))){continue;}
    const type=key(row[columns.type]),account=columns.account<0?'':row[columns.account]||'',rawLocation=row[columns.location]||'';
    const purchase=['debit','purchase','sale'].includes(type),credit=['credit','refund','reversal'].includes(type);
    if(!purchase&&!credit){ignoredRows++;continue;}
    sourceRows++;
    if(account&&!/\b(?:food|flex|dining)\b/i.test(account)||/eprint|dukecard|eaccounts|top.?up|deposit|adjustment/i.test(rawLocation)){ignoredRows++;continue;}
    const date=parseDate(row[columns.date]),amount=parseCents(row[columns.amount]),name=normalizeLocation(rawLocation);
    if(!date||amount===null||!name||name.length>100)throw new Error('A dining row has an unreadable date, location, or amount. Use MM/DD/YYYY dates and USD amounts.');
    if(amount===0){ignoredRows++;continue;}
    dates.push(date);
    if(!locations.has(name))locations.set(name,{name,purchases:0,netCents:0});
    const place=locations.get(name);
    if(purchase){purchases++;grossCents+=amount;place.purchases++;place.netCents+=amount;}
    else{refundCount++;refundCents+=amount;place.netCents-=amount;}
  }
  if(!purchases)throw new Error('No dining purchases found. Include Food or Flex purchase rows from your eAccounts transaction history.');
  dates.sort();
  const summary=validateSummary({format:'meal-ledger-eaccounts-summary',version:1,from:dates[0],through:dates.at(-1),sourceRows,purchases,grossCents,refundCount,refundCents,netCents:grossCents-refundCents,locations:[...locations.values()],excludes:['Meal swipes','Printing','Deposits and transfers'],source:'Your imported transaction table. Only the rows supplied are counted. Register and online terminal suffixes are combined.'});
  return {summary,ignoredRows};
}
