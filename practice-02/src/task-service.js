const goodId = (id) => Number.isSafeInteger(id) && id > 0;
const goodTitle = (title) => typeof title === 'string' && title.trim().length >= 1 && title.trim().length <= 100;
const goodPriority = (p) => ['low','medium','high'].includes(p);
const fail = (error) => ({ok:false,error});

export function createTask(id,title,priority='medium') {
  if (!goodId(id)) return fail('Некорректный идентификатор задачи.');
  if (!goodTitle(title)) return fail('Название: строка от 1 до 100 символов.');
  if (!goodPriority(priority)) return fail('Недопустимый приоритет.');
  return {ok:true,task:{id,title:title.trim(),completed:false,priority}};
}
export function findTaskById(tasks,id) { return tasks.find(task=>task.id === id); }
export function getPendingTasks(tasks) { return tasks.filter(task=>task.completed === false); }
export function getTaskTitles(tasks) { return tasks.map(task=>task.title); }
export function getTaskStats(tasks) {
  const total=tasks.length;
  const completed=tasks.filter(t=>t.completed===true).length;
  return {total,completed,pending:total-completed,progress:total?completed/total*100:0};
}
export function addTask(tasks,id,title,priority='medium') {
  const result=createTask(id,title,priority);
  if(!result.ok) return result;
  if(findTaskById(tasks,id)) return fail('Задача с таким id уже есть.');
  return {ok:true,tasks:[...tasks,result.task]};
}
export function setTaskCompleted(tasks,id,completed) {
  if(!goodId(id)) return fail('Некорректный id.');
  if(typeof completed!=='boolean') return fail('Статус должен быть логическим.');
  if(!findTaskById(tasks,id)) return fail('Задача не найдена.');
  return {ok:true,tasks:tasks.map(task=>task.id===id?{...task,completed}:task)};
}
export function renameTask(tasks,id,title) {
  if(!goodId(id)) return fail('Некорректный id.');
  if(!goodTitle(title)) return fail('Некорректное название.');
  if(!findTaskById(tasks,id)) return fail('Задача не найдена.');
  return {ok:true,tasks:tasks.map(task=>task.id===id?{...task,title:title.trim()}:task)};
}
export function removeTask(tasks,id) {
  if(!goodId(id)) return fail('Некорректный id.');
  if(!findTaskById(tasks,id)) return fail('Задача не найдена.');
  return {ok:true,tasks:tasks.filter(task=>task.id!==id)};
}
// ПР4 расширяет сервис, не меняя функции ПР2.
export function updateTask(tasks,id,title,priority) {
  const r=createTask(id,title,priority);
  if(!r.ok) return fail(r.error);
  if(!findTaskById(tasks,id)) return fail('Задача не найдена.');
  return {ok:true,tasks:tasks.map(t=>t.id===id?{...t,title:r.task.title,priority:r.task.priority}:t)};
}
