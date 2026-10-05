// Servidor local do Smart Agenda Pro: serve os arquivos e repassa as chamadas ao SMS Gateway.
// Uso: node server.js   ->   abra http://localhost:3000
const http=require('http'),fs=require('fs'),path=require('path');
const PORT=process.env.PORT||3000,DIR=__dirname;
const TIPOS={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const redeLocal=h=>/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/.test(h)||h.endsWith('.local');

const ORIGENS=(process.env.ORIGIN||'').split(',').map(s=>s.trim()).filter(Boolean);
function cors(req,res){ // só libera os sites listados em ORIGIN (ex.: https://usuario.github.io)
  const o=req.headers.origin;if(!o||!ORIGENS.includes(o))return;
  res.setHeader('Access-Control-Allow-Origin',o);res.setHeader('Vary','Origin');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization, X-Gateway-Url');
  res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  res.setHeader('Access-Control-Expose-Headers','x-proxy, x-proxy-erro');
  res.setHeader('Access-Control-Allow-Private-Network','true');
}
http.createServer((req,res)=>{
  if(req.url.startsWith('/__gw')){
    cors(req,res);if(req.method==='OPTIONS'){res.writeHead(204);return res.end()} // proxy: /__gw/message -> {X-Gateway-Url}/message
    const falha=(c,t)=>{res.writeHead(c,{'content-type':'text/plain; charset=utf-8','x-proxy':'smart-agenda','x-proxy-erro':'1'});res.end(t)};
    let alvo;try{alvo=new URL(req.headers['x-gateway-url']||'')}catch{return falha(400,'X-Gateway-Url inválido')}
    if(alvo.protocol!=='http:'||!redeLocal(alvo.hostname))return falha(403,'Só são aceitos endereços http da rede local');
    const p=http.request({hostname:alvo.hostname,port:alvo.port||80,path:req.url.slice(5),method:req.method,timeout:10000,
      headers:{'content-type':req.headers['content-type']||'application/json',authorization:req.headers.authorization||''}},r=>{
      res.writeHead(r.statusCode,{'content-type':r.headers['content-type']||'text/plain','x-proxy':'smart-agenda'});r.pipe(res)});
    p.on('timeout',()=>p.destroy(new Error('sem resposta em 10 segundos')));
    p.on('error',e=>falha(502,e.message));
    return req.pipe(p);
  }
  let u=decodeURIComponent(req.url.split('?')[0]);if(u==='/')u='/index.html';
  const f=path.join(DIR,u);
  if(!f.startsWith(DIR+path.sep)){res.writeHead(403);return res.end()}
  fs.readFile(f,(e,d)=>{
    if(e){res.writeHead(404);return res.end('Não encontrado')}
    res.writeHead(200,{'content-type':TIPOS[path.extname(f)]||'application/octet-stream'});res.end(d);
  });
}).listen(PORT,'127.0.0.1',()=>console.log(`Smart Agenda Pro em http://localhost:${PORT}`+(ORIGENS.length?` (aceita chamadas de ${ORIGENS.join(', ')})`:'')));
