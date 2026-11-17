const PRIORITY_LABELS = { low: 'Низкий', medium: 'Средний', high: 'Высокий' };
function span(className, value) { const el = document.createElement('span'); el.className = className; el.textContent = value; return el; }
export function createTaskElement(task, category) {
  const li = document.createElement('li');
  li.className = `task-card${task.completed ? ' is-completed' : ''}`;
  li.dataset.taskId = String(task.id);
  const content = document.createElement('div'); content.className = 'task-content';
  const heading = document.createElement('h3'); heading.className = 'task-title'; heading.textContent = task.title;
  const meta = document.createElement('div'); meta.className = 'task-meta';
  meta.append(span('task-status', task.completed ? 'Выполнено' : 'В работе'),
    span('task-priority', PRIORITY_LABELS[task.priority] ?? task.priority),
    span('task-category', category?.name ?? 'Без категории'));
  content.append(heading, meta);
  const actions = document.createElement('div'); actions.className = 'task-actions';
  for (const [action, label] of [
    ['toggle', task.completed ? 'Вернуть в работу' : 'Завершить'],
    ['edit', 'Изменить'], ['delete', 'Удалить']]) {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.action = action;
    button.append(span('action-label', label));
    actions.append(button);
  }
  li.append(content, actions);
  return li;
}
export function renderTaskList(list, tasks, categories) {
  const byId = new Map(categories.map((category) => [category.id, category]));
  list.replaceChildren(...tasks.map((task) => createTaskElement(task, byId.get(task.categoryId))));
}
