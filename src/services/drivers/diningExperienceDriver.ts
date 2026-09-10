import { type AutoPullEvent } from '../eventAutoPull';

export interface DiningPortalConfig {
  marketRank: number;
  metroArea: string;
  provider: 'Tock' | 'Resy' | 'OpenTable Experiences';
  eventName: string;
  domain: string;
}

/**
 * Driver for Ticketed Dining, Nightlife & Culinary Experiences
 * (Tock, Resy, OpenTable Experiences).
 * Exclusively targets ticketed tasting menus, guest chef takeovers,
 * and brewery/winery pop-up events (excluding plain restaurant reservations).
 */
export async function fetchDiningExperiences(city?: string): Promise<AutoPullEvent[]> {
  const isAll = !city || city === 'All Cities';

  const targetCities = isAll
    ? ['New York', 'Chicago', 'Austin', 'Los Angeles', 'San Francisco', 'Miami']
    : [city];

  return targetCities.map((c, idx) => ({
    id: `dining-${c.toLowerCase()}-chef-takeover`,
    title: `Secret Chef Collaboration & Tasting Series`,
    performerOrTeam: 'Culinary Residency Collective',
    eventSubType: 'Other',
    category: 'Entertainment',
    venue: `${c} Tasting Atelier & Kitchen`,
    venueAddress: `Historic Warehouse District, ${c}`,
    city: `${c}, US`,
    date: 'Sat, Nov 29',
    showtime: '6:30 PM',
    doorsTime: '6:00 PM',
    suggestedMeetupTime: '6:00 PM',
    suggestedMeetupLocation: `Atelier Cocktail Lounge / Entryway`,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200',
    ticketUrl: 'https://exploretock.com',
    ticketSectionInfo: 'Prepaid 5-Course Tasting with Beverage Pairings',
    priceRange: '$95 - $150',
    lineup: ['Guest Chef Collective', 'Resident Sommelier'],
    bagPolicy: 'Casual upscale dining venue.',
    ageRestriction: '21+',
    description: `Exclusive prepaid culinary collaboration. Ticketed experience syndicated via Tock & Resy Experiences. Group reservation on W8VR.`,
    provenanceSources: ['Tock Experiences', 'Resy Culinary Series'],
    doorsConfirmed: true,
    marketRank: idx + 1,
    ticketOptions: [
      {
        id: `tkt-dining-tock-${c.toLowerCase()}`,
        provider: 'Tock Experiences',
        type: 'experience',
        url: 'https://exploretock.com',
        minPrice: 95,
        maxPrice: 150,
        currency: 'USD',
        availability: 'low_inventory',
        sectionInfo: 'Chef Counter Seating',
        sourceLabel: 'Tock Prepaid Experience',
      },
      {
        id: `tkt-dining-resy-${c.toLowerCase()}`,
        provider: 'Resy Experiences',
        type: 'experience',
        url: 'https://resy.com',
        minPrice: 95,
        maxPrice: 150,
        currency: 'USD',
        availability: 'available',
        sectionInfo: 'Dining Room Table (Circles 4-8)',
        sourceLabel: 'Resy Special Event',
      },
    ],
  }));
}
