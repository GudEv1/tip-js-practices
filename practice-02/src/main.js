import { demoTasks, variantTasks, variantNumber } from './data.js';
import {
  getTaskTitles,
  getPendingTasks,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask
} from './task-service.js';

console.log(`=== ОБЩИЙ СЦЕНАРИЙ (Вариант ${variantNumber}) ===\n`);

let currentTasks = demoTasks;

// 1. Исходное состояние
let stats = getTaskStats(currentTasks);
console.log("1. Исходный набор:");
console.log(`   Всего: ${stats.total}, Выполнено: ${stats.completed}, Осталось: ${stats.pending}`);
console.log(`   Прогресс: ${stats.total > 0 ? stats.progress.toFixed(1) : 0}%`);
console.log(`   Названия: ${getTaskTitles(currentTasks).join(', ')}`);

// 2. Добавить задачу
let result = addTask(currentTasks, 20, "Добавить проверку", "high");
if (result.ok) {
  currentTasks = result.tasks;
  console.log("\n2. Добавлена задача id=20. Всего задач:", getTaskStats(currentTasks).total);
}

// 3. Выполнить задачу id=4
result = setTaskCompleted(currentTasks, 4, true);
if (result.ok) {
  currentTasks = result.tasks;
  console.log("3. Задача id=4 отмечена как выполненная.");
}

// 4. Переименовать задачу id=10
result = renameTask(currentTasks, 10, "Подготовить инструкцию запуска");
if (result.ok) {
  currentTasks = result.tasks;
  console.log("4. Задача id=10 переименована.");
}

// 5. Удалить задачу id=7
result = removeTask(currentTasks, 7);
if (result.ok) {
  currentTasks = result.tasks;
  console.log("5. Задача id=7 удалена. Осталось задач:", getTaskStats(currentTasks).total);
}

// 6. Обработка ошибки (попытка добавить дубликат)
result = addTask(currentTasks, 20, "Дубликат", "low");
if (!result.ok) {
  console.log(`\n6. Ожидаемая ошибка при добавлении дубликата: ${result.error}`);
}

// 7. Проверка неизменности исходного массива
console.log("\n7. Проверка неизменности demoTasks:");
console.log(`   Исходный массив всё ещё содержит ${demoTasks.length} задач.`);
console.log(`   Первая задача всё ещё называется: "${demoTasks[0].title}"`);


console.log(`\n=== ИНДИВИДУАЛЬНЫЙ СЦЕНАРИЙ (Вариант ${variantNumber}) ===\n`);

let variantCurrent = variantTasks;
stats = getTaskStats(variantCurrent);
console.log(`1. Исходный прогресс варианта: ${stats.total > 0 ? stats.progress.toFixed(1) : 0}%`);

// 2. Добавить задачу id=80
result = addTask(variantCurrent, 80, "Финальная сборка проекта", "high");
if (result.ok) variantCurrent = result.tasks;

// 3. Выполнить задачу id=11
result = setTaskCompleted(variantCurrent, 11, true);
if (result.ok) variantCurrent = result.tasks;

// 4. Переименовать задачу id=23
result = renameTask(variantCurrent, 23, "Спроектировать схему БД (обновлено)");
if (result.ok) variantCurrent = result.tasks;

// 5. Удалить задачу id=37
result = removeTask(variantCurrent, 37);
if (result.ok) variantCurrent = result.tasks;

// 6. Попытка добавить дубликат id=80
result = addTask(variantCurrent, 80, "Дубликат", "low");
if (!result.ok) {
  console.log(`\n2. Ожидаемая ошибка: ${result.error}`);
}

stats = getTaskStats(variantCurrent);
console.log(`\n3. Итоговый прогресс варианта: ${stats.total > 0 ? stats.progress.toFixed(1) : 0}%`);
console.log(`   Осталось задач: ${getPendingTasks(variantCurrent).length}`);
console.log(`   Исходный variantTasks не изменён (длина: ${variantTasks.length})`);