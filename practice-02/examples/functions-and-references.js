// ЭКСПЕРИМЕНТ 1: Вызов с разными типами
function sum(a, b) {
  return a + b;
}
console.log("1. sum(2, 3):", sum(2, 3)); // 5
console.log("1. sum('2', 3):", sum('2', 3)); // '23' (конкатенация, функция не проверяет типы)

// ЭКСПЕРИМЕНТ 2: Стрелочная функция с фигурными скобками (ИСПРАВЛЕННЫЙ)
// БЫЛО: const square = (x) => { x * x }; (возвращало undefined)
// СТАЛО: добавлен return
const square = (x) => { return x * x; };
console.log("2. square(4):", square(4)); // 16

// ЭКСПЕРИМЕНТ 3: Ссылка на объект
const originalObj = { title: "Черновик", published: false };
const aliasObj = originalObj;
aliasObj.published = true;
console.log("3. originalObj.published:", originalObj.published); // true (изменился и оригинал)

// ЭКСПЕРИМЕНТ 4: Spread массива (поверхностное копирование)
const arr1 = [{ id: 1, title: "A" }];
const arr2 = [...arr1];
arr2[0].title = "B";
console.log("4. arr1[0].title:", arr1[0].title); // "B" (объект внутри общий)

// ЭКСПЕРИМЕНТ 5: Spread объекта и перекрытие свойств
const book1 = { id: 1, title: "Old", available: false };
const book2 = { ...book1, available: true };
console.log("5. book2.available:", book2.available); // true (новое значение перекрыло старое)

// ЭКСПЕРИМЕНТ 6: Параметр по умолчанию
function makeCaption(text = "Без названия") {
  return text;
}
console.log("6. makeCaption():", makeCaption()); // "Без названия"
console.log("6. makeCaption(null):", makeCaption(null)); // null (null не триггерит дефолт)