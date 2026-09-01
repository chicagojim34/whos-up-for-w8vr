import React from 'react';
import cx from 'classnames';
import { avatarColors, initialsOf } from '../lib/avatar';

interface AvatarProps {
  name: string;
  size?: number;
  className?: string;
  /** Ring colour, for stacked groups sitting on a coloured surface. */
  ringColor?: string;
  title?: string;
}

/**
 * Locally rendered initials avatar.
 *
 * Replaces the previous api.dicebear.com dependency: avatars carry "who else
 * is going", the product's whole social proof, so they must not depend on a
 * third-party host being reachable.
 */
export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 32,
  className,
  ringColor = '#ffffff',
  title,
}) => {
  const { bg, fg } = avatarColors(name);

  return (
    <span
      className={cx('inline-flex items-center justify-center rounded-full shrink-0', className)}
      style={{
        width: size,
        height: size,
        background: bg,
        color: fg,
        boxShadow: ringColor === 'transparent' ? undefined : `0 0 0 2px ${ringColor}`,
        fontFamily: 'var(--font-headline)',
        fontWeight: 800,
        fontSize: Math.max(9, Math.round(size * 0.38)),
        letterSpacing: '-0.02em',
        lineHeight: 1,
        userSelect: 'none',
      }}
      title={title ?? name}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
};
