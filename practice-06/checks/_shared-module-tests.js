import { ApiError, buildUrl, createApiClient } from '../src/api-client.js';
import { createTaskApi } from '../src/task-api.js';
import { assert, suite, expectKind } from './_helpers.js';
const base='http://example.test/api';
const task=(overrides={})=>({id:4,title:'Подготовить модель задач',completed:false,priority:'high',categoryId:2,...overrides});
const cat=(id=2)=>({id,name:id===1?'Учёба':'Проект'});
const ok=(payload,status=200)=>new Response(JSON.stringify(payload),{status,headers:{'Content-Type':'application/json; charset=utf-8'}});
const client=(fetchFn,timeoutMs=500)=>createApiClient({baseUrl:base,fetchFn,timeoutMs});
const api=(reply)=>createTaskApi({requestJson:async (...args)=>typeof reply==='function'?reply(...args):reply});
const never=(_url,{signal})=>new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>resolve(ok({data:[]})),2000);
  const stop=()=>{clearTimeout(timer);reject(signal.reason??new DOMException('Aborted','AbortError'));};
  if(signal.aborted)stop();else signal.addEventListener('abort',stop,{once:true});
});
export const cases=[
['01 URL соединяет пути',()=>assert.equal(buildUrl(`${base}/`,'/tasks'),`${base}/tasks`)],
['02 URL кодирует false, 0, кириллицу',()=>{const u=new URL(buildUrl(base,'tasks',{completed:false,categoryId:0,q:'API & ошибки',none:null,empty:''}));assert.equal(u.searchParams.get('completed'),'false');assert.equal(u.searchParams.get('categoryId'),'0');assert.equal(u.searchParams.get('q'),'API & ошибки');assert.equal(u.searchParams.has('none'),false);assert.equal(u.searchParams.has('empty'),false);}],
['03 query не меняется',()=>{const q=Object.freeze({completed:false});buildUrl(base,'tasks',q);assert.deepEqual(q,{completed:false});}],
['04 некорректный baseUrl',()=>{for(const u of ['/api','ftp://x/a',`${base}?q=1`])assert.throws(()=>buildUrl(u,'x'),TypeError);}],
['05 некорректный path',()=>{for(const p of ['', 'https://example.test/x'])assert.throws(()=>buildUrl(base,p),TypeError);}],
['06 некорректный query',()=>assert.throws(()=>buildUrl(base,'x',[]),TypeError)],
['07 конфигурация клиента',()=>{for(const opts of [{},{baseUrl:'/api'},{baseUrl:base,fetchFn:null},{baseUrl:base,timeoutMs:0},{baseUrl:base,timeoutMs:1.5}])assert.throws(()=>createApiClient(opts),TypeError);}],
['08 GET: accept и signal',async()=>{let seen;await client(async(url,options)=>{seen={url,options};return ok({data:[]});}).requestJson('/tasks',{query:{completed:false}});assert.equal(seen.url,`${base}/tasks?completed=false`);assert.equal(seen.options.method,'GET');assert.equal(new Headers(seen.options.headers).get('accept'),'application/json');assert.ok(seen.options.signal instanceof AbortSignal);}],
['09 успешный JSON',async()=>assert.deepEqual(await client(async()=>ok({data:[task()]})).requestJson('/tasks'),{data:[task()]})],
['10 204 без тела',async()=>assert.equal(await client(async()=>new Response(null,{status:204})).requestJson('/empty'),null)],
['11 HTTP 404 fields',async()=>{const c=client(async()=>ok({error:{code:'TASK_NOT_FOUND',message:'Отсутствует',details:{id:999}}},404));const error=await expectKind(()=>c.requestJson('/tasks/999'),'http');assert.equal(error.status,404);assert.equal(error.code,'TASK_NOT_FOUND');assert.deepEqual(error.details,{id:999});}],
['12 HTTP 502 без JSON',async()=>{const e=await expectKind(()=>client(async()=>new Response('bad',{status:502})).requestJson('/tasks'),'http');assert.equal(e.status,502);}],
['13 неверный Content-Type',async()=>expectKind(()=>client(async()=>new Response('text',{headers:{'Content-Type':'text/plain'}})).requestJson('/tasks'),'invalid-response')],
['14 повреждённый JSON',async()=>{const e=await expectKind(()=>client(async()=>new Response('{bad',{headers:{'Content-Type':'application/json'}})).requestJson('/tasks'),'invalid-response');assert.ok(e.cause instanceof SyntaxError);}],
['15 не Response',async()=>expectKind(()=>client(async()=>({ok:true,status:200})).requestJson('/tasks'),'invalid-response')],
['16 network с cause',async()=>{const source=new TypeError('fetch failed');const e=await expectKind(()=>client(async()=>{throw source;}).requestJson('/tasks'),'network');assert.equal(e.cause,source);}],
['17 тайм-аут',async()=>expectKind(()=>client(never,20).requestJson('/slow'),'timeout')],
['18 внешний AbortController',async()=>{const controller=new AbortController();const pending=client(never,1000).requestJson('/slow',{signal:controller.signal});controller.abort();await expectKind(()=>pending,'aborted');}],
['19 createTaskApi требует requestJson',()=>{for(const arg of [undefined,{}, {requestJson:1}])assert.throws(()=>createTaskApi(arg),TypeError);}],
['20 нормализация фильтров',async()=>{let seen;await api((path,options)=>{seen={path,options};return {data:[task()],meta:{total:1}};}).getTasks({completed:false,priority:'high',categoryId:2,q:' модель '});assert.equal(seen.path,'/tasks');assert.deepEqual(seen.options.query,{completed:false,priority:'high',categoryId:2,q:'модель'});}],
['21 неверные фильтры',async()=>{const a=api({});for(const filter of [null,[],{completed:'false'},{categoryId:'2'},{priority:'urgent'},{q:'x'.repeat(101)},{owner:1}])await assert.rejects(()=>a.getTasks(filter),TypeError);}],
['22 getTaskById',async()=>assert.deepEqual(await api({data:task()}).getTaskById(4),task())],
['23 getTaskById проверяет id',async()=>{const a=api({});for(const id of [0,-1,'4',1.5])await assert.rejects(()=>a.getTaskById(id),TypeError);}],
['24 getCategories',async()=>assert.deepEqual(await api({data:[cat()],meta:{total:1}}).getCategories(),[cat()])],
['25 некорректные схемы',async()=>{await expectKind(()=>api({data:[task({id:4}),task({id:4})],meta:{total:2}}).getTasks(),'invalid-response');await expectKind(()=>api({data:[{id:3}],meta:{total:1}}).getCategories(),'invalid-response');}],
['26 параллельный Promise.all',async()=>{const seen=[];const a=api(async(path)=>{seen.push(path);return path==='/tasks'?{data:[task()],meta:{total:1}}:{data:[cat()],meta:{total:1}};});const r=await a.loadInitialData();assert.deepEqual(seen,['/tasks','/categories']);assert.equal(r.meta.total,1);}],
];

