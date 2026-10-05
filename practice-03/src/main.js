import { demoTasks, variantTasks } from './data.js';
import { findTaskById, setTaskCompleted, removeTask } from './task-service.js';
import { renderApp, restoreTaskFocus } from './task-view.js';

// 1. Инициализация состояния
const urlParams = new URLSearchParams(window.location.search);
const isVariant = urlParams.get('dataset') === 'variant';

// Глубокое копирование, чтобы не мутировать исходные данные из data.js
let currentTasks = isVariant 
  ? structuredClone(variantTasks) 
  : structuredClone(demoTasks);
  
let currentFilter = "all";

// 2. Ссылки на DOM-элементы
const taskList = document.getElementById("task-list");
const filterContainer = document.getElementById("task-filters");
const summaryElement = document.getElementById("task-summary");
const emptyMessageElement = document.getElementById("empty-message");
const operationMessageElement = document.getElementById("operation-message");

// 3. Делегирование событий для списка задач
taskList.addEventListener("click", (event) => {
  // Ищем ближайшую кнопку с действием, на которую кликнули (или которая является предком target)
  const button = event.target.closest("button[data-action]");
  
  // Если кликнули не по кнопке или кнопка не внутри нашего списка
  if (!button || !taskList.contains(button)) return;

  const action = button.dataset.action;
  const card = button.closest("li[data-task-id]");
  
  if (!card) return;

  const idStr = card.dataset.taskId;
  const id = Number(idStr);

  // Строгая проверка ID
  if (!Number.isSafeInteger(id) || id <= 0) {
    operationMessageElement.textContent = "Ошибка: некорректный идентификатор задачи";
    operationMessageElement.hidden = false;
    return;
  }

  if (action === "toggle") {
    const task = findTaskById(currentTasks, id);
    if (!task) {
      operationMessageElement.textContent = "Ошибка: задача не найдена";
      operationMessageElement.hidden = false;
      return;
    }
    const result = setTaskCompleted(currentTasks, id, !task.completed);
    handleServiceResult(result, id, action);
  } 
  else if (action === "delete") {
    const result = removeTask(currentTasks, id);
    handleServiceResult(result, id, action);
  }
});

// 4. Делегирование событий для фильтров
filterContainer.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-filter]");
  if (!button || !filterContainer.contains(button)) return;

  currentFilter = button.dataset.filter;
  operationMessageElement.hidden = true; // Сброс сообщений об ошибках при смене фильтра
  renderApp(currentTasks, currentFilter, taskList, summaryElement, emptyMessageElement, filterContainer);
});

// 5. Обработка результата от сервиса
function handleServiceResult(result, id, action) {
  if (result.ok) {
    currentTasks = result.tasks; // Обновляем состояние только при успехе!
    operationMessageElement.textContent = "";
    operationMessageElement.hidden = true;
    renderApp(currentTasks, currentFilter, taskList, summaryElement, emptyMessageElement, filterContainer);
    restoreTaskFocus(id, action);
  } else {
    operationMessageElement.textContent = `Ошибка: ${result.error}`;
    operationMessageElement.hidden = false;
  }
}

// 6. Первичная отрисовка
renderApp(currentTasks, currentFilter, taskList, summaryElement, emptyMessageElement, filterContainer);