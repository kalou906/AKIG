const monthRegex = /janv|févr|fevr|mars|avr|mai|juin|juil|ao[uû]t|sept|oct|nov|d[eé]c/i;

export function smartSearch(query, { tenants = [], contracts = [], payments = [] }) {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) {
    return { tMatches: [], cMatches: [], pMatches: [] };
  }

  const words = q.split(/\s+/).filter(Boolean);
  const matchesText = (text) => words.some((word) => text.toLowerCase().includes(word));

  const tMatches = tenants.filter((tenant) => matchesText(tenant.nom ?? ""));
  const cMatches = contracts.filter((contract) => matchesText(String(contract.n_contrat ?? "")));
  const pMatches = payments.filter((payment) => {
    return (
      matchesText(payment.periode ?? "") ||
      words.some((word) => monthRegex.test(word)) ||
      words.some((word) => String(payment.contrat_id ?? "").includes(word))
    );
  });

  return { tMatches, cMatches, pMatches };
}
