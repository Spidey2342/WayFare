/** Mirrors server solo cap (5 debates per UTC day counting toward XP). */
export function soloXpWouldCount(soloDebatesToday: number): boolean {
  return soloDebatesToday < 5;
}

export function soloDisplayXp(soloDebatesToday: number, serverXp: number): number {
  if (!soloXpWouldCount(soloDebatesToday) && serverXp === 0) return 0;
  return serverXp > 0 ? serverXp : 1;
}
