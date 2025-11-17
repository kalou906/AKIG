export function validateTenant(tenant) {
  if (!tenant.nom || tenant.nom.length < 2) {
    return "Nom trop court";
  }

  if (!/^\d{9}$/.test(tenant.tel ?? "")) {
    return "Téléphone (9 chiffres)";
  }

  return null;
}

export function validateContract(contract) {
  if (!contract.n_contrat) {
    return "N° de contrat requis";
  }

  if (!contract.montant_loyer || contract.montant_loyer <= 0) {
    return "Montant loyer invalide";
  }

  if (new Date(contract.date_fin) < new Date(contract.date_debut)) {
    return "Dates incohérentes";
  }

  return null;
}
