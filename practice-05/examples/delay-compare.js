import { createApiClient } from '../src/api-client.js';
const api = createApiClient({ baseUrl: process.env.API_URL ?? 'http://127.0.0.1:5505/api', timeoutMs: 1500 });
const delay = () => api.requestJson('/debug/delay', { query: { ms: 150 } });
async function measure(fn) { const start=performance.now();await fn();return Math.round(performance.now()-start); }
const serial=[],parallel=[];
for(let n=0;n<3;n++)serial.push(await measure(async()=>{await delay();await delay();}));
for(let n=0;n<3;n++)parallel.push(await measure(async()=>{await Promise.all([delay(),delay()]);}));
console.log('Последовательно, мс:',serial);
console.log('Параллельный старт, мс:',parallel);
