export const STICKER_CATALOG = [
  "Grande campeón",
  "Qué máquina",
  "Fuego puro",
  "Nivel dios",
  "Andá que podés",
  "Ídolo total",
  "Constancia de acero",
  "Se nota el esfuerzo",
] as const;

export type Sticker = (typeof STICKER_CATALOG)[number];

export function isValidSticker(value: string): value is Sticker {
  return (STICKER_CATALOG as readonly string[]).includes(value);
}
