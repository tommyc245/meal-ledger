import { parseDiningImport } from './dining-import.js';
import { getDataMode, setDataMode, readDiningSummary, saveDiningSummary } from './workspace-data.js';
import { validateSummary, rankedLocations } from './eaccounts-model.js';
const $ = s => document.querySelector(s);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = cents => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
const shortDate = value => new Date(value+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const hosted = $('meta[name="meal-ledger-mode"]')?.content === 'browser';
let summary = null, active = false, sort = 'spend', publicDefault = false;
async function readSummary() {
  if(getDataMode()!=='shared'){
    const value=await readDiningSummary().catch(()=>null);
    try{if(value){const valid=validateSummary(value);if(!getDataMode())setDataMode('personal');publicDefault=false;return valid;}}catch{}
    if(getDataMode()==='personal'){publicDefault=false;return null;}
  }
  if(!hosted)return null;
  try{const response=await fetch(new URL('./eaccounts-summary.json',import.meta.url),{cache:'no-cache'});if(!response.ok)return null;const value=validateSummary(await response.json());publicDefault=true;return value;}catch{return null;}
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
  return '<section class="panel place-ranking" data-ranking="'+metric+'"><div class="panel-head"><div><h2>'+title+'</h2><p class="panel-subtitle">'+note+'</p></div></div><div class="place-leader"><span class="coverage-label">'+(metric==='visits'?'YOUR MOST VISITED':'YOUR TOP SPENDING SPOT')+'</span><h3>'+escape(leader.name)+'</h3><strong>'+label(leader)+'</strong></div><div class="card-bars">'+rows.map((row,index)=>'<div class="card-bar-row"><div><span><small>'+String(index+1).padStart(2,'0')+'</small> '+escape(row.name)+'</span><strong>'+label(row)+'</strong></div><div class="rank-bar"><i style="width:'+Math.max(0,value(row)/maximum*100)+'%;background:'+(index?'#00539B':'#012169')+'"></i></div></div>').join('')+'</div></section>';
}
function render() {
  active=true;
  document.querySelectorAll('.nav-item').forEach(button=>button.classList.remove('active'));
  $('#eaccounts-nav').classList.add('active');
  if($('#tools-menu'))$('#tools-menu').open=false;
  $('#page-title').textContent='Dining places';
  $('#page-description').textContent='Your campus favorites, from mobile and in-person purchases.';
  $('#breadcrumb').textContent='Dining places';
  for(const selector of ['#toolbar','#history-coverage','#demo-banner','#connect-button'])$(selector)?.classList.add('hidden');
  const input='<input type="file" accept=".csv,.tsv,.txt,.json" data-eaccounts-file hidden>';
  if(!summary){
    $('#content').innerHTML='<section class="panel empty-state"><h2>Add your dining history</h2><p>Import an eAccounts summary to see your most visited places.</p><button class="button primary" data-eaccounts-action="import">Import dining summary</button>'+input+'</section>';
    return;
  }
  const rows=rankedLocations(summary,'spend');
  $('#content').innerHTML=
    '<div class="page-period"><span>'+(publicDefault?'Public eAccounts summary':'Your dining summary')+'</span><span>'+shortDate(summary.from)+' – '+shortDate(summary.through)+'</span></div>'+
    '<section class="stats-grid dining-stats" aria-label="Dining summary">'+stat('Dining locations',summary.locations.length,'Registers combined by location')+stat('Dining visits',summary.purchases.toLocaleString(),'Based on purchase transactions')+'</section>'+
    '<div class="place-rankings">'+rankingPanel('spend','Most money spent','Your top places by spending')+rankingPanel('visits','Most times visited','Your most frequent stops')+'</div>'+
    '<details class="panel all-locations"><summary>All '+summary.locations.length+' dining locations</summary><div class="table-wrap"><table class="data-table"><thead><tr><th>LOCATION</th><th>VISITS</th><th>SPENT</th></tr></thead><tbody>'+
    rows.map(row=>'<tr><td>'+escape(row.name)+'</td><td>'+row.purchases+'</td><td>'+money(row.netCents)+'</td></tr>').join('')+'</tbody></table></div></details>'+
    '<div class="quiet-summary"><span>Visits count purchases, so several purchases in one stop count separately.</span><span class="dining-spending">Total spent '+money(summary.netCents)+'</span></div>'+
    '<details class="data-notes"><summary>About this data</summary><p>'+escape(summary.source)+'</p><p>Saved summary, including mobile and in-person purchases. Mobile totals are never added again. Excludes '+summary.excludes.map(escape).join(', ')+'.</p></details>'+input;
  $('#footer-status').textContent=publicDefault?'Shared dining history · USD':'Your dining history · USD';
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
  if(action==='open'){if(location.hash!=='#dining-places')history.pushState({},'','#dining-places');render();window.scrollTo(0,0);return;}
  if(action==='import'){document.dispatchEvent(new CustomEvent('meal-ledger:upload-open',{detail:{kind:'dining'}}));return;}
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
    if(file.size>10*1024*1024)throw new Error('Choose a dining file under 10 MB.');
    const {summary:parsed}=parseDiningImport(await file.text());await saveDiningSummary(parsed);setDataMode('personal');summary=parsed;publicDefault=false;
    $('#eaccounts-count').textContent=String(summary.purchases);useRealData();render();notify('eAccounts summary imported. Receipt totals are kept separate.');
  }catch(error){notify(error.message||'The summary could not be imported.');}
});
async function ready() {
  if(!$('#content')||$('#content .loading')) await new Promise(resolve=>{
    const observer=new MutationObserver(()=>{if($('#content')&&!$('#content .loading')){observer.disconnect();resolve();}});
    observer.observe(document.documentElement,{childList:true,subtree:true});
  });
  const button=document.createElement('button');button.id='eaccounts-nav';button.className='nav-item';button.dataset.eaccountsAction='open';
  button.innerHTML='Dining places<span class="nav-count hidden" id="eaccounts-count"></span>';
  $('nav[aria-label="Main navigation"]')?.prepend(button);
  const initialMode=getDataMode();summary=await readSummary();if(initialMode!==getDataMode())summary=await readSummary();
  $('#eaccounts-count').textContent=summary?String(summary.purchases):'';
  if(summary)useRealData();
  if(location.hash==='#dining-places'||(!location.hash&&hosted&&$('#breadcrumb')?.textContent!=='Connections')) {
    history.replaceState({},'','#dining-places');render();
  }
  document.addEventListener('meal-ledger:mobile',()=>{active=false;$('#eaccounts-nav')?.classList.remove('active');$('#connect-button')?.classList.remove('hidden');});
  document.addEventListener('meal-ledger:rendered',()=>{if(active)render();});
  window.addEventListener('hashchange',()=>{if(location.hash==='#dining-places')render();});
}
document.addEventListener('meal-ledger:data-changed',event=>{
  summary=event.detail?.summary ? validateSummary(event.detail.summary) : null;publicDefault=false;
  if($('#eaccounts-count'))$('#eaccounts-count').textContent=summary?String(summary.purchases):'';
  if(event.detail?.page==='dining'){
    if(location.hash!=='#dining-places')history.pushState({},'','#dining-places');
    render();window.scrollTo(0,0);
  }else if(active)render();
});
await ready();
