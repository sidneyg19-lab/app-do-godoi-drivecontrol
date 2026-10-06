const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let all=[], charts={}, config={metaDiaria:200,metaMensal:4400,reservaKm:.12};
const money=n=>(+n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const num=n=>+n||0;
const api=()=>localStorage.getItem('dc_api')||'';
const toast=t=>{let e=$('#toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2500)};
function duration(a,b){if(!a||!b)return 0;let [h,m]=a.split(':').map(Number),[h2,m2]=b.split(':').map(Number),x=h2*60+m2-(h*60+m);if(x<0)x+=1440;return x/60}
function calc(r){r={...r};r.uber=num(r.uber);r.noventaNove=num(r.noventaNove);r.extras=num(r.extras);r.combustivel=num(r.combustivel);r.lavagem=num(r.lavagem);r.estacionamento=num(r.estacionamento);r.manutencao=num(r.manutencao);r.outros=num(r.outros);r.kmInicial=num(r.kmInicial);r.kmFinal=num(r.kmFinal);r.horas=num(r.horas)||duration(r.inicio,r.fim);r.km=num(r.km)||Math.max(0,r.kmFinal-r.kmInicial);r.receita=r.uber+r.noventaNove+r.extras;r.despesas=r.combustivel+r.lavagem+r.estacionamento+r.manutencao+r.outros;r.lucro=r.receita-r.despesas;r.lucroReal=r.lucro-r.km*num(config.reservaKm);return r}
async function call(action,payload={}){if(!api())throw Error('Configure a URL do Apps Script em Metas.');let res=await fetch(api(),{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,...payload})});return await res.json()}
async function load(){if(!api()){setConn(false);render();return}try{let x=await call('list');all=(x.rows||[]).map(calc);if(x.config)config={...config,...x.config};vehicle=x.vehicle||{};maintenances=x.maintenances||[];setConn(true);fillConfig();fillYears();render();renderVehicle();renderFun()}catch(e){setConn(false);toast('Falha ao conectar: '+e.message)}}
function setConn(ok){$('#dot').classList.toggle('on',ok);$('#status').textContent=ok?'Google Sheets conectado':'API não conectada';const f=$('#apiFriendlyStatus');if(f)f.textContent=ok?'🟢 Base conectada':'🔴 Base não conectada';const ed=$('#apiEditor');if(ed&&ok)ed.classList.add('api-hidden')}
function fillYears(){let s=$('#fAno'),v=s.value,ys=[...new Set(all.map(x=>String(x.data||'').slice(0,4)).filter(Boolean))].sort().reverse();s.innerHTML='<option value="">Todos</option>'+ys.map(y=>`<option>${y}</option>`).join('');s.value=v}
function filtered(){return all.filter(r=>{let d=new Date((r.data||'')+'T12:00:00');return(!$('#fAno').value||d.getFullYear()==$('#fAno').value)&&(!$('#fMes').value||d.getMonth()+1==$('#fMes').value)&&(!$('#fPlat').value||r.plataforma==$('#fPlat').value)&&(!$('#fDia').value||d.toLocaleDateString('pt-BR',{weekday:'long'})==$('#fDia').value)})}
function sum(a,k){return a.reduce((s,x)=>s+num(x[k]),0)}
function render(){let a=filtered().map(calc),rec=sum(a,'receita'),des=sum(a,'despesas'),luc=sum(a,'lucro'),hrs=sum(a,'horas'),km=sum(a,'km'),days=new Set(a.map(x=>x.data)).size||0;
$('#heroLucro').textContent=money(sum(a,'lucroReal'));$('#kReceita').textContent=money(rec);$('#kLucro').textContent=money(luc);$('#kDesp').textContent=money(des);$('#kHoras').textContent=hrs.toFixed(1)+'h';$('#kKm').textContent=km.toFixed(0)+' km';let real=sum(a,'lucroReal');$('#kHora').textContent=money(hrs?real/hrs:0);$('#kKmR').textContent=money(km?real/km:0);$('#kMedia').textContent=money(days?real/days:0);$('#metaDiariaLabel').textContent=money(config.metaDiaria);
let pct=config.metaMensal?Math.max(0,real/config.metaMensal*100):0;$('#goalText').textContent=pct.toFixed(0)+'% de '+money(config.metaMensal);$('#goalBar').style.width=Math.min(100,pct)+'%';
renderTable(a);renderCharts(a);renderRank(a);renderVehicle();renderFun();renderIntelligence()}
function chart(id,type,data,options={}){if(charts[id])charts[id].destroy();charts[id]=new Chart($(id),{type,data,options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#8da6bd',boxWidth:10}}},scales:type==='doughnut'?{}:{x:{ticks:{color:'#6f8aa4'},grid:{display:false}},y:{ticks:{color:'#6f8aa4'},grid:{color:'#15304a'}}},...options}})}
function renderCharts(a){let daily={};a.forEach(r=>{daily[r.data]??={r:0,l:0};daily[r.data].r+=r.receita;daily[r.data].l+=r.lucro});let ds=Object.keys(daily).sort();
chart('#chartDaily','bar',{labels:ds.map(x=>x.slice(8,10)+'/'+x.slice(5,7)),datasets:[{label:'Receita',data:ds.map(x=>daily[x].r),borderRadius:6},{label:'Lucro',data:ds.map(x=>daily[x].l),type:'line',tension:.35}]});
chart('#chartExpenses','doughnut',{labels:['Combustível','Lavagem','Estac./Pedágio','Manutenção','Outros'],datasets:[{data:['combustivel','lavagem','estacionamento','manutencao','outros'].map(k=>sum(a,k)),borderWidth:0}]},{cutout:'68%'});
chart('#chartApps','bar',{labels:['Uber','99','Extras'],datasets:[{label:'Receita',data:[sum(a,'uber'),sum(a,'noventaNove'),sum(a,'extras')],borderRadius:8}]})}
function renderRank(a){let g={};a.forEach(r=>{let d=new Date(r.data+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long'});g[d]??={l:0,h:0};g[d].l+=r.lucroReal;g[d].h+=r.horas});let x=Object.entries(g).map(([d,v])=>[d,v.h?v.l/v.h:0]).sort((a,b)=>b[1]-a[1]).slice(0,5);$('#ranking').innerHTML=x.length?x.map((v,i)=>`<div class="rank"><i>${i+1}</i><div><b>${v[0]}</b><br><small>rentabilidade por hora</small></div><strong>${money(v[1])}/h</strong></div>`).join(''):'<p class="hint">Cadastre seus primeiros dias para gerar o ranking.</p>'}
function renderTable(a){$('#tbody').innerHTML=[...a].sort((x,y)=>String(y.data).localeCompare(String(x.data))).map(r=>`<tr><td>${r.data?.split('-').reverse().join('/')||''}</td><td>${r.plataforma||''}</td><td>${r.horas.toFixed(1)}h</td><td>${r.km.toFixed(0)}</td><td>${money(r.receita)}</td><td>${money(r.despesas)}</td><td class="profit">${money(r.lucro)}</td><td>${money(r.horas?r.lucro/r.horas:0)}</td></tr>`).join('')}
function fillConfig(){let f=$('#formConfig');f.metaDiaria.value=config.metaDiaria;f.metaMensal.value=config.metaMensal;f.reservaKm.value=config.reservaKm}
$$('.nav').forEach(b=>b.onclick=()=>{$$('.nav').forEach(x=>x.classList.remove('active'));b.classList.add('active');$$('.page').forEach(x=>x.classList.remove('active'));$('#'+b.dataset.page).classList.add('active');$('#pageTitle').textContent=b.querySelector('span').textContent;$('#sidebar').classList.remove('open')});
$('#menu').onclick=()=>$('#sidebar').classList.toggle('open');
['fAno','fMes','fPlat','fDia'].forEach(id=>$('#'+id).onchange=render);
$('#limparFiltros').onclick=()=>{['fAno','fMes','fPlat','fDia'].forEach(id=>$('#'+id).value='');render()};
function updateLaunchPreview(form=$('#formLanc')){
 const o=Object.fromEntries(new FormData(form)),r=calc(o);
 $('#preview').innerHTML=`<b>Prévia:</b> ${r.horas.toFixed(1)}h • ${r.km.toFixed(1)} km • Receita ${money(r.receita)} • Despesas ${money(r.despesas)} • <b>Lucro ${money(r.lucro)}</b> • Lucro real estimado ${money(r.lucroReal)}`;
}
$('#formLanc').addEventListener('input',e=>updateLaunchPreview(e.currentTarget));
$('#formLanc').onsubmit=async e=>{
 e.preventDefault(); const form=e.currentTarget,btn=form.querySelector('button[type="submit"]'); if(btn.disabled)return;
 const data=Object.fromEntries(new FormData(form)),r=calc(data);
 if(num(data.kmFinal)<num(data.kmInicial))return toast('KM final não pode ser menor que o KM inicial.');
 if(['uber','noventaNove','extras','combustivel','litros','lavagem','estacionamento','manutencao','outros','kmInicial','kmFinal'].some(k=>num(data[k])<0))return toast('Não use valores negativos.');
 if(r.horas<=0)return toast('Confira os horários da jornada.');
 const fp=[data.data,data.inicio,data.fim,data.kmInicial,data.kmFinal,data.uber,data.noventaNove].join('|');
 if(localStorage.getItem('dc_last_save')===fp)return toast('Este lançamento já foi enviado.');
 const old=btn.textContent;
 try{btn.disabled=true;btn.textContent='Salvando...';await call('save',{row:r});localStorage.setItem('dc_last_save',fp);toast('Lançamento salvo! 🔥');if(r.lucroReal>=num(config.metaDiaria))celebrate();form.reset();form.data.value=new Date().toISOString().slice(0,10);['uber','noventaNove','extras','combustivel','litros','lavagem','estacionamento','manutencao','outros'].forEach(n=>form.elements[n].value=0);fillInitialKm(form);updateLaunchPreview(form);await load()}
 catch(err){toast('Erro ao salvar: '+err.message)}
 finally{btn.disabled=false;btn.textContent=old}
};
$('#formConfig').onsubmit=async e=>{e.preventDefault();config={...config,...Object.fromEntries(new FormData(e.currentTarget))};Object.keys(config).forEach(k=>config[k]=num(config[k]));try{if(api())await call('config',{config});localStorage.setItem('dc_config',JSON.stringify(config));toast('Configurações salvas');render()}catch(err){toast(err.message)}};
$('#saveApi').onclick=async()=>{let u=$('#apiUrl').value.trim();if(!u.includes('/exec'))return toast('Cole a URL terminada em /exec');localStorage.setItem('dc_api',u);toast('URL salva. Testando conexão...');await load()};
$('#exportCsv').onclick=()=>{let a=filtered().map(calc),cols=['data','plataforma','inicio','fim','horas','km','receita','despesas','lucro'];let csv=[cols.join(';'),...a.map(r=>cols.map(k=>String(r[k]??'').replace('.',',')).join(';'))].join('\n');let blob=new Blob(['\ufeff'+csv],{type:'text/csv'}),u=URL.createObjectURL(blob),a1=document.createElement('a');a1.href=u;a1.download='historico-motorista.csv';a1.click();URL.revokeObjectURL(u)};

let vehicle={}, maintenances=[], journeyInterval=null;

function getKmAtual(){
  const logged = all.length ? Math.max(...all.map(r=>num(r.kmFinal))) : 0;
  return Math.max(num(vehicle.kmAtual), logged);
}
function maintenanceStatus(m){
  const km=getKmAtual(), pk=num(m.proximoKm);
  const kmLeft=pk?pk-km:null;
  let daysLeft=null;
  if(m.proximaData){daysLeft=Math.ceil((new Date(m.proximaData+'T23:59:59')-new Date())/86400000)}
  let level='ok', text='Em dia';
  if((kmLeft!==null&&kmLeft<=0)||(daysLeft!==null&&daysLeft<0)){level='danger';text='Vencido'}
  else if((kmLeft!==null&&kmLeft<=1000)||(daysLeft!==null&&daysLeft<=30)){level='warn';text='Atenção'}
  let detail=[];
  if(kmLeft!==null)detail.push(kmLeft>=0?`faltam ${kmLeft.toFixed(0)} km`:`${Math.abs(kmLeft).toFixed(0)} km vencidos`);
  if(daysLeft!==null)detail.push(daysLeft>=0?`faltam ${daysLeft} dias`:`${Math.abs(daysLeft)} dias vencido`);
  return {level,text,detail:detail.join(' • ')||'Sem próxima previsão'};
}
function renderVehicle(){
  const km=getKmAtual(); $('#vKmAtual').textContent=km.toLocaleString('pt-BR')+' km';
  const sorted=maintenances.map(m=>({m,s:maintenanceStatus(m)})).sort((a,b)=>({danger:0,warn:1,ok:2}[a.s.level]-({danger:0,warn:1,ok:2}[b.s.level])));
  $('#vProxima').textContent=sorted.length?`${sorted[0].m.item}: ${sorted[0].s.text}`:'Cadastre manutenção';
  const markup=sorted.length?sorted.map(({m,s})=>`<div class="health"><div><b>${s.level==='danger'?'🔴':s.level==='warn'?'🟡':'🟢'} ${m.item}</b><br><small>${s.detail}${m.custo?` • ${money(m.custo)}`:''}</small></div><strong class="status-${s.level}">${s.text}</strong></div>`).join(''):'<p class="hint">Nenhuma manutenção cadastrada ainda.</p>';
  $('#healthList').innerHTML=markup; $('#maintenanceList').innerHTML=markup;
  let f=$('#formVehicle'); if(vehicle&&Object.keys(vehicle).length) Object.keys(vehicle).forEach(k=>{if(f[k])f[k].value=vehicle[k]??''});
}
function calcStreak(){
  const by={}; all.map(calc).forEach(r=>{by[r.data]=(by[r.data]||0)+r.lucroReal});
  let dates=Object.keys(by).filter(d=>by[d]>=num(config.metaDiaria)).sort().reverse(), streak=0;
  if(!dates.length)return 0;
  let d=new Date(dates[0]+'T12:00:00');
  for(let i=0;i<dates.length;i++){let expected=d.toISOString().slice(0,10);if(dates[i]!==expected)break;streak++;d.setDate(d.getDate()-1)}
  return streak;
}
function latestKnownKm(){
 const vehicleKm=num(vehicle&&vehicle.kmAtual);
 const launchKm=(all||[]).reduce((max,r)=>Math.max(max,num(r.kmFinal)),0);
 return Math.max(vehicleKm,launchKm);
}
function fillInitialKm(form=$('#formLanc')){
 if(!form||!form.kmInicial)return;
 const km=latestKnownKm();
 form.kmInicial.value=km>0?km:'';
}
function todayRows(){const today=new Date().toISOString().slice(0,10);return all.map(calc).filter(r=>r.data===today)}
function dailyStats(rows=todayRows()){
 const receita=sum(rows,'receita'),despesas=sum(rows,'despesas'),lucro=sum(rows,'lucro'),lucroReal=sum(rows,'lucroReal'),horas=sum(rows,'horas'),km=sum(rows,'km');
 return {receita,despesas,lucro,lucroReal,horas,km,reserva:Math.max(0,lucro-lucroReal),porHora:horas?lucroReal/horas:0,porKm:km?lucroReal/km:0}
}
function etaMeta(s){
 const meta=num(config.metaDiaria),faltam=meta-s.lucroReal;
 if(faltam<=0)return 'Atingida 🏆';
 if(!s.horas||s.porHora<=0)return 'Sem ritmo suficiente';
 const min=Math.ceil(faltam/s.porHora*60),d=new Date(Date.now()+min*60000);
 return d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
}
function monthlyProjection(){
 const by={};all.map(calc).forEach(r=>{if(r.data)by[r.data]=(by[r.data]||0)+r.lucroReal});
 const vals=Object.values(by); if(!vals.length)return 0;
 const avg=vals.reduce((a,b)=>a+b,0)/vals.length;
 const targetDays=Math.max(1,Math.round(num(config.metaMensal)/Math.max(1,num(config.metaDiaria))));
 return avg*targetDays;
}
function renderFun(){
 const s=dailyStats();
 $('#vStreak').textContent='🔥 '+calcStreak()+' dias';
 $('#vFaltaMeta').textContent=money(Math.max(0,num(config.metaDiaria)-s.lucroReal));
 $('#journeyGoal').textContent=money(config.metaDiaria);
 if($('#journeyReal'))$('#journeyReal').textContent=money(s.lucroReal);
 if($('#journeyPct'))$('#journeyPct').textContent=(num(config.metaDiaria)?Math.max(0,s.lucroReal/config.metaDiaria*100):0).toFixed(0)+'%';
 if($('#journeyMissing'))$('#journeyMissing').textContent=money(Math.max(0,num(config.metaDiaria)-s.lucroReal));
 if($('#journeyEta'))$('#journeyEta').textContent=etaMeta(s);
}

function alertKey(type){return 'dc_alert_'+new Date().toISOString().slice(0,10)+'_'+type}
function smartAlert(type,title,msg,force=false){
 const key=alertKey(type);if(!force&&sessionStorage.getItem(key))return;
 sessionStorage.setItem(key,'1');
 const box=document.createElement('div');box.className='smart-alert '+type;
 const icon=type==='good'?'🔥':type==='danger'?'🔴':'🟡';
 box.innerHTML=`<b>${icon} ${title}</b><span>${msg}</span>`;
 $('#smartAlerts').appendChild(box);requestAnimationFrame(()=>box.classList.add('show'));
 setTimeout(()=>{box.classList.remove('show');setTimeout(()=>box.remove(),300)},5200);
}
function historicalBenchmarks(){
 const today=new Date().toISOString().slice(0,10),rows=all.map(calc).filter(r=>r.data!==today);
 const h=sum(rows,'horas'),km=sum(rows,'km'),real=sum(rows,'lucroReal');
 return {hour:h?real/h:0,km:km?real/km:0,count:rows.length}
}
function renderIntelligence(){
 const s=dailyStats(),meta=Math.max(0,num(config.metaDiaria)),pct=meta?Math.max(0,s.lucroReal/meta*100):0,missing=Math.max(0,meta-s.lucroReal);
 $('#intelPct').textContent=pct.toFixed(0)+'%';$('#intelBar').style.width=Math.min(100,pct)+'%';
 $('#intelReal').textContent=money(s.lucroReal);$('#intelMissing').textContent=money(missing);
 $('#intelHour').textContent=money(s.porHora)+'/h';$('#intelKm').textContent=money(s.porKm)+'/km';
 $('#intelEta').textContent=etaMeta(s);$('#intelMonth').textContent=money(monthlyProjection());
 let title='Aguardando dados de hoje',msg='Registre sua jornada para receber análises do dia.',verdict='Comece a registrar para avaliar o dia.',level='neutral';
 if(s.receita>0){
   if(s.lucroReal>=meta&&meta>0){title='Meta atingida! 🏆';msg=`Você está ${money(s.lucroReal-meta)} acima da meta líquida de hoje.`;verdict=`Valeu a pena hoje: ${money(s.lucroReal)} reais após despesas e reserva por KM.`;level='good'}
   else if(pct>=80){title='Meta perto! 🔥';msg=`Faltam ${money(missing)} para sua meta. Mantendo o ritmo atual: ${etaMeta(s)}.`;verdict=`Hoje: ${s.horas.toFixed(1)}h • ${s.km.toFixed(0)} km • ${money(s.porHora)}/h real.`;level='warn'}
   else {title='Jornada em andamento';msg=`Você chegou a ${pct.toFixed(0)}% da meta. Faltam ${money(missing)}.`;verdict=`Hoje: ${s.horas.toFixed(1)}h • ${s.km.toFixed(0)} km • ${money(s.porKm)}/km real.`}
 }
 const card=$('#intelCard');card.classList.remove('good','warn','danger');if(level!=='neutral')card.classList.add(level);
 $('#intelTitle').textContent=title;$('#intelMessage').textContent=msg;$('#intelVerdict').textContent=verdict;

 if(s.receita<=0)return;
 const bench=historicalBenchmarks(),fuel=sum(todayRows(),'combustivel'),fuelPct=s.receita?fuel/s.receita*100:0;
 if(meta>0&&s.lucroReal>=meta){smartAlert('good','Meta batida!',`${money(s.lucroReal)} de lucro real hoje.`)}
 else if(pct>=80){smartAlert('warn','Meta perto!',`Faltam ${money(missing)}. Previsão: ${etaMeta(s)}.`)}
 if(bench.count>=3&&s.porHora>0&&bench.hour>0&&s.porHora<bench.hour*.75)smartAlert('danger','Rentabilidade caiu',`${money(s.porHora)}/h hoje, abaixo da sua média de ${money(bench.hour)}/h.`)
 if(bench.count>=3&&s.porKm>0&&bench.km>0&&s.porKm<bench.km*.75)smartAlert('danger','Atenção ao KM',`${money(s.porKm)}/km hoje, abaixo da sua média de ${money(bench.km)}/km.`)
 if(fuelPct>=30)smartAlert('warn','Combustível pesando',`Combustível representa ${fuelPct.toFixed(0)}% do faturamento registrado hoje.`)
 const due=maintenances.map(m=>({m,s:maintenanceStatus(m)})).find(x=>x.s.level!=='ok');
 if(due)smartAlert(due.s.level==='danger'?'danger':'warn','Manutenção '+due.s.text.toLowerCase(),`${due.m.item}: ${due.s.detail}.`)
}

function celebrate(){let c=$('#celebrate');c.classList.add('show');setTimeout(()=>c.classList.remove('show'),2800)}
function updateJourney(){
  let st=localStorage.getItem('dc_journey_start'); if(!st){$('#journeyTimer').textContent='00:00:00';return}
  let sec=Math.max(0,Math.floor((Date.now()-num(st))/1000)),h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;
  $('#journeyTimer').textContent=[h,m,s].map(x=>String(x).padStart(2,'0')).join(':');
  $('#journeyStatus').textContent='🔥 Jornada em andamento';
  $('#startJourney').disabled=true;$('#stopJourney').disabled=false;
}
$('#startJourney').onclick=()=>{localStorage.setItem('dc_journey_start',Date.now());updateJourney();journeyInterval=setInterval(updateJourney,1000);toast('Jornada iniciada 🔥')};
$('#stopJourney').onclick=()=>{
 let st=num(localStorage.getItem('dc_journey_start'));if(!st)return;
 let a=new Date(st),b=new Date(),fmt=d=>`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
 let f=$('#formLanc');
 f.reset();
 f.data.value=new Date().toISOString().slice(0,10);
 f.inicio.value=fmt(a);f.fim.value=fmt(b);
 f.plataforma.value='Uber + 99';
 fillInitialKm(f);
 ['uber','noventaNove','extras','combustivel','litros','lavagem','estacionamento','manutencao','outros'].forEach(n=>{if(f.elements[n])f.elements[n].value=0});
 updateLaunchPreview(f);
 localStorage.removeItem('dc_journey_start');clearInterval(journeyInterval);
 $('#journeyStatus').textContent='Jornada encerrada. Complete ganhos, KM e custos.';
 $('#startJourney').disabled=false;$('#stopJourney').disabled=true;updateJourney();
 document.querySelector('[data-page="novo"]').click();
 toast('Horários preenchidos automaticamente');
};
$('#formVehicle').onsubmit=async e=>{e.preventDefault();vehicle=Object.fromEntries(new FormData(e.currentTarget));try{await call('vehicle',{vehicle});toast('Veículo salvo 🚘');renderVehicle()}catch(err){toast(err.message)}};
$('#formMaintenance').onsubmit=async e=>{
 e.preventDefault(); const form=e.currentTarget,btn=form.querySelector('button[type="submit"]'); if(btn.disabled)return;
 const maintenance=Object.fromEntries(new FormData(form)),old=btn.textContent;
 try{btn.disabled=true;btn.textContent='Salvando...';await call('maintenance',{maintenance});toast('Manutenção salva 🔧');form.reset();if(form.elements.custo)form.elements.custo.value=0;await load()}
 catch(err){toast('Erro ao salvar: '+err.message)}
 finally{btn.disabled=false;btn.textContent=old}
};
if(localStorage.getItem('dc_journey_start')){updateJourney();journeyInterval=setInterval(updateJourney,1000)}

function loadDriverName(){const name=localStorage.getItem('dc_driver_name')||'';const i=$('#driverName');if(i)i.value=name;const h=$('#driverHello');if(h)h.textContent=name?`Olá, ${name} 👋`:'Olá, Motorista 👋'}
$('#driverName').addEventListener('change',e=>{localStorage.setItem('dc_driver_name',e.target.value.trim());loadDriverName();toast('Nome salvo')});
$('#toggleApi').onclick=()=>$('#apiEditor').classList.toggle('api-hidden');
loadDriverName();

$('#today').textContent=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
$('#apiUrl').value=api();$('#formLanc').data.value=new Date().toISOString().slice(0,10);updateLaunchPreview($('#formLanc'));
try{config={...config,...JSON.parse(localStorage.getItem('dc_config')||'{}')}}catch{} fillConfig();load();
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));}
