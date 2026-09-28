/** "YYYY-MM-DDTHH:mm" plus some hours. */
export function addHours(ts: string, hours: number): string {
  const d = new Date(`${ts}:00`);
  d.setMinutes(d.getMinutes() + Math.round(hours * 60));
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
