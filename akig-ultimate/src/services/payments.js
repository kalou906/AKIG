export function planFractionnement({ montant, parts }) {
  const total = Number(montant ?? 0);
  const portions = Math.max(1, Number(parts ?? 1));

  const base = Math.floor(total / portions);
  const schedule = Array.from({ length: portions }, (_, index) => ({ part: index + 1, montant: base }));
  const remainder = total - base * portions;

  if (remainder > 0) {
    schedule[schedule.length - 1].montant += remainder;
  }

  return schedule;
}
