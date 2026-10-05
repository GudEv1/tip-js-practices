"use strict";

const totalTasks = 12;
const completedTasks = 5;
const dailyLimit = 3;

function validatePlan(total, completed, limit) {
  if (typeof total !== 'number' || typeof completed !== 'number' || typeof limit !== 'number') {
    return "Ошибка: все входные данные должны быть числами";
  }
  if (!Number.isInteger(total) || !Number.isInteger(completed) || !Number.isInteger(limit)) {
    return "Ошибка: все значения должны быть целыми числами";
  }
  if (Number.isNaN(total) || Number.isNaN(completed) || Number.isNaN(limit)) {
    return "Ошибка: недопустимое числовое значение";
  }
  if (total < 0 || total > 1000) {
    return "Ошибка: общее количество задач должно быть от 0 до 1000";
  }
  if (completed < 0 || completed > total) {
    return "Ошибка: некорректное количество выполненных задач";
  }
  if (limit < 1 || limit > 1000) {
    return "Ошибка: дневная норма должна быть от 1 до 1000";
  }
  return null;
}

const error = validatePlan(totalTasks, completedTasks, dailyLimit);

if (error) {
  console.log(error);
} else {
  let remainingTasks = totalTasks - completedTasks;
  
  if (remainingTasks === 0) {
    console.log("Все задачи уже выполнены");
    console.log("Потребуется дней: 0");
  } else {
    console.log(`Осталось задач: ${remainingTasks}`);
    
    let day = 0;
    let daysNeeded = 0;
    
    while (remainingTasks > 0) {
      day += 1;
      const tasksToday = Math.min(dailyLimit, remainingTasks);
      remainingTasks -= tasksToday;
      daysNeeded += 1;
      
      console.log(`День ${day}: выполнено ${tasksToday}, осталось ${remainingTasks}`);
    }
    
    console.log(`Потребуется дней: ${daysNeeded}`);
  }
}