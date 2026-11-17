export function validateTaskDraft(draft,tasks,editingId=null){
 const errors={}; const isEditing=editingId!==null;let id;
 if(isEditing){id=editingId;if(!Number.isSafeInteger(id)||id<=0||!tasks.some(t=>t.id===id))errors.id='Редактируемая задача не найдена.';}
 else {const raw=draft?.id;id=typeof raw==='string'&&raw.trim()===''?NaN:Number(raw);if(!Number.isSafeInteger(id)||id<=0)errors.id='Введите положительный целый ID.';else if(tasks.some(t=>t.id===id))errors.id='Такой ID уже существует.';}
 const title=draft?.title;
 if(typeof title!=='string'||title.trim().length<1||title.trim().length>100)errors.title='Название: от 1 до 100 символов.';
 const priority=draft?.priority;if(!['low','medium','high'].includes(priority))errors.priority='Недопустимый приоритет.';
 if(Object.keys(errors).length)return {ok:false,errors};
 return {ok:true,value:{id,title:title.trim(),priority}};
}
