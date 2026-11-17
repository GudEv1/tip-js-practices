"use strict";
// Вариант 6. Останется 12 задач, лимит 5: 5 + 5 + 2 = 3 дня.
const totalTasks = 18;
const completedTasks = 6;
const dailyLimit = 5;
if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks) ||
    totalTasks < 0 || totalTasks > 1000 || completedTasks < 0 || completedTasks > totalTasks ||
    !Number.isInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 1000) {
  console.log("Ошибка: введены недопустимые количества задач или дневной лимит.");
} else {
  let remaining = totalTasks - completedTasks;
  let day = 0;
  console.log(`Осталось задач: ${remaining}`);
  if (remaining === 0) console.log("Все задачи уже выполнены");
  while (remaining > 0) {
    day += 1;
    const today = Math.min(dailyLimit, remaining);
    remaining -= today;
    console.log(`День ${day}: выполнено ${today}, осталось ${remaining}`);
  }
  console.log(`Потребуется дней: ${day}`);
}
