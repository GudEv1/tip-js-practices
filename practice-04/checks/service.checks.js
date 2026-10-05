import assert from 'node:assert/strict';
import {
  createTask, findTaskById, getPendingTasks, getTaskTitles, getTaskStats,
  addTask, setTaskCompleted, renameTask, removeTask
} from '../src/task-service.js';
import { demoTasks } from '../src/data.js';

console.log("Запуск проверок сервиса (35 сценариев)...\n");

// 1. createTask
assert.strictEqual(createTask(1, "Test", "high").ok, true, "createTask: валидные данные");
assert.strictEqual(createTask(1, "Test").task.priority, "medium", "createTask: приоритет по умолчанию");
assert.strictEqual(createTask(0, "Test").ok, false, "createTask: id = 0");
assert.strictEqual(createTask(1, "").ok, false, "createTask: пустое название");
assert.strictEqual(createTask(1, "   ").ok, false, "createTask: название из пробелов");
assert.strictEqual(createTask(1, "A".repeat(101)).ok, false, "createTask: название > 100 символов");
assert.strictEqual(createTask(1, 123).ok, false, "createTask: название не строка");
assert.strictEqual(createTask(1.5, "Test").ok, false, "createTask: дробный id");
assert.strictEqual(createTask(Number.MAX_SAFE_INTEGER + 1, "Test").ok, false, "createTask: id > MAX_SAFE_INTEGER");
assert.strictEqual(createTask(1, "Test", "urgent").ok, false, "createTask: неверный приоритет");

// 2. findTaskById
assert.strictEqual(findTaskById(demoTasks, 4).id, 4, "findTaskById: найдено");
assert.strictEqual(findTaskById(demoTasks, 999), undefined, "findTaskById: не найдено");
assert.strictEqual(findTaskById(demoTasks, "4"), undefined, "findTaskById: строковый id");

// 3. getPendingTasks
assert.strictEqual(getPendingTasks(demoTasks).length, 2, "getPendingTasks: длина");
assert.strictEqual(getPendingTasks([]).length, 0, "getPendingTasks: пустой массив");

// 4. getTaskTitles
assert.deepStrictEqual(getTaskTitles(demoTasks), ["Изучить функции", "Подготовить модель задач", "Проверить методы массивов", "Оформить README"], "getTaskTitles");

// 5. getTaskStats
assert.deepStrictEqual(getTaskStats(demoTasks), { total: 4, completed: 2, pending: 2, progress: 50 }, "getTaskStats: обычный");
assert.deepStrictEqual(getTaskStats([]), { total: 0, completed: 0, pending: 0, progress: 0 }, "getTaskStats: пустой");

// 6. addTask
const addRes = addTask(demoTasks, 99, "New", "low");
assert.strictEqual(addRes.ok, true, "addTask: успех");
assert.strictEqual(addRes.tasks.length, 5, "addTask: длина нового массива");
assert.strictEqual(demoTasks.length, 4, "addTask: мутации нет");
assert.strictEqual(addTask(demoTasks, 1, "Dup").ok, false, "addTask: дубликат id");

// 7. setTaskCompleted
const compRes = setTaskCompleted(demoTasks, 4, true);
assert.strictEqual(compRes.ok, true, "setTaskCompleted: успех");
assert.strictEqual(compRes.tasks.find(t => t.id === 4).completed, true, "setTaskCompleted: статус изменен");
assert.strictEqual(demoTasks.find(t => t.id === 4).completed, false, "setTaskCompleted: мутации нет");
assert.strictEqual(setTaskCompleted(demoTasks, 4, "true").ok, false, "setTaskCompleted: строка вместо boolean");
assert.strictEqual(setTaskCompleted(demoTasks, 999, true).ok, false, "setTaskCompleted: задача не найдена");

// 8. renameTask
const renRes = renameTask(demoTasks, 1, "  New Title  ");
assert.strictEqual(renRes.ok, true, "renameTask: успех");
assert.strictEqual(renRes.tasks.find(t => t.id === 1).title, "New Title", "renameTask: пробелы удалены");
assert.strictEqual(renRes.tasks.find(t => t.id === 1).completed, true, "renameTask: остальные поля сохранены");
assert.strictEqual(renameTask(demoTasks, 999, "New").ok, false, "renameTask: задача не найдена");

// 9. removeTask
const remRes = removeTask(demoTasks, 7);
assert.strictEqual(remRes.ok, true, "removeTask: успех");
assert.strictEqual(remRes.tasks.length, 3, "removeTask: длина уменьшилась");
assert.strictEqual(remRes.tasks.find(t => t.id === 7), undefined, "removeTask: задача удалена");
assert.strictEqual(demoTasks.length, 4, "removeTask: мутации нет");
assert.strictEqual(removeTask(demoTasks, 999).ok, false, "removeTask: задача не найдена");

console.log("✅ Все 35 сценариев проверок сервиса пройдены успешно!\n");