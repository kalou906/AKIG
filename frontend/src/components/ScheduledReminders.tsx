import React, { useMemo } from 'react';
import { FR } from '../i18n/fr';

/**
 * Interface pour les contrats
 */
interface Contract {
  id: string;
  tenant_name?: string;
  full_name?: string;
  frequency_note?: string;
  next_payment_date?: string;
  status?: string;
}

/**
 * Props pour ScheduledReminders
 */
export interface ScheduledRemindersProps {
  contracts: Contract[];
  onRemind?: (contractId: string) => void;
}

/**
 * Composant ScheduledReminders
 * Affiche les rappels périodiques planifiés
 *
 * Identifie automatiquement :
 * - Rappels le 5 du mois
 * - Rappels le 30 du mois
 * - Rappels à venir
 *
 * Exemple d'utilisation :
 * <ScheduledReminders
 *   contracts={contractsList}
 *   onRemind={(id) => sendReminder(id)}
 * />
 */
export function ScheduledReminders({
  contracts,
  onRemind,
}: ScheduledRemindersProps): React.ReactElement | null {
  const upcomingReminders = useMemo(() => {
    if (!contracts || contracts.length === 0) return [];

    const today = new Date();
    const currentDay = today.getDate();

    return contracts.filter((contract) => {
      if (!contract.frequency_note) return false;

      const note = String(contract.frequency_note).toLowerCase();
      const hasSchedule =
        note.includes('le 05') ||
        note.includes('le 5') ||
        note.includes('le 30') ||
        note.includes('tous les');

      if (!hasSchedule) return false;

      // Ajouter les prochains rappels
      return (
        note.includes('le 05') ||
        note.includes('le 5') ||
        note.includes('le 30') ||
        (currentDay <= 10 && note.includes('debut'))
      );
    });
  }, [contracts]);

  if (upcomingReminders.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <span className="text-xl">🔔</span>
        <div className="flex-1">
          <div className="font-semibold text-yellow-900">
            {upcomingReminders.length} {FR.notifications.scheduledReminder}
          </div>
          <ul className="mt-2 space-y-2 text-sm">
            {upcomingReminders.slice(0, 5).map((contract) => (
              <li
                key={contract.id}
                className="flex items-center justify-between bg-white p-2 rounded border border-yellow-100"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {contract.tenant_name || contract.full_name || 'Contrat'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {contract.frequency_note}
                  </div>
                </div>
                <button
                  onClick={() => onRemind?.(contract.id)}
                  className="btn btn-sm bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 text-xs"
                >
                  📤 Relancer
                </button>
              </li>
            ))}
          </ul>
          {upcomingReminders.length > 5 && (
            <div className="text-xs text-yellow-700 mt-2">
              +{upcomingReminders.length - 5} autre(s)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Variante compacte
 */
export function ScheduledRemindersCompact({
  contracts,
}: Omit<ScheduledRemindersProps, 'onRemind'>): React.ReactElement | null {
  const count = contracts?.filter((c) =>
    String(c.frequency_note || '').toLowerCase().includes('le')
  ).length || 0;

  if (count === 0) return null;

  return (
    <div className="text-sm text-yellow-700 bg-yellow-50 px-2 py-1 rounded inline-flex items-center gap-1">
      <span>🔔</span>
      <span>{count} rappels planifiés</span>
    </div>
  );
}

/**
 * Utilitaire : extraire la date du prochain rappel
 */
export function getNextReminderDate(frequencyNote?: string): Date | null {
  if (!frequencyNote) return null;

  const note = String(frequencyNote).toLowerCase();
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();

  if (note.includes('le 05') || note.includes('le 5')) {
    const next = new Date(year, month, 5);
    return next < today ? new Date(year, month + 1, 5) : next;
  }

  if (note.includes('le 30')) {
    const next = new Date(year, month, 30);
    return next < today ? new Date(year, month + 1, 30) : next;
  }

  return null;
}
