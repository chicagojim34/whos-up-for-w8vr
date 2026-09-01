import React from 'react';
import cx from 'classnames';

interface AvatarGroupProps {
  names: string[];
  max?: number;
  size?: number;
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  names,
  max = 3,
  size = 32,
  className,
}) => {
  const visible = names.slice(0, max);
  const remaining = names.length - max;

  if (names.length === 0) return null;

  return (
    <div className={cx('flex items-center', className)}>
      {visible.map((name, i) => (
        <div
          key={name + i}
          className="rounded-full overflow-hidden border-2 border-white bg-slate-800 shrink-0 shadow-sm"
          style={{
            width: size,
            height: size,
            marginLeft: i > 0 ? -Math.floor(size * 0.3) : 0,
            zIndex: 10 - i,
          }}
          title={name}
        >
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className="rounded-full border-2 border-white bg-primary text-white font-headline font-black text-[10px] flex items-center justify-center shrink-0 shadow-sm"
          style={{
            width: size,
            height: size,
            marginLeft: -Math.floor(size * 0.3),
            zIndex: 1,
          }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};
