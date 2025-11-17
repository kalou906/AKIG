import React, { useEffect, useRef } from 'react';

/**
 * FocusTrap component - Piège le focus dans un conteneur
 * Utile pour les modals, dialogs, popovers
 */
interface FocusTrapProps {
  children: React.ReactNode;
}

export function FocusTrap({ children }: FocusTrapProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Récupérer tous les éléments focusables
    const focusable = Array.from(
      el.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    );

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    // Focus initial sur le premier élément
    first?.focus();

    // Gérer la navigation au clavier
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const activeEl = document.activeElement;

      // Shift+Tab sur le premier élément -> focus sur le dernier
      if (e.shiftKey && activeEl === first) {
        e.preventDefault();
        last.focus();
      }
      // Tab sur le dernier élément -> focus sur le premier
      else if (!e.shiftKey && activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    };

    el.addEventListener('keydown', onKeyDown);

    return () => {
      el.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}
