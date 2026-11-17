export function getVisibleTasks(tasks,filter='all') {
 if(filter==='all')return [...tasks];
 if(filter==='pending')return tasks.filter(t=>t.completed===false);
 if(filter==='completed')return tasks.filter(t=>t.completed===true);
 throw new RangeError('Неизвестный фильтр задач.');
}
