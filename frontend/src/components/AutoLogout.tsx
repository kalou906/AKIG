import React, { useEffect, useRef } from 'react';

interface AutoLogoutProps {
  minutes?: number;
  onTimeout: () => void;
}

/**
 * AutoLogout component - Logs out user after inactivity
 * Tracks user activity: clicks, keyboard, mouse movement, scrolling
 */
export function AutoLogout({
  minutes = 30,
  onTimeout,
}: AutoLogoutProps): React.ReactElement | null {
  const timer = useRef<number | null>(null);

  const reset = (): void => {
    if (timer.current) {
      window.clearTimeout(timer.current);
    }
    timer.current = window.setTimeout(onTimeout, minutes * 60 * 1000);
  };

  useEffect(() => {
    const events = ['click', 'keydown', 'mousemove', 'scroll'];

    events.forEach((ev) => window.addEventListener(ev, reset));
    reset();

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, reset));
      if (timer.current) {
        window.clearTimeout(timer.current);
      }
    };
  }, [minutes, onTimeout]);

  return null;
}
