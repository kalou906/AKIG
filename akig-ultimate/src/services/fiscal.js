export function buildFiscalReport({ payments = [], charges = [], year }) {
  const targetYear = Number(year ?? new Date().getFullYear());

  const revenus = payments
    .filter((payment) => String(payment.periode ?? "").startsWith(String(targetYear)))
    .reduce((sum, payment) => sum + (payment.montant_paye ?? 0), 0);

  const couts = charges
    .filter((charge) => {
      const date = charge.date ? new Date(charge.date) : null;
      return date && date.getFullYear() === targetYear;
    })
    .reduce((sum, charge) => sum + (charge.montant ?? 0), 0);

  return {
    annee: targetYear,
    revenus,
    charges: couts,
    resultat: revenus - couts,
  };
}
