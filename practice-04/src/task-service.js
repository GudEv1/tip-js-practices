function isValidId(id) {
  return typeof id === 'number' && Number.isSafeInteger(id) && id > 0;
}

export function createTask(id, title, priority = "medium") {
  if (!isValidId(id)) return { ok: false, error: "Некорректный идентификатор" };
  if (typeof title !== 'string' || title.trim().length === 0 || title.trim().length > 100) return { ok: false, error: "Некорректное название" };
  if (!['low', 'medium', 'high'].includes(priority)) return { ok: false, error: "Некорректный приоритет" };
  return { ok: true, task: { id, title: title.trim(), completed: false, priority } };
}

export function updateTask(tasks, id, title, priority) {
  if (!isValidId(id)) return { ok: false, error: "Некорректный идентификатор" };
  if (typeof title !== 'string' || title.trim().length === 0 || title.trim().length > 100) return { ok: false, error: "Некорректное название" };
  if (!['low', 'medium', 'high'].includes(priority)) return { ok: false, error: "Некорректный приоритет" };
  
  const taskIndex = tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) return { ok: false, error: "Задача не найдена" };

  // Создаем новый массив и новый объект задачи, не мутируя оригинал
  const newTasks = [...tasks];
  newTasks[taskIndex] = { ...newTasks[taskIndex], title: title.trim(), priority };
  
  return { ok: true, tasks: newTasks };
}

export function findTaskById(tasks, id) {
  return tasks.find((task) => task.id === id);
}

export function getPendingTasks(tasks) {
  return tasks.filter((task) => !task.completed);
}

export function getTaskTitles(tasks) {
  return tasks.map((task) => task.title);
}

export function getTaskStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const pending = total - completed;
  const progress = total > 0 ? (completed / total) * 100 : 0;
  return { total, completed, pending, progress };
}

export function addTask(tasks, id, title, priority = "medium") {
  const creationResult = createTask(id, title, priority);
  if (!creationResult.ok) return creationResult;
  if (tasks.find((task) => task.id === id)) {
    return { ok: false, error: "Задача с таким id уже существует" };
  }
  return { ok: true, tasks: [...tasks, creationResult.task] };
}

export function setTaskCompleted(tasks, id, completed) {
  if (!isValidId(id)) return { ok: false, error: "Некорректный идентификатор" };
  if (typeof completed !== 'boolean') return { ok: false, error: "Статус должен быть логическим значением" };
  const task = findTaskById(tasks, id);
  if (!task) return { ok: false, error: "Задача не найдена" };
  const newTasks = tasks.map((t) => t.id === id ? { ...t, completed } : t);
  return { ok: true, tasks: newTasks };
}

export function renameTask(tasks, id, title) {
  if (!isValidId(id)) return { ok: false, error: "Некорректный идентификатор" };
  if (typeof title !== 'string' || title.trim().length === 0 || title.trim().length > 100) return { ok: false, error: "Некорректное название" };
  const task = findTaskById(tasks, id);
  if (!task) return { ok: false, error: "Задача не найдена" };
  const newTasks = tasks.map((t) => t.id === id ? { ...t, title: title.trim() } : t);
  return { ok: true, tasks: newTasks };
}

export function removeTask(tasks, id) {
  if (!isValidId(id)) return { ok: false, error: "Некорректный идентификатор" };
  if (!tasks.some(t => t.id === id)) return { ok: false, error: "Задача не найдена" };
  return { ok: true, tasks: tasks.filter(t => t.id !== id) };
}