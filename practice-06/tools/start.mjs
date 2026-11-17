import { createApiServer, readPort } from '../api/server.mjs';
import { createStaticServer, readWebPort } from './static-server.mjs';
const apiPort = readPort(process.argv[2] ?? process.env.API_PORT);
const webPort = readWebPort(process.argv[3] ?? process.env.WEB_PORT);
if (apiPort === webPort) throw new TypeError('Порты не должны совпадать.');
const api = createApiServer(), web = createStaticServer(webPort);
const host = '127.0.0.1';
for (const [name,server] of [['API',api],['Сайт',web]]) server.on('error',(error)=>{console.error(name, error.message);process.exitCode=1;});
api.listen(apiPort,host,()=>web.listen(webPort,host,()=>{
  console.log(`Учебный API: http://${host}:${apiPort}/api`);
  console.log(`Приложение: http://${host}:${webPort}/`);
  console.log(`Проверки: http://${host}:${webPort}/checks.html`);
  if(apiPort!==5505) console.log(`Нестандартный порт: http://${host}:${webPort}/?api=http://${host}:${apiPort}/api`);
  console.log('Остановка: Ctrl+C');
}));
const stop=()=>{api.close();web.close();};
process.on('SIGINT',stop); process.on('SIGTERM',stop);
