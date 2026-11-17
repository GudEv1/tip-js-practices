import assert from 'node:assert/strict';
export { assert };
export async function suite(title, cases) {
  let ok=0, failed=0;
  for(const [name,fn] of cases){try{await fn();ok++;console.log(`OK: ${name}`);}catch(error){failed++;console.error(`FAIL: ${name}\n${error.stack??error}`);}}
  console.log(`\nИтог ${title}: успешно ${ok}, ошибок ${failed}.`);
  if(failed)process.exitCode=1;
}
export async function serve(server) {
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  return `http://127.0.0.1:${server.address().port}/api`;
}
export async function expectKind(fn,kind){
  let err;try{await fn();}catch(e){err=e;}
  assert.equal(err?.kind,kind,`Ожидалась ошибка ${kind}, получено ${err?.kind??'ничего'}`);
  return err;
}
