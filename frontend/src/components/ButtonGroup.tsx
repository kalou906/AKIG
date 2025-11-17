import React from 'react';

interface ButtonGroupProps {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  gap?: 'sm' | 'md' | 'lg';
  align?: 'start' | 'center' | 'end';
  justified?: boolean;
  className?: string;
}

/**
 * Button group component for organizing multiple buttons
 * @param children Button elements to group
 * @param direction Layout direction (row or column)
 * @param gap Spacing between buttons (sm, md, lg)
 * @param align Vertical alignment
 * @param justified Stretch buttons to fill available space
 */
export function ButtonGroup({
  children,
  direction = 'row',
  gap = 'md',
  align = 'center',
  justified = false,
  className = '',
}: ButtonGroupProps) {
  const directionClass = direction === 'row' ? 'flex-row' : 'flex-col';

  const gapMap = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
  };

  const alignMap = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
  };

  return (
    <div
      className={`
        flex ${directionClass} ${alignMap[align]} ${gapMap[gap]}
        ${justified ? 'w-full' : ''}
        ${className}
      `}
      role="group"
    >
      {children}
    </div>
  );
}

/**
 * Segmented button group (radio-like behavior)
 */
interface SegmentedButtonGroupProps {
  options: Array<{ id: string; label: string }>;
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export function SegmentedButtonGroup({
  options,
  value,
  onChange,
  className = '',
}: SegmentedButtonGroupProps) {
  return (
    <div
      className={`inline-flex rounded-lg border border-[var(--border)] p-1 ${className}`}
      role="group"
    >
      {options.map((option, index) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`
            px-3 py-2 text-sm font-medium transition-colors
            ${index > 0 ? 'border-l border-[var(--border)]' : ''}
            ${
              value === option.id
                ? 'bg-[var(--akigBlue)] text-white'
                : 'bg-transparent text-[var(--akigText)] hover:bg-gray-100'
            }
          `}
          aria-pressed={value === option.id}
          aria-label={option.label}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
