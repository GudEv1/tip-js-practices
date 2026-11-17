"use strict";
const expressions = [
 ['"8" + 2', "8" + 2],
 ['"8" - 2', "8" - 2],
 ['Number("8") + 2', Number("8") + 2],
 ['"12" > "3"', "12" > "3"],
 ['12 === "12"', 12 === "12"],
 ['Number("")', Number("")],
 ['Number("text")', Number("text")],
 ['Boolean("false")', Boolean("false")],
 ['typeof null', typeof null],
 ['typeof NaN', typeof NaN],
];
for (const [expression, result] of expressions) {
 console.log(`${expression}:`, result, `(тип: ${typeof result})`);
}
