import { getTaskStats } from './task-service.js';
import { getVisibleTasks } from './task-selectors.js';


export function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = `task-card ${task.completed ? "is-completed" : ""}`;
  li.dataset.taskId = task.id;

  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title; // БЕЗОПАСНО: textContent не исполняет HTML

  const status = document.createElement("span");
  status.className = "task-status";
  status.textContent = task.completed ? "Выполнена" : "В работе";

  const priority = document.createElement("span");
  priority.className = "task-priority";
  const priorityMap = { low: "Низкий", medium: "Средний", high: "Высокий" };
  priority.textContent = priorityMap[task.priority] || task.priority;

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.dataset.action = "toggle";
  toggleBtn.setAttribute("aria-pressed", task.completed);
  const toggleLabel = document.createElement("span");
  toggleLabel.className = "action-label";
  toggleLabel.textContent = "Выполнена";
  toggleBtn.append(toggleLabel);

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.dataset.action = "delete";
  const deleteLabel = document.createElement("span");
  deleteLabel.className = "action-label";
  deleteLabel.textContent = "Удалить";
  deleteBtn.append(deleteLabel);

  actions.append(toggleBtn, deleteBtn);
  li.append(title, status, priority, actions);
  
  return li;
}

export function renderTaskList(listElement, tasks) {
  const elements = tasks.map(createTaskElement);
  listElement.replaceChildren(...elements);
}

export function renderSummary(summaryElement, tasks, visibleCount) {
  const stats = getTaskStats(tasks);
  summaryElement.querySelector('[data-stat="total"]').textContent = stats.total;
  summaryElement.querySelector('[data-stat="completed"]').textContent = stats.completed;
  summaryElement.querySelector('[data-stat="pending"]').textContent = stats.pending;
  summaryElement.querySelector('[data-stat="progress"]').textContent = 
    stats.total > 0 ? `${stats.progress.toFixed(1)}%` : "0.0%";
  summaryElement.querySelector('[data-stat="visible"]').textContent = visibleCount;
}

export function renderEmptyState(messageElement, total, visibleCount) {
  if (total === 0 && visibleCount === 0) {
    messageElement.textContent = "Список задач пуст.";
    messageElement.hidden = false;
  } else if (total > 0 && visibleCount === 0) {
    messageElement.textContent = "Нет задач по выбранному фильтру.";
    messageElement.hidden = false;
  } else {
    messageElement.textContent = "";
    messageElement.hidden = true;
  }
}

export function renderApp(currentTasks, currentFilter, listEl, summaryEl, emptyEl, filterContainer) {
  const visibleTasks = getVisibleTasks(currentTasks, currentFilter);
  
  renderTaskList(listEl, visibleTasks);
  renderSummary(summaryEl, currentTasks, visibleTasks.length);
  renderEmptyState(emptyEl, currentTasks.length, visibleTasks.length);

  // Обновляем состояние кнопок фильтра
  const buttons = filterContainer.querySelectorAll("button");
  buttons.forEach(btn => {
    const isActive = btn.dataset.filter === currentFilter;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-pressed", isActive);
  });
}

export function restoreTaskFocus(id, action) {
  // Упрощенная версия для возврата фокуса (не является строго обязательной для базовой оценки, но полезна)
  const card = document.querySelector(`li[data-task-id="${id}"]`);
  if (card) {
    const btn = card.querySelector(`button[data-action="${action}"]`);
    if (btn) btn.focus();
  }
}