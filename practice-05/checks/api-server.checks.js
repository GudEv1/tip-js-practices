import { createApiServer } from '../api/server.mjs';
import { assert,suite,serve } from './_helpers.js';
const server=createApiServer(),base=await serve(server);
const get=(path,opts)=>fetch(`${base}${path}`,opts);
const json=async(path,opts)=>(await(await get(path,opts)).json());
try{await suite('API',[
['01 health',async()=>assert.equal((await get('/health')).status,200)],
['02 health body',async()=>assert.equal((await json('/health')).data.status,'ok')],
['03 список задач',async()=>assert.equal((await json('/tasks')).data.length,12)],
['04 категории',async()=>assert.equal((await json('/categories')).data.length,3)],
['05 meta.total',async()=>assert.equal((await json('/tasks')).meta.total,12)],
['06 false',async()=>assert.equal((await json('/tasks?completed=false')).meta.total,7)],
['07 true',async()=>assert.equal((await json('/tasks?completed=true')).meta.total,5)],
['08 high',async()=>assert.equal((await json('/tasks?priority=high')).meta.total,5)],
['09 категория 2',async()=>assert.equal((await json('/tasks?categoryId=2')).meta.total,6)],
['10 комбинированный',async()=>assert.deepEqual((await json('/tasks?completed=false&priority=high')).data.map(x=>x.id),[4,13,34])],
['11 поисковый фильтр',async()=>assert.deepEqual((await json('/tasks?q=%D0%BF%D1%80%D0%BE%D0%B2%D0%B5%D1%80')).data.map(x=>x.id),[7,16])],
['12 получение задачи',async()=>assert.equal((await json('/tasks/25')).data.id,25)],
['13 задача 999',async()=>assert.equal((await json('/tasks/999')).error.code,'TASK_NOT_FOUND')],
['14 GET неверные фильтры 400',async()=>assert.equal((await get('/tasks?unknown=1')).status,400)],
['15 повторный параметр 400',async()=>assert.equal((await get('/tasks?priority=high&priority=high')).status,400)],
['16 серверная 503',async()=>assert.equal((await get('/debug/error')).status,503)],
['17 текст вместо JSON',async()=>assert.match((await get('/debug/text')).headers.get('content-type'),/text\/plain/)],
['18 CORS + OPTIONS',async()=>{assert.equal((await get('/health')).headers.get('access-control-allow-origin'),'*');assert.equal((await get('/tasks',{method:'OPTIONS'})).status,204);}],
]);}finally{await new Promise(resolve=>server.close(resolve));}
