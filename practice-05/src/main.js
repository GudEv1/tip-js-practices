import { ApiError, createApiClient } from './api-client.js';
import { createTaskApi } from './task-api.js';
import { variantFilters, variantNumber } from './variant.js';
const baseUrl = process.env.API_URL ?? 'http://127.0.0.1:5505/api';
function describeError(error) {
  if (!(error instanceof ApiError)) return `Неожиданная ошибка: ${error.message}`;
  return [`Тип: ${error.kind}`, error.message,
    error.status === null ? '' : `HTTP ${error.status}`,
    error.code === null ? '' : `Код API: ${error.code}`].filter(Boolean).join(' · ');
}
try {
  const client = createApiClient({ baseUrl, timeoutMs: 2000 });
  const api = createTaskApi(client);
  const started = performance.now();
  const { tasks, categories, meta } = await api.loadInitialData(variantFilters);
  const names = new Map(categories.map((item) => [item.id, item.name]));
  console.log(`Индивидуальный вариант ${variantNumber}`);
  console.log('Фильтры:', meta.filters);
  console.log(`Получено задач: ${meta.total}; время: ${(performance.now() - started).toFixed(1)} мс`);
  console.table(tasks.map((task) => ({ id: task.id, title: task.title, completed: task.completed,
    priority: task.priority, category: names.get(task.categoryId) ?? 'Неизвестно' })));
  try { await api.getTaskById(999); } catch (error) { console.log('Контрольная ошибка 404:', describeError(error)); }
} catch (error) {
  console.error(describeError(error));
  console.error(`Проверяемый адрес API: ${baseUrl}`);
  process.exitCode = 1;
}
