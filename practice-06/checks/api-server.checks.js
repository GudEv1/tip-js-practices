import { createApiServer } from '../api/server.mjs';
import { assert, suite, serve } from './_helpers.js';
const server=createApiServer();const base=await serve(server);
const get=(path,opts)=>fetch(`${base}${path}`,opts);
const data=async(path,opts)=>(await(await get(path,opts)).json());
const jsonBody=(body)=>({headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const initial=async()=>data('/debug/reset',{method:'POST'});
try{await suite('API',[
['01 health 200',async()=>assert.equal((await get('/health')).status,200)],
['02 health JSON',async()=>assert.deepEqual((await data('/health')).data,{status:'ok'})],
['03 tasks 12',async()=>assert.equal((await data('/tasks')).data.length,12)],
['04 categories 3',async()=>assert.equal((await data('/categories')).data.length,3)],
['05 мета списка',async()=>assert.equal((await data('/tasks')).meta.total,12)],
['06 фильтр completed=false',async()=>assert.equal((await data('/tasks?completed=false')).meta.total,7)],
['07 фильтр completed=true',async()=>assert.equal((await data('/tasks?completed=true')).meta.total,5)],
['08 фильтр priority=high',async()=>assert.equal((await data('/tasks?priority=high')).meta.total,5)],
['09 комбинированный фильтр',async()=>assert.deepEqual((await data('/tasks?completed=false&priority=high&categoryId=2')).data.map(x=>x.id),[4,34])],
['10 поиск без учёта регистра',async()=>assert.deepEqual((await data('/tasks?q=%D0%9F%D0%A0%D0%9E%D0%92%D0%95%D0%A0')).data.map(x=>x.id),[7,16])],
['11 задача по id',async()=>assert.equal((await data('/tasks/4')).data.id,4)],
['12 404 для неизвестной задачи',async()=>assert.equal((await get('/tasks/999')).status,404)],
['13 INVALID_QUERY',async()=>assert.equal((await data('/tasks?other=x')).error.code,'INVALID_QUERY')],
['14 дубли query дают 400',async()=>assert.equal((await get('/tasks?completed=false&completed=false')).status,400)],
['15 debug error 503',async()=>assert.equal((await get('/debug/error')).status,503)],
['16 invalid JSON воспроизводится',async()=>{const r=await get('/debug/invalid-json');await assert.rejects(()=>r.json());}],
['17 text вместо JSON',async()=>assert.match((await get('/debug/text')).headers.get('content-type'),/text\/plain/)],
['18 CORS',async()=>assert.equal((await get('/health')).headers.get('access-control-allow-origin'),'*')],
['19 OPTIONS',async()=>assert.equal((await get('/tasks',{method:'OPTIONS'})).status,204)],
['20 POST создаёт id 35',async()=>{await initial();const r=await get('/tasks',{method:'POST',...jsonBody({title:'Новая',priority:'high',categoryId:2})});assert.equal(r.status,201);assert.equal((await r.json()).data.id,35);}],
['21 PATCH обновляет title',async()=>{const r=await get('/tasks/35',{method:'PATCH',...jsonBody({title:'Изменённая'})});assert.equal((await r.json()).data.title,'Изменённая');}],
['22 DELETE возвращает 204',async()=>assert.equal((await get('/tasks/35',{method:'DELETE'})).status,204)],
['23 reset восстанавливает 12',async()=>{await initial();assert.equal((await data('/tasks')).meta.total,12);}],
]);}finally{await new Promise(resolve=>server.close(resolve));}
