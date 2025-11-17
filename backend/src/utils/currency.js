function formatGNF(amount) {
  if (amount == null || isNaN(Number(amount))) return 'GNF 0';
  const rounded = Math.round(Number(amount));
  const parts = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `GNF ${parts}`;
}

module.exports = { formatGNF };
