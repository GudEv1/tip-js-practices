export function isValidTaskList(value) {
  if (!Array.isArray(value)) return false;
  const ids = new Set();
  for (const task of value) {
    if (!task || typeof task.id !== 'number' || !Number.isSafeInteger(task.id) || task.id <= 0) return false;
    if (ids.has(task.id)) return false;
    ids.add(task.id);
    if (typeof task.title !== 'string' || task.title.length === 0 || task.title.length > 100) return false;
    if (typeof task.completed !== 'boolean') return false;
    if (!['low', 'medium', 'high'].includes(task.priority)) return false;
  }
  return true;
}

export function loadTasks(storage, key, fallbackTasks) {
  const fallback = structuredClone(fallbackTasks);
  try {
    const raw = storage.getItem(key);
    if (raw === null) return { ok: true, source: "initial", tasks: fallback };
    
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 1 && isValidTaskList(parsed.tasks)) {
      return { ok: true, source: "storage", tasks: structuredClone(parsed.tasks) };
    }
    return { ok: false, source: "fallback", tasks: fallback, error: "Неверный формат данных" };
  } catch (e) {
    return { ok: false, source: "fallback", tasks: fallback, error: "Ошибка чтения хранилища" };
  }
}

export function saveTasks(storage, key, tasks) {
  try {
    if (!isValidTaskList(tasks)) return { ok: false, error: "Некорректные данные" };
    storage.setItem(key, JSON.stringify({ version: 1, tasks }));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Ошибка записи" };
  }
}

export function removeSavedTasks(storage, key) {
  try {
    storage.removeItem(key);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Ошибка удаления" };
  }
}