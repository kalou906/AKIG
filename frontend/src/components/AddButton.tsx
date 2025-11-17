import React from 'react';

interface AddButtonProps {
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function AddButton({
  label = 'Ajouter',
  onClick,
  disabled = false,
  className = '',
}: AddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-primary ${className}`}
      aria-label={label}
    >
      ➕ {label}
    </button>
  );
}
