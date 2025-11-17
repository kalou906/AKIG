const rules = [
  {
    when: (context) => context.contract && context.contract.daysToEnd <= 15,
    then: (context) => context.notify?.("Contrat en fin J-15", context.contract.id),
  },
  {
    when: (context) => context.payment && context.payment.reste > context.threshold,
    then: (context) => context.notify?.("Impayé > seuil", context.payment.contrat_id),
  },
];

export function runWorkflows(context) {
  rules.forEach((rule) => {
    try {
      if (rule.when(context)) {
        rule.then(context);
      }
    } catch (error) {
      console.warn("Workflow rule failed", error);
    }
  });
}
