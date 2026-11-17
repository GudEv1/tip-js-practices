import {demoTasks,variantTasks} from '../src/data.js';
import {createTaskElement,renderTaskList,renderSummary,renderEmptyState} from '../src/task-view.js';
import {getVisibleTasks} from '../src/task-selectors.js';
const results=document.querySelector('#results'),summary=document.querySelector('#summary'),frame=document.querySelector('#frame');
let passed=0,failed=0;const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),ids=doc=>[...doc.querySelectorAll('#task-list li[data-task-id]')].map(x=>Number(x.dataset.taskId));
async function check(name,fn){const li=document.createElement('li');try{await fn();passed++;li.className='pass';li.textContent='OK: '+name;}catch(e){failed++;li.className='fail';li.textContent='FAIL: '+name+': '+e.message;console.error(e)}results.append(li);}
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
async function app(variant=false){const url=new URL('./index.html',location.href);url.searchParams.set('check',String(Math.random()));if(variant)url.searchParams.set('dataset','variant');if(3===4)url.searchParams.set('mode','check');await new Promise(r=>{frame.onload=r;frame.src=url.href});return frame.contentDocument;}
await check('Безопасный текст',()=>{const li=createTaskElement({id:99,title:'<img onerror=alert(1)>',completed:false,priority:'low'});assert(li.querySelector('img')===null,'HTML исполнился');assert(li.querySelector('.task-title').textContent.includes('<img'),'Не виден текст');});
await check('Фильтры и порядок',()=>{assert(same(getVisibleTasks(demoTasks,'pending').map(t=>t.id),[4,7]),'Неверный фильтр');});
await check('Отрисовка без дублей',()=>{const ul=document.createElement('ul');renderTaskList(ul,demoTasks);renderTaskList(ul,demoTasks);assert(ul.children.length===4,'Дубли карточек');});
await check('Общий набор',async()=>{const d=await app();assert(same(ids(d),[1,4,7,10]),'Неверные ID');});
await check('Вариант 6: 6 задач',async()=>{const d=await app(true);assert(same(ids(d),[11,23,37,41,58,64]),'Неверные ID варианта');assert(d.querySelector('[data-stat="completed"]').textContent==='5','Должно быть 5 завершённых');});
await check('Фильтр В работе',async()=>{const d=await app();d.querySelector('[data-filter="pending"]').click();assert(same(ids(d),[4,7]),'Список не отфильтрован');});
await check('Смена статуса',async()=>{const d=await app();d.querySelector('[data-task-id="4"] [data-action="toggle"] .action-label').click();assert(d.querySelector('[data-task-id="4"]').classList.contains('is-completed'),'Статус не переключён');});
await check('Удаление',async()=>{const d=await app();d.querySelector('[data-task-id="7"] [data-action="delete"]').click();assert(!ids(d).includes(7),'Задача не удалена');});

summary.textContent=`Всего: ${passed+failed}. Пройдено: ${passed}. Ошибок: ${failed}.`;summary.className=failed?'fail':'pass';
