const PER=8,campos=['nome','telefone','obs'];
let page=1,editId=null;
function salvarCliente(){
  const d={};campos.forEach(c=>d[c]=$(c).value.trim());
  if(!d.nome||!d.telefone){msg('Informe o nome e o telefone do cliente.',1);return}
  if(d.telefone.replace(/\D/g,'').length<8){msg('Telefone inválido.',1);return}
  const l=clientes(),era=!!editId;
  if(era){const i=l.findIndex(c=>c.id===editId);l[i]={...l[i],...d}}else l.push({id:uid(),...d});
  DB.set('clientes',l);limpar(true);render();msg(era?'Cliente atualizado.':'Cliente cadastrado.');
}
function limpar(silencioso){
  editId=null;campos.forEach(c=>$(c).value='');
  $('btnSalvar').textContent='Salvar cliente';$('btnDescartar').hidden=true;if(!silencioso)msg('');
}
function editar(id){
  const c=clientes().find(x=>x.id===id);if(!c)return;editId=id;campos.forEach(k=>$(k).value=c[k]||'');
  $('btnSalvar').textContent='Atualizar cliente';$('btnDescartar').hidden=false;scrollTo({top:0,behavior:'smooth'});$('nome').focus({preventScroll:true});
}
function excluir(id){
  const c=clientes().find(x=>x.id===id);
  if(!c||!confirm(`Excluir o cliente ${c.nome}? Os agendamentos existentes não serão alterados.`))return;
  DB.set('clientes',clientes().filter(x=>x.id!==id));if(editId===id)limpar(true);render();msg('Cliente excluído.');
}
function irPagina(n){page=n;render()}
function render(){
  const q=$('busca').value.trim().toLowerCase(),qd=q.replace(/\D/g,'');
  const l=clientes().filter(c=>!q||c.nome.toLowerCase().includes(q)||(qd&&c.telefone.replace(/\D/g,'').includes(qd))).sort((a,b)=>a.nome.localeCompare(b.nome));
  page=Math.min(page,Math.max(1,Math.ceil(l.length/PER)));
  const it=l.slice((page-1)*PER,page*PER);
  $('lista').innerHTML=it.length?it.map(c=>`<article class="item"><div><div class="tit">${esc(c.nome)}</div><div class="meta">${esc(c.telefone)}</div>${c.obs?`<div class="meta">${esc(c.obs)}</div>`:''}</div><div class="acoes"><button class="sec" onclick="editar('${c.id}')">Editar</button><button class="perigo" onclick="excluir('${c.id}')">Excluir</button></div></article>`).join(''):'<p class="vazio">Nenhum cliente encontrado. Use o formulário acima para cadastrar.</p>';
  pager($('pager'),l.length,PER,page);
}
document.addEventListener('DOMContentLoaded',()=>{$('busca').addEventListener('input',()=>{page=1;render()});render()});
