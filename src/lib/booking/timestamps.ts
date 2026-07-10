/** Compare instants regardless of ISO string format (.000Z vs +00:00). */
export function sameInstant(a: string, b: string): boolean {
  const aMs = new Date(a).getTime();
  const bMs = new Date(b).getTime();
  return !Number.isNaN(aMs) && !Number.isNaN(bMs) && aMs === bMs;
}
