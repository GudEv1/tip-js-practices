export const STORAGE_VERSION=1;
export function isValidTaskList(value){
 if(!Array.isArray(value))return false;
 const ids=new Set();for(const t of value){
  if(!t||typeof t!=='object'||Array.isArray(t)||!Number.isSafeInteger(t.id)||t.id<=0||ids.has(t.id)||typeof t.title!=='string'||t.title.trim()!==t.title||t.title.length<1||t.title.length>100||typeof t.completed!=='boolean'||!['low','medium','high'].includes(t.priority))return false;
  ids.add(t.id);
 }return true;
}
const copy=(tasks)=>tasks.map(t=>({...t}));
export function loadTasks(storage,key,fallbackTasks){
 const initial=copy(fallbackTasks);
 try{const raw=storage.getItem(key);if(raw===null)return {ok:true,source:'initial',tasks:initial};const envelope=JSON.parse(raw);if(!envelope||envelope.version!==1||!isValidTaskList(envelope.tasks))throw new Error('Неверная версия или структура сохранённого списка.');return {ok:true,source:'storage',tasks:copy(envelope.tasks)};}
 catch(error){return {ok:false,source:'fallback',tasks:initial,error:String(error.message??error)};}
}
export function saveTasks(storage,key,tasks){
 if(!isValidTaskList(tasks))return {ok:false,error:'Некорректный список задач.'};
 try{storage.setItem(key,JSON.stringify({version:1,tasks}));return {ok:true};}catch(error){return {ok:false,error:String(error.message??error)};}
}
export function removeSavedTasks(storage,key){
 try{storage.removeItem(key);return {ok:true};}catch(error){return {ok:false,error:String(error.message??error)};}
}
