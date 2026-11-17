"use strict";
const plannedText = "8";
const completedText = "3";
const additionalText = "2";
// Исправление 1: суммируем числа, а не склеиваем строки.
const completedTotal = Number(completedText) + Number(additionalText);
const remainingTasks = Number(plannedText) - completedTotal;
console.log("Выполнено:", completedTotal);
console.log("Осталось:", remainingTasks);
let controlSum = 0;
// Исправление 2: включаем значение 4 в цикл.
for (let taskNumber = 1; taskNumber <= 4; taskNumber += 1) controlSum += taskNumber;
console.log("Контрольная сумма:", controlSum);
