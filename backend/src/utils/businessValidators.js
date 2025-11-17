exports.isPhoneGN = (s) => /^(\+224|00224)?[62345678][0-9]{7}$/.test(s || '');
exports.validateSolvabilite = (revenu, loyer) => Number(revenu) >= Number(loyer) * 3;
exports.validatePreavis = (dateNotif, dateFin) => {
  const d1 = new Date(dateNotif), d2 = new Date(dateFin);
  return (d2 - d1) / (1000*60*60*24) >= 90;
};
