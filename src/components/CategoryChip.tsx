import React from 'react';
import cx from 'classnames';
import { CATEGORY_ICONS, type EventCategory } from '../lib/categories';

interface CategoryChipProps {
  category: EventCategory;
  active?: boolean;
  onClick?: () => void;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  category,
  active = false,
  onClick,
  showIcon = true,
  size = 'md',
  className,
}) => {
  const Icon = CATEGORY_ICONS[category];

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-xs font-bold gap-2',
    lg: 'px-5 py-2.5 text-sm font-bold gap-2.5',
  }[size];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'rounded-full flex items-center shrink-0 transition-all font-headline active:scale-95 duration-150 select-none',
        sizeClasses,
        active
          ? 'bg-primary-container text-white shadow-md shadow-primary/25'
          : 'bg-surface-high text-text-medium hover:bg-surface-highest hover:text-text-dark',
        className
      )}
    >
      {showIcon && (
        <Icon
          size={size === 'sm' ? 13 : 15}
          className={active ? 'text-white' : 'text-primary'}
          aria-hidden="true"
        />
      )}
      <span>{category}</span>
    </button>
  );
};
