// Вспомогательные функции валидации (не экспортируются, используются внутри)
function isValidId(id) {
  return typeof id === 'number' && Number.isSafeInteger(id) && id > 0;
}

function isValidTitle(title) {
  if (typeof title !== 'string') return false;
  const trimmed = title.trim();
  return trimmed.length >= 1 && trimmed.length <= 100;
}

function isValidPriority(priority) {
  return priority === 'low' || priority === 'medium' || priority === 'high';
}

// 1. Создание задачи
export function createTask(id, title, priority = "medium") {
  if (!isValidId(id)) return { ok: false, error: "Некорректный идентификатор" };
  if (!isValidTitle(title)) return { ok: false, error: "Некорректное название задачи" };
  if (!isValidPriority(priority)) return { ok: false, error: "Некорректный приоритет" };

  return {
    ok: true,
    task: {
      id,
      title: title.trim(),
      completed: false,
      priority
    }
  };
}

// 2. Чтение: поиск по ID
export function findTaskById(tasks, id) {
  return tasks.find((task) => task.id === id);
}

// 3. Чтение: невыполненные задачи
export function getPendingTasks(tasks) {
  return tasks.filter((task) => !task.completed);
}

// 4. Чтение: список названий
export function getTaskTitles(tasks) {
  return tasks.map((task) => task.title);
}

// 5. Чтение: сводка
export function getTaskStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const pending = total - completed;
  const progress = total > 0 ? (completed / total) * 100 : 0;
  return { total, completed, pending, progress };
}

// 6. Изменение: добавление задачи
export function addTask(tasks, id, title, priority = "medium") {
  const creationResult = createTask(id, title, priority);
  if (!creationResult.ok) return creationResult;
  
  if (tasks.find((task) => task.id === id)) {
    return { ok: false, error: "Задача с таким id уже существует" };
  }
  
  return { ok: true, tasks: [...tasks, creationResult.task] };
}

// 7. Изменение: смена статуса
export function setTaskCompleted(tasks, id, completed) {
  if (!isValidId(id)) return { ok: false, error: "Некорректный идентификатор" };
  if (typeof completed !== 'boolean') return { ok: false, error: "Статус должен быть логическим значением (true/false)" };
  
  const task = findTaskById(tasks, id);
  if (!task) return { ok: false, error: "Задача не найдена" };

  const newTasks = tasks.map((t) => 
    t.id === id ? { ...t, completed } : t
  );
  return { ok: true, tasks: newTasks };
}

// 8. Изменение: переименование
export function renameTask(tasks, id, title) {
  if (!isValidId(id)) return { ok: false, error: "Некорректный идентификатор" };
  if (!isValidTitle(title)) return { ok: false, error: "Некорректное название задачи" };
  
  const task = findTaskById(tasks, id);
  if (!task) return { ok: false, error: "Задача не найдена" };

  const newTasks = tasks.map((t) => 
    t.id === id ? { ...t, title: title.trim() } : t
  );
  return { ok: true, tasks: newTasks };
}

// 9. Изменение: удаление
export function removeTask(tasks, id) {
  if (!isValidId(id)) return { ok: false, error: "Некорректный идентификатор" };
  
  const task = findTaskById(tasks, id);
  if (!task) return { ok: false, error: "Задача не найдена" };

  return { ok: true, tasks: tasks.filter((t) => t.id !== id) };
}