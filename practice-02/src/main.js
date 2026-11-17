import {demoTasks,variantTasks,variantNumber} from './data.js';
import {getTaskStats,addTask,setTaskCompleted,renameTask,removeTask,findTaskById} from './task-service.js';
function scenario(name,initial,priority){
 let tasks=initial;
 console.log(`\n${name}, вариант ${variantNumber}:`,tasks);
 console.log('Начальная сводка:',getTaskStats(tasks));
 for(const operation of [
  ()=>addTask(tasks,80,'Проверить навигацию и меню',priority),
  ()=>setTaskCompleted(tasks,11,true),
  ()=>renameTask(tasks,23,'Проверить экран входа и сообщения об ошибках'),
  ()=>removeTask(tasks,37),
  ()=>addTask(tasks,80,'Дубликат ID',priority),
 ]) {
  const result=operation();
  if(result.ok) tasks=result.tasks;
  else console.log('Ожидаемый отказ:',result.error);
 }
 console.log('Итог:',tasks,'\nСводка:',getTaskStats(tasks));
 console.log('Исходный массив не менялся:',initial.length===6);
}
console.log('Общий набор:',getTaskStats(demoTasks),'Задача 4:',findTaskById(demoTasks,4));
scenario('Проверка пользовательского интерфейса',variantTasks,'low');
