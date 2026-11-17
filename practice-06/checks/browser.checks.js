import { createTaskElement, renderTaskList } from '../src/task-view.js';
const API = 'http://127.0.0.1:5505/api';
const results=document.querySelector('#check-results'), log=document.querySelector('#check-log');
const summary=document.querySelector('#check-summary'), frame=document.querySelector('#test-frame');
const fixture=document.querySelector('#test-fixture');
let passed=0, failed=0, run=0;
const assert=(x,m='Условие не выполнено')=>{if(!x)throw new Error(m);};
const same=(actual,expected,m='Значения отличаются')=>assert(JSON.stringify(actual)===JSON.stringify(expected),`${m}: получено ${JSON.stringify(actual)}, ожидалось ${JSON.stringify(expected)}`);
const requireNode=(root,selector)=>{const el=root.querySelector(selector);assert(el,`Не найден элемент: ${selector}`);return el;};
function task(overrides={}){return {id:4,title:'Подготовить модель задач',completed:false,priority:'high',categoryId:2,...overrides};}
const categories=[{id:1,name:'Учёба'},{id:2,name:'Проект'},{id:3,name:'Организация'}];
const ids=(doc)=>[...doc.querySelectorAll('#task-list > [data-task-id]')].map((x)=>Number(x.dataset.taskId));
async function until(fn,message,timeout=5000){const start=performance.now();while(performance.now()-start<timeout){const v=fn();if(v)return v;await new Promise(r=>setTimeout(r,25));}throw new Error(message);}
async function check(name,fn){fixture.replaceChildren();const li=document.createElement('li');try{await fn();passed++;li.className='check-pass';li.textContent=`OK: ${name}`;}catch(error){failed++;li.className='check-fail';li.textContent=`FAIL: ${name} — ${error.message}`;console.error(name,error);}results.append(li);log.textContent=[...results.children].map(x=>x.textContent).join('\n');}
async function reset(){const response=await fetch(`${API}/debug/reset`,{method:'POST'});assert(response.ok,'Не удалось сбросить данные API');}
async function app({doReset=true,api=API}={}){
  if(doReset)await reset(); run++;
  const url=new URL('./index.html',location.href);url.searchParams.set('run',String(run));if(api!==API)url.searchParams.set('api',api);
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Iframe не загрузился')),5000);frame.addEventListener('load',()=>{clearTimeout(timer);resolve();},{once:true});frame.src=url.href;});
  const doc=frame.contentDocument,win=frame.contentWindow;
  const hook=await until(()=>win.practice06??(doc.querySelector('#list-state')?.dataset.kind==='error'?{startupError:true}:null),'Приложение не создало window.practice06');
  assert(!hook.startupError,'Приложение не запустилось');await hook.ready;return {doc,win};
}
function change(doc,selector,value){const el=requireNode(doc,selector);el.value=value;el.dispatchEvent(new doc.defaultView.Event('input',{bubbles:true}));el.dispatchEvent(new doc.defaultView.Event('change',{bubbles:true}));}
const submit=(doc,selector)=>requireNode(doc,selector).requestSubmit();
const click=(doc,selector)=>requireNode(doc,selector).click();
await check('Карточка содержит безопасный текст и три действия',()=>{
 const title='<img src=x onerror="alert(1)"> & API';const el=createTaskElement(task({title}),categories[1]);
 assert(el instanceof HTMLLIElement);same(el.dataset.taskId,'4');same(requireNode(el,'.task-title').textContent,title);
 same(requireNode(el,'.task-title').children.length,0);
 for(const x of ['toggle','edit','delete'])requireNode(el,`button[data-action="${x}"] .action-label`);
 same(requireNode(el,'.task-category').textContent,'Проект');
});
await check('Повторная отрисовка списка не накапливает карточки',()=>{
 const list=document.createElement('ul');fixture.append(list);
 renderTaskList(list,[task(),task({id:7})],categories);renderTaskList(list,[task({id:10})],categories);
 same([...list.children].map((el)=>Number(el.dataset.taskId)),[10]);
});
await check('Начальная загрузка показывает 12 задач и 3 категории',async()=>{
 const {doc}=await app();same(ids(doc),[1,4,7,10,13,16,19,22,25,28,31,34]);
 same(requireNode(doc,'#task-total').textContent,'12');same(requireNode(doc,'#task-category').options.length,4);
 same(requireNode(doc,'#list-state').dataset.kind,'ready');same(requireNode(doc,'#list-panel').getAttribute('aria-busy'),'false');
});
await check('Фильтры формируют новый серверный запрос',async()=>{
 const {doc}=await app();change(doc,'#filter-completed','false');change(doc,'#filter-priority','high');change(doc,'#filter-category','2');
 submit(doc,'#filters-form');await until(()=>ids(doc).length===2,'Фильтр не применился');same(ids(doc),[4,34]);same(requireNode(doc,'#task-total').textContent,'2');
});
await check('Поиск без результатов показывает empty, а сброс возвращает список',async()=>{
 const {doc}=await app();change(doc,'#filter-query','такой задачи точно нет');submit(doc,'#filters-form');
 await until(()=>requireNode(doc,'#list-state').dataset.kind==='empty','Нет состояния empty');
 same(requireNode(doc,'#task-total').textContent,'0');click(doc,'#clear-filters');await until(()=>ids(doc).length===12,'Не восстановились задачи');
});
await check('Корректная форма создаёт задачу с серверным id',async()=>{
 const {doc}=await app();change(doc,'#task-title','  Подключить браузер  ');change(doc,'#task-priority','high');change(doc,'#task-category','2');
 submit(doc,'#task-form');await until(()=>doc.querySelector('[data-task-id="35"]'),'Задача не появилась');
 same(requireNode(doc,'[data-task-id="35"] .task-title').textContent,'Подключить браузер');
 same(requireNode(doc,'#task-title').value,'');same(requireNode(doc,'#task-total').textContent,'13');
});
await check('Ошибки формы не отправляют запрос и связаны с полями',async()=>{
 const {doc}=await app();change(doc,'#task-title','   ');change(doc,'#task-priority','low');change(doc,'#task-category','1');
 submit(doc,'#task-form');await until(()=>requireNode(doc,'#task-title-error').textContent,'Нет ошибки title');
 same(ids(doc).length,12);same(requireNode(doc,'#task-title').getAttribute('aria-invalid'),'true');
});
await check('Редактирование заполняет форму и сохраняет изменения',async()=>{
 const {doc}=await app();click(doc,'[data-task-id="4"] [data-action="edit"]');
 same(requireNode(doc,'#task-title').value,'Подготовить модель задач');same(requireNode(doc,'#form-submit').textContent,'Сохранить изменения');
 assert(!requireNode(doc,'#cancel-edit').hidden);change(doc,'#task-title','Обновить модель задач');
 change(doc,'#task-priority','low');change(doc,'#task-category','1');submit(doc,'#task-form');
 await until(()=>requireNode(doc,'[data-task-id="4"] .task-title').textContent==='Обновить модель задач','Изменения не появились');
 same(requireNode(doc,'[data-task-id="4"] .task-category').textContent,'Учёба');
 same(requireNode(doc,'#form-submit').textContent,'Добавить задачу');
});
await check('Отмена редактирования возвращает режим создания',async()=>{
 const {doc}=await app();click(doc,'[data-task-id="7"] [data-action="edit"]');click(doc,'#cancel-edit');
 same(requireNode(doc,'#task-title').value,'');same(requireNode(doc,'#form-submit').textContent,'Добавить задачу');assert(requireNode(doc,'#cancel-edit').hidden);
});
await check('Смена статуса подтверждается сервером',async()=>{
 const {doc}=await app();assert(!requireNode(doc,'[data-task-id="4"]').classList.contains('is-completed'));
 click(doc,'[data-task-id="4"] [data-action="toggle"]');
 await until(()=>requireNode(doc,'[data-task-id="4"]').classList.contains('is-completed'),'Статус не изменился');
 const payload=await(await fetch(`${API}/tasks/4`)).json();assert(payload.data.completed);
});
await check('Удаление подтверждается и сохраняется на сервере',async()=>{
 const {doc,win}=await app();win.confirm=()=>true;click(doc,'[data-task-id="7"] [data-action="delete"]');
 await until(()=>!doc.querySelector('[data-task-id="7"]'),'Задача не удалена');same((await fetch(`${API}/tasks/7`)).status,404);
});
await check('Сброс восстанавливает учебный набор',async()=>{
 const {doc,win}=await app();win.confirm=()=>true;click(doc,'[data-task-id="7"] [data-action="delete"]');
 await until(()=>!doc.querySelector('[data-task-id="7"]'),'Удаление не выполнено');click(doc,'#reset-data');
 await until(()=>ids(doc).length===12,'Исходный набор не восстановлен');assert(doc.querySelector('[data-task-id="7"]'));
});
await check('Недоступный API показывает error и кнопку повтора',async()=>{
 const {doc}=await app({doReset:false,api:'http://127.0.0.1:1/api'});
 same(requireNode(doc,'#list-state').dataset.kind,'error');assert(!requireNode(doc,'#retry-load').hidden);
 assert(requireNode(doc,'#list-state').textContent.includes('соединения'));
});
await check('Приложение не использует localStorage как источник данных',async()=>{
 localStorage.setItem('tip-js-practice-06:trap',JSON.stringify([{id:999}]));const {doc}=await app();
 assert(!ids(doc).includes(999));localStorage.removeItem('tip-js-practice-06:trap');
});
await reset().catch(()=>{});
summary.textContent=`Всего: ${passed+failed}. Пройдено: ${passed}. Ошибок: ${failed}.`;
summary.className=failed?'check-fail':'check-pass';
