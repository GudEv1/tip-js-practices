import { getTaskStats } from './task-service.js';
import { getVisibleTasks } from './task-selectors.js';

export function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = `task-card ${task.completed ? "is-completed" : ""}`;
  li.dataset.taskId = task.id;

  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;

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
  toggleBtn.innerHTML = '<span class="action-label">Выполнена</span>';

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.dataset.action = "edit";
  editBtn.innerHTML = '<span class="action-label">Изменить</span>';

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.dataset.action = "delete";
  deleteBtn.innerHTML = '<span class="action-label">Удалить</span>';

  actions.append(toggleBtn, editBtn, deleteBtn);
  li.append(title, status, priority, actions);
  return li;
}

export function renderTaskList(listElement, tasks) {
  listElement.replaceChildren(...tasks.map(createTaskElement));
}

export function renderSummary(summaryElement, tasks, visibleCount) {
  const stats = getTaskStats(tasks);
  summaryElement.querySelector('[data-stat="total"]').textContent = stats.total;
  summaryElement.querySelector('[data-stat="completed"]').textContent = stats.completed;
  summaryElement.querySelector('[data-stat="pending"]').textContent = stats.pending;
  summaryElement.querySelector('[data-stat="progress"]').textContent = stats.total > 0 ? `${stats.progress.toFixed(1)}%` : "0.0%";
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
  const visible = getVisibleTasks(currentTasks, currentFilter);
  renderTaskList(listEl, visible);
  renderSummary(summaryEl, currentTasks, visible.length);
  renderEmptyState(emptyEl, currentTasks.length, visible.length);
  
  const buttons = filterContainer.querySelectorAll("button");
  buttons.forEach(btn => {
    const isActive = btn.dataset.filter === currentFilter;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-pressed", isActive);
  });
}

export function restoreTaskFocus(id, action) {
  const card = document.querySelector(`li[data-task-id="${id}"]`);
  if (card) {
    const btn = card.querySelector(`button[data-action="${action}"]`);
    if (btn) btn.focus();
  } else {
    document.querySelector(`button[data-filter="all"]`)?.focus();
  }
}