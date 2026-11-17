import { cases as shared } from './_shared-module-tests.js';
import { ApiError, createApiClient } from '../src/api-client.js';
import { createTaskApi } from '../src/task-api.js';
import { createAppController, messageForError } from '../src/app-controller.js';
import { validateTaskDraft } from '../src/form-validation.js';
import { assert, suite } from './_helpers.js';
const cats=[{id:1,name:'Учёба'},{id:2,name:'Проект'}];
const task={id:4,title:'Подготовить модель задач',completed:false,priority:'high',categoryId:2};
const view=()=>({states:[],tasks:[],categories:[],errors:[],pending:[],notices:[],forms:[],totals:[],
  setListState(...args){this.states.push(args);},setTasks(...args){this.tasks.push(args);},setCategories(x){this.categories.push(x);},
  setTotal(x){this.totals.push(x);},setFormTask(x){this.forms.push(x);},showFormErrors(x){this.errors.push(x);},
  setMutationPending(x){this.pending.push(x);},notify(...args){this.notices.push(args);}});
const fakeApi=(overrides={})=>({
  async loadInitialData(){return {tasks:[task],categories:cats,meta:{total:1}};},
  async getTasks(){return {tasks:[task],meta:{total:1}};},
  async createTask(draft){return {id:35,completed:false,...draft};},
  async updateTask(id,changes){return {...task,...changes,id};},
  async setTaskCompleted(id,completed){return {...task,id,completed};},
  async deleteTask(){return null;},async resetDemoData(){return {reset:true,total:12};},...overrides,
});
const extra=[
['27 POST сериализует JSON',async()=>{let seen;const c=createApiClient({baseUrl:'http://example.test/api',fetchFn:async(_url,opts)=>{seen=opts;return new Response('{}',{headers:{'Content-Type':'application/json'}});}});await c.requestJson('/tasks',{method:'POST',body:{title:'X'}});assert.equal(seen.method,'POST');assert.equal(new Headers(seen.headers).get('content-type'),'application/json');assert.deepEqual(JSON.parse(seen.body),{title:'X'});}],
['28 CRUD методы',async()=>{let calls=[];const a=createTaskApi({async requestJson(path,options){calls.push([path,options?.method]);return options?.method==='DELETE'?null:options?.method==='POST'&&path==='/debug/reset'?{data:{reset:true,total:12}}:{data:task};}});await a.createTask({title:'X',priority:'high',categoryId:2});await a.updateTask(4,{title:'Y'});await a.setTaskCompleted(4,true);await a.deleteTask(4);await a.resetDemoData();assert.deepEqual(calls.map(x=>x[1]),['POST','PATCH','PATCH','DELETE','POST']);}],
['29 форма нормализуется',()=>assert.deepEqual(validateTaskDraft({title:'  Новая задача  ',priority:'low',categoryId:'2'},cats),{valid:true,value:{title:'Новая задача',priority:'low',categoryId:2},errors:{}})],
['30 неверная форма отклоняется',()=>{const result=validateTaskDraft({title:'   ',priority:'urgent',categoryId:'99'},cats);assert.equal(result.valid,false);assert.deepEqual(Object.keys(result.errors).sort(),['categoryId','priority','title']);}],
['31 контроллер загрузка',async()=>{const v=view();const c=createAppController({api:fakeApi(),view:v});await c.start({});assert.equal(v.states[0][0],'loading');assert.equal(v.states.at(-1)[0],'ready');assert.equal(v.totals.at(-1),1);}],
['32 неправильная форма без POST',async()=>{const v=view();let count=0;const c=createAppController({api:fakeApi({async createTask(){count++;}}),view:v});await c.start({});await c.submit({title:' ',priority:'low',categoryId:'1'});assert.equal(count,0);assert.ok(v.errors.at(-1).title);}],
['33 создание обновляет список',async()=>{const v=view();let created,loads=0;const a=fakeApi({async createTask(x){created=x;return {id:35,...x};},async getTasks(){loads++;return {tasks:[task],meta:{total:1}};}});const c=createAppController({api:a,view:v});await c.start({});await c.submit({title:'  Клиент  ',priority:'medium',categoryId:'1'});assert.deepEqual(created,{title:'Клиент',priority:'medium',categoryId:1});assert.deepEqual(v.pending.slice(-2),[true,false]);assert.equal(loads,1);assert.equal(v.notices.at(-1)[1],'success');}],
];
await suite('модулей',[...shared,...extra]);
