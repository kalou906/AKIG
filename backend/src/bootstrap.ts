import { billingQueue } from './jobs/billing.queue';

export async function bootJobs() {
  // Planification mensuelle (le 1er à 02:00)
  await billingQueue.add('generate-invoices', {
    month: getPreviousMonth()
  }, {
    repeat: { cron: '0 2 1 * *' }
  });
  console.log('📅 Jobs de facturation planifiés');
}

function getPreviousMonth(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
}
