import React from 'react';
import cx from 'classnames';
import { Gamepad2 } from 'lucide-react';
import type { Game } from '../lib/games';

/** The game's initials on a tint drawn from its brand colour. */
export const GameMark: React.FC<{ game: Game; size?: number; className?: string }> = ({
  game,
  size = 44,
  className,
}) => (
  <span
    className={cx('inline-flex items-center justify-center rounded-2xl shrink-0', className)}
    style={{
      width: size,
      height: size,
      background: game.accent,
      color: '#fff',
      fontFamily: 'var(--font-headline)',
      fontWeight: 800,
      fontSize: Math.max(11, Math.round(size * 0.34)),
      letterSpacing: '-0.02em',
    }}
    aria-hidden="true"
  >
    {game.name
      .replace(/[^A-Za-z ]/g, '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase()}
  </span>
);

const PLATFORM_LABEL: Record<string, string> = {
  iOS: 'iPhone',
  Android: 'Android',
  Web: 'Web',
};

export const PlatformList: React.FC<{ game: Game; className?: string }> = ({
  game,
  className,
}) => (
  <span className={cx('flex flex-wrap gap-1', className)}>
    {game.platforms.map(p => (
      <span
        key={p}
        className="badge bg-surface-high text-text-medium text-[9px] py-0 px-1.5 font-bold uppercase tracking-wider"
      >
        {PLATFORM_LABEL[p] ?? p}
      </span>
    ))}
  </span>
);

export const GameModeChip: React.FC<{ label: string; className?: string }> = ({
  label,
  className,
}) => (
  <span
    className={cx(
      'badge bg-primary-fixed text-primary-container text-[9px] py-0 px-2 font-bold uppercase tracking-wider flex items-center gap-1',
      className
    )}
  >
    <Gamepad2 size={10} aria-hidden="true" />
    {label}
  </span>
);
