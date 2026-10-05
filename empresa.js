const CAMPOS=['nome','documento','telefone','email','endereco'],ORDEM=[1,2,3,4,5,6,0];
let svEdit=null;
function carregar(){
  const e=empresa();CAMPOS.forEach(c=>$(c).value=e[c]||'');$('passo').value=e.passo;
  $('horas').innerHTML=ORDEM.map(d=>{const h=e.horarios[d];return `<tr><td><label class="chk"><input type="checkbox" id="a${d}" ${h.ativo?'checked':''}>${DIAS[d]}</label></td><td><input type="time" id="i${d}" value="${h.ini}" aria-label="Abre ${DIAS[d]}"></td><td><input type="time" id="f${d}" value="${h.fim}" aria-label="Fecha ${DIAS[d]}"></td></tr>`}).join('');
  const s={minutos:60,ponte:'http://localhost:3000',...DB.get('sms',{})};
  $('smsAtivo').checked=!!s.ativo;$('smsMin').value=s.minutos;$('smsUrl').value=s.url||'';$('smsUser').value=s.user||'';$('smsPass').value=s.pass||'';$('smsDdi').value=s.ddi||'';$('smsPonte').value=s.ponte;
  listarServicos();comandos();
}
function salvarEmpresa(){
  const h={};
  for(const d of ORDEM){
    h[d]={ativo:$('a'+d).checked,ini:$('i'+d).value,fim:$('f'+d).value};
    if(h[d].ativo&&(!h[d].ini||!h[d].fim||h[d].ini>=h[d].fim)){msg(`Horário inválido em ${DIAS[d]}: a abertura deve ser antes do fechamento.`,1,'msgEmp');return}
  }
  const e={horarios:h,passo:+$('passo').value};CAMPOS.forEach(c=>e[c]=$(c).value.trim());
  if(!e.nome){msg('Informe o nome da empresa.',1,'msgEmp');return}
  if(!Object.values(h).some(x=>x.ativo)){msg('Marque ao menos um dia de funcionamento.',1,'msgEmp');return}
  DB.set('empresa',e);renderNav();msg('Empresa salva.',0,'msgEmp');
}
// ---- Tipos de serviço ----
function listarServicos(){
  const l=servicos();
  $('svLista').innerHTML=l.length?l.map(s=>`<article class="item"><div><div class="tit">${esc(s.nome)}</div><div class="meta">${s.duracao} min</div></div><div class="acoes"><button class="sec" onclick="editarServico('${s.id}')">Editar</button><button class="perigo" onclick="excluirServico('${s.id}')">Excluir</button></div></article>`).join(''):'<p class="vazio">Nenhum tipo de serviço cadastrado.</p>';
}
function salvarServico(){
  const nome=$('svNome').value.trim(),duracao=+$('svDur').value;
  if(!nome||!(duracao>0)){msg('Informe o nome e a duração do serviço.',1,'msgSv');return}
  const l=servicos(),i=l.findIndex(s=>s.id===svEdit);
  if(i>=0)l[i]={...l[i],nome,duracao};else l.push({id:uid(),nome,duracao});
  DB.set('servicos',l);limparServico();listarServicos();msg('Serviço salvo.',0,'msgSv');
}
function editarServico(id){
  const s=servicos().find(x=>x.id===id);if(!s)return;svEdit=id;$('svNome').value=s.nome;$('svDur').value=s.duracao;
  $('svSalvar').textContent='Atualizar serviço';$('svDescartar').hidden=false;$('svNome').focus();
}
function limparServico(){svEdit=null;$('svNome').value='';$('svDur').value=30;$('svSalvar').textContent='Adicionar serviço';$('svDescartar').hidden=true}
function excluirServico(id){
  const s=servicos().find(x=>x.id===id);
  if(!s||!confirm(`Excluir o serviço ${s.nome}? Os agendamentos existentes não serão alterados.`))return;
  DB.set('servicos',servicos().filter(x=>x.id!==id));if(svEdit===id)limparServico();listarServicos();
}
// ---- SMS ----
function lerSms(){return{ativo:$('smsAtivo').checked,minutos:+$('smsMin').value,url:$('smsUrl').value.trim(),user:$('smsUser').value.trim(),pass:$('smsPass').value,ddi:$('smsDdi').value.trim(),ponte:$('smsPonte').value.trim()||'http://localhost:3000'}}
function salvarSms(){
  const s=lerSms();
  if(!(s.minutos>0)){msg('Informe a antecedência do lembrete em minutos.',1,'msgSms');return}
  if(s.ativo&&(!s.url||!s.user||!s.pass)){msg('Para ativar os lembretes, informe endereço, usuário e senha do gateway.',1,'msgSms');return}
  DB.set('sms',s);comandos();msg('Configuração de SMS salva.',0,'msgSms');
}
async function testarConexao(){
  msg('Testando conexão...',0,'msgSms');
  try{await gwFetch('/health',{},lerSms());msg('Conexão OK: o gateway respondeu.',0,'msgSms')}catch(e){msg(e.message,1,'msgSms')}
}
async function enviarTeste(){
  const s=lerSms();
  try{
    const tel=normalizarTel($('telTeste').value,s.ddi);msg('Enviando...',0,'msgSms');
    await gwFetch('/message',{method:'POST',body:JSON.stringify({textMessage:{text:`${$('nome').value.trim()||'Agenda SMS'}: mensagem de teste. Se você recebeu este SMS, o envio está funcionando.`},phoneNumbers:[tel]})},s);
    msg('Mensagem de teste enviada ao gateway. Confira o celular.',0,'msgSms');
  }catch(e){msg(e.message,1,'msgSms')}
}
function comandos(){
  const loc=['localhost','127.0.0.1'].includes(location.hostname),org=/^https?:/.test(location.origin)?location.origin:'https://SEU-USUARIO.github.io';
  let porta='3000';try{porta=new URL($('smsPonte').value||'http://localhost:3000').port||'3000'}catch{}
  const pp=porta!=='3000',
    ps=(pp?`$env:PORT="${porta}"; `:'')+(loc?'':`$env:ORIGIN="${org}"; `)+'node server.js',
    cmd=(pp?`set PORT=${porta}&& `:'')+(loc?'':`set ORIGIN=${org}&& `)+'node server.js',
    sh=(pp?`PORT=${porta} `:'')+(loc?'':`ORIGIN=${org} `)+'node server.js';
  $('cmds').innerHTML=[['PowerShell (Windows)',ps],['Prompt de comando (Windows)',cmd],['Linux / macOS',sh]].map(([t,c],i)=>`<label>${t}</label><div class="cmd"><code id="cmd${i}">${esc(c)}</code><button class="sec" type="button" onclick="copiar(${i})">Copiar</button></div>`).join('')
    +(!loc&&org.includes('SEU-USUARIO')?'<p class="vazio">Abra o site pelo endereço do GitHub Pages para o comando sair com o endereço certo.</p>':'');
}
function copiar(i){
  const t=$('cmd'+i).textContent;
  (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>msg('Comando copiado.',0,'msgSms'),()=>msg('Não foi possível copiar. Selecione o comando e copie manualmente.',1,'msgSms'));
}
document.addEventListener('DOMContentLoaded',carregar);
