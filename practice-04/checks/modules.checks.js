import assert from 'node:assert/strict';
import { updateTask } from '../src/task-service.js';
import { validateTaskDraft } from '../src/form-validation.js';
import { isValidTaskList, loadTasks, saveTasks, removeSavedTasks } from '../src/task-storage.js';

console.log("Запуск проверок новых модулей...\n");

// 1. updateTask
const tasks = [{ id: 1, title: "Test", completed: true, priority: "low" }];
const res1 = updateTask(tasks, 1, "New Title", "high");
assert.strictEqual(res1.ok, true, "updateTask: успех");
assert.strictEqual(res1.tasks[0].title, "New Title", "updateTask: название изменено");
assert.strictEqual(res1.tasks[0].priority, "high", "updateTask: приоритет изменен");
assert.strictEqual(res1.tasks[0].completed, true, "updateTask: статус сохранен");
assert.strictEqual(tasks[0].title, "Test", "updateTask: мутации нет");
assert.strictEqual(updateTask(tasks, 99, "New", "low").ok, false, "updateTask: задача не найдена");

// 2. validateTaskDraft
const v1 = validateTaskDraft({ id: 2, title: "New", priority: "medium" }, tasks);
assert.strictEqual(v1.ok, true, "validateTaskDraft: успех создания");
assert.strictEqual(v1.value.title, "New", "validateTaskDraft: значение корректно");

const v2 = validateTaskDraft({ id: 1, title: "New", priority: "medium" }, tasks);
assert.strictEqual(v2.ok, false, "validateTaskDraft: дубликат id");
assert.ok(v2.errors.id, "validateTaskDraft: ошибка в id");

const v3 = validateTaskDraft({ id: "", title: "   ", priority: "bad" }, tasks);
assert.strictEqual(v3.ok, false, "validateTaskDraft: множественные ошибки");
assert.ok(v3.errors.title, "validateTaskDraft: ошибка в title");
assert.ok(v3.errors.priority, "validateTaskDraft: ошибка в priority");

// Редактирование
const v4 = validateTaskDraft({ id: 99, title: "Edited", priority: "low" }, tasks, 1);
assert.strictEqual(v4.ok, true, "validateTaskDraft: успех редактирования (id игнорируется)");
assert.strictEqual(v4.value.id, 1, "validateTaskDraft: использован editingId");

// 3. task-storage
const mockStorage = {};
const saveRes = saveTasks(mockStorage, "test-key", tasks);
assert.strictEqual(saveRes.ok, true, "saveTasks: успех");
assert.ok(mockStorage["test-key"], "saveTasks: данные записаны");

const loadRes = loadTasks(mockStorage, "test-key", []);
assert.strictEqual(loadRes.ok, true, "loadTasks: успех чтения");
assert.strictEqual(loadRes.source, "storage", "loadTasks: источник storage");

const loadInitial = loadTasks(mockStorage, "missing-key", [{ id: 99, title: "Fallback", completed: false, priority: "low" }]);
assert.strictEqual(loadInitial.source, "initial", "loadTasks: источник initial");

const badStorage = {};
badStorage["bad-key"] = "{ broken json";
const loadBad = loadTasks(badStorage, "bad-key", []);
assert.strictEqual(loadBad.ok, false, "loadTasks: ошибка парсинга");
assert.strictEqual(loadBad.source, "fallback", "loadTasks: источник fallback");

const removeRes = removeSavedTasks(mockStorage, "test-key");
assert.strictEqual(removeRes.ok, true, "removeSavedTasks: успех");
assert.strictEqual(mockStorage["test-key"], undefined, "removeSavedTasks: ключ удален");

console.log("✅ Все проверки новых модулей пройдены успешно!\n");