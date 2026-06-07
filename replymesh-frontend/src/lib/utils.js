export const BRL = (value) => "R$ " + value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const BRL0 = (value) => "R$ " + value.toLocaleString("pt-BR");
export const NUM = (value) => value.toLocaleString("pt-BR");

export function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 32);
}
