import { createApiServer } from '../api/server.mjs';
import { createApiClient } from '../src/api-client.js';
import { createTaskApi } from '../src/task-api.js';
import { assert,suite,serve,expectKind } from './_helpers.js';
const server=createApiServer(),base=await serve(server);
const client=createApiClient({baseUrl:base,timeoutMs:1200}),api=createTaskApi(client);
try{await suite('интеграции',[
['01 health',async()=>assert.equal((await client.requestJson('/health')).data.status,'ok')],
['02 initial data',async()=>{const x=await api.loadInitialData();assert.equal(x.tasks.length,12);assert.equal(x.categories.length,3);}],
['03 фильтры',async()=>assert.deepEqual((await api.getTasks({completed:false,priority:'high',categoryId:2})).tasks.map(x=>x.id),[4,34])],
['04 категории',async()=>assert.equal((await api.getCategories()).length,3)],
['05 not found',async()=>{const e=await expectKind(()=>api.getTaskById(999),'http');assert.equal(e.status,404);}],
['06 create id 35',async()=>{const item=await api.createTask({title:'  Подключить браузер  ',priority:'high',categoryId:2});assert.equal(item.id,35);assert.equal(item.title,'Подключить браузер');}],
['07 GET возвращает созданную',async()=>assert.equal((await api.getTaskById(35)).id,35)],
['08 PATCH название',async()=>assert.equal((await api.updateTask(35,{title:'Изменено'})).title,'Изменено')],
['09 PATCH completed',async()=>assert.equal((await api.setTaskCompleted(35,true)).completed,true)],
['10 DELETE 204',async()=>assert.equal(await api.deleteTask(35),null)],
['11 DELETE реально удалило',async()=>{const e=await expectKind(()=>api.getTaskById(35),'http');assert.equal(e.status,404);}],
['12 неверное тело 400',async()=>{const e=await expectKind(()=>api.createTask({title:'   ',priority:'low',categoryId:1}),'http');assert.equal(e.code,'VALIDATION_ERROR');}],
['13 reset',async()=>assert.deepEqual(await api.resetDemoData(),{reset:true,total:12})],
['14 timeout и отмена',async()=>{await expectKind(()=>client.requestJson('/debug/delay',{query:{ms:200},timeoutMs:20}),'timeout');const controller=new AbortController();const pending=client.requestJson('/debug/delay',{query:{ms:200},signal:controller.signal});controller.abort();await expectKind(()=>pending,'aborted');}],
]);}finally{await new Promise(resolve=>server.close(resolve));}
