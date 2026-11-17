"use strict";
// Индивидуальный вариант 6: всего 18, выполнено 6.
const totalTasks = 18;
const completedTasks = 6;
if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks) ||
    totalTasks < 0 || totalTasks > 1000 || completedTasks < 0 || completedTasks > totalTasks) {
  console.log("Ошибка: количество задач должно быть целым и допустимым.");
} else if (totalTasks === 0) {
  console.log("Задач пока нет");
} else {
  const remaining = totalTasks - completedTasks;
  const percent = (completedTasks / totalTasks * 100).toFixed(1);
  const status = completedTasks === 0 ? "Не начато" : completedTasks === totalTasks ? "Завершено" : "В работе";
  console.log(`Всего задач: ${totalTasks}`);
  console.log(`Выполнено: ${completedTasks}`);
  console.log(`Осталось: ${remaining}`);
  console.log(`Прогресс: ${percent}%`);
  console.log(`Статус: ${status}`);
}
