import { ApiError } from './api-client.js';
import { validateTaskDraft } from './form-validation.js';

export function messageForError(error) {
  if (!(error instanceof ApiError)) return 'Не удалось выполнить операцию.';
  if (error.kind === 'timeout') return 'Сервер не ответил вовремя. Попробуйте ещё раз.';
  if (error.kind === 'network') return 'Нет соединения с учебным API. Проверьте, запущен ли npm start.';
  if (error.kind === 'invalid-response') return 'Сервер вернул ответ неожиданного формата.';
  if (error.kind === 'http' && error.status === 404) return 'Запись уже отсутствует на сервере. Обновите список.';
  if (error.kind === 'http') return error.message || `Сервер вернул ошибку ${error.status}.`;
  return 'Не удалось выполнить операцию.';
}

export function createAppController({ api, view, validateDraft = validateTaskDraft } = {}) {
  const apiMethods = ['loadInitialData','getTasks','createTask','updateTask','setTaskCompleted','deleteTask','resetDemoData'];
  const viewMethods = ['setListState','setTasks','setCategories','setTotal','setFormTask','showFormErrors','setMutationPending','notify'];
  if (!api || !apiMethods.every((key) => typeof api[key] === 'function') ||
      !view || !viewMethods.every((key) => typeof view[key] === 'function') || typeof validateDraft !== 'function') {
    throw new TypeError('Неверные зависимости контроллера.');
  }
  let tasks = [];
  let categories = [];
  let filters = {};
  let editingId = null;
  let activeLoad = null;
  let loadSequence = 0;
  let destroyed = false;
  let mutationPending = false;
  let haveCategories = false;

  async function loadCurrentTasks() {
    if (destroyed) return;
    activeLoad?.abort();
    const controller = new AbortController();
    activeLoad = controller;
    const sequence = ++loadSequence;
    view.setListState('loading');
    try {
      const payload = !haveCategories
        ? await api.loadInitialData({ ...filters }, { signal: controller.signal })
        : await api.getTasks({ ...filters }, { signal: controller.signal });
      if (destroyed || sequence !== loadSequence || controller.signal.aborted) return;
      if (!haveCategories) {
        categories = payload.categories;
        haveCategories = true;
        view.setCategories(categories);
      }
      tasks = payload.tasks;
      view.setTasks(tasks, categories);
      view.setTotal(payload.meta.total);
      view.setListState(tasks.length ? 'ready' : 'empty');
    } catch (error) {
      if (destroyed || sequence !== loadSequence || controller.signal.aborted ||
          (error instanceof ApiError && error.kind === 'aborted')) return;
      view.setListState('error', messageForError(error));
    } finally {
      if (activeLoad === controller) activeLoad = null;
    }
  }

  async function mutation(operation, successMessage, { resetForm = false } = {}) {
    if (mutationPending || destroyed) return;
    mutationPending = true;
    view.setMutationPending(true);
    try {
      await operation();
      if (resetForm) {
        editingId = null;
        view.setFormTask(null);
        view.showFormErrors({});
      }
      await loadCurrentTasks();
      view.notify(successMessage, 'success');
    } catch (error) {
      view.notify(messageForError(error), 'error');
    } finally {
      mutationPending = false;
      view.setMutationPending(false);
    }
  }

  return {
    start(initialFilters = {}) {
      filters = { ...initialFilters };
      return loadCurrentTasks();
    },
    applyFilters(newFilters = {}) {
      filters = { ...newFilters };
      return loadCurrentTasks();
    },
    refresh() { return loadCurrentTasks(); },
    submit(draft) {
      if (mutationPending) return Promise.resolve();
      const result = validateDraft(draft, categories);
      view.showFormErrors(result.errors);
      if (!result.valid) return Promise.resolve();  // ПР6: ничего не отправляем при неправильной форме
      return mutation(() => editingId === null
        ? api.createTask(result.value)
        : api.updateTask(editingId, result.value),
      editingId === null ? 'Задача добавлена.' : 'Изменения сохранены.', { resetForm: true });
    },
    beginEdit(id) {
      if (mutationPending) return;
      const task = tasks.find((item) => item.id === id);
      if (!task) return;
      editingId = id;
      view.setFormTask(task);
      view.showFormErrors({});
    },
    cancelEdit() {
      editingId = null;
      view.setFormTask(null);
      view.showFormErrors({});
    },
    toggleTask(id) {
      const task = tasks.find((item) => item.id === id);
      if (!task) return Promise.resolve();
      return mutation(() => api.setTaskCompleted(id, !task.completed), 'Статус задачи изменён.');
    },
    deleteTask(id) {
      if (!tasks.some((task) => task.id === id)) return Promise.resolve();
      return mutation(() => api.deleteTask(id), 'Задача удалена.');
    },
    resetData() {
      return mutation(() => api.resetDemoData(), 'Учебные данные восстановлены.', { resetForm: true });
    },
    destroy() {
      destroyed = true;
      ++loadSequence;
      activeLoad?.abort();
      activeLoad = null;
    },
  };
}
