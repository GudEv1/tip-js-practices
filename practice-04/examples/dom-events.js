const b=document.querySelector('#demo'),out=document.querySelector('#log');const log=x=>{out.textContent+=x+'\n';};
b.addEventListener('click',e=>log(`кнопка: ${e.eventPhase}, target ${e.target.tagName}`));b.parentElement.addEventListener('click',e=>log(`всплытие: ${e.eventPhase}`));b.parentElement.addEventListener('click',e=>log(`захват: ${e.eventPhase}`),true);
