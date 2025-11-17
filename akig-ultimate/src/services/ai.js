export function forecastCashflow(payments, horizonMonths = 3) {
  const grouped = payments.reduce((acc, payment) => {
    const key = payment.periode;
    acc[key] = (acc[key] ?? 0) + (payment.montant_paye ?? 0);
    return acc;
  }, {});

  const values = Object.values(grouped);
  const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

  return Array.from({ length: horizonMonths }, (_, index) => ({
    mois: index + 1,
    prevu: Math.round(average),
  }));
}

export function tenantRiskScore(history) {
  const totalMonths = history.length || 1;
  const lateMonths = history.filter((entry) => (entry.reste ?? 0) > 0).length;
  const ratio = lateMonths / totalMonths;
  const score = Math.max(5, Math.round(100 - ratio * 80));

  let label = "Risque élevé";
  if (score >= 80) {
    label = "Faible risque";
  } else if (score >= 50) {
    label = "Risque moyen";
  }

  return { score, label };
}
