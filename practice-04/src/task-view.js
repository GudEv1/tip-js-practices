import { getTaskStats } from './task-service.js';
const priorities={low:'Низкий',medium:'Средний',high:'Высокий'};
function el(name,className,text) {const node=document.createElement(name); if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node;}
export function createTaskElement(task) {
 const li=el('li','task-card'+(task.completed?' is-completed':'')); li.dataset.taskId=String(task.id);
 li.append(el('h3','task-title',task.title));
 const status=el('span','task-status',task.completed?'Выполнена':'В работе');
 const priority=el('span','task-priority',priorities[task.priority]??task.priority);
 li.append(status,priority);
 const actions=el('div','task-actions');
 for(const [action,text] of [['toggle','Выполнена'],['edit','Изменить'],['delete','Удалить']]) {
   if(action==='edit'&&document.body.dataset.practice==='03')continue;
   const button=el('button','');button.type='button';button.dataset.action=action;
   if(action==='toggle')button.setAttribute('aria-pressed',String(task.completed));
   button.append(el('span','action-label',text));actions.append(button);
 }
 li.append(actions);return li;
}
export function renderTaskList(list,tasks) {list.replaceChildren(...tasks.map(createTaskElement));}
export function renderSummary(summary,tasksOrStats,visibleCount) {
 const stats=Array.isArray(tasksOrStats)?getTaskStats(tasksOrStats):tasksOrStats;
 for(const [key,value] of Object.entries({...stats,visible:visibleCount})) {
   const node=summary.querySelector(`[data-stat="${key}"]`);
   if(node)node.textContent=key==='progress'?`${value.toFixed(1)}%`:String(value);
 }
}
export function renderEmptyState(container,total,visibleCount) {
 if(visibleCount>0){container.hidden=true;container.textContent='';return;}
 container.hidden=false;container.textContent=total===0?'Список задач пуст.':'Нет задач по выбранному фильтру.';
}
