// Учебный локальный API; исходные записи хранятся в памяти. В ПР6 разрешён CRUD.
import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { categories as seedCategories, tasks as seedTasks } from './data.js';
const HOST = '127.0.0.1';
const DEFAULT_PORT = 5505;
const READ_ONLY = true;
const PRIORITIES = new Set(['low','medium','high']);
const FILTERS = new Set(['completed','priority','categoryId','q']);
const cors = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': READ_ONLY ? 'GET, HEAD, OPTIONS' : 'GET, HEAD, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Accept, Content-Type',
  'Access-Control-Expose-Headers': 'Location',
  'Access-Control-Max-Age': '600',
});
function json(res, status, payload, head = false, extra = {}) {
  const content = JSON.stringify(payload);
  res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Content-Length':Buffer.byteLength(content),
    'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', ...cors(), ...extra });
  res.end(head ? undefined : content);
}
function empty(res, status) { res.writeHead(status, { 'Cache-Control':'no-store', ...cors() }); res.end(); }
function raw(res, status, content, type, head = false) {
  res.writeHead(status, { 'Content-Type':type, 'Content-Length':Buffer.byteLength(content), ...cors(), 'Cache-Control':'no-store' });
  res.end(head ? undefined : content);
}
function fail(res, status, code, message, details, head = false, extra = {}) {
  const error = { code, message }; if (details !== undefined) error.details = details;
  json(res, status, { error }, head, extra);
}
function one(params, key) {
  const values = params.getAll(key);
  if (values.length > 1) throw new TypeError(`Параметр ${key} нельзя повторять.`);
  return values[0] ?? null;
}
function idFrom(raw) { if (!/^[1-9]\d*$/.test(raw)) return null; const value = Number(raw); return Number.isSafeInteger(value) ? value : null; }
function parseFilters(params) {
  for (const name of params.keys()) if (!FILTERS.has(name)) throw new TypeError(`Неизвестный параметр: ${name}.`);
  const filters = { completed:null, priority:null, categoryId:null, q:'' };
  const completed = one(params,'completed');
  if (completed !== null) { if (!['true','false'].includes(completed)) throw new TypeError('completed должен быть true или false.'); filters.completed = completed === 'true'; }
  const priority = one(params,'priority');
  if (priority !== null) { if (!PRIORITIES.has(priority)) throw new TypeError('Неверный priority.'); filters.priority = priority; }
  const categoryId = one(params,'categoryId');
  if (categoryId !== null) { const id = idFrom(categoryId); if (!id) throw new TypeError('Неверный categoryId.'); filters.categoryId = id; }
  const q = one(params,'q');
  if (q !== null) { filters.q = q.trim(); if (filters.q.length > 100) throw new TypeError('Строка поиска слишком длинная.'); }
  return filters;
}
function selectTasks(tasks, filters) {
  const q = filters.q.toLocaleLowerCase('ru-RU');
  return tasks.filter((item) =>
    (filters.completed === null || item.completed === filters.completed) &&
    (filters.priority === null || item.priority === filters.priority) &&
    (filters.categoryId === null || item.categoryId === filters.categoryId) &&
    (!q || item.title.toLocaleLowerCase('ru-RU').includes(q)));
}
function parseDelay(params) {
  for (const name of params.keys()) if (name !== 'ms') throw new TypeError('Недопустимый query-параметр.');
  const raw = one(params,'ms') ?? '1000';
  if (!/^\d+$/.test(raw) || Number(raw) > 5000 || !Number.isSafeInteger(Number(raw))) throw new TypeError('ms: 0..5000');
  return Number(raw);
}
function validateFields(body, categoryIds, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { body: 'Тело должно быть JSON-объектом.' };
  const allowed = new Set(partial ? ['title','completed','priority','categoryId'] : ['title','priority','categoryId']);
  const errors = {};
  for (const field of Object.keys(body)) if (!allowed.has(field)) errors[field] = 'Неизвестное поле.';
  if (partial && !Object.keys(body).length) errors.body = 'Передайте хотя бы одно поле.';
  if (!partial) for (const field of ['title','priority','categoryId']) if (!(field in body)) errors[field] = 'Обязательное поле.';
  if ('title' in body && (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 100)) errors.title = 'Название должно содержать от 1 до 100 символов.';
  if ('completed' in body && typeof body.completed !== 'boolean') errors.completed = 'Нужно boolean.';
  if ('priority' in body && !PRIORITIES.has(body.priority)) errors.priority = 'Недопустимый приоритет.';
  if ('categoryId' in body && (!Number.isSafeInteger(body.categoryId) || !categoryIds.has(body.categoryId))) errors.categoryId = 'Указана неизвестная категория.';
  return errors;
}
async function readBody(req) {
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] ?? '')) {
    const error = new Error('Требуется Content-Type application/json.'); error.status = 415; error.code = 'UNSUPPORTED_MEDIA_TYPE'; throw error;
  }
  const chunks = []; let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > 16 * 1024) { const error = new Error('Слишком большой запрос.'); error.status = 413; error.code = 'PAYLOAD_TOO_LARGE'; throw error; }
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { const error = new Error('Некорректный JSON.'); error.status = 400; error.code = 'INVALID_JSON'; throw error; }
}
export function createApiServer() {
  let tasks = seedTasks.map((t) => ({ ...t }));
  const categories = seedCategories.map((c) => ({ ...c }));
  const categoryIds = new Set(categories.map((c) => c.id));
  let nextId = 35;
  function reset() { tasks = seedTasks.map((t) => ({ ...t })); nextId = 35; }
  return http.createServer(async (req,res) => {
    let url;
    try { url = new URL(req.url ?? '/', `http://${HOST}`); }
    catch { fail(res,400,'BAD_REQUEST','Неверный URL.'); return; }
    const head = req.method === 'HEAD'; const method = head ? 'GET' : req.method;
    if (req.method === 'OPTIONS') { empty(res,204); return; }
    try {
      if (method === 'GET' && url.pathname === '/api/health') { json(res,200,{ data:{status:'ok'} },head); return; }
      if (method === 'GET' && url.pathname === '/api/tasks') {
        const filters = parseFilters(url.searchParams);
        const selected = selectTasks(tasks,filters);
        json(res,200,{ data:selected, meta:{ total:selected.length, filters } },head); return;
      }
      if (!READ_ONLY && req.method === 'POST' && url.pathname === '/api/tasks') {
        const body = await readBody(req);
        const errors = validateFields(body,categoryIds);
        if (Object.keys(errors).length) { fail(res,400,'VALIDATION_ERROR','Данные задачи не прошли проверку.',errors); return; }
        const task = { id:nextId++, title:body.title.trim(), completed:false, priority:body.priority, categoryId:body.categoryId };
        tasks.push(task); json(res,201,{data:task},false,{Location:`/api/tasks/${task.id}`}); return;
      }
      const match = url.pathname.match(/^\/api\/tasks\/([^/]+)$/);
      if (match) {
        let rawId;
        try { rawId = decodeURIComponent(match[1]); } catch { fail(res,400,'INVALID_ID','Неверный формат id.',undefined,head); return; }
        const id = idFrom(rawId);
        if (id === null) { fail(res,400,'INVALID_ID','id должен быть положительным целым.',undefined,head); return; }
        const index = tasks.findIndex((item) => item.id === id);
        if (index === -1) { fail(res,404,'TASK_NOT_FOUND',`Задача с id ${id} не найдена.`,{id},head); return; }
        if (method === 'GET') { json(res,200,{data:tasks[index]},head); return; }
        if (!READ_ONLY && req.method === 'PATCH') {
          const body = await readBody(req);
          const errors = validateFields(body,categoryIds,true);
          if (Object.keys(errors).length) { fail(res,400,'VALIDATION_ERROR','Данные задачи не прошли проверку.',errors); return; }
          tasks[index] = { ...tasks[index], ...body, title:'title' in body ? body.title.trim() : tasks[index].title, id };
          json(res,200,{data:tasks[index]}); return;
        }
        if (!READ_ONLY && req.method === 'DELETE') { tasks.splice(index,1); empty(res,204); return; }
        fail(res,405,'METHOD_NOT_ALLOWED','Метод не поддерживается.',undefined,head,{Allow:READ_ONLY?'GET, HEAD, OPTIONS':'GET, HEAD, PATCH, DELETE, OPTIONS'}); return;
      }
      if (method === 'GET' && url.pathname === '/api/categories') {
        json(res,200,{data:categories,meta:{total:categories.length}},head); return;
      }
      if (method === 'GET' && /^\/api\/categories\/[^/]+$/.test(url.pathname)) {
        const id = idFrom(url.pathname.split('/').at(-1));
        if (id === null) { fail(res,400,'INVALID_ID','Неверный id категории.',undefined,head); return; }
        const category = categories.find((x)=>x.id===id);
        if (!category) { fail(res,404,'CATEGORY_NOT_FOUND',`Категория с id ${id} не найдена.`,{id},head); return; }
        json(res,200,{data:category},head); return;
      }
      if (method === 'GET' && url.pathname === '/api/debug/delay') {
        const ms = parseDelay(url.searchParams); await new Promise((resolve)=>setTimeout(resolve,ms));
        if (!res.destroyed) json(res,200,{data:{delayedMs:ms}},head); return;
      }
      if (method === 'GET' && url.pathname === '/api/debug/error') { fail(res,503,'SERVICE_UNAVAILABLE','Учебная имитация временной недоступности сервиса.',undefined,head); return; }
      if (method === 'GET' && url.pathname === '/api/debug/invalid-json') { raw(res,200,'{"data":','application/json; charset=utf-8',head); return; }
      if (method === 'GET' && url.pathname === '/api/debug/text') { raw(res,200,'Это не JSON.','text/plain; charset=utf-8',head); return; }
      if (!READ_ONLY && req.method === 'POST' && url.pathname === '/api/debug/reset') { reset(); json(res,200,{data:{reset:true,total:tasks.length}}); return; }
      if (url.pathname === '/api/tasks') {
        fail(res,405,'METHOD_NOT_ALLOWED','Метод не поддерживается.',undefined,head,{Allow:READ_ONLY?'GET, HEAD, OPTIONS':'GET, HEAD, POST, OPTIONS'}); return;
      }
      fail(res,404,'ROUTE_NOT_FOUND',`Маршрут ${url.pathname} не найден.`,undefined,head);
    } catch(error) {
      if (error.status && error.code) fail(res,error.status,error.code,error.message);
      else if (error instanceof TypeError) fail(res,400,'INVALID_QUERY',error.message,undefined,head);
      else { console.error(error); if (!res.headersSent) fail(res,500,'INTERNAL_ERROR','Внутренняя ошибка API.'); else res.destroy(); }
    }
  });
}
export function readPort(raw, fallback = DEFAULT_PORT) {
  const port = Number(raw ?? fallback);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new TypeError('Неверный порт (1024–65535).');
  return port;
}
const entry = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (import.meta.url === entry) {
  const port = readPort(process.argv[2] ?? process.env.API_PORT);
  const server = createApiServer();
  server.on('error', (error) => { console.error(error.message); process.exitCode=1; });
  server.listen(port,HOST,()=>console.log(`Учебный API: http://${HOST}:${port}/api  (Ctrl+C — остановка)`));
}
