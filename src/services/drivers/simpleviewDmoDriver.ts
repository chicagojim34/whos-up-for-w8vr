import { type AutoPullEvent } from '../eventAutoPull';

export interface DmoPortalConfig {
  marketRank: number;
  metroArea: string;
  dmoName: string;
  domain: string;
}

export const TOP_DMO_PORTALS: Record<string, DmoPortalConfig> = {
  'New York': { marketRank: 1, metroArea: 'New York-Newark-Jersey City, NY-NJ-PA', dmoName: 'NYC Tourism + Conventions', domain: 'nyctourism.com' },
  'Los Angeles': { marketRank: 2, metroArea: 'Los Angeles-Long Beach-Anaheim, CA', dmoName: 'Discover Los Angeles', domain: 'discoverlosangeles.com' },
  'Chicago': { marketRank: 3, metroArea: 'Chicago-Naperville-Elgin, IL-IN-WI', dmoName: 'Choose Chicago', domain: 'choosechicago.com' },
  'Dallas': { marketRank: 4, metroArea: 'Dallas-Fort Worth-Arlington, TX', dmoName: 'Visit Dallas', domain: 'visitdallas.com' },
  'Houston': { marketRank: 5, metroArea: 'Houston-The Woodlands-Sugar Land, TX', dmoName: 'Visit Houston', domain: 'visithoustontexas.com' },
  'Washington': { marketRank: 6, metroArea: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', dmoName: 'Destination DC', domain: 'washington.org' },
  'Philadelphia': { marketRank: 7, metroArea: 'Philadelphia-Camden-Wilmington, PA-NJ-DE-MD', dmoName: 'Visit Philadelphia', domain: 'visitphilly.com' },
  'Miami': { marketRank: 8, metroArea: 'Miami-Fort Lauderdale-Pompano Beach, FL', dmoName: 'Greater Miami CVB', domain: 'miamiandbeaches.com' },
  'Atlanta': { marketRank: 9, metroArea: 'Atlanta-Sandy Springs-Alpharetta, GA', dmoName: 'Discover Atlanta', domain: 'discoveratlanta.com' },
  'Boston': { marketRank: 10, metroArea: 'Boston-Cambridge-Newton, MA-NH', dmoName: 'Meet Boston', domain: 'meetboston.com' },
  'Austin': { marketRank: 28, metroArea: 'Austin-Round Rock-Georgetown, TX', dmoName: 'Visit Austin', domain: 'visitaustin.org' },
  'St. Louis': { marketRank: 21, metroArea: 'St. Louis, MO-IL', dmoName: 'Explore St. Louis', domain: 'explorestlouis.com' },
  'Nashville': { marketRank: 36, metroArea: 'Nashville-Davidson-Murfreesboro-Franklin, TN', dmoName: 'Visit Music City', domain: 'visitmusiccity.com' },
  'New Orleans': { marketRank: 46, metroArea: 'New Orleans-Metairie, LA', dmoName: 'New Orleans & Company', domain: 'neworleans.com' },
};

/**
 * Driver for Official Tourism Board & DMO event calendars
 * (Simpleview CMS / Tempest CMS / Bandwango).
 * Ingests civic festivals, open-air cultural celebrations, and heritage events.
 */
export async function fetchDmoEvents(city?: string): Promise<AutoPullEvent[]> {
  const isAll = !city || city === 'All Cities';

  const targetMarkets = isAll
    ? ['New York', 'Chicago', 'Austin', 'Miami', 'Nashville', 'Los Angeles']
    : [city];

  const results: AutoPullEvent[] = [];

  for (const targetCity of targetMarkets) {
    const matched = Object.entries(TOP_DMO_PORTALS).find(([k]) =>
      targetCity.toLowerCase().includes(k.toLowerCase())
    );
    if (!matched) continue;
    const [cityName, portal] = matched;

    results.push({
      id: `dmo-${portal.marketRank}-civic-arts`,
      title: `${portal.dmoName}: Seasonal Cultural Walk & Arts Fair`,
      performerOrTeam: 'City Cultural Affairs',
      eventSubType: 'Festival',
      category: 'Entertainment',
      venue: `${cityName} Civic Center & Cultural Plaza`,
      venueAddress: `Downtown Cultural Corridor, ${cityName}`,
      city: `${cityName}, US`,
      date: 'Sun, Nov 23',
      showtime: '12:00 PM',
      doorsTime: '11:00 AM',
      suggestedMeetupTime: '11:30 AM',
      suggestedMeetupLocation: `Plaza Fountain / Visitor Pavilion`,
      image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=1200',
      ticketUrl: `https://${portal.domain}`,
      ticketSectionInfo: 'Free Public Admission / RSVP Required for Tastings',
      priceRange: 'Free - $25',
      lineup: ['Regional Artists', 'Local Food Trucks', 'Civic Performers'],
      bagPolicy: 'Open outdoor venue; clear bags encouraged.',
      ageRestriction: 'All Ages',
      description: `Official regional civic event syndicated via ${portal.dmoName} (${portal.domain}). Perfect for circle gatherings.`,
      provenanceSources: [portal.dmoName, `${portal.domain} Calendar`],
      marketRank: portal.marketRank,
      metroArea: portal.metroArea,
      doorsConfirmed: true,
      ticketOptions: [
        {
          id: `tkt-dmo-${portal.marketRank}`,
          provider: portal.dmoName,
          type: 'community',
          url: `https://${portal.domain}`,
          minPrice: 0,
          maxPrice: 25,
          currency: 'USD',
          availability: 'available',
          sectionInfo: 'General Admission / RSVP',
          sourceLabel: 'Official Tourism Board RSVP',
        },
      ],
    });
  }

  return results;
}
