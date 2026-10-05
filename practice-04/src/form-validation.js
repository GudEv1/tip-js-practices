export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};
  let id = editingId !== null ? editingId : Number(draft.id);

  if (editingId === null) {
    if (draft.id === "" || draft.id === null || draft.id === undefined) {
      errors.id = "ID обязателен";
    } else if (!Number.isSafeInteger(id) || id <= 0) {
      errors.id = "ID должен быть положительным целым числом";
    } else if (tasks.some(t => t.id === id)) {
      errors.id = "Задача с таким ID уже существует";
    }
  } else {
    if (!tasks.some(t => t.id === editingId)) {
      errors.id = "Редактируемая задача не найдена";
    }
  }

  if (typeof draft.title !== 'string' || draft.title.trim().length === 0 || draft.title.trim().length > 100) {
    errors.title = "Название должно быть от 1 до 100 символов";
  }

  if (!['low', 'medium', 'high'].includes(draft.priority)) {
    errors.priority = "Приоритет должен быть low, medium или high";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: { id, title: draft.title.trim(), priority: draft.priority }
  };
}