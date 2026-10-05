const PER=6;let page=1,editId=null,off=0,enviando=false;
const lista=()=>DB.get('agendamentos',[]),fim=a=>+new Date(a.horario)+a.duracao*6e4;
const toInput=d=>`${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`;
function inicioSemana(d){const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-(x.getDay()+6)%7);return x}
const offDe=d=>Math.round((inicioSemana(d)-inicioSemana(new Date()))/6048e5);

function carregarSelects(){
  const cs=clientes().sort((a,b)=>a.nome.localeCompare(b.nome)),ss=servicos(),f=[];
  $('cliente').innerHTML='<option value="">Selecione o cliente</option>'+cs.map(c=>`<option value="${c.id}">${esc(c.nome)}</option>`).join('');
  $('servico').innerHTML='<option value="">Selecione o serviço</option>'+ss.map(s=>`<option value="${s.id}">${esc(s.nome)} (${s.duracao} min)</option>`).join('');
  if(!cs.length)f.push('um <a href="clientes.html">cliente</a>');if(!ss.length)f.push('um <a href="empresa.html">tipo de serviço</a>');
  $('aviso').hidden=!f.length;$('aviso').innerHTML=`Para agendar, cadastre ${f.join(' e ')}.`;
}
function salvar(){
  const c=clientes().find(x=>x.id===$('cliente').value),s=servicos().find(x=>x.id===$('servico').value);
  const d={horario:$('horario').value,duracao:+$('duracao').value,obs:$('obs').value.trim()};
  if(!c||!s||!d.horario||!(d.duracao>0)){msg('Selecione cliente e serviço e preencha data e hora e duração.',1);return}
  const e=empresa(),ini=new Date(d.horario),h=e.horarios[ini.getDay()],m=ini.getHours()*60+ini.getMinutes();
  if(!h.ativo){msg(`A empresa não funciona neste dia (${DIAS[ini.getDay()]}).`,1);return}
  if(m<min(h.ini)||m+d.duracao>min(h.fim)){msg(`Fora do horário comercial: ${DIAS[ini.getDay()]} das ${h.ini} às ${h.fim}.`,1);return}
  const t0=+ini,t1=t0+d.duracao*6e4,conf=lista().find(a=>a.id!==editId&&t0<fim(a)&&t1>+new Date(a.horario));
  if(conf&&!confirm(`Conflito com ${conf.cliente} às ${fmt(conf.horario)}. Salvar mesmo assim?`))return;
  Object.assign(d,{clienteId:c.id,cliente:c.nome,telefone:c.telefone,servicoId:s.id,servico:s.nome});
  const l=lista(),i=l.findIndex(a=>a.id===editId),era=i>=0;
  if(era)l[i]={...l[i],...d,lembrete:d.horario===l[i].horario?l[i].lembrete:null};else l.push({id:uid(),...d});
  DB.set('agendamentos',l);cancelarEdicao(true);off=offDe(ini);render();verificarLembretes();
  msg(era?'Agendamento atualizado.':'Agendamento salvo.');
}
function editar(id){
  const a=lista().find(x=>x.id===id);if(!a)return;editId=id;
  $('cliente').value=a.clienteId;$('servico').value=a.servicoId;$('horario').value=a.horario;$('duracao').value=a.duracao;$('obs').value=a.obs||'';
  $('btnSalvar').textContent='Atualizar agendamento';$('btnExcluir').hidden=$('btnDescartar').hidden=false;
  off=offDe(new Date(a.horario));render();scrollTo({top:0,behavior:'smooth'});
}
function excluir(id){
  const a=lista().find(x=>x.id===id);if(!a||!confirm(`Excluir o agendamento de ${a.cliente} (${fmt(a.horario)})?`))return;
  DB.set('agendamentos',lista().filter(x=>x.id!==id));if(editId===id)cancelarEdicao(true);render();msg('Agendamento excluído.');
}
function cancelarEdicao(silencioso){
  editId=null;['cliente','servico','horario','duracao','obs'].forEach(c=>$(c).value='');
  $('btnSalvar').textContent='Salvar agendamento';$('btnExcluir').hidden=$('btnDescartar').hidden=true;if(!silencioso)msg('');
}
function novoEm(v){ // clique em horário livre da grade
  $('horario').value=v;scrollTo({top:0,behavior:'smooth'});($('cliente').value?$('servico'):$('cliente')).focus({preventScroll:true});
}
function semana(n){off=n?off+n:0;renderSemana()}
function irPagina(n){page=n;renderLista()}
function render(){renderSemana();renderLista()}

