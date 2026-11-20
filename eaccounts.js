import { validateSummary, rankedLocations } from './eaccounts-model.js';
const $ = s => document.querySelector(s);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = cents => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
const shortDate = value => new Date(value+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const hosted = $('meta[name="meal-ledger-mode"]')?.content === 'browser';
const namespace = () => hosted ? localStorage.getItem('meal-ledger-workspace') || 'imports' : 'local';
let summary = null, active = false, sort = 'spend', publicDefault = false;
const database = await new Promise((resolve,reject) => {
  const request = indexedDB.open('meal-ledger-card-history',1);
  request.onupgradeneeded = () => request.result.createObjectStore('summaries');
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(new Error('Browser storage is unavailable.'));
}).catch(() => null);
async function readSummary() {
  if(database) {
    const value = await new Promise((resolve,reject) => { const request=database.transaction('summaries').objectStore('summaries').get(namespace()); request.onsuccess=()=>resolve(request.result); request.onerror=()=>reject(request.error); }).catch(()=>null);
    try { if(value){ publicDefault=false; return validateSummary(value); } } catch {}
  }
  if(!hosted)return null;
  try {
    const response=await fetch(new URL('./eaccounts-summary.json',import.meta.url),{cache:'no-cache'});
    if(!response.ok)return null;
    const value=validateSummary(await response.json());publicDefault=true;return value;
  }catch{return null;}
}
async function saveSummary(value) {
  if(!database) throw new Error('Enable browser site storage before importing.');
  await new Promise((resolve,reject) => { const transaction=database.transaction('summaries','readwrite'); transaction.objectStore('summaries').put(value,namespace()); transaction.oncomplete=resolve; transaction.onerror=()=>reject(transaction.error); });
}
function notify(message) {
  const target=$('#toast'); if(!target) return; target.textContent=message; target.classList.add('visible'); setTimeout(()=>target.classList.remove('visible'),6000);
}
function useRealData() { localStorage.setItem('meal-ledger-demo','false'); $('#demo-exit')?.click(); }
function download(contents,type,name) {
  const url=URL.createObjectURL(new Blob([contents],{type})),link=document.createElement('a'); link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function stat(label,value,note) {
  return '<div class="stat-card"><div class="stat-top">'+label+'</div><div class="stat-value">'+value+'</div><div class="stat-note">'+note+'</div></div>';
}
function rankingPanel(metric, title, note) {
  const rows=rankedLocations(summary,metric).slice(0,7), leader=rows[0];
  const value=row=>metric==='visits'?row.purchases:row.netCents;
  const label=row=>metric==='visits'?row.purchases.toLocaleString()+' visits':money(row.netCents);
  const maximum=Math.max(1,...rows.map(value));
  return '<section class="panel place-ranking" data-ranking="'+metric+'"><div class="panel-head"><div><h2>'+title+'</h2><p class="panel-subtitle">'+note+'</p></div></div><div class="place-leader"><span class="coverage-label">'+(metric==='visits'?'YOUR MOST VISITED':'YOUR TOP SPENDING SPOT')+'</span><h3>'+escape(leader.name)+'</h3><strong>'+label(leader)+'</strong></div><div class="card-bars">'+rows.map((row,index)=>'<div class="card-bar-row"><div><span><small>'+String(index+1).padStart(2,'0')+'</small> '+escape(row.name)+'</span><strong>'+label(row)+'</strong></div><div class="rank-bar"><i style="width:'+Math.max(0,value(row)/maximum*100)+'%;background:'+(index?'#afc48d':'#385f40')+'"></i></div></div>').join('')+'</div></section>';
}
function render() {
  active=true;
  document.querySelectorAll('.nav-item').forEach(button=>button.classList.remove('active'));
  $('#eaccounts-nav').classList.add('active');
  $('.sidebar')?.classList.remove('open');
  $('#page-title').textContent='Your dining places.';
  $('#page-description').textContent='Where you spend the most. Where you stop the most. Mobile and in-person purchases together.';
  $('#breadcrumb').textContent='Dining places';
  if(hosted) $('.local-status').innerHTML='<i></i> '+(publicDefault?'Shared dining summary':'Private browser storage');
  for(const selector of ['#toolbar','#history-coverage','#demo-banner','#connect-button']) $(selector)?.classList.add('hidden');
  const input='<input type="file" accept=".json,application/json" data-eaccounts-file hidden>';
  if(!summary) {
    $('#content').innerHTML='<div class="panel empty-state"><h2>Bring your card history to the table</h2><p>Import your eAccounts summary to see restaurant visits and spending, including in-person purchases. Your receipt meal rankings stay on Mobile orders.</p><button class="button primary" data-eaccounts-action="import">Import eAccounts summary</button>'+input+'<p class="muted">The file stays in this browser. No Duke password is needed.</p></div>';
    return;
  }
  const rows=rankedLocations(summary,sort);
  $('#content').innerHTML=
    '<section class="history-coverage"><div class="coverage-main"><span class="coverage-label">'+(publicDefault?'Public eAccounts summary':'Your eAccounts summary')+'</span><span>'+shortDate(summary.from)+' – '+shortDate(summary.through)+'</span></div><p class="card-source-note">'+(publicDefault?'This is the site owner’s shared summary. Import your own summary to view your purchases here. ':'')+'Card totals already include mobile purchases. Visit counts use purchase transactions; multiple purchases during one stop count separately. This is a saved snapshot.</p></section>'+
    '<section class="stats-grid" aria-label="eAccounts summary">'+
      stat('Dining purchases',summary.purchases.toLocaleString(),'Purchase count excludes refunds')+
      stat('Dining locations',summary.locations.length,'Registers combined by location')+
      stat('Net card spending',money(summary.netCents),'Gross '+money(summary.grossCents)+' less refunds')+
      stat('Refunds',money(summary.refundCents),summary.refundCount+' refunds already subtracted')+
    '</section>'+
    '<div class="card-actions"><div class="segmented" aria-label="Rank restaurants"><button data-eaccounts-action="sort-spend" class="'+(sort==='spend'?'selected':'')+'">By spending</button><button data-eaccounts-action="sort-visits" class="'+(sort==='visits'?'selected':'')+'">By purchases</button></div><div class="card-action-buttons"><button class="button" data-eaccounts-action="export">Export locations</button><button class="button" data-eaccounts-action="backup">Download summary</button><button class="button" data-eaccounts-action="import">'+(publicDefault?'Import my own summary':'Replace my summary')+'</button></div></div>'+
    '<div class="place-rankings">'+rankingPanel('spend','Most money spent','Ranked by net card spending')+rankingPanel('visits','Most times visited','Ranked by purchase transactions')+'</div>'+
    '<section class="panel card-coverage"><details><summary>What this history covers</summary><p>Dining dollars and Flex purchases, grouped across each location’s registers and online terminals. Refunds are subtracted from spending. Mobile receipt totals are tracked separately and never added again.</p><p><strong>Excluded:</strong> '+summary.excludes.map(escape).join(', ')+'.</p><p>'+escape(summary.source)+'</p><p>'+summary.sourceRows+' reported source rows; '+summary.purchases+' dining purchases and '+summary.refundCount+' refunds included.</p></details></section>'+
    '<section class="panel recent-panel"><div class="panel-head"><div><h2>Every dining location</h2><p class="panel-subtitle">Net amounts include refunds</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>LOCATION</th><th>PURCHASES</th><th>NET SPENT</th><th>NET PER PURCHASE</th></tr></thead><tbody>'+
    rows.map(row=>'<tr><td>'+escape(row.name)+'</td><td>'+row.purchases+'</td><td>'+money(row.netCents)+'</td><td>'+(row.purchases?money(Math.round(row.netCents/row.purchases)):'—')+'</td></tr>').join('')+
    '</tbody><tfoot><tr><td>Total</td><td>'+summary.purchases+'</td><td>'+money(summary.netCents)+'</td><td>'+money(Math.round(summary.netCents/Math.max(1,summary.purchases)))+'</td></tr></tfoot></table></div></section>'+input;
  $('#footer-status').textContent=summary.purchases+' dining purchases · '+(publicDefault?'Public shared summary':hosted?'Saved in this browser':'Private local summary');
}
document.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(!button)return;
  const action=button.dataset.eaccountsAction;
  if(!action) {
    if(active&&button.dataset.view){active=false;$('#eaccounts-nav')?.classList.remove('active');$('#connect-button')?.classList.remove('hidden');}
    return;
  }
  event.preventDefault();event.stopImmediatePropagation();
  if(action==='open'){if(location.hash!=='#dining-places')history.pushState({},'','#dining-places');render();return;}
  if(action==='import'){$('[data-eaccounts-file]').click();return;}
  if(action==='sort-spend'||action==='sort-visits'){sort=action==='sort-spend'?'spend':'visits';render();return;}
  if(!summary)return;
  if(action==='backup'){download(JSON.stringify(summary,null,2),'application/json','meal-ledger-eaccounts-summary.json');return;}
  if(action==='export'){
    const values=[['Location','Purchases','Net spent USD'],...rankedLocations(summary,sort).map(row=>[row.name,row.purchases,(row.netCents/100).toFixed(2)])];
    const csv='\ufeff'+values.map(row=>row.map(value=>{let text=String(value);if(/^[=+@\-\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}).join(',')).join('\r\n');
    download(csv,'text/csv;charset=utf-8','meal-ledger-eaccounts-locations.csv');
  }
},true);
document.addEventListener('change',async event=>{
  if(!event.target.matches('[data-eaccounts-file]'))return;
  const file=event.target.files[0];if(!file)return;
  try {
    if(file.size>2*1024*1024)throw new Error('Choose a summary file under 2 MB.');
    const parsed=validateSummary(JSON.parse(await file.text()));await saveSummary(parsed);summary=parsed;publicDefault=false;
    $('#eaccounts-count').textContent=String(summary.purchases);useRealData();render();notify('eAccounts summary imported. Receipt totals are kept separate.');
  }catch(error){notify(error.message||'The summary could not be imported.');}
});
async function ready() {
  if(!$('#content')||$('#content .loading')) await new Promise(resolve=>{
    const observer=new MutationObserver(()=>{if($('#content')&&!$('#content .loading')){observer.disconnect();resolve();}});
    observer.observe(document.documentElement,{childList:true,subtree:true});
  });
  const styles=document.createElement('style');
  styles.textContent='.card-actions{display:flex;gap:15px;justify-content:space-between;align-items:center;margin:0 0 22px;flex-wrap:wrap}.card-action-buttons{display:flex;gap:8px;flex-wrap:wrap}.card-source-note{margin:10px 0 0;font-size:11px;color:#7b896d;line-height:1.8}.card-bars{padding:18px 23px 25px}.card-bar-row{padding:12px 0}.card-bar-row>div:first-child{display:flex;justify-content:space-between;gap:15px;font-size:12px;color:#5b744c}.card-bar-row strong{font-weight:550;white-space:nowrap}.card-bar-row .rank-bar{height:5px;margin-top:10px}.data-table tfoot td{background:#f3f6ed;font-weight:600;border-top:1px solid #e1e9d6}.card-actions .button{font-size:10px}@media(max-width:650px){.card-actions{align-items:flex-start}.card-bars{padding:13px 18px 20px}.card-bar-row>div:first-child{font-size:11px}.card-source-note{font-size:10px}}';
  document.head.append(styles);
  const button=document.createElement('button');button.id='eaccounts-nav';button.className='nav-item';button.dataset.eaccountsAction='open';
  button.innerHTML='<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M7 15h4"/></svg>Dining places<span class="nav-count" id="eaccounts-count"></span>';
  $('nav[aria-label="Main navigation"]')?.prepend(button);
  summary=await readSummary();
  $('#eaccounts-count').textContent=summary?String(summary.purchases):'';
  if(summary)useRealData();
  if(location.hash==='#dining-places'||(!location.hash&&hosted&&$('#breadcrumb')?.textContent!=='Connections')) {
    history.replaceState({},'','#dining-places');render();
  }
  document.addEventListener('meal-ledger:mobile',()=>{active=false;$('#eaccounts-nav')?.classList.remove('active');$('#connect-button')?.classList.remove('hidden');});
  document.addEventListener('meal-ledger:rendered',()=>{if(active)render();});
  window.addEventListener('hashchange',()=>{if(location.hash==='#dining-places')render();});
}
await ready();
