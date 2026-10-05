"use strict";

const totalTasks = 12;
const completedTasks = 5;

function validateProgress(total, completed) {
  if (typeof total !== 'number' || typeof completed !== 'number') {
    return "Ошибка: входные данные должны быть числами";
  }
  if (!Number.isInteger(total) || !Number.isInteger(completed)) {
    return "Ошибка: количество задач должно быть целым числом";
  }
  if (Number.isNaN(total) || Number.isNaN(completed)) {
    return "Ошибка: недопустимое числовое значение";
  }
  if (total < 0 || total > 1000) {
    return "Ошибка: общее количество задач должно быть от 0 до 1000";
  }
  if (completed < 0) {
    return "Ошибка: выполненное количество не может быть отрицательным";
  }
  if (completed > total) {
    return "Ошибка: выполнено больше задач, чем всего";
  }
  return null;
}

const error = validateProgress(totalTasks, completedTasks);

if (error) {
  console.log(error);
} else if (totalTasks === 0 && completedTasks === 0) {
  console.log("Задач пока нет");
} else {
  const remainingTasks = totalTasks - completedTasks;
  const percentage = (completedTasks / totalTasks * 100).toFixed(1);
  
  let status;
  if (completedTasks === 0) {
    status = "Не начато";
  } else if (completedTasks === totalTasks) {
    status = "Завершено";
  } else {
    status = "В работе";
  }
  
  console.log(`Всего задач: ${totalTasks}`);
  console.log(`Выполнено: ${completedTasks}`);
  console.log(`Осталось: ${remainingTasks}`);
  console.log(`Прогресс: ${percentage}%`);
  console.log(`Статус: ${status}`);
}