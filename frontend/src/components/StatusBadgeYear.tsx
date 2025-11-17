/**
 * StatusBadgeYear Component
 * Displays arrears status badge with color coding
 *
 * Colors:
 * - Green: À jour (up to date, 0 arrears)
 * - Yellow: 1 mois (1 month arrears)
 * - Red: > 1 mois (more than 1 month or >2M arrears)
 * - Gray: Inconnu (unknown/no data)
 */

interface StatusBadgeYearProps {
  arrears_amount: number;
  arrears_months: number;
}

export function StatusBadgeYear({
  arrears_amount,
  arrears_months,
}: StatusBadgeYearProps) {
  // Determine status based on arrears
  const isGreen = arrears_amount === 0;
  const isYellow = arrears_amount > 0 && arrears_months <= 1;
  const isRed = arrears_months > 1 || arrears_amount > 2_000_000;

  // Apply appropriate styling
  let className = 'px-2 py-1 rounded text-xs font-medium ';
  let label = 'Inconnu';

  if (isGreen) {
    className += 'bg-green-100 text-green-700';
    label = 'À jour';
  } else if (isYellow) {
    className += 'bg-yellow-100 text-yellow-800';
    label = '1 mois';
  } else if (isRed) {
    className += 'bg-red-100 text-red-700';
    label = '> 1 mois';
  } else {
    className += 'bg-gray-100 text-gray-600';
  }

  return <span className={className}>{label}</span>;
}
