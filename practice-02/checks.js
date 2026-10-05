import assert from 'node:assert/strict';
import {
  createTask, findTaskById, getPendingTasks, getTaskTitles, getTaskStats,
  addTask, setTaskCompleted, renameTask, removeTask
} from './src/task-service.js';
import { demoTasks } from './src/data.js';

console.log("Запуск проверок...\n");

// 1. createTask
assert.deepStrictEqual(createTask(1, "Test", "high").ok, true);
assert.strictEqual(createTask(1, "Test").task.priority, "medium");
assert.strictEqual(createTask(0, "Test").ok, false);
assert.strictEqual(createTask(1, "").ok, false);
assert.strictEqual(createTask(1, "   ").ok, false);
assert.strictEqual(createTask(1, "A".repeat(101)).ok, false);
assert.strictEqual(createTask(1, 123).ok, false);
assert.strictEqual(createTask(1.5, "Test").ok, false);
assert.strictEqual(createTask(Number.MAX_SAFE_INTEGER + 1, "Test").ok, false);
assert.strictEqual(createTask(1, "Test", "urgent").ok, false);

// 2. findTaskById
assert.strictEqual(findTaskById(demoTasks, 4).id, 4);
assert.strictEqual(findTaskById(demoTasks, 999), undefined);
assert.strictEqual(findTaskById(demoTasks, "4"), undefined);

// 3. getPendingTasks
assert.strictEqual(getPendingTasks(demoTasks).length, 2);
assert.strictEqual(getPendingTasks([]).length, 0);

// 4. getTaskTitles
assert.deepStrictEqual(getTaskTitles(demoTasks), ["Изучить функции", "Подготовить модель задач", "Проверить методы массивов", "Оформить README"]);

// 5. getTaskStats
assert.deepStrictEqual(getTaskStats(demoTasks), { total: 4, completed: 2, pending: 2, progress: 50 });
assert.deepStrictEqual(getTaskStats([]), { total: 0, completed: 0, pending: 0, progress: 0 });

// 6. addTask
const addRes = addTask(demoTasks, 99, "New", "low");
assert.strictEqual(addRes.ok, true);
assert.strictEqual(addRes.tasks.length, 5);
assert.strictEqual(demoTasks.length, 4); // мутации нет
assert.strictEqual(addTask(demoTasks, 1, "Dup").ok, false);

// 7. setTaskCompleted
const compRes = setTaskCompleted(demoTasks, 4, true);
assert.strictEqual(compRes.ok, true);
assert.strictEqual(compRes.tasks.find(t => t.id === 4).completed, true);
assert.strictEqual(demoTasks.find(t => t.id === 4).completed, false); // мутации нет
assert.strictEqual(setTaskCompleted(demoTasks, 4, "true").ok, false);
assert.strictEqual(setTaskCompleted(demoTasks, 999, true).ok, false);

// 8. renameTask
const renRes = renameTask(demoTasks, 1, "  New Title  ");
assert.strictEqual(renRes.ok, true);
assert.strictEqual(renRes.tasks.find(t => t.id === 1).title, "New Title");
assert.strictEqual(renRes.tasks.find(t => t.id === 1).completed, true); // остальные поля сохранены
assert.strictEqual(renameTask(demoTasks, 999, "New").ok, false);

// 9. removeTask
const remRes = removeTask(demoTasks, 7);
assert.strictEqual(remRes.ok, true);
assert.strictEqual(remRes.tasks.length, 3);
assert.strictEqual(remRes.tasks.find(t => t.id === 7), undefined);
assert.strictEqual(demoTasks.length, 4); // мутации нет
assert.strictEqual(removeTask(demoTasks, 999).ok, false);

console.log("✅ Все 35+ сценариев проверок пройдены успешно!");