function renderSemana(){
  const e=empresa(),t=$('semana'),ini=inicioSemana(new Date());ini.setDate(ini.getDate()+7*off);
  const dias=[...Array(7)].map((_,i)=>{const d=new Date(ini);d.setDate(ini.getDate()+i);return d});
  const dm=d=>d.toLocaleDateString(undefined,{day:'numeric',month:'short'});
  $('semanaTitulo').textContent=(off?'Semana de ':'Semana atual: ')+dm(dias[0])+' a '+dm(dias[6]);
  const at=Object.values(e.horarios).filter(h=>h.ativo);
  if(!at.length){t.innerHTML='<tbody><tr><td class="vazio">Defina o horário semanal na página Empresa para ver a grade.</td></tr></tbody>';return}
  const p=e.passo||30,a0=Math.floor(Math.min(...at.map(h=>min(h.ini)))/p)*p,a1=Math.max(...at.map(h=>min(h.fim)));
  const ags=lista(),hoje=new Date().toDateString();
  let h='<thead><tr><th></th>'+dias.map(d=>`<th class="${d.toDateString()===hoje?'hoje':''}">${DIAS[d.getDay()].slice(0,3)} ${d.getDate()}</th>`).join('')+'</tr></thead><tbody>';
  for(let m=a0;m<a1;m+=p){
    h+=`<tr><th scope="row">${hhmm(m)}</th>`;
    for(const d of dias){
      const cf=e.horarios[d.getDay()];
      if(!(cf.ativo&&m>=min(cf.ini)&&m<min(cf.fim))){h+='<td class="fechado"></td>';continue}
      const s=new Date(d);s.setHours(0,m,0,0);const t0=+s,t1=t0+p*6e4;
      const hit=ags.filter(a=>{const x=+new Date(a.horario);return x<t1&&fim(a)>t0});
      h+='<td>'+(hit.length?hit.map(a=>+new Date(a.horario)>=t0
        ?`<button class="ag" onclick="editar('${a.id}')" title="Editar ou excluir">${esc(a.cliente)}<br>${esc(a.servico)}</button>`
        :'<div class="ag cont"></div>').join('')
        :`<button class="livre" aria-label="Agendar ${DIAS[d.getDay()]} às ${hhmm(m)}" onclick="novoEm('${toInput(s)}')">+</button>`)+'</td>';
    }
    h+='</tr>';
  }
  t.innerHTML=h+'</tbody>';
}
function renderLista(){
  const lim=new Date();lim.setHours(0,0,0,0);
  let l=lista().sort((a,b)=>a.horario.localeCompare(b.horario));
  if(!$('passados').checked)l=l.filter(a=>+new Date(a.horario)>=+lim);
  page=Math.min(page,Math.max(1,Math.ceil(l.length/PER)));
  const it=l.slice((page-1)*PER,page*PER);
  $('lista').innerHTML=it.length?it.map(a=>`<article class="item"><div><div class="tit">${esc(a.cliente)}: ${esc(a.servico)}</div><div class="meta">${fmt(a.horario)}, ${a.duracao} min${a.telefone?', '+esc(a.telefone):''}</div>${a.obs?`<div class="meta">${esc(a.obs)}</div>`:''}${lembreteTxt(a)?`<div class="meta">${esc(lembreteTxt(a))}</div>`:''}</div><div class="acoes"><button class="sec" onclick="editar('${a.id}')">Editar</button><button class="sec" onclick="enviarAgora('${a.id}')">Enviar lembrete</button><button class="perigo" onclick="excluir('${a.id}')">Excluir</button></div></article>`).join(''):'<p class="vazio">Nenhum agendamento. Clique em um horário livre da grade ou preencha o formulário.</p>';
  pager($('pager'),l.length,PER,page);
}

// ---- Lembretes por SMS ----
function montarTexto(a){
  const e=DB.get('empresa',{}),d=new Date(a.horario);
  const dia=d.toLocaleDateString(undefined,{weekday:'short',day:'2-digit',month:'2-digit'}),hora=d.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});
  return `${e.nome||'Lembrete'}: lembrete de ${a.servico} em ${dia} às ${hora}.${e.endereco?` Endereço: ${e.endereco}.`:''}`;
}
async function enviarLembrete(a,n){ // nunca lança erro: devolve o estado do lembrete
  try{
    const s=DB.get('sms',{}),c=clientes().find(x=>x.id===a.clienteId)||a;
    const body={textMessage:{text:montarTexto(a)},phoneNumbers:[normalizarTel(c.telefone,s.ddi)],validUntil:new Date(a.horario).toISOString()};
    const r=await gwFetch('/message',{method:'POST',body:JSON.stringify(body)});
    const j=await r.json().catch(()=>({}));
    return{estado:'enviado',em:new Date().toISOString(),msgId:j.id||''};
  }catch(err){return{estado:'falhou',em:new Date().toISOString(),erro:err.message,n:n+1}}
}
function salvarLembretes(up){ // grava só o campo "lembrete", sem sobrescrever edições feitas durante o envio
  const f=lista();let m=false;
  f.forEach(x=>{const u=up[x.id];if(u&&u.hor===x.horario){x.lembrete=u.lem;m=true}});
  if(m){DB.set('agendamentos',f);renderLista()}
}
async function verificarLembretes(){
  const s=DB.get('sms',{});if(enviando||!s.ativo)return;enviando=true;
  try{
    const up={},agora=Date.now(),ant=(+s.minutos||60)*6e4;
    for(const a of lista()){
      const u=a.lembrete,t=+new Date(a.horario);
      if(u&&(u.estado==='enviado'||u.estado==='expirado'))continue;
      if(agora>=t){up[a.id]={hor:a.horario,lem:{estado:'expirado',em:new Date().toISOString()}};continue}
      if(agora<t-ant)continue;
      if(u&&u.estado==='falhou'&&(u.n>=5||agora-new Date(u.em)<3e5))continue; // até 5 tentativas, 5 min entre elas
      up[a.id]={hor:a.horario,lem:await enviarLembrete(a,u?u.n:0)};
    }
    if(Object.keys(up).length)salvarLembretes(up);
  }finally{enviando=false}
}
async function enviarAgora(id){
  const a=lista().find(x=>x.id===id);if(!a)return;
  if(+new Date(a.horario)<=Date.now()){msg('O horário deste agendamento já passou.',1);return}
  if(!confirm(`Enviar agora o lembrete por SMS para ${a.cliente}?`))return;
  msg('Enviando lembrete...');
  const lem=await enviarLembrete(a,0);salvarLembretes({[id]:{hor:a.horario,lem}});
  lem.estado==='enviado'?msg('Lembrete enviado ao gateway.'):msg(lem.erro,1);
}
function lembreteTxt(a){
  const s=DB.get('sms',{}),l=a.lembrete;
  if(l&&l.estado==='enviado')return `Lembrete enviado ao gateway em ${fmt(l.em)}`;
  if(l&&l.estado==='expirado')return 'Lembrete não enviado: o horário já passou';
  if(l&&l.estado==='falhou')return `Lembrete falhou (${l.n}x): ${l.erro}`;
  return s.ativo?`Lembrete previsto para ${fmt(+new Date(a.horario)-(+s.minutos||60)*6e4)}`:'';
}
document.addEventListener('DOMContentLoaded',()=>{
  carregarSelects();
  $('servico').addEventListener('change',()=>{const s=servicos().find(x=>x.id===$('servico').value);if(s)$('duracao').value=s.duracao});
  $('passados').addEventListener('change',()=>{page=1;renderLista()});
  render();verificarLembretes();setInterval(verificarLembretes,3e4);
});
