// Вариант №6; используется единый источник FILTERS_BY_VARIANT.
export const variantNumber = 6;
const FILTERS_BY_VARIANT = Object.freeze({
  1: { completed: false }, 2: { completed: true },
  3: { priority: 'high' }, 4: { priority: 'medium' },
  5: { categoryId: 1 }, 6: { categoryId: 2 },
  7: { q: 'провер' }, 8: { completed: false, priority: 'high', categoryId: 2 },
});
export function getVariantFilters(number) {
  if (!Number.isInteger(number) || !FILTERS_BY_VARIANT[number]) throw new RangeError('Номер варианта: 1–8.');
  return { ...FILTERS_BY_VARIANT[number] };
}
