const PRIORITIES = new Set(['low', 'medium', 'high']);
export function validateTaskDraft(draft, categories) {
  const errors = {};
  const title = typeof draft?.title === 'string' ? draft.title.trim() : '';
  const priority = draft?.priority;
  const rawCategory = draft?.categoryId;
  const categoryId = typeof rawCategory === 'string' && /^\d+$/.test(rawCategory)
    ? Number(rawCategory) : rawCategory;
  if (!title || title.length > 100) errors.title = 'Название должно содержать от 1 до 100 символов.';
  if (!PRIORITIES.has(priority)) errors.priority = 'Выберите правильный приоритет.';
  if (!Number.isSafeInteger(categoryId) || categoryId <= 0 ||
      !Array.isArray(categories) || !categories.some((c) => c.id === categoryId)) {
    errors.categoryId = 'Выберите существующую категорию.';
  }
  return { valid: Object.keys(errors).length === 0, value: { title, priority, categoryId }, errors };
}
