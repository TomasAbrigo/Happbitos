export type PulseSide = { username: string; done: number; total: number };

function rateOf(side: PulseSide): number {
  return side.total === 0 ? 0 : side.done / side.total;
}

export function getPulseQuip(me: PulseSide, friend: PulseSide | null): string {
  if (!friend) return "Todavía no hay con quién comparar.";

  const meRate = rateOf(me);
  const friendRate = rateOf(friend);

  if (me.total === 0 && friend.total === 0) return "Ninguno de los dos tiene hábitos activos.";
  if (meRate === friendRate) return "Están empatados. Nadie afloja.";
  if (meRate > friendRate) return `Le ganás a ${friend.username} hoy.`;
  return `${friend.username} te está ganando hoy.`;
}
