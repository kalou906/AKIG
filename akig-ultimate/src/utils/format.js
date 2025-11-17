export const fmtMoney = (value) => {
  const amount = Number(value ?? 0);
  return `GNF ${amount.toLocaleString()}`;
};

export const fmtDate = (iso) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleDateString();
};
