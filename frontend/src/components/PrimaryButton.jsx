/**
 * Composant PrimaryButton
 * Bouton principal avec styling cohérent et accessibilité
 */

import React from 'react';
import PropTypes from 'prop-types';
import styles from './PrimaryButton.module.css';

export default function PrimaryButton({
  label,
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  ariaLabel,
  dataTestId,
  title,
  size = 'md',
  icon = null,
  fullWidth = false,
}) {
  const handleClick = (e) => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  const buttonClass = [
    styles.button,
    styles[`button--${size}`],
    disabled && styles['button--disabled'],
    loading && styles['button--loading'],
    fullWidth && styles['button--full-width'],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      className={buttonClass}
      aria-label={ariaLabel || label}
      aria-busy={loading}
      data-testid={dataTestId || `primary-button-${label}`}
      title={title}
    >
      {/* Loading spinner */}
      {loading && (
        <span className={styles.spinner} aria-hidden="true">
          <svg
            className={styles.spinnerIcon}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </span>
      )}

      {/* Icon */}
      {icon && !loading && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}

      {/* Label */}
      <span className={styles.label}>{label}</span>

      {/* Loading text (for screen readers) */}
      {loading && (
        <span className={styles.srOnly}>
          {label} est en cours de traitement
        </span>
      )}
    </button>
  );
}

PrimaryButton.propTypes = {
  /** Texte du bouton */
  label: PropTypes.string.isRequired,

  /** Fonction appelée au clic */
  onClick: PropTypes.func,

  /** Type du bouton HTML */
  type: PropTypes.oneOf(['button', 'submit', 'reset']),

  /** Désactiver le bouton */
  disabled: PropTypes.bool,

  /** Afficher l'état de chargement */
  loading: PropTypes.bool,

  /** Classes CSS supplémentaires */
  className: PropTypes.string,

  /** Label pour l'accessibilité */
  ariaLabel: PropTypes.string,

  /** Attribut data-testid */
  dataTestId: PropTypes.string,

  /** Tooltip du bouton */
  title: PropTypes.string,

  /** Taille du bouton */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),

  /** Icône à afficher */
  icon: PropTypes.node,

  /** Largeur complète */
  fullWidth: PropTypes.bool,
};

PrimaryButton.defaultProps = {
  type: 'button',
  disabled: false,
  loading: false,
  className: '',
  size: 'md',
  icon: null,
  fullWidth: false,
  onClick: undefined,
  ariaLabel: undefined,
  dataTestId: undefined,
  title: undefined,
};
