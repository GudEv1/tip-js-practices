export class ApiError extends Error {
  constructor(message, { kind, status = null, code = null, details = null, url = null, cause } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}

export function buildUrl(baseUrl, path, query = {}) {
  if (typeof baseUrl !== 'string' || !baseUrl.trim()) throw new TypeError('baseUrl должен быть абсолютным HTTP URL.');
  let base;
  try { base = new URL(baseUrl); } catch { throw new TypeError('Неверный baseUrl.'); }
  if (!['http:', 'https:'].includes(base.protocol) || base.search || base.hash || !base.hostname || base.username || base.password) {
    throw new TypeError('baseUrl должен быть HTTP(S) адресом без query и hash.');
  }
  if (typeof path !== 'string' || !path.trim() || /^[a-z][a-z\d+.-]*:/i.test(path) || path.startsWith('//') || path.includes('?') || path.includes('#')) {
    throw new TypeError('path должен быть непустым относительным путём.');
  }
  if (!query || typeof query !== 'object' || Array.isArray(query)) throw new TypeError('query должен быть объектом.');
  const combined = `${base.pathname.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  if (combined.split('/').includes('..')) throw new TypeError('Подъём по пути запрещён.');
  base.pathname = combined.replace(/\/{2,}/g, '/');
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') base.searchParams.set(key, String(value));
  }
  return base.href;
}

export function createApiClient({ baseUrl, fetchFn = globalThis.fetch, timeoutMs = 3000 } = {}) {
  const normalized = buildUrl(baseUrl, 'health').replace(/\/health$/, '');
  if (typeof fetchFn !== 'function') throw new TypeError('fetchFn должен быть функцией.');
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) throw new TypeError('timeoutMs должен быть положительным целым.');

  async function requestJson(path, { method = 'GET', query = {}, body, signal, timeoutMs: override } = {}) {
    const verb = typeof method === 'string' ? method.toUpperCase() : '';
    if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(verb)) throw new TypeError('Недопустимый HTTP-метод.');
    if (verb === 'GET' && body !== undefined) throw new TypeError('GET не может содержать body.');
    const actualTimeout = override === undefined ? timeoutMs : override;
    if (!Number.isSafeInteger(actualTimeout) || actualTimeout <= 0) throw new TypeError('Неверный timeoutMs.');
    if (signal !== undefined && !(signal instanceof AbortSignal)) throw new TypeError('Неверный AbortSignal.');
    const url = buildUrl(normalized, path, query);
    const deadline = AbortSignal.timeout(actualTimeout);
    const combinedSignal = signal ? AbortSignal.any([signal, deadline]) : deadline;
    const headers = { Accept: 'application/json' };
    const options = { method: verb, headers, signal: combinedSignal };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
    const classify = (cause) => {
      const kind = deadline.aborted && !(signal?.aborted) ? 'timeout' : signal?.aborted ? 'aborted' : 'network';
      const message = kind === 'timeout' ? 'Превышено время ожидания ответа API.' :
        kind === 'aborted' ? 'Запрос отменён.' : 'Не удалось соединиться с API.';
      return new ApiError(message, { kind, cause, url });
    };
    let response;
    try {
      response = await fetchFn(url, options);
    } catch (error) {
      throw classify(error);
    }
    if (!(response instanceof Response)) {
      throw new ApiError('Ожидался объект Response.', { kind: 'invalid-response', url });
    }
    // HTTP-статус важнее Content-Type: даже HTML 502 должен остаться kind=http.
    if (!response.ok) {
      let errorData;
      try { errorData = (await response.json())?.error; } catch { /* неверный JSON ошибки не скрывает статус */ }
      throw new ApiError(typeof errorData?.message === 'string' ? errorData.message : `HTTP ${response.status}`, {
        kind: 'http', status: response.status,
        code: typeof errorData?.code === 'string' ? errorData.code : null,
        details: errorData?.details ?? null, url,
      });
    }
    if (response.status === 204) return null;
    if (!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '')) {
      throw new ApiError('Ожидался Content-Type application/json.', { kind: 'invalid-response', url });
    }
    try { return await response.json(); }
    catch (cause) {
      if (deadline.aborted || signal?.aborted) throw classify(cause);
      throw new ApiError('Не удалось прочитать JSON ответа.', { kind: 'invalid-response', cause, url });
    }
  }
  return { requestJson };
}
