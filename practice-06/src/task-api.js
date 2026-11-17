import { ApiError } from './api-client.js';
const PRIORITIES = new Set(['low', 'medium', 'high']);
const FILTERS = new Set(['completed', 'priority', 'categoryId', 'q']);
const positive = (n) => Number.isSafeInteger(n) && n > 0;
const invalid = (message) => new ApiError(message, { kind: 'invalid-response' });
export function isTask(value) {
  return !!(value && typeof value === 'object' && positive(value.id) &&
    typeof value.title === 'string' && value.title.trim().length > 0 && value.title.trim().length <= 100 &&
    typeof value.completed === 'boolean' && PRIORITIES.has(value.priority) && positive(value.categoryId));
}
export function isCategory(value) {
  return !!(value && typeof value === 'object' && positive(value.id) &&
    typeof value.name === 'string' && value.name.trim().length > 0 && value.name.trim().length <= 100);
}
function assertCollection(payload, check, name) {
  if (!payload || !Array.isArray(payload.data) || !payload.meta || !positive(payload.meta.total + 1) ||
      !Number.isSafeInteger(payload.meta.total) || payload.meta.total !== payload.data.length ||
      payload.data.some((item) => !check(item)) || new Set(payload.data.map((item) => item.id)).size !== payload.data.length) {
    throw invalid(`Неверная схема коллекции ${name}.`);
  }
  return payload;
}
function assertTask(payload) {
  if (!isTask(payload?.data)) throw invalid('Неверная схема задачи.');
  return payload.data;
}
function normalize(filters) {
  if (!filters || typeof filters !== 'object' || Array.isArray(filters)) throw new TypeError('Фильтры должны быть объектом.');
  const result = {};
  for (const [key, value] of Object.entries(filters)) {
    if (!FILTERS.has(key)) throw new TypeError(`Недопустимый фильтр ${key}.`);
    if (key === 'completed' && typeof value !== 'boolean') throw new TypeError('completed: нужен boolean.');
    if (key === 'priority' && !PRIORITIES.has(value)) throw new TypeError('priority: неверное значение.');
    if (key === 'categoryId' && !positive(value)) throw new TypeError('categoryId: нужно положительное целое.');
    if (key === 'q' && (typeof value !== 'string' || value.trim().length > 100)) throw new TypeError('q: нужна строка до 100 символов.');
    if (key !== 'q' || value.trim()) result[key] = key === 'q' ? value.trim() : value;
  }
  return result;
}
function assertId(id) { if (!positive(id)) throw new TypeError('id должен быть положительным целым числом.'); }
function requestOptions(signal, extra) { return signal === undefined && extra === undefined ? undefined : { ...extra, ...(signal === undefined ? {} : { signal }) }; }

export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== 'function') throw new TypeError('Требуется client.requestJson.');
  return {
    async getTasks(filters = {}, options = {}) {
      const query = normalize(filters);
      const payload = assertCollection(await client.requestJson('/tasks', requestOptions(options.signal, { query })), isTask, 'tasks');
      return { tasks: payload.data, meta: payload.meta };
    },
    async getTaskById(id, options = {}) {
      assertId(id);
      return assertTask(await client.requestJson(`/tasks/${id}`, requestOptions(options.signal)));
    },
    async getCategories(options = {}) {
      return assertCollection(await client.requestJson('/categories', requestOptions(options.signal)), isCategory, 'categories').data;
    },
    async loadInitialData(filters = {}, options = {}) {
      // Оба запроса стартуют до общего ожидания.
      const [result, categories] = await Promise.all([this.getTasks(filters, options), this.getCategories(options)]);
      return { tasks: result.tasks, categories, meta: result.meta };
    },
    async createTask(draft, options = {}) {
      return assertTask(await client.requestJson('/tasks', requestOptions(options.signal, { method: 'POST', body: draft })));
    },
    async updateTask(id, changes, options = {}) {
      assertId(id);
      return assertTask(await client.requestJson(`/tasks/${id}`, requestOptions(options.signal, { method: 'PATCH', body: changes })));
    },
    async setTaskCompleted(id, completed, options = {}) {
      assertId(id);
      if (typeof completed !== 'boolean') throw new TypeError('completed должен быть boolean.');
      return assertTask(await client.requestJson(`/tasks/${id}`, requestOptions(options.signal, { method: 'PATCH', body: { completed } })));
    },
    async deleteTask(id, options = {}) {
      assertId(id);
      const result = await client.requestJson(`/tasks/${id}`, requestOptions(options.signal, { method: 'DELETE' }));
      if (result !== null) throw invalid('DELETE должен возвращать 204 No Content.');
      return null;
    },
    async resetDemoData(options = {}) {
      const payload = await client.requestJson('/debug/reset', requestOptions(options.signal, { method: 'POST' }));
      if (payload?.data?.reset !== true || !Number.isSafeInteger(payload.data.total) || payload.data.total < 0) throw invalid('Неверное подтверждение сброса.');
      return payload.data;
    },
  };
}
