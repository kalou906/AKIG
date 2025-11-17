const dayjs = require('dayjs');

exports.calcCaution = (monthlyRent) => Number(monthlyRent) * 3;
exports.calcCommission = (paidAmount) => Number(paidAmount) * 0.15;
exports.calcReversement = (paidAmount) => Number(paidAmount) - exports.calcCommission(paidAmount);
exports.calcPenalites = (montantDu, dateEcheance, datePaiement = new Date()) => {
  const j = dayjs(datePaiement).diff(dayjs(dateEcheance), 'day');
  return j >= 6 ? Number(montantDu) * 0.10 : 0;
};
exports.calcCompensationRupture = (monthlyRent) => Number(monthlyRent) * 1;
exports.calcDateFinPreavis = (dateNotif) => dayjs(dateNotif).add(90, 'day').toDate();
exports.calcDateRemiseClesMax = (dateFinPreavis) => new Date(dayjs(dateFinPreavis).year(), dayjs(dateFinPreavis).month(), 25);
exports.isFermetureAdministrative = (retardsCumulesEnMois) => retardsCumulesEnMois >= 2;
exports.getNextQuarterlyPaymentDates = (year) => [
  new Date(year, 0, 5), new Date(year, 3, 5), new Date(year, 6, 5), new Date(year, 9, 5)
];
