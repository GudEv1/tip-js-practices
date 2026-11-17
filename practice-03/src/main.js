import {demoTasks,variantTasks} from './data.js';
import {findTaskById,getTaskStats,setTaskCompleted,removeTask} from './task-service.js';
import {getVisibleTasks} from './task-selectors.js';
import {renderTaskList,renderSummary,renderEmptyState} from './task-view.js';
const params=new URLSearchParams(location.search);
const initialTasks=params.get('dataset')==='variant'?variantTasks:demoTasks;
let currentTasks=initialTasks.map(t=>({...t}));let currentFilter='all';
const list=document.querySelector('#task-list'),filters=document.querySelector('#task-filters');
const summary=document.querySelector('#task-summary'),empty=document.querySelector('#empty-message'),message=document.querySelector('#operation-message');
function renderApp(){const visible=getVisibleTasks(currentTasks,currentFilter);renderTaskList(list,visible);renderSummary(summary,getTaskStats(currentTasks),visible.length);renderEmptyState(empty,currentTasks.length,visible.length);for(const b of filters.querySelectorAll('[data-filter]')){const on=b.dataset.filter===currentFilter;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on));}}
function restoreTaskFocus(id,action){(list.querySelector(`[data-task-id="${id}"] [data-action="${action}"]`)??filters.querySelector(`[data-filter="${currentFilter}"]`))?.focus();}
function handleFilterClick(event){const button=event.target.closest?.('button[data-filter]');if(!button||!filters.contains(button))return;if(!['all','pending','completed'].includes(button.dataset.filter))return;currentFilter=button.dataset.filter;message.textContent='';renderApp();button.focus();}
function handleTaskListClick(event){const b=event.target.closest?.('button[data-action]');if(!b||!list.contains(b)||!['toggle','delete'].includes(b.dataset.action))return;const card=b.closest('li[data-task-id]');const id=Number(card?.dataset.taskId);if(!Number.isSafeInteger(id)||id<=0){message.textContent='Неверный идентификатор.';return;}const task=findTaskById(currentTasks,id);if(!task){message.textContent='Задача не найдена.';return;}const result=b.dataset.action==='toggle'?setTaskCompleted(currentTasks,id,!task.completed):removeTask(currentTasks,id);if(!result.ok){message.textContent=result.error;return;}currentTasks=result.tasks;message.textContent='';renderApp();restoreTaskFocus(id,b.dataset.action);}
filters.addEventListener('click',handleFilterClick);list.addEventListener('click',handleTaskListClick);renderApp();
window.practice03={getState:()=>({tasks:currentTasks.map(t=>({...t})),filter:currentFilter}),renderApp};
