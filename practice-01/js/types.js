"use strict";

const checks = [
  { expr: '"8" + 2', result: "8" + 2, type: typeof ("8" + 2), desc: "Конкатенация строки и числа" },
  { expr: '"8" - 2', result: "8" - 2, type: typeof ("8" - 2), desc: "Вычитание: строка преобразуется в число" },
  { expr: 'Number("8") + 2', result: Number("8") + 2, type: typeof (Number("8") + 2), desc: "Явное преобразование в число" },
  { expr: '"12" > "3"', result: "12" > "3", type: typeof ("12" > "3"), desc: "Посимвольное сравнение строк (1 < 3, поэтому false)" },
  { expr: '12 === "12"', result: 12 === "12", type: typeof (12 === "12"), desc: "Строгое равенство: разные типы" },
  { expr: 'Number("")', result: Number(""), type: typeof Number(""), desc: "Пустая строка даёт 0" },
  { expr: 'Number("text")', result: Number("text"), type: typeof Number("text"), desc: "Непреобразуемая строка даёт NaN" },
  { expr: 'Boolean("false")', result: Boolean("false"), type: typeof Boolean("false"), desc: "Непустая строка всегда true" },
  { expr: 'typeof null', result: typeof null, type: typeof (typeof null), desc: "Исторический баг: typeof null === 'object'" },
  { expr: 'typeof NaN', result: typeof NaN, type: typeof (typeof NaN), desc: "NaN — это числовое значение" }
];

checks.forEach((check, index) => {
  console.log(`${index + 1}. ${check.expr}`);
  console.log(`   Результат: ${check.result}`);
  console.log(`   Тип: ${check.type}`);
  console.log(`   Объяснение: ${check.desc}`);
  console.log("");
});