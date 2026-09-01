import React from 'react';
import cx from 'classnames';
import { Avatar } from './Avatar';

interface AvatarGroupProps {
  names: string[];
  max?: number;
  size?: number;
  className?: string;
  ringColor?: string;
  /** Describes the group for screen readers, e.g. "12 people going". */
  label?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  names,
  max = 3,
  size = 32,
  className,
  ringColor,
  label,
}) => {
  if (names.length === 0) return null;

  const visible = names.slice(0, max);
  const remaining = names.length - visible.length;
  const overlap = -Math.floor(size * 0.3);

  return (
    <span
      className={cx('inline-flex items-center', className)}
      role="img"
      aria-label={label ?? `${names.length} people`}
    >
      {visible.map((name, i) => (
        <span
          key={name + i}
          className="inline-flex"
          style={{ marginLeft: i === 0 ? 0 : overlap, zIndex: visible.length - i }}
        >
          <Avatar name={name} size={size} ringColor={ringColor} />
        </span>
      ))}
      {remaining > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full bg-primary text-white font-headline font-black shrink-0"
          style={{
            width: size,
            height: size,
            marginLeft: overlap,
            // Smaller than the initials: "+128" has to fit the same circle.
            fontSize: Math.max(8, Math.round(size * 0.26)),
            letterSpacing: '-0.03em',
            boxShadow: `0 0 0 2px ${ringColor ?? '#ffffff'}`,
          }}
          aria-hidden="true"
        >
          +{remaining}
        </span>
      )}
    </span>
  );
};
