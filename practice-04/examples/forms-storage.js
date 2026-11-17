const KEY = 'tip-js-practice-04:example-form';
const form = document.querySelector('#example-form');
const result = document.querySelector('#result');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form));
  if (!values.title.trim() || values.title.trim().length > 100) {
    result.textContent = 'Название должно содержать от 1 до 100 символов.';
    return;
  }
  const task = { title: values.title.trim(), priority: values.priority };
  try {
    localStorage.setItem(KEY, JSON.stringify(task));
    result.textContent = `Сохранено: ${JSON.stringify(task, null, 2)}`;
  } catch (error) {
    result.textContent = `Ошибка сохранения: ${error.message}`;
  }
});
document.querySelector('#restore').addEventListener('click', () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) { result.textContent = 'Сохранённых данных нет.'; return; }
    const item = JSON.parse(raw);
    if (!item || typeof item.title !== 'string' || !['low','medium','high'].includes(item.priority)) throw new Error('Неверная схема.');
    form.elements.title.value = item.title;
    form.elements.priority.value = item.priority;
    result.textContent = 'Данные восстановлены.';
  } catch (error) { result.textContent = `Невозможно восстановить: ${error.message}`; }
});
document.querySelector('#clear').addEventListener('click', () => {
  try { localStorage.removeItem(KEY); form.reset(); result.textContent = 'Данные удалены.'; }
  catch (error) { result.textContent = `Ошибка очистки: ${error.message}`; }
});
