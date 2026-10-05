import { demoTasks, variantTasks } from './data.js';
import { findTaskById, addTask, updateTask, setTaskCompleted, removeTask } from './task-service.js';
import { renderApp, restoreTaskFocus } from './task-view.js';
import { validateTaskDraft } from './form-validation.js';
import { loadTasks, saveTasks, removeSavedTasks } from './task-storage.js';

const urlParams = new URLSearchParams(window.location.search);
const isVariant = urlParams.get('dataset') === 'variant';
const storageKey = isVariant ? 'tip-js-practice-04:variant' : 'tip-js-practice-04:demo';
const initialTasks = isVariant ? variantTasks : demoTasks;

let currentTasks = [];
let currentFilter = "all";
let editingId = null;

const taskList = document.getElementById("task-list");
const filterContainer = document.getElementById("task-filters");
const summaryElement = document.getElementById("task-summary");
const emptyMessageElement = document.getElementById("empty-message");
const operationMessageElement = document.getElementById("operation-message");
const taskForm = document.getElementById("task-form");
const formTitle = document.getElementById("form-title");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");

// Инициализация
const loadResult = loadTasks(localStorage, storageKey, initialTasks);
currentTasks = loadResult.tasks;
if (!loadResult.ok) {
  operationMessageElement.textContent = `Предупреждение: ${loadResult.error}. Загружен исходный набор.`;
  operationMessageElement.hidden = false;
}

function setFormMode(id) {
  editingId = id;
  taskForm.reset();
  clearFormErrors();
  operationMessageElement.hidden = true;

  if (id === null) {
    formTitle.textContent = "Добавление задачи";
    submitBtn.textContent = "Добавить задачу";
    cancelBtn.hidden = true;
    document.getElementById("task-id").disabled = false;
    document.getElementById("task-id").focus();
  } else {
    const task = findTaskById(currentTasks, id);
    if (!task) {
      operationMessageElement.textContent = "Ошибка: задача не найдена";
      operationMessageElement.hidden = false;
      return;
    }
    formTitle.textContent = "Редактирование задачи";
    submitBtn.textContent = "Сохранить изменения";
    cancelBtn.hidden = false;
    
    document.getElementById("task-id").value = task.id;
    document.getElementById("task-id").disabled = true;
    document.getElementById("task-title").value = task.title;
    document.getElementById("task-priority").value = task.priority;
    document.getElementById("task-title").focus();
  }
}

function showFormErrors(errors) {
  clearFormErrors();
  if (errors.id) {
    const el = document.getElementById("task-id");
    el.setCustomValidity(errors.id);
    el.reportValidity();
  } // <-- ВОТ ЭТУ СКОБКУ Я ЗАБЫЛ РАНЬШЕ
  if (errors.title) {
    const el = document.getElementById("task-title");
    el.setCustomValidity(errors.title);
    el.reportValidity();
  }
  if (errors.priority) {
    const el = document.getElementById("task-priority");
    el.setCustomValidity(errors.priority);
    el.reportValidity();
  }
}

function clearFormErrors() {
  ["task-id", "task-title", "task-priority"].forEach(id => {
    document.getElementById(id).setCustomValidity("");
  });
}

["task-id", "task-title", "task-priority"].forEach(id => {
  document.getElementById(id).addEventListener("input", () => {
    document.getElementById(id).setCustomValidity("");
  });
});

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearFormErrors();

  const formData = new FormData(taskForm);
  const draft = {
    id: formData.get("id"),
    title: formData.get("title"),
    priority: formData.get("priority")
  };

  const validation = validateTaskDraft(draft, currentTasks, editingId);
  if (!validation.ok) {
    showFormErrors(validation.errors);
    return;
  }

  let result;
  if (editingId === null) {
    result = addTask(currentTasks, validation.value.id, validation.value.title, validation.value.priority);
  } else {
    result = updateTask(currentTasks, editingId, validation.value.title, validation.value.priority);
  }

  if (result.ok) {
    currentTasks = result.tasks;
    saveTasks(localStorage, storageKey, currentTasks);
    setFormMode(null);
    renderApp(currentTasks, currentFilter, taskList, summaryElement, emptyMessageElement, filterContainer);
  } else {
    operationMessageElement.textContent = `Ошибка: ${result.error}`;
    operationMessageElement.hidden = false;
  }
});

cancelBtn.addEventListener("click", (event) => {
  event.preventDefault();
  setFormMode(null);
});

document.getElementById("reset-storage-btn").addEventListener("click", () => {
  removeSavedTasks(localStorage, storageKey);
  currentTasks = structuredClone(initialTasks);
  currentFilter = "all";
  setFormMode(null);
  renderApp(currentTasks, currentFilter, taskList, summaryElement, emptyMessageElement, filterContainer);
  operationMessageElement.textContent = "Данные сброшены до исходного состояния.";
  operationMessageElement.hidden = false;
});

taskList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button || !taskList.contains(button)) return;

  const action = button.dataset.action;
  const card = button.closest("li[data-task-id]");
  if (!card) return;

  const id = Number(card.dataset.taskId);
  if (!Number.isSafeInteger(id) || id <= 0) return;

  if (action === "edit") {
    setFormMode(id);
    return;
  }

  let result;
  if (action === "toggle") {
    const task = findTaskById(currentTasks, id);
    result = setTaskCompleted(currentTasks, id, !task.completed);
  } else if (action === "delete") {
    result = removeTask(currentTasks, id);
    if (editingId === id) setFormMode(null);
  }

  if (result && result.ok) {
    currentTasks = result.tasks;
    saveTasks(localStorage, storageKey, currentTasks);
    operationMessageElement.hidden = true;
    renderApp(currentTasks, currentFilter, taskList, summaryElement, emptyMessageElement, filterContainer);
    restoreTaskFocus(id, action);
  } else if (result) {
    operationMessageElement.textContent = `Ошибка: ${result.error}`;
    operationMessageElement.hidden = false;
  }
});

filterContainer.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-filter]");
  if (!button || !filterContainer.contains(button)) return;
  currentFilter = button.dataset.filter;
  operationMessageElement.hidden = true;
  renderApp(currentTasks, currentFilter, taskList, summaryElement, emptyMessageElement, filterContainer);
});

setFormMode(null);
renderApp(currentTasks, currentFilter, taskList, summaryElement, emptyMessageElement, filterContainer);