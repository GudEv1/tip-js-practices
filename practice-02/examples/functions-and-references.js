const sum=(a,b)=>a+b;
const square=(x)=>{return x*x;}; // Исправлен забытый return.
const obj={title:'Старая'};const alias=obj;alias.title='Новая';
const source=[obj];const copied=[...source];
const other={...obj,title:'Независимая'};
const defaultText=(value='По умолчанию')=>value;
console.log('1:',sum(3,4),sum('3',4),'2:',square(4));
console.log('3:',obj===alias,obj.title,'4:',source!==copied,source[0]===copied[0]);
console.log('5:',other.title,obj.title,'6:',defaultText(),defaultText(undefined),defaultText(null),defaultText(''));
