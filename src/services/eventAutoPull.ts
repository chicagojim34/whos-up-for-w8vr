export type EventSubType = 'Concert' | 'Sports' | 'Comedy' | 'Theater' | 'Festival' | 'Other';

export interface AutoPullEvent {
  id: string;
  title: string;
  performerOrTeam: string;
  eventSubType: EventSubType;
  category: 'Entertainment' | 'Active';
  venue: string;
  venueAddress: string;
  city: string;
  date: string;
  showtime: string;           // Official start time (e.g., 8:00 PM)
  doorsTime: string;          // Venue doors open (e.g., 7:00 PM)
  suggestedMeetupTime: string;// Group meetup time (e.g., 6:00 PM)
  suggestedMeetupLocation: string; // Pre-event gathering spot
  image: string;
  additionalImages?: string[];
  ticketUrl: string;
  ticketSectionInfo: string;
  priceRange: string;
  lineup: string[];
  bagPolicy: string;
  ageRestriction: string;
  description: string;
}

export const POPULAR_EVENTS_CATALOG: AutoPullEvent[] = [
  // --- CONCERTS ---
  {
    id: 'evt-billie-eilish',
    title: 'Billie Eilish: Hit Me Hard and Soft Tour',
    performerOrTeam: 'Billie Eilish',
    eventSubType: 'Concert',
    category: 'Entertainment',
    venue: 'Moody Center ATX',
    venueAddress: '2001 Robert Dedman Dr, Austin, TX 78712',
    city: 'Austin, TX',
    date: 'Fri, Nov 14',
    showtime: '8:00 PM',
    doorsTime: '6:30 PM',
    suggestedMeetupTime: '5:30 PM',
    suggestedMeetupLocation: 'Scholz Garten (pre-drinks & food, 5 min walk to venue)',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=1200',
    additionalImages: [
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1200'
    ],
    ticketUrl: 'https://www.ticketmaster.com',
    ticketSectionInfo: 'Section 114, Rows 12-16 (or GA Floor)',
    priceRange: '$95 - $285',
    lineup: ['Billie Eilish', 'FINNEAS (Special Guest)', 'Nat & Alex Wolff'],
    bagPolicy: 'Clear bags only (max 12"x6"x12") or small clutches under 4.5"x6.5"',
    ageRestriction: 'All Ages',
    description: 'The monumental Hit Me Hard and Soft world tour. Expect immersive stage visuals, 360-degree acoustic arrangements, and full stadium energy.'
  },
  {
    id: 'evt-zach-bryan',
    title: 'Zach Bryan: The Quittin Time Tour',
    performerOrTeam: 'Zach Bryan',
    eventSubType: 'Concert',
    category: 'Entertainment',
    venue: 'Nissan Stadium',
    venueAddress: '1 Titans Way, Nashville, TN 37213',
    city: 'Nashville, TN',
    date: 'Sat, Nov 22',
    showtime: '7:30 PM',
    doorsTime: '6:00 PM',
    suggestedMeetupTime: '4:30 PM',
    suggestedMeetupLocation: 'Lot R Tailgate (look for W8VR banner)',
    image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=1200',
    additionalImages: [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=1200'
    ],
    ticketUrl: 'https://www.seatgeek.com',
    ticketSectionInfo: 'Lower Bowl Section 136 or GA Pit',
    priceRange: '$110 - $340',
    lineup: ['Zach Bryan', 'The War and Treaty', 'Levi Turner'],
    bagPolicy: 'NFL Stadium clear bag policy strictly enforced',
    ageRestriction: 'All Ages',
    description: 'Raw, energetic country and folk anthems in the heart of Nashville. Bring boots, friends, and prepare for Revival.'
  },
  {
    id: 'evt-coldplay',
    title: 'Coldplay: Music of the Spheres World Tour',
    performerOrTeam: 'Coldplay',
    eventSubType: 'Concert',
    category: 'Entertainment',
    venue: 'Rose Bowl Stadium',
    venueAddress: '1001 Rose Bowl Dr, Pasadena, CA 91103',
    city: 'Pasadena, CA',
    date: 'Sun, Dec 07',
    showtime: '8:30 PM',
    doorsTime: '6:00 PM',
    suggestedMeetupTime: '5:00 PM',
    suggestedMeetupLocation: 'Area H Fan Village & Solar Kinetic Dancefloors',
    image: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&q=80&w=1200',
    additionalImages: [
      'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=1200'
    ],
    ticketUrl: 'https://www.ticketmaster.com',
    ticketSectionInfo: 'Section 18-H or General Admission Field',
    priceRange: '$75 - $320',
    lineup: ['Coldplay', 'CHVRCHES', 'H.E.R.'],
    bagPolicy: 'Clear bags only. Reusable water bottles allowed (empty). LED wristbands provided at gates.',
    ageRestriction: 'All Ages',
    description: 'A visual and sensory spectacle powered 100% by renewable energy, kinetic dancefloors, and LED wristbands lighting up 90,000 fans.'
  },
  {
    id: 'evt-kendrick-lamar',
    title: 'Kendrick Lamar & SZA: Stadium Live',
    performerOrTeam: 'Kendrick Lamar',
    eventSubType: 'Concert',
    category: 'Entertainment',
    venue: 'SoFi Stadium',
    venueAddress: '1001 Stadium Dr, Inglewood, CA 90301',
    city: 'Inglewood, CA',
    date: 'Fri, Dec 19',
    showtime: '8:00 PM',
    doorsTime: '6:30 PM',
    suggestedMeetupTime: '5:30 PM',
    suggestedMeetupLocation: 'Lake Park Plaza at SoFi Stadium (North Gate)',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    additionalImages: [
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80&w=1200'
    ],
    ticketUrl: 'https://www.ticketmaster.com',
    ticketSectionInfo: 'Level 200 Club or Floor Sections',
    priceRange: '$120 - $450',
    lineup: ['Kendrick Lamar', 'SZA', 'Baby Keem'],
    bagPolicy: 'SoFi Clear Bag Policy (12"x6"x12")',
    ageRestriction: 'All Ages',
    description: 'High-concept theatrical hip-hop production from Compton’s finest with career-spanning classics and unreleased tracks.'
  },
  {
    id: 'evt-fred-again',
    title: 'Fred Again..: Places We\'ve Never Been Tour',
    performerOrTeam: 'Fred Again..',
    eventSubType: 'Concert',
    category: 'Entertainment',
    venue: 'Bill Graham Civic Auditorium',
    venueAddress: '99 Grove St, San Francisco, CA 94102',
    city: 'San Francisco, CA',
    date: 'Thu, Nov 27',
    showtime: '9:00 PM',
    doorsTime: '7:30 PM',
    suggestedMeetupTime: '6:30 PM',
    suggestedMeetupLocation: 'Smuggler\'s Cove (cocktails 3 blocks away)',
    image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=1200',
    additionalImages: [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=1200'
    ],
    ticketUrl: 'https://www.axs.com',
    ticketSectionInfo: 'General Admission Floor (Group meets front right)',
    priceRange: '$85 - $160',
    lineup: ['Fred Again..', 'Joy Anonymous', 'Overmono (DJ Set)'],
    bagPolicy: 'Small clutches and clear bags permitted. No large backpacks.',
    ageRestriction: '18+',
    description: 'Unfiltered electronic euphoria and live MPC fingertapping with intimate vocal samples and transcendent builds.'
  },
  {
    id: 'evt-khruangbin',
    title: 'Khruangbin: A LA SALA World Tour',
    performerOrTeam: 'Khruangbin',
    eventSubType: 'Concert',
    category: 'Entertainment',
    venue: 'Red Rocks Amphitheatre',
    venueAddress: '18300 W Alameda Pkwy, Morrison, CO 80465',
    city: 'Morrison, CO',
    date: 'Mon, Oct 13',
    showtime: '7:30 PM',
    doorsTime: '6:00 PM',
    suggestedMeetupTime: '4:00 PM',
    suggestedMeetupLocation: 'Upper South Lot 2 Tailgate (bring blankets & snacks)',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=1200',
    additionalImages: [
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=1200'
    ],
    ticketUrl: 'https://www.axs.com',
    ticketSectionInfo: 'Reserved Rows 25-35 Center',
    priceRange: '$65 - $185',
    lineup: ['Khruangbin', 'Arooj Aftab'],
    bagPolicy: 'Soft-sided bags 12"x12"x6" or smaller. Warm layers recommended for mountain air.',
    ageRestriction: 'All Ages',
    description: 'Psych-funk Thai-surf grooves framed between the monolithic sandstone towers of Red Rocks under the sunset.'
  },

  // --- SPORTING EVENTS ---
  {
    id: 'evt-lakers-warriors',
    title: 'Golden State Warriors vs. Los Angeles Lakers',
    performerOrTeam: 'Warriors vs. Lakers',
    eventSubType: 'Sports',
    category: 'Active',
    venue: 'Chase Center',
    venueAddress: '1 Warriors Way, San Francisco, CA 94158',
    city: 'San Francisco, CA',
    date: 'Tue, Nov 18',
    showtime: '7:00 PM',
    doorsTime: '5:30 PM',
    suggestedMeetupTime: '5:00 PM',
    suggestedMeetupLocation: 'Harmonic Brewing at Thrive City (outdoor plaza)',
    image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=1200',
    additionalImages: [
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=1200'
    ],
    ticketUrl: 'https://www.ticketmaster.com/nba',
    ticketSectionInfo: 'Section 114 Lower Level or Section 212 Upper Center',
    priceRange: '$140 - $650',
    lineup: ['Steph Curry & Draymond Green', 'LeBron James & Anthony Davis'],
    bagPolicy: 'No bags larger than 14"x14"x6". Backpacks prohibited.',
    ageRestriction: 'All Ages',
    description: 'Western Conference rivalry showdown under the bright lights of Chase Center. High-stakes basketball with prime star power.'
  },
  {
    id: 'evt-austin-fc',
    title: 'Austin FC vs. LA Galaxy (Western Conference Match)',
    performerOrTeam: 'Austin FC vs. LA Galaxy',
    eventSubType: 'Sports',
    category: 'Active',
    venue: 'Q2 Stadium',
    venueAddress: '10414 McKalla Pl, Austin, TX 78758',
    city: 'Austin, TX',
    date: 'Sat, Oct 25',
    showtime: '7:30 PM',
    doorsTime: '6:00 PM',
    suggestedMeetupTime: '5:00 PM',
    suggestedMeetupLocation: 'Hopsquad Brewing (Austin FC supporter march begins at 6:15 PM)',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200',
    additionalImages: [
      'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&q=80&w=1200'
    ],
    ticketUrl: 'https://www.seatgeek.com/austin-fc',
    ticketSectionInfo: 'Section 103 (Supporter Section / La Murga Verde) or Sec 128',
    priceRange: '$42 - $135',
    lineup: ['Austin FC (Verde & Black)', 'LA Galaxy'],
    bagPolicy: 'Clear bag policy (12"x12"x6"). Beer showers expected in supporter section!',
    ageRestriction: 'All Ages',
    description: 'Electrifying MLS match atmosphere under the Texas twilight. Non-stop brass band drums, chants, and pitch-side excitement.'
  },
  {
    id: 'evt-celtics-knicks',
    title: 'Boston Celtics vs. New York Knicks (Rivalry Clash)',
    performerOrTeam: 'Celtics vs. Knicks',
    eventSubType: 'Sports',
    category: 'Active',
    venue: 'TD Garden',
    venueAddress: '100 Legends Way, Boston, MA 02114',
    city: 'Boston, MA',
    date: 'Wed, Dec 10',
    showtime: '7:30 PM',
    doorsTime: '6:30 PM',
    suggestedMeetupTime: '5:30 PM',
    suggestedMeetupLocation: 'The Harp on Causeway St (pre-game pints)',
    image: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&q=80&w=1200',
    additionalImages: [
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=1200'
    ],
    ticketUrl: 'https://www.ticketmaster.com',
    ticketSectionInfo: 'Balcony 314 or Loge 7',
    priceRange: '$90 - $420',
    lineup: ['Jayson Tatum & Jaylen Brown', 'Jalen Brunson & Karl-Anthony Towns'],
    bagPolicy: 'Bags larger than 14"x14"x6" prohibited.',
    ageRestriction: 'All Ages',
    description: 'Classic Eastern Conference basketball rivalry. High intensity, historic parquet floor, and championship atmosphere.'
  },
  {
    id: 'evt-f1-usgp',
    title: 'Formula 1: United States Grand Prix 2026',
    performerOrTeam: 'Formula 1 World Championship',
    eventSubType: 'Sports',
    category: 'Active',
    venue: 'Circuit of The Americas (COTA)',
    venueAddress: '9201 Circuit of the Americas Blvd, Austin, TX 78617',
    city: 'Austin, TX',
    date: 'Sun, Oct 19',
    showtime: '2:00 PM',
    doorsTime: '9:00 AM',
    suggestedMeetupTime: '10:30 AM',
    suggestedMeetupLocation: 'Turn 1 Grandstand Lawn & Fan Zone Stage',
    image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=1200',
    additionalImages: [
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=1200'
    ],
    ticketUrl: 'https://www.circuitoftheamericas.com',
    ticketSectionInfo: 'Turn 1 GA Hill or Main Grandstand Tier 2',
    priceRange: '$180 - $790',
    lineup: ['Max Verstappen', 'Lewis Hamilton (Ferrari debut)', 'Lando Norris', 'Charles Leclerc'],
    bagPolicy: 'Clear bags (12"x12"x20") or standard backpacks up to 12"x12"x20". Sealed water bottles allowed.',
    ageRestriction: 'All Ages',
    description: 'V8 hybrid engines screaming up the iconic 133-foot Turn 1 climb. World championship drama plus post-race headline concert.'
  },

  // --- COMEDY SHOWS ---
  {
    id: 'evt-nate-bargatze',
    title: 'Nate Bargatze: The Be Funny Tour',
    performerOrTeam: 'Nate Bargatze',
    eventSubType: 'Comedy',
    category: 'Entertainment',
    venue: 'Bass Concert Hall',
    venueAddress: '2350 Robert Dedman Dr, Austin, TX 78712',
    city: 'Austin, TX',
    date: 'Sat, Nov 08',
    showtime: '7:00 PM',
    doorsTime: '6:00 PM',
    suggestedMeetupTime: '5:15 PM',
    suggestedMeetupLocation: 'Crown & Anchor Pub for burgers & pints',
    image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&q=80&w=1200',
    additionalImages: [
      'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&q=80&w=1200'
    ],
    ticketUrl: 'https://www.ticketmaster.com',
    ticketSectionInfo: 'Orchestra Center Rows K-P',
    priceRange: '$55 - $175',
    lineup: ['Nate Bargatze', 'Julian McCullough', 'Stephen Bargatze'],
    bagPolicy: 'Small clutches under 5"x7". No phone recording allowed during comedy sets.',
    ageRestriction: 'All Ages (Clean comedy)',
    description: 'The reigning king of relatable deadpan comedy. Hilarious, family-friendly observations about everyday human bewilderment.'
  },
  {
    id: 'evt-dave-chappelle',
    title: 'Dave Chappelle & Friends: Live Stand-Up',
    performerOrTeam: 'Dave Chappelle',
    eventSubType: 'Comedy',
    category: 'Entertainment',
    venue: 'Radio City Music Hall',
    venueAddress: '1260 6th Ave, New York, NY 10020',
    city: 'New York, NY',
    date: 'Fri, Dec 12',
    showtime: '8:00 PM',
    doorsTime: '6:30 PM',
    suggestedMeetupTime: '5:30 PM',
    suggestedMeetupLocation: 'Bar Fiori on 5th Ave (pre-show drinks)',
    image: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&q=80&w=1200',
    additionalImages: [
      'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&q=80&w=1200'
    ],
    ticketUrl: 'https://www.ticketmaster.com',
    ticketSectionInfo: '1st Mezzanine Center or Orchestra',
    priceRange: '$125 - $380',
    lineup: ['Dave Chappelle', 'Surprise Special Guests', 'DJ Trauma'],
    bagPolicy: 'Strict Yondr pouch policy: all mobile phones and smart watches locked in pouches at entry.',
    ageRestriction: '18+',
    description: 'Intimate, razor-sharp commentary from the comedy icon, accompanied by live musical guests and DJ sets.'
  },
  {
    id: 'evt-john-mulaney',
    title: 'John Mulaney: New Hour In Progress',
    performerOrTeam: 'John Mulaney',
    eventSubType: 'Comedy',
    category: 'Entertainment',
    venue: 'Chicago Theatre',
    venueAddress: '175 N State St, Chicago, IL 60601',
    city: 'Chicago, IL',
    date: 'Fri, Nov 21',
    showtime: '7:30 PM',
    doorsTime: '6:30 PM',
    suggestedMeetupTime: '5:30 PM',
    suggestedMeetupLocation: 'Miller\'s Pub (classic Chicago tavern right around the corner)',
    image: 'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?auto=format&fit=crop&q=80&w=1200',
    additionalImages: [
      'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&q=80&w=1200'
    ],
    ticketUrl: 'https://www.ticketmaster.com',
    ticketSectionInfo: 'Main Floor Center Row M',
    priceRange: '$65 - $195',
    lineup: ['John Mulaney', 'Ricky Velez'],
    bagPolicy: 'Phone-free show (Yondr pouches). Clutches under 6"x9" only.',
    ageRestriction: '16+',
    description: 'Fast-paced storytelling, sharp crowd work, and neurotic reflections from the SNL alumnus in his hometown.'
  },

  // --- FESTIVALS ---
  {
    id: 'evt-acl-fest',
    title: 'Austin City Limits Music Festival 2026',
    performerOrTeam: 'ACL Fest Weekend Two',
    eventSubType: 'Festival',
    category: 'Entertainment',
    venue: 'Zilker Metropolitan Park',
    venueAddress: '2100 Barton Springs Rd, Austin, TX 78704',
    city: 'Austin, TX',
    date: 'Fri-Sun, Oct 10-12',
    showtime: '11:00 AM',
    doorsTime: '11:00 AM',
    suggestedMeetupTime: '1:00 PM',
    suggestedMeetupLocation: 'Barton Springs West Entrance Tree Grove (near Honda Stage)',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200',
    additionalImages: [
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=1200'
    ],
    ticketUrl: 'https://www.aclfestival.com',
    ticketSectionInfo: '3-Day General Admission Wristband',
    priceRange: '$340 - $750',
    lineup: ['Dua Lipa', 'Blink-182', 'Tyler, The Creator', 'Chappell Roan', 'Leon Bridges', 'Reneé Rapp'],
    bagPolicy: 'Hydration packs with max 2 pockets permitted (empty upon entry). Small clutches allowed.',
    ageRestriction: 'All Ages (Kids under 10 free with ticketed adult)',
    description: 'Eight stages, 130+ bands, iconic Austin skyline backdrop, and mouthwatering local Texas food court treats.'
  }
];

