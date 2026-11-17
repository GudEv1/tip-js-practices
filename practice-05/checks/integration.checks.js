import { createApiServer } from '../api/server.mjs';
import { createApiClient } from '../src/api-client.js';
import { createTaskApi } from '../src/task-api.js';
import { assert,suite,serve,expectKind } from './_helpers.js';
const server=createApiServer(),base=await serve(server);
const client=createApiClient({baseUrl:base,timeoutMs:1000}),api=createTaskApi(client);
try{await suite('интеграции',[
['01 health',async()=>assert.equal((await client.requestJson('/health')).data.status,'ok')],
['02 categories',async()=>assert.equal((await api.getCategories()).length,3)],
['03 tasks',async()=>assert.equal((await api.getTasks()).tasks.length,12)],
['04 filter false high',async()=>assert.deepEqual((await api.getTasks({completed:false,priority:'high'})).tasks.map(x=>x.id),[4,13,34])],
['05 category filter',async()=>assert.equal((await api.getTasks({categoryId:2})).meta.total,6)],
['06 search',async()=>assert.deepEqual((await api.getTasks({q:'ПРОВЕР'})).tasks.map(x=>x.id),[7,16])],
['07 getTaskById',async()=>assert.equal((await api.getTaskById(25)).id,25)],
['08 not found',async()=>{const err=await expectKind(()=>api.getTaskById(999),'http');assert.equal(err.status,404);assert.equal(err.code,'TASK_NOT_FOUND');}],
['09 debug 503',async()=>{const err=await expectKind(()=>client.requestJson('/debug/error'),'http');assert.equal(err.status,503);}],
['10 неверный JSON',async()=>expectKind(()=>client.requestJson('/debug/invalid-json'),'invalid-response')],
['11 текст вместо JSON',async()=>expectKind(()=>client.requestJson('/debug/text'),'invalid-response')],
['12 timeout',async()=>expectKind(()=>client.requestJson('/debug/delay',{query:{ms:200},timeoutMs:20}),'timeout')],
['13 отмена',async()=>{const controller=new AbortController();const pending=client.requestJson('/debug/delay',{query:{ms:200},signal:controller.signal});controller.abort();await expectKind(()=>pending,'aborted');}],
]);}finally{await new Promise(resolve=>server.close(resolve));}
