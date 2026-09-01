import React from 'react';
import { 
  Activity, 
  Utensils, 
  Music, 
  Home, 
  Paintbrush, 
  Briefcase, 
  HeartHandshake, 
  Sparkles,
  type LucideIcon 
} from 'lucide-react';
import cx from 'classnames';

export type EventCategory = 
  | 'All Events'
  | 'Active' 
  | 'Dining' 
  | 'Entertainment' 
  | 'Home/Social' 
  | 'Creative' 
  | 'Professional' 
  | 'Community';

export const CATEGORY_DEFINITIONS: { label: EventCategory; icon: LucideIcon; desc: string }[] = [
  { label: 'All Events', icon: Sparkles, desc: 'All nearby happenings' },
  { label: 'Active', icon: Activity, desc: 'Pickleball, Hiking, Gym, Team Sports' },
  { label: 'Dining', icon: Utensils, desc: 'Brunch, Dinner, Drinks, Coffee' },
  { label: 'Entertainment', icon: Music, desc: 'Live Shows, Vinyl Sets, Theater' },
  { label: 'Home/Social', icon: Home, desc: 'BBQ, Game Nights, Watch Parties' },
  { label: 'Creative', icon: Paintbrush, desc: 'Workshops, Arts & Crafts, Jams' },
  { label: 'Professional', icon: Briefcase, desc: 'Networking, Coworking, Tech Talks' },
  { label: 'Community', icon: HeartHandshake, desc: 'Volunteering, Local Rallies' },
];

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
  const def = CATEGORY_DEFINITIONS.find(c => c.label === category) || CATEGORY_DEFINITIONS[0];
  const Icon = def.icon;

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-xs font-bold gap-2',
    lg: 'px-5 py-2.5 text-sm font-bold gap-2.5',
  }[size];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'rounded-full flex items-center shrink-0 transition-all font-headline cursor-pointer active:scale-95 duration-150 select-none',
        sizeClasses,
        active
          ? 'bg-primary-container text-white shadow-md shadow-primary/25'
          : 'bg-surface-high text-text-medium hover:bg-surface-highest hover:text-text-dark',
        className
      )}
    >
      {showIcon && <Icon size={size === 'sm' ? 13 : 15} className={active ? 'text-white' : 'text-primary'} />}
      <span>{category}</span>
    </button>
  );
};