/**
 * Searches the catalog of events by artist, team, venue, city, or event title.
 */
export function searchAutoPullEvents(query: string): AutoPullEvent[] {
  if (!query || !query.trim()) {
    return POPULAR_EVENTS_CATALOG.slice(0, 6);
  }

  const clean = query.trim().toLowerCase();
  const tokens = clean.split(/\s+/);

  return POPULAR_EVENTS_CATALOG.filter(evt => {
    const haystack = [
      evt.title,
      evt.performerOrTeam,
      evt.venue,
      evt.city,
      evt.eventSubType,
      evt.category,
      ...evt.lineup
    ].join(' ').toLowerCase();

    return tokens.every(token => haystack.includes(token));
  });
}

/**
 * Parses an event URL or pasted text snippet from Ticketmaster, SeatGeek, AXS, etc.
 * Intelligently maps to matched metadata or extracts the title, venue, and time.
 */
export function parseEventUrlOrText(input: string): AutoPullEvent | null {
  if (!input || !input.trim()) return null;

  const raw = input.trim();
  const lower = raw.toLowerCase();

  // Try matching against catalog first
  for (const evt of POPULAR_EVENTS_CATALOG) {
    if (
      lower.includes(evt.performerOrTeam.toLowerCase()) ||
      lower.includes(evt.venue.toLowerCase()) ||
      evt.lineup.some(l => lower.includes(l.toLowerCase())) ||
      lower.includes(evt.id)
    ) {
      return evt;
    }
  }

  // If it's a URL or unstructured text, synthesize sensible auto-pulled defaults
  const isTicketUrl = raw.startsWith('http://') || raw.startsWith('https://');
  let extractedTitle = raw;
  let inferredType: EventSubType = 'Concert';

  if (isTicketUrl) {
    try {
      const parsedUrl = new URL(raw);
      const pathnameParts = parsedUrl.pathname.split('/').filter(Boolean);
      if (pathnameParts.length > 0) {
        // e.g. /event/billie-eilish-tickets-austin/1234
        const slug = pathnameParts[pathnameParts.length - 1].replace(/[-_]/g, ' ');
        extractedTitle = slug.replace(/\b\w/g, l => l.toUpperCase());
      }
    } catch {
      // Fallback
    }
  }

  if (lower.includes('vs') || lower.includes('fc') || lower.includes('nba') || lower.includes('game')) {
    inferredType = 'Sports';
  } else if (lower.includes('comedy') || lower.includes('standup') || lower.includes('laugh')) {
    inferredType = 'Comedy';
  } else if (lower.includes('fest') || lower.includes('festival')) {
    inferredType = 'Festival';
  }

  return {
    id: `parsed-${Date.now()}`,
    title: extractedTitle.length > 50 ? extractedTitle.slice(0, 50) + '...' : extractedTitle,
    performerOrTeam: extractedTitle,
    eventSubType: inferredType,
    category: inferredType === 'Sports' ? 'Active' : 'Entertainment',
    venue: 'Local Arena / Music Hall',
    venueAddress: 'Downtown District',
    city: 'Metro Area',
    date: 'Upcoming Weekend',
    showtime: '8:00 PM',
    doorsTime: '6:30 PM',
    suggestedMeetupTime: '5:30 PM',
    suggestedMeetupLocation: 'Meet outside main gate / plaza bar',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=1200',
    ticketUrl: isTicketUrl ? raw : 'https://www.ticketmaster.com',
    ticketSectionInfo: 'General Admission / Lower Bowl',
    priceRange: '$50 - $150',
    lineup: [extractedTitle],
    bagPolicy: 'Venue clear bag policy applies.',
    ageRestriction: 'All Ages',
    description: `Auto-pulled live gathering for ${extractedTitle}. Group outing organized on W8VR.`
  };
}
