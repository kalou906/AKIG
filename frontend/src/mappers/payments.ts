// Mapper résilient pour paiements — uniformise champs backend variables
export function mapPayment(p: any) {
  return {
    id: p.id ?? crypto.randomUUID(),
    tenant_id: p.tenant_id ?? p.tenantId ?? null,
    date: p.date ?? p.created_at ?? new Date().toISOString(),
    amount: Number(p.amount ?? p.total ?? 0),
    method: p.method ?? p.type ?? 'N/A',
  };
}

export function mapPayments(list: any[]): any[] {
  return Array.isArray(list) ? list.map(mapPayment) : [];
}