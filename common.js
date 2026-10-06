const $=id=>document.getElementById(id);
const DB={get(k,d){try{return JSON.parse(localStorage.getItem('sa:'+k))??d}catch{return d}},set(k,v){localStorage.setItem('sa:'+k,JSON.stringify(v))}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DIAS=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const HORARIO_PADRAO=()=>Object.fromEntries([0,1,2,3,4,5,6].map(d=>[d,{ativo:d>0&&d<6,ini:'09:00',fim:'18:00'}]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const p2=n=>String(n).padStart(2,'0'),min=t=>{const[h,m]=t.split(':');return +h*60+ +m},hhmm=m=>p2(Math.floor(m/60))+':'+p2(m%60);
const fmt=s=>new Date(s).toLocaleString(undefined,{dateStyle:'short',timeStyle:'short'});
const empresa=()=>({horarios:HORARIO_PADRAO(),passo:30,...DB.get('empresa',{})});
const clientes=()=>DB.get('clientes',[]),servicos=()=>DB.get('servicos',[]);
function msg(t,erro,id){const m=$(id||'msg');if(m){m.textContent=t;m.className=erro?'erro':''}}
function renderNav(){
   const p=location.pathname.split('/').pop()||'index.html',e=DB.get('empresa',{}),logo=DB.get('logo','');
   let brand=logo?`<img src="${logo}" alt="Logo">`:'';
   brand+=`<span>${esc(e.nome||'Agenda SMS')}</span>`;
   $('nav').innerHTML=`<div class="brand">${brand}</div><nav>${[['index.html','Agenda'],['clientes.html','Clientes'],['empresa.html','Empresa']].map(([h,t])=>`<a href="${h}" ${p===h?'aria-current="page"':''}>${t}</a>`).join('')}</nav>`;
 }
function pager(el,total,per,page){
  const tp=Math.max(1,Math.ceil(total/per));
  if(total<=per){el.innerHTML=total?`<span class="info">${total} registro(s)</span>`:'';return}
  let h=`<button ${page<=1?'disabled':''} onclick="irPagina(${page-1})">Anterior</button>`;
  for(let i=1;i<=tp;i++)h+=`<button class="${i===page?'on':''}" ${i===page?'aria-current="page"':''} onclick="irPagina(${i})">${i}</button>`;
  el.innerHTML=h+`<button ${page>=tp?'disabled':''} onclick="irPagina(${page+1})">Próxima</button><span class="info">${(page-1)*per+1} a ${Math.min(page*per,total)} de ${total}</span>`;
}
// ---- SMS Gateway for Android (Local Server) por meio do server.js local ----
function normalizarTel(t,ddi){
  if(!String(t||'').trim())throw new Error('Cliente sem telefone cadastrado.');
  let n=String(t).replace(/[^\d+]/g,'');
  if(n.startsWith('00'))n='+'+n.slice(2);
  if(!n.startsWith('+')){const d=String(ddi||'').replace(/\D/g,'');if(!d)throw new Error('Telefone sem código do país. Informe o DDI na configuração de SMS (página Empresa).');n='+'+d+n.replace(/^0+/,'')}
  if(!/^\+\d{8,15}$/.test(n))throw new Error('Telefone inválido: '+t);
  return n;
}
async function gwFetch(path,opt={},s=DB.get('sms',{})){
  if(!s.url||!s.user||!s.pass)throw new Error('Configure o endereço, o usuário e a senha do gateway na página Empresa.');
  let base=s.url.trim();if(!/^https?:\/\//i.test(base))base='http://'+base;
  const ponte=['localhost','127.0.0.1'].includes(location.hostname)?'':(s.ponte||'http://localhost:3000').replace(/\/+$/,'');
  const auth='Basic '+btoa(String.fromCharCode(...new TextEncoder().encode(`${s.user}:${s.pass}`)));
  let r;
  try{r=await fetch(ponte+'/__gw'+path,{...opt,headers:{'Content-Type':'application/json',Authorization:auth,'X-Gateway-Url':base.replace(/\/+$/,'')},signal:AbortSignal.timeout(10000)})}
  catch(e){throw new Error(e.name==='TimeoutError'?'Sem resposta em 10 segundos.':'Não foi possível falar com o servidor local (server.js). Confira se ele está rodando, iniciado com o comando mostrado na página Empresa.')}
  if(!r.headers.get('x-proxy'))throw new Error('Esse endereço não é o servidor local do Agenda SMS. Inicie o server.js e confira o endereço do servidor local.');
  if(r.headers.get('x-proxy-erro'))throw new Error('O servidor local não alcançou o gateway: '+(await r.text()).slice(0,120));
  if(r.status===401||r.status===403)throw new Error('Usuário ou senha recusados pelo gateway.');
  if(!r.ok)throw new Error(`O gateway respondeu HTTP ${r.status}: ${(await r.text()).slice(0,120)}`);
  return r;
}
document.addEventListener('DOMContentLoaded',renderNav);
