import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HOST = '127.0.0.1';
const root = fileURLToPath(new URL('../',import.meta.url));
const contentTypes = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8' };
export function createStaticServer(port=5506) {
  return http.createServer(async (req,res)=>{
    const head=req.method==='HEAD';
    if(req.method!=='GET'&&!head){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
    let name;
    try { name=decodeURIComponent(new URL(req.url,`http://${HOST}:${port}`).pathname).slice(1)||'index.html'; }
    catch {res.writeHead(400);res.end('Bad request');return;}
    if(name.includes('..')||name.includes('\\')||name.startsWith('.')||
       !( ['index.html','checks.html','styles.css'].includes(name)||name.startsWith('src/')||name==='checks/browser.checks.js')){
      res.writeHead(404);res.end('Not found');return;
    }
    const type=contentTypes[path.extname(name)];
    if(!type){res.writeHead(404);res.end('Not found');return;}
    try {const data=await readFile(path.join(root,name));res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(head?undefined:data);}
    catch {res.writeHead(404);res.end('Not found');}
  });
}
export function readWebPort(raw,fallback=5506) {
  const port=Number(raw??fallback);
  if(!Number.isInteger(port)||port<1024||port>65535)throw new TypeError('Неверный порт.');
  return port;
}
if(import.meta.url===(process.argv[1]?pathToFileURL(process.argv[1]).href:'')){
  const port=readWebPort(process.argv[2]??process.env.WEB_PORT);
  createStaticServer(port).listen(port,HOST,()=>console.log(`Приложение: http://${HOST}:${port}/`));
}
