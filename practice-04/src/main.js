import {demoTasks,variantTasks} from './data.js';
import {findTaskById,getTaskStats,addTask,updateTask,setTaskCompleted,removeTask} from './task-service.js';
import {getVisibleTasks} from './task-selectors.js';
import {renderTaskList,renderSummary,renderEmptyState} from './task-view.js';
import {validateTaskDraft} from './form-validation.js';
import {loadTasks,saveTasks,removeSavedTasks} from './task-storage.js';
const params=new URLSearchParams(location.search);
const dataset=params.get('dataset')==='variant'?'variant':'demo';
const initialTasks=dataset==='variant'?variantTasks:demoTasks;
const storageKey=`tip-js-practice-04:${params.get('mode')==='check'?'checks:':''}${dataset}`;
const initial=loadTasks(localStorage,storageKey,initialTasks);
let currentTasks=initial.tasks;let currentFilter='all',editingId=null;
const list=document.querySelector('#task-list'),filters=document.querySelector('#task-filters');
const summary=document.querySelector('#task-summary'),empty=document.querySelector('#empty-message');
const message=document.querySelector('#operation-message'),storageMessage=document.querySelector('#storage-status');
const form=document.querySelector('#task-form'), idField=document.querySelector('#task-id'), titleField=document.querySelector('#task-title');
const priorityField=document.querySelector('#task-priority'),cancel=document.querySelector('#cancel-edit');
const submitButton=document.querySelector('#form-submit'),heading=document.querySelector('#editor-heading');
storageMessage.classList.toggle('is-warning', initial.source==='fallback');
storageMessage.textContent=initial.source==='fallback'?'Сохранение повреждено: восстановлен исходный список.':initial.source==='storage'?'Данные восстановлены из localStorage.':'Загружен исходный набор задач.';
function renderApp(){const visible=getVisibleTasks(currentTasks,currentFilter);renderTaskList(list,visible);renderSummary(summary,getTaskStats(currentTasks),visible.length);renderEmptyState(empty,currentTasks.length,visible.length);for(const b of filters.querySelectorAll('[data-filter]')){const on=b.dataset.filter===currentFilter;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on));}}
function setMessage(value=''){message.textContent=value;}
function showFormErrors(errors={}){for(const key of ['id','title','priority']){const node=form.querySelector(`[data-error-for="${key}"]`),field=form.elements.namedItem(key);node.textContent=errors[key]??'';if(errors[key])field.setAttribute('aria-invalid','true');else field.removeAttribute('aria-invalid');field.setCustomValidity(errors[key]??'');}}
function setFormMode(id=null){if(id===null){editingId=null;form.reset();idField.disabled=false;heading.textContent='Добавление задачи';submitButton.textContent='Добавить задачу';cancel.hidden=true;showFormErrors({});idField.focus();return;}const task=findTaskById(currentTasks,id);if(!task){setMessage('Задача для редактирования не найдена.');return;}editingId=id;idField.value=String(id);idField.disabled=true;titleField.value=task.title;priorityField.value=task.priority;heading.textContent='Редактирование задачи';submitButton.textContent='Сохранить изменения';cancel.hidden=false;showFormErrors({});titleField.focus();}
function save(){const result=saveTasks(localStorage,storageKey,currentTasks);if(!result.ok)storageMessage.textContent='Предупреждение: данные не сохранены. '+result.error;else storageMessage.textContent='Список сохранён в localStorage.';}
function handleFormSubmit(event){event.preventDefault();const fd=new FormData(form);const draft={id:editingId===null?fd.get('id'):String(editingId),title:fd.get('title'),priority:fd.get('priority')};const checked=validateTaskDraft(draft,currentTasks,editingId);showFormErrors(checked.ok?{}:checked.errors);if(!checked.ok)return;const {id,title,priority}=checked.value;const result=editingId===null?addTask(currentTasks,id,title,priority):updateTask(currentTasks,id,title,priority);if(!result.ok){setMessage(result.error);return;}currentTasks=result.tasks;setFormMode(null);save();setMessage('Операция выполнена.');renderApp();}
function handleFilterClick(event){const b=event.target.closest?.('button[data-filter]');if(!b||!filters.contains(b)||!['all','pending','completed'].includes(b.dataset.filter))return;currentFilter=b.dataset.filter;setMessage();renderApp();b.focus();}
function handleTaskListClick(event){const b=event.target.closest?.('button[data-action]');if(!b||!list.contains(b))return;const action=b.dataset.action;if(!['toggle','edit','delete'].includes(action))return;const id=Number(b.closest('li[data-task-id]')?.dataset.taskId);if(!Number.isSafeInteger(id)||id<=0){setMessage('Некорректный id.');return;}const task=findTaskById(currentTasks,id);if(!task){setMessage('Задача не найдена.');return;}if(action==='edit'){setFormMode(id);return;}const result=action==='toggle'?setTaskCompleted(currentTasks,id,!task.completed):removeTask(currentTasks,id);if(!result.ok){setMessage(result.error);return;}currentTasks=result.tasks;if(action==='delete'&&editingId===id)setFormMode(null);save();setMessage();renderApp();(list.querySelector(`[data-task-id="${id}"] [data-action="${action}"]`)??filters.querySelector(`[data-filter="${currentFilter}"]`))?.focus();}
form.addEventListener('submit',handleFormSubmit);
form.addEventListener('input',event=>{const name=event.target?.name;if(!['id','title','priority'].includes(name))return;const node=form.querySelector(`[data-error-for="${name}"]`);node.textContent='';event.target.removeAttribute('aria-invalid');event.target.setCustomValidity('');});
filters.addEventListener('click',handleFilterClick);list.addEventListener('click',handleTaskListClick);cancel.addEventListener('click',()=>setFormMode(null));
document.querySelector('#reset-data').addEventListener('click',()=>{const res=removeSavedTasks(localStorage,storageKey);if(!res.ok){storageMessage.textContent=res.error;return;}currentTasks=initialTasks.map(t=>({...t}));setFormMode(null);currentFilter='all';storageMessage.classList.remove('is-warning');storageMessage.textContent='Исходный набор восстановлен.';setMessage();renderApp();});
renderApp();window.practice04={getState:()=>({tasks:currentTasks.map(t=>({...t})),filter:currentFilter,editingId,storageKey}),renderApp};
