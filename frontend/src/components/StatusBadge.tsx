import React from 'react';
import { FR } from '../i18n/fr';

/**
 * Props du StatusBadge
 */
export interface StatusBadgeProps {
  arrears_amount?: number;
  arrears_months?: number;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

/**
 * Composant StatusBadge
 * Affiche le statut de paiement du locataire avec couleur
 *
 * Logique de couleur :
 * - 🟢 Vert : Aucun impayé (arrears_amount = 0)
 * - 🟡 Jaune : < 1 mois (0 < arrears_months <= 1)
 * - 🔴 Rouge : > 1 mois ou > 2M GNF (arrears_months > 1 OU arrears_amount > 2M)
 * - ⚪ Gris : Pas de données
 *
 * Exemple d'utilisation :
 * <StatusBadge
 *   arrears_amount={1500000}
 *   arrears_months={2}
 *   size="md"
 * />
 */
export function StatusBadge({
  arrears_amount = 0,
  arrears_months = 0,
  size = 'md',
  onClick,
}: StatusBadgeProps): React.ReactElement {
  // Déterminer le statut
  const isUpToDate = arrears_amount === 0 || arrears_amount === null;
  const isWarning =
    !isUpToDate && arrears_amount > 0 && arrears_months <= 1 && arrears_amount <= 2_000_000;
  const isCritical = arrears_months > 1 || arrears_amount > 2_000_000;

  // Déterminer les couleurs et le label
  let className = '';
  let label = '';
  let emoji = '';

  if (isUpToDate) {
    className = 'bg-green-100 text-green-700 border border-green-300';
    label = FR.statusBadge.upToDate;
    emoji = '✅';
  } else if (isWarning) {
    className = 'bg-yellow-100 text-yellow-800 border border-yellow-300';
    label = FR.statusBadge.oneMonth;
    emoji = '⚠️';
  } else if (isCritical) {
    className = 'bg-red-100 text-red-700 border border-red-300';
    label = FR.statusBadge.overOneMonth;
    emoji = '🔴';
  } else {
    className = 'bg-gray-100 text-gray-600 border border-gray-300';
    label = FR.statusBadge.unknown;
    emoji = '❓';
  }

  // Tailles
  const sizeClass =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs'
      : size === 'lg'
        ? 'px-3 py-1.5 text-sm'
        : 'px-2 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-medium cursor-pointer hover:opacity-80 transition ${className} ${sizeClass}`}
      onClick={onClick}
      title={`${label} - ${arrears_months} mois d'impayés (${Intl.NumberFormat('fr-GN').format(arrears_amount || 0)} GNF)`}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </span>
  );
}

/**
 * Variante avec détails
 * Affiche plus d'informations
 */
export function StatusBadgeDetailed({
  arrears_amount = 0,
  arrears_months = 0,
}: Omit<StatusBadgeProps, 'size' | 'onClick'>): React.ReactElement {
  const isUpToDate = arrears_amount === 0;
  const months = arrears_months || 0;
  const amount = arrears_amount || 0;

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
      <StatusBadge
        arrears_amount={arrears_amount}
        arrears_months={arrears_months}
        size="md"
      />
      {!isUpToDate && (
        <div className="text-xs text-gray-600">
          <div className="font-medium">
            {months} mois d'impayés
          </div>
          <div className="text-red-600 font-bold">
            {Intl.NumberFormat('fr-GN').format(amount)} GNF
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Variante année (avec année dans le label)
 */
export function StatusBadgeYear({
  arrears_amount = 0,
  arrears_months = 0,
  year,
}: StatusBadgeProps & { year?: number }): React.ReactElement {
  const isUpToDate = arrears_amount === 0;

  return (
    <div className="inline-flex items-center gap-2">
      <StatusBadge arrears_amount={arrears_amount} arrears_months={arrears_months} />
      {year && (
        <span className="text-xs text-gray-500">
          {year}
          {!isUpToDate && ` • ${Intl.NumberFormat('fr-GN').format(arrears_amount)} GNF`}
        </span>
      )}
    </div>
  );
}

/**
 * Badge compact (icône seulement)
 */
export function StatusBadgeIcon({
  arrears_amount = 0,
  arrears_months = 0,
}: Omit<StatusBadgeProps, 'size' | 'onClick'>): React.ReactElement {
  const isUpToDate = arrears_amount === 0;
  const isWarning =
    !isUpToDate && arrears_amount > 0 && arrears_months <= 1 && arrears_amount <= 2_000_000;
  const isCritical = arrears_months > 1 || arrears_amount > 2_000_000;

  let emoji = '❓';
  if (isUpToDate) {
    emoji = '✅';
  } else if (isWarning) {
    emoji = '⚠️';
  } else if (isCritical) {
    emoji = '🔴';
  }

  return (
    <span
      className="text-lg cursor-pointer hover:scale-110 transition"
      title={`${arrears_months} mois d'impayés`}
    >
      {emoji}
    </span>
  );
}
