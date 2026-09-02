import {
  Activity,
  Utensils,
  Music,
  Home,
  Paintbrush,
  Briefcase,
  HeartHandshake,
  Gamepad2,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

/**
 * The PRD's seven-category taxonomy, plus "Online/Play" and the "everything"
 * pseudo-filter.
 *
 * Online/Play is an addition to the PRD's seven. An online game is not an
 * in-person Entertainment outing and not a Home/Social game night — it has no
 * venue, and the async ones have no start time either — so folding it into an
 * existing category would have made the feed filter lie.
 */
export type EventCategory =
  | 'All Events'
  | 'Active'
  | 'Dining'
  | 'Entertainment'
  | 'Home/Social'
  | 'Creative'
  | 'Professional'
  | 'Community'
  | 'Online/Play';

export interface CategoryDefinition {
  label: EventCategory;
  icon: LucideIcon;
  desc: string;
}

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  { label: 'All Events', icon: Sparkles, desc: 'All nearby happenings' },
  { label: 'Active', icon: Activity, desc: 'Pickleball, hiking, gym, team sports' },
  { label: 'Dining', icon: Utensils, desc: 'Brunch, dinner, drinks, coffee' },
  { label: 'Entertainment', icon: Music, desc: 'Live shows, vinyl sets, theatre' },
  { label: 'Home/Social', icon: Home, desc: 'BBQ, game nights, watch parties' },
  { label: 'Creative', icon: Paintbrush, desc: 'Workshops, arts and crafts, jams' },
  { label: 'Professional', icon: Briefcase, desc: 'Networking, coworking, tech talks' },
  { label: 'Community', icon: HeartHandshake, desc: 'Volunteering, local causes' },
  { label: 'Online/Play', icon: Gamepad2, desc: 'Word games, chess, party games with your circle' },
];

/** Categories a host can actually choose (everything but the pseudo-filter). */
export const SELECTABLE_CATEGORIES = CATEGORY_DEFINITIONS.filter(c => c.label !== 'All Events');

/** Static lookup so components read an icon rather than calling a factory. */
export const CATEGORY_ICONS = Object.fromEntries(
  CATEGORY_DEFINITIONS.map(c => [c.label, c.icon])
) as Record<EventCategory, LucideIcon>;
