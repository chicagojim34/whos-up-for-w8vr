import React from 'react';
import cx from 'classnames';

interface StatusRingProps {
  capacity: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  showPulse?: boolean;
  className?: string;
  variant?: 'light' | 'dark' | 'glass';
}

export const StatusRing: React.FC<StatusRingProps> = ({
  capacity,
  size = 48,
  strokeWidth = 4,
  label,
  showPulse = true,
  className,
  variant = 'glass',
}) => {
  const isUrgent = capacity >= 90;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (capacity / 100) * circumference;

  const bgVariantClass = {
    glass: 'bg-white/90 backdrop-blur-md shadow-md text-primary',
    light: 'bg-white shadow-md text-primary',
    dark: 'bg-black/40 backdrop-blur-md text-white border border-white/20',
  }[variant];

  return (
    <div
      className={cx(
        'relative rounded-full flex items-center justify-center transition-transform',
        bgVariantClass,
        { 'status-ring-pulse': isUrgent && showPulse },
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(65, 102, 86, 0.2)"
          strokeWidth={strokeWidth}
        />
        {/* Fill circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={isUrgent ? 'var(--error)' : 'var(--primary)'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-headline font-bold text-[10px] leading-none" style={{ color: isUrgent ? 'var(--error)' : 'inherit' }}>
          {label ?? `${capacity}%`}
        </span>
      </div>
    </div>
  );
};
