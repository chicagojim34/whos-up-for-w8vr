import React from 'react';
import cx from 'classnames';
import { ringTone } from '../lib/ring';

interface StatusRingProps {
  /** 0–100. */
  capacity: number;
  size?: number;
  strokeWidth?: number;
  /** Overrides the centre text (e.g. spots remaining instead of a percent). */
  label?: string;
  /** Read aloud in place of the visual label. */
  srLabel?: string;
  showPulse?: boolean;
  className?: string;
  variant?: 'light' | 'dark' | 'glass' | 'bare';
}

/**
 * The signature capacity ring.
 *
 * Colour follows the PRD's rule — green while there is room, red once it is
 * full — with the brand indigo marking the "filling up" middle band, and the
 * urgency pulse DESIGN.md asks for above 90%.
 */
export const StatusRing: React.FC<StatusRingProps> = ({
  capacity,
  size = 48,
  strokeWidth = 4,
  label,
  srLabel,
  showPulse = true,
  className,
  variant = 'glass',
}) => {
  const clamped = Math.max(0, Math.min(100, capacity));
  const isUrgent = clamped >= 90;
  const { stroke, text } = ringTone(clamped);

  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;

  const bgVariantClass = {
    glass: 'bg-surface-lowest/90 backdrop-blur-md shadow-md',
    light: 'bg-surface-lowest shadow-md',
    dark: 'bg-text-dark/50 backdrop-blur-md',
    bare: '',
  }[variant];

  return (
    // The outer span carries only sizing and the caller's classes, so a caller
    // positioning the ring (`absolute bottom-3 right-4`) is not fighting a
    // `relative` baked in here — Tailwind resolves that collision by stylesheet
    // order, not class order, and `relative` would silently win.
    <span
      className={cx(
        'inline-flex items-center justify-center rounded-full shrink-0',
        bgVariantClass,
        { 'animate-status-pulse': isUrgent && showPulse },
        className
      )}
      style={{ width: size, height: size }}
      role="img"
      aria-label={srLabel ?? `${clamped}% full`}
    >
      <span className="relative inline-flex" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          aria-hidden="true"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="var(--color-secondary)"
            strokeOpacity={0.2}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s var(--ease-curator), stroke 0.4s' }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center pointer-events-none font-headline font-bold leading-none"
          style={{ color: text, fontSize: Math.max(9, Math.round(size * 0.24)) }}
          aria-hidden="true"
        >
          {label ?? `${clamped}%`}
        </span>
      </span>
    </span>
  );
};
