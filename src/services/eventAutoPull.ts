import { resolveEventSchedule } from './venueScheduleResolver';
import type { CanonicalTicketOption } from '../types';
import type { EventCategory } from '../lib/categories';
import { 
  findMsaByCity, 
  resolveCityCoordinates, 
  calculateDistanceMiles 
} from '../lib/usMsaDirectory';

export type EventSubType = 'Concert' | 'Sports' | 'Comedy' | 'Theater' | 'Festival' | 'Other';

export interface AutoPullEvent {
  id: string;
  title: string;
  performerOrTeam: string;
  eventSubType: EventSubType;
  category: EventCategory;
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
  doorsConfirmed?: boolean;
  doorsSource?: string;
  venueGateInfo?: string;

  // Multi-Provider Ticketing & Deduplication Fields
  canonicalId?: string;
  ticketOptions?: CanonicalTicketOption[];
  provenanceSources?: string[];
  confidenceScore?: number;
  marketRank?: number;
  metroArea?: string;
  latitude?: number;
  longitude?: number;
  distanceMi?: number;
}

export const POPULAR_EVENTS_CATALOG: AutoPullEvent[] = [
  // --- CONCERTS ---
  {
    id: 'evt-acdc-powerup-stl',
    title: 'AC/DC – POWER UP TOUR 2026',
    performerOrTeam: 'AC/DC',
    eventSubType: 'Concert',
    category: 'Entertainment',
    venue: "The Dome at America's Center",
    venueAddress: '701 Convention Plaza, St. Louis, MO 63101',
    city: 'St. Louis, MO',
    date: 'Tue, Sep 15',
    showtime: '7:00 PM',
    doorsTime: '5:00 PM',
    suggestedMeetupTime: '4:30 PM',
    suggestedMeetupLocation: "Meet outside The Dome at America's Center (near Main Gate / Entry A Plaza)",
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    additionalImages: [
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=1200'
    ],
    ticketUrl: 'https://www.ticketmaster.com',
    ticketSectionInfo: 'Section 114 / Lower Bowl or GA Floor',
    priceRange: '$85 - $325',
    lineup: ['AC/DC', 'Foo Fighters (Special Guests)'],
    bagPolicy: 'Clear bags only (max 12"x6"x12") or small clutches under 4.5"x6.5". Cashless venue.',
    ageRestriction: 'All Ages',
    doorsConfirmed: true,
    doorsSource: 'Explore St. Louis / Official Venue Guide',
    venueGateInfo: 'Entry through Entry A, Entry B, Broadway Central, Entry C and Entry D. Accessible entrances at Gate A and Broadway Central. Floor tickets: Gate A or B (wristbands at Concourse Sections 115 & 140).',
    description: "Official live concert event featuring AC/DC and Foo Fighters on the Power Up Tour at The Dome at America's Center. Group outing organized with W8VR."
  },
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

  // --- FESTIVALS & COMMUNITY ART WALKS ---
  {
    id: 'evt-ravenswood-artwalk',
    title: 'Ravenswood ArtWalk: Tour of Arts & Industry (RAW)',
    performerOrTeam: 'Ravenswood Artists & Craftsmen',
    eventSubType: 'Festival',
    category: 'Community',
    venue: 'Ravenswood Industrial Corridor',
    venueAddress: '4300 N Ravenswood Ave, Chicago, IL 60613',
    city: 'Chicago, IL',
    date: 'Sat-Sun, Sep 19-20',
    showtime: '11:00 AM',
    doorsTime: '11:00 AM',
    suggestedMeetupTime: '11:30 AM',
    suggestedMeetupLocation: 'Begyle Brewing / Artifact Events Beer Garden on Ravenswood Ave',
    image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=1200',
    additionalImages: [
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=1200'
    ],
    ticketUrl: 'https://ravenswoodchicago.org/signature-events/artwalk/',
    ticketSectionInfo: 'Open Neighborhood Art Studios / Free Admission',
    priceRange: 'Free ($5 Suggested Donation)',
    lineup: ['50+ Open Art Studios', 'Begyle & Dovetail Craft Beer Garden', '20+ Local Food Trucks', 'Live Music Stages'],
    bagPolicy: 'Open street festival, all bags allowed, dog friendly.',
    ageRestriction: 'All Ages',
    doorsConfirmed: true,
    doorsSource: 'Greater Ravenswood Chamber of Commerce',
    description: 'Weekend-long celebration of arts and industry along historic Ravenswood Avenue. Explore open artist studios, craft markets, outdoor beer gardens, and live music.'
  },
  {
    id: 'evt-naperville-artwalk',
    title: 'Downtown Naperville Riverwalk Wine & Art Walk',
    performerOrTeam: 'Downtown Naperville Artists Guild',
    eventSubType: 'Festival',
    category: 'Community',
    venue: 'Naperville Riverwalk Pavilion',
    venueAddress: '400 S Eagle St, Naperville, IL 60540',
    city: 'Naperville, IL',
    metroArea: 'Chicago-Naperville-Elgin, IL-IN',
    latitude: 41.7508,
    longitude: -88.1535,
    date: 'Sat, Sep 26',
    showtime: '12:00 PM',
    doorsTime: '12:00 PM',
    suggestedMeetupTime: '12:30 PM',
    suggestedMeetupLocation: 'Riverwalk Grand Pavilion fountain near Eagle St',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=1200',
    ticketUrl: 'https://downtownnaperville.com/events/',
    ticketSectionInfo: 'Riverwalk Promenade / Tasting Glass Included',
    priceRange: '$35 - $50',
    lineup: ['Local Artisan Showcase', 'Fox Valley Wineries', 'Acoustic Riverwalk Duo'],
    bagPolicy: 'Standard outdoor festival bags permitted.',
    ageRestriction: 'All Ages / 21+ for Wine Tasting',
    doorsConfirmed: true,
    doorsSource: 'Downtown Naperville Alliance',
    description: 'Stroll the scenic Naperville Riverwalk with wine tastings, fine art exhibits, and live acoustic music in the heart of downtown Naperville.'
  },
  {
    id: 'evt-north-central-jazz',
    title: 'Wentz Concert Hall: Chicagoland Contemporary Jazz Showcase',
    performerOrTeam: 'North Central College Fine Arts & Chicago Jazz Ensemble',
    eventSubType: 'Concert',
    category: 'Entertainment',
    venue: 'Wentz Concert Hall (North Central College)',
    venueAddress: '171 E Chicago Ave, Naperville, IL 60540',
    city: 'Naperville, IL',
    metroArea: 'Chicago-Naperville-Elgin, IL-IN',
    latitude: 41.7735,
    longitude: -88.1442,
    date: 'Fri, Oct 2',
    showtime: '8:00 PM',
    doorsTime: '7:00 PM',
    suggestedMeetupTime: '7:15 PM',
    suggestedMeetupLocation: 'Wentz Concert Hall Lobby / Box Office steps',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=1200',
    ticketUrl: 'https://northcentralcollege.edu/show',
    ticketSectionInfo: 'Main Orchestra Floor / Reserved Seating',
    priceRange: '$25 - $45',
    lineup: ['Chicago Jazz Ensemble', 'North Central Big Band'],
    bagPolicy: 'Standard auditorium bag inspection.',
    ageRestriction: 'All Ages',
    doorsConfirmed: true,
    doorsSource: 'North Central College Fine Arts',
    description: 'Acoustically pristine jazz performance at the acclaimed Wentz Concert Hall in Naperville, featuring top Chicago and Midwest jazz virtuosos.'
  },
  {
    id: 'evt-slam-artwalk-stl',
    title: 'Saint Louis Art Museum (SLAM) & Forest Park Art Walk',
    performerOrTeam: 'Saint Louis Art Museum & Forest Park',
    eventSubType: 'Festival',
    category: 'Community',
    venue: 'Saint Louis Art Museum',
    venueAddress: '1 Fine Arts Dr, St. Louis, MO 63110',
    city: 'St. Louis, MO',
    date: 'Sat-Sun, Sep 19-20',
    showtime: '11:00 AM',
    doorsTime: '10:00 AM',
    suggestedMeetupTime: '10:30 AM',
    suggestedMeetupLocation: 'Art Hill Steps & Grand Basin Promenade (Forest Park)',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=1200',
    additionalImages: [
      'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=1200'
    ],
    ticketUrl: 'https://www.slam.org',
    ticketSectionInfo: 'Free Museum Admission / Sculpture Park Walk',
    priceRange: 'Free ($15 Special Exhibitions)',
    lineup: ['SLAM Permanent Collection', 'Art Hill Stroll', 'Grand Basin Sculpture Park', 'Forest Park Visitors Center'],
    bagPolicy: 'Museum security checkpoint; standard bags permitted.',
    ageRestriction: 'All Ages',
    doorsConfirmed: true,
    doorsSource: 'Explore St. Louis / SLAM Official Guide',
    description: 'Explore world-renowned classical and modern art galleries at SLAM, followed by an outdoor sculpture stroll along Art Hill and the Grand Basin in historic Forest Park.'
  },
  {
    id: 'evt-saborea-latino-gourmet',
    title: "Saborea Chicago's Latino Gourmet Festival",
    performerOrTeam: 'Latino Culinary Masters & Mixologists',
    eventSubType: 'Festival',
    category: 'Dining',
    venue: 'Navy Pier Aon Grand Ballroom & Festival Hall',
    venueAddress: '600 E Grand Ave, Chicago, IL 60611',
    city: 'Chicago, IL',
    date: 'Sat, Sep 19',
    showtime: '1:00 PM',
    doorsTime: '12:30 PM',
    suggestedMeetupTime: '12:30 PM',
    suggestedMeetupLocation: 'Navy Pier Grand Staircase / Riva Crab House Terrace',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200',
    additionalImages: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1200'
    ],
    ticketUrl: 'https://www.eventbrite.com',
    ticketSectionInfo: 'General Tasting Ticket / VIP Early Admission',
    priceRange: '$45 - $95',
    lineup: ['Celebrity Latino Chefs', 'Artisanal Mezcal & Tequila Tastings', 'Live Salsa & Latin Jazz Bands'],
    bagPolicy: 'Navy Pier standard security. Clutches and medium tote bags welcome.',
    ageRestriction: '21+ for alcohol tastings; all ages festival hall.',
    description: 'Vibrant celebration of Latin food culture, artisanal cocktails, and live music at Navy Pier. Sample bites from 30+ celebrated restaurants.'
  },
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
  },

  // --- TOURS & ATTRACTIONS ---
  {
    id: 'evt-chicago-river-architecture-tour',
    title: 'Chicago River Architecture Tour',
    performerOrTeam: 'Chicago Architecture Center Docents',
    eventSubType: 'Other',
    category: 'Entertainment',
    venue: 'Chicago First Lady Cruises (Riverwalk)',
    venueAddress: '112 E Wacker Dr, Chicago, IL 60601',
    city: 'Chicago, IL',
    date: 'Sun, Sep 20',
    showtime: '2:00 PM',
    doorsTime: '1:30 PM',
    suggestedMeetupTime: '1:15 PM',
    suggestedMeetupLocation: 'Chicago Riverwalk Promenade Dock (Southeast corner of Michigan Ave Bridge)',
    image: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&q=80&w=1200',
    additionalImages: [
      'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&q=80&w=1200'
    ],
    ticketUrl: 'https://www.architecture.org',
    ticketSectionInfo: 'Open-Air Top Deck Seating',
    priceRange: '$48 - $55',
    lineup: ['Certified CAC Docents', 'Chicago First Lady Fleet'],
    bagPolicy: 'Standard purses and backpacks permitted. Full bar and snacks on lower deck.',
    ageRestriction: 'All Ages',
    doorsConfirmed: true,
    doorsSource: 'Chicago Architecture Center & First Lady Cruises',
    description: 'The acclaimed 90-minute architecture cruise along all three branches of the Chicago River. Discover how Chicago grew from a small settlement into the birthplace of the skyscraper.'
  },
  {
    id: 'evt-museum-of-illusions-chicago',
    title: 'Museum of Illusions Chicago: Interactive Experience',
    performerOrTeam: 'Museum of Illusions',
    eventSubType: 'Other',
    category: 'Entertainment',
    venue: 'Museum of Illusions',
    venueAddress: '25 E Washington St, Chicago, IL 60602',
    city: 'Chicago, IL',
    date: 'Sat, Sep 19',
    showtime: '4:00 PM',
    doorsTime: '3:45 PM',
    suggestedMeetupTime: '3:30 PM',
    suggestedMeetupLocation: 'Washington St Lobby / Ticket Counter',
    image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&q=80&w=1200',
    ticketUrl: 'https://moichicago.com',
    ticketSectionInfo: 'Timed Entry Admission',
    priceRange: '$28 - $34',
    lineup: ['Vortex Tunnel', 'Ames Room', 'Optical Holograms'],
    bagPolicy: 'Casual bag policy; photo taking highly encouraged.',
    ageRestriction: 'All Ages',
    description: 'Fascinating visual, sensory and educational experience in the Loop with illusions, holograms, and perspective-bending exhibits.'
  },
  {
    id: 'evt-360-chicago-tilt',
    title: '360 Chicago Observation Deck & TILT',
    performerOrTeam: '360 Chicago & CloudBar',
    eventSubType: 'Other',
    category: 'Entertainment',
    venue: '360 Chicago (875 N Michigan Ave)',
    venueAddress: '875 N Michigan Ave 94th Floor, Chicago, IL 60611',
    city: 'Chicago, IL',
    date: 'Sun, Sep 20',
    showtime: '6:00 PM',
    doorsTime: '5:30 PM',
    suggestedMeetupTime: '5:15 PM',
    suggestedMeetupLocation: 'CloudBar on 94th Floor (meet for sunset cocktails)',
    image: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?auto=format&fit=crop&q=80&w=1200',
    ticketUrl: 'https://360chicago.com',
    ticketSectionInfo: 'General Observation + TILT Ride Pass',
    priceRange: '$35 - $50',
    lineup: ['TILT Glass Ride', 'CloudBar Cocktails', 'Panoramic Skyline Views'],
    bagPolicy: 'Standard security checkpoint at concourse.',
    ageRestriction: 'All Ages / 21+ at CloudBar',
    description: 'Experience panoramic 360-degree views of Chicago and Lake Michigan from 1,000 feet up, featuring the downward-tilting glass platform.'
  },
  {
    id: 'evt-citygarden-stl',
    title: 'Citygarden Urban Sculpture & Architecture Walk',
    performerOrTeam: 'Citygarden St. Louis',
    eventSubType: 'Other',
    category: 'Entertainment',
    venue: 'Citygarden Downtown',
    venueAddress: '801 Market St, St. Louis, MO 63101',
    city: 'St. Louis, MO',
    date: 'Sat, Sep 19',
    showtime: '2:00 PM',
    doorsTime: '1:30 PM',
    suggestedMeetupTime: '1:30 PM',
    suggestedMeetupLocation: 'Ginkgo Room Cafe & Video Wall at 8th & Market',
    image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&q=80&w=1200',
    ticketUrl: 'https://www.citygardenstl.org',
    ticketSectionInfo: 'Free Public Sculpture Walk',
    priceRange: 'Free',
    lineup: ['24 International Sculptures', 'Interactive Fountain Gardens', 'Audio Tour Guide'],
    bagPolicy: 'Public urban park; casual attire.',
    ageRestriction: 'All Ages',
    doorsConfirmed: true,
    description: 'A vibrant 2.9-acre urban sculpture park in the heart of downtown St. Louis featuring 24 modern sculptures, lush botanical gardens, and reflection pools.'
  },
  {
    id: 'evt-the-muny-stl',
    title: 'Broadway Under the Stars at The Muny',
    performerOrTeam: 'The Muny Company',
    eventSubType: 'Theater',
    category: 'Entertainment',
    venue: 'The Muny (Forest Park)',
    venueAddress: '1 Theatre Dr, St. Louis, MO 63112',
    city: 'St. Louis, MO',
    date: 'Sun, Sep 20',
    showtime: '8:15 PM',
    doorsTime: '7:00 PM',
    suggestedMeetupTime: '6:30 PM',
    suggestedMeetupLocation: 'Lichtenstein Plaza / Free Seat Line entrance',
    image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&q=80&w=1200',
    ticketUrl: 'https://muny.org',
    ticketSectionInfo: 'Free Back 9 Rows or Reserved Orchestra',
    priceRange: 'Free (Back 9 Rows) / $25 - $115',
    lineup: ['The Muny Orchestra', 'Broadway Guest Cast'],
    bagPolicy: 'Clear bags recommended; outside food/drink permitted in coolers under 16"x16"x8".',
    ageRestriction: 'All Ages',
    doorsConfirmed: true,
    doorsSource: 'The Muny Official Box Office & MetroTix',
    description: 'America’s oldest and largest outdoor musical theatre in Forest Park. World-class Broadway productions under the stars with 1,500 free seats available every night.'
  },

  // --- SPORTS CLASSICS & STADIUM MATCHES ---
  {
    id: 'evt-chicago-football-classic',
    title: 'Chicago Football Classic: Delta Devils vs. Lincoln Lions',
    performerOrTeam: 'Mississippi Valley State vs. Lincoln University',
    eventSubType: 'Sports',
    category: 'Active',
    venue: 'Soldier Field',
    venueAddress: '1410 Special Olympics Dr, Chicago, IL 60605',
    city: 'Chicago, IL',
    date: 'Sat, Sep 19',
    showtime: '3:30 PM',
    doorsTime: '1:30 PM',
    suggestedMeetupTime: '11:30 AM',
    suggestedMeetupLocation: 'Soldier Field South Lot 2 Tailgate (look for the W8VR Circle flag)',
    image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=1200',
    additionalImages: [
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&q=80&w=1200'
    ],
    ticketUrl: 'https://www.ticketmaster.com',
    ticketSectionInfo: 'Lower Bowl Sections 108-112 or Student Sections',
    priceRange: '$25 - $75',
    lineup: ['Mississippi Valley State Delta Devils', 'Lincoln University Lions', 'Battle of the Halftime Marching Bands', 'HBCU College Fair'],
    bagPolicy: 'Soldier Field NFL Clear Bag Policy (12"x6"x12") strictly enforced. Cashless venue.',
    ageRestriction: 'All Ages',
    doorsConfirmed: true,
    doorsSource: 'Soldier Field Box Office & Chicago Football Classic',
    description: 'The premier HBCU football classic in the Midwest at historic Soldier Field. Thrilling gridiron action, high-stepping marching band showdown, and vibrant community tailgate.'
  },
  {
    id: 'evt-cardinals-cubs-stl',
    title: 'St. Louis Cardinals vs. Chicago Cubs',
    performerOrTeam: 'St. Louis Cardinals vs. Chicago Cubs',
    eventSubType: 'Sports',
    category: 'Active',
    venue: 'Busch Stadium',
    venueAddress: '700 Clark Ave, St. Louis, MO 63102',
    city: 'St. Louis, MO',
    date: 'Sat, Sep 19',
    showtime: '6:15 PM',
    doorsTime: '4:15 PM',
    suggestedMeetupTime: '3:30 PM',
    suggestedMeetupLocation: 'Ballpark Village / Fox Sports Midwest Live Plaza across from Gate 3',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200',
    ticketUrl: 'https://www.mlb.com/cardinals',
    ticketSectionInfo: 'Infield Pavilion Sections 240-250 or Left Field Bleachers',
    priceRange: '$28 - $145',
    lineup: ['St. Louis Cardinals', 'Chicago Cubs', 'Fredbird Appearance', 'Post-Game Fireworks'],
    bagPolicy: 'Bags up to 16"x16"x8" permitted; no backpacks. Cashless venue.',
    ageRestriction: 'All Ages',
    doorsConfirmed: true,
    doorsSource: 'St. Louis Cardinals Box Office & Ballpark Guide',
    description: 'Historic I-55 rivalry baseball at Busch Stadium in downtown St. Louis. Pre-game meetup at Ballpark Village.'
  },
  {
    id: 'evt-bears-vikings-chi',
    title: 'Chicago Bears vs. Minnesota Vikings',
    performerOrTeam: 'Chicago Bears vs. Minnesota Vikings',
    eventSubType: 'Sports',
    category: 'Active',
    venue: 'Soldier Field',
    venueAddress: '1410 Special Olympics Dr, Chicago, IL 60605',
    city: 'Chicago, IL',
    date: 'Sun, Sep 20',
    showtime: '12:00 PM',
    doorsTime: '10:00 AM',
    suggestedMeetupTime: '9:30 AM',
    suggestedMeetupLocation: 'Soldier Field South Lot 2 Tailgate (look for W8VR Circle flag)',
    image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=1200',
    ticketUrl: 'https://www.ticketmaster.com/nfl',
    ticketSectionInfo: 'Lower Bowl Section 110 or Section 212',
    priceRange: '$85 - $380',
    lineup: ['Chicago Bears', 'Minnesota Vikings', 'Caleb Williams', 'Soldier Field Tailgate'],
    bagPolicy: 'Soldier Field NFL Clear Bag Policy (12"x6"x12") strictly enforced. Cashless venue.',
    ageRestriction: 'All Ages',
    doorsConfirmed: true,
    doorsSource: 'NFL Ticket Exchange & Soldier Field Box Office',
    description: 'NFC North division battle at iconic Soldier Field along the Chicago lakefront. Pre-game tailgating in South Lot.'
  },
  {
    id: 'evt-bears-jets-chi',
    title: 'Chicago Bears vs. New York Jets',
    performerOrTeam: 'Chicago Bears vs. New York Jets',
    eventSubType: 'Sports',
    category: 'Active',
    venue: 'Soldier Field',
    venueAddress: '1410 Special Olympics Dr, Chicago, IL 60605',
    city: 'Chicago, IL',
    date: 'Sun, Oct 04',
    showtime: '12:00 PM',
    doorsTime: '10:00 AM',
    suggestedMeetupTime: '9:30 AM',
    suggestedMeetupLocation: 'Stadium Green at Soldier Field / Lakefront Trail',
    image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=1200',
    ticketUrl: 'https://www.ticketmaster.com/nfl',
    ticketSectionInfo: 'Lower Bowl Section 114 / Midfield',
    priceRange: '$85 - $420',
    lineup: ['Chicago Bears', 'New York Jets'],
    bagPolicy: 'Soldier Field NFL Clear Bag Policy strictly enforced.',
    ageRestriction: 'All Ages',
    doorsConfirmed: true,
    doorsSource: 'NFL / Ticketmaster Verified',
    description: 'Interconference clash at Soldier Field featuring the Chicago Bears host defense against the New York Jets.'
  },
  {
    id: 'evt-bears-packers-gb',
    title: 'Green Bay Packers vs. Chicago Bears',
    performerOrTeam: 'Green Bay Packers vs. Chicago Bears',
    eventSubType: 'Sports',
    category: 'Active',
    venue: 'Lambeau Field',
    venueAddress: '1265 Lombardi Ave, Green Bay, WI 54304',
    city: 'Green Bay, WI',
    date: 'Sun, Oct 11',
    showtime: '3:25 PM',
    doorsTime: '1:00 PM',
    suggestedMeetupTime: '11:00 AM',
    suggestedMeetupLocation: 'Lambeau Field Tundra Tailgate Zone',
    image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=1200',
    ticketUrl: 'https://www.ticketmaster.com/nfl',
    ticketSectionInfo: 'Bowl Section 118 or Section 320',
    priceRange: '$110 - $490',
    lineup: ['Green Bay Packers', 'Chicago Bears', 'Historic NFL Rivalry'],
    bagPolicy: 'NFL Clear Bag Policy strictly enforced.',
    ageRestriction: 'All Ages',
    doorsConfirmed: true,
    doorsSource: 'NFL / Ticketmaster Verified',
    description: 'Road Game: Historic NFL division rivalry at legendary Lambeau Field. Chicago Bears take on the Packers on the road in Green Bay.'
  },
  {
    id: 'evt-bears-falcons-atl',
    title: 'Atlanta Falcons vs. Chicago Bears',
    performerOrTeam: 'Atlanta Falcons vs. Chicago Bears',
    eventSubType: 'Sports',
    category: 'Active',
    venue: 'Mercedes-Benz Stadium',
    venueAddress: '1 AMB Dr NW, Atlanta, GA 30313',
    city: 'Atlanta, GA',
    date: 'Sun, Oct 18',
    showtime: '1:00 PM',
    doorsTime: '11:00 AM',
    suggestedMeetupTime: '10:30 AM',
    suggestedMeetupLocation: 'The Home Depot Backyard / Tailgate Village at Mercedes-Benz Stadium',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200',
    ticketUrl: 'https://www.ticketmaster.com/nfl',
    ticketSectionInfo: 'Lower Concourse Sections 110-120 or Upper Level View',
    priceRange: '$65 - $320',
    lineup: ['Atlanta Falcons', 'Chicago Bears', 'Caleb Williams', 'Bijan Robinson'],
    bagPolicy: 'NFL Clear Bag Policy strictly enforced. Cashless venue.',
    ageRestriction: 'All Ages',
    doorsConfirmed: true,
    doorsSource: 'Mercedes-Benz Stadium Box Office & Ticketmaster',
    description: 'Road Game: Chicago Bears travel to Atlanta to take on the Falcons under the retractable roof of Mercedes-Benz Stadium. Pre-game meetup at The Home Depot Backyard.'
  },
  {
    id: 'evt-bears-patriots-chi',
    title: 'Chicago Bears vs. New England Patriots',
    performerOrTeam: 'Chicago Bears vs. New England Patriots',
    eventSubType: 'Sports',
    category: 'Active',
    venue: 'Soldier Field',
    venueAddress: '1410 Special Olympics Dr, Chicago, IL 60605',
    city: 'Chicago, IL',
    date: 'Thu, Oct 22',
    showtime: '7:15 PM',
    doorsTime: '5:00 PM',
    suggestedMeetupTime: '4:45 PM',
    suggestedMeetupLocation: 'Soldier Field Colonnade Concourse / Gate 0 Meetup',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200',
    ticketUrl: 'https://www.ticketmaster.com/nfl',
    ticketSectionInfo: 'Section 114 / Lower Bowl or GA Floor',
    priceRange: '$90 - $450',
    lineup: ['Chicago Bears', 'New England Patriots', 'Thursday Night Prime Time'],
    bagPolicy: 'NFL Clear Bag Policy strictly enforced.',
    ageRestriction: 'All Ages',
    doorsConfirmed: true,
    doorsSource: 'NFL Prime Time Box Office',
    description: 'Prime time Thursday Night Football at historic Soldier Field under the lights. Bears defend home turf against the Patriots.'
  },
  {
    id: 'evt-bears-vikings-minn',
    title: 'Chicago Bears at Minnesota Vikings',
    performerOrTeam: 'Minnesota Vikings vs. Chicago Bears',
    eventSubType: 'Sports',
    category: 'Active',
    venue: 'U.S. Bank Stadium',
    venueAddress: '401 Chicago Ave, Minneapolis, MN 55415',
    city: 'Minneapolis, MN',
    date: 'Sun, Jan 10, 2027',
    showtime: '12:00 PM',
    doorsTime: '10:00 AM',
    suggestedMeetupTime: '9:30 AM',
    suggestedMeetupLocation: 'The Commons Plaza / Longfellow Park Tailgate at U.S. Bank Stadium',
    image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=1200',
    ticketUrl: 'https://www.ticketmaster.com/nfl',
    ticketSectionInfo: 'Section 114 Lower Bowl or Club Purple',
    priceRange: '$75 - $380',
    lineup: ['Minnesota Vikings', 'Chicago Bears', 'NFC North Division Rivalry'],
    bagPolicy: 'U.S. Bank Stadium NFL Clear Bag Policy (12"x6"x12"). Cashless venue.',
    ageRestriction: 'All Ages',
    doorsConfirmed: true,
    doorsSource: 'U.S. Bank Stadium Box Office & Ticketmaster',
    description: 'Road Game: Crucial late-season NFC North division showdown at state-of-the-art U.S. Bank Stadium in downtown Minneapolis. Chicago Bears road trip gathering.'
  },

  // --- NIGHTLIFE & CLUBS ---
  {
    id: 'evt-malaa-prysm',
    title: 'Malaa: Live at PRYSM Nightclub',
    performerOrTeam: 'Malaa',
    eventSubType: 'Concert',
    category: 'Entertainment',
    venue: 'PRYSM Nightclub',
    venueAddress: '1543 N Kingsbury St, Chicago, IL 60642',
    city: 'Chicago, IL',
    date: 'Sat, Sep 19',
    showtime: '10:00 PM',
    doorsTime: '10:00 PM',
    suggestedMeetupTime: '10:30 PM',
    suggestedMeetupLocation: 'Kingsbury St Entry Lounge or Mezzanine VIP Bar',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200',
    additionalImages: [
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200'
    ],
    ticketUrl: 'https://www.prysmchicago.com',
    ticketSectionInfo: 'General Admission Tier 1 or VIP Table Service',
    priceRange: '$25 - $60',
    lineup: ['Malaa', 'Local Support DJ Collective'],
    bagPolicy: 'No backpacks or large bags. Coat check available.',
    ageRestriction: '21+',
    doorsConfirmed: true,
    doorsSource: 'PRYSM Chicago Box Office',
    description: 'Late-night electronic dance music session headlined by masked bass-house powerhouse Malaa at PRYSM Nightclub.'
  },

  // --- ICONIC RESTAURANTS & DINING OUTINGS ---
  {
    id: 'evt-au-cheval-chicago',
    title: 'Dinner & Burgers at Au Cheval',
    performerOrTeam: 'Au Cheval Chicago',
    eventSubType: 'Other',
    category: 'Dining',
    venue: 'Au Cheval',
    venueAddress: '800 W Randolph St, Chicago, IL 60607',
    city: 'Chicago, IL',
    date: 'Fri, Sep 18',
    showtime: '6:30 PM',
    doorsTime: '6:00 PM',
    suggestedMeetupTime: '6:00 PM',
    suggestedMeetupLocation: 'Lone Wolf Tavern next door (grabbing craft beers while table gets paged)',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=1200',
    additionalImages: [
      'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=1200'
    ],
    ticketUrl: 'https://auchevaldiner.com',
    ticketSectionInfo: 'Dining Room Table / Walk-in Waitlist',
    priceRange: '$25 - $60',
    lineup: ['World-Famous Double Cheeseburger', 'Thick-Cut Bacon & Fried Egg', 'Bespoke Draft Ales'],
    bagPolicy: 'Casual upscale diner setting.',
    ageRestriction: 'All Ages / 21+ at bar',
    doorsConfirmed: true,
    description: 'Legendary West Loop diner famed for the country’s top-ranked double cheeseburger, rich chopped chicken liver, draft beers, and energetic atmosphere.'
  },
  {
    id: 'evt-pequods-pizza-chicago',
    title: "Deep Dish Pizza Outing at Pequod's",
    performerOrTeam: "Pequod's Pizza",
    eventSubType: 'Other',
    category: 'Dining',
    venue: "Pequod's Pizza",
    venueAddress: '2207 N Clybourn Ave, Chicago, IL 60614',
    city: 'Chicago, IL',
    date: 'Sat, Sep 19',
    showtime: '7:00 PM',
    doorsTime: '6:30 PM',
    suggestedMeetupTime: '6:30 PM',
    suggestedMeetupLocation: 'Clybourn Ave front bar / booth section',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=1200',
    additionalImages: [
      'https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&q=80&w=1200'
    ],
    ticketUrl: 'https://pequodspizza.com',
    ticketSectionInfo: 'Large Booth Table for Circle',
    priceRange: '$20 - $40',
    lineup: ['Caramelized Halo Crust Deep Dish', 'Italian Sausage & Giardiniera Pizza', 'Local Pitchers'],
    bagPolicy: 'Casual neighborhood pizzeria.',
    ageRestriction: 'All Ages',
    doorsConfirmed: true,
    description: "Chicago's cult-favorite deep dish pan pizza featuring the famous caramelized cheese crust ring baked in cast iron pans. A true Chicago institution."
  },
  {
    id: 'evt-pappys-bbq-stl',
    title: "Dinner & BBQ Outing at Pappy's Smokehouse",
    performerOrTeam: "Pappy's Smokehouse",
    eventSubType: 'Other',
    category: 'Dining',
    venue: "Pappy's Smokehouse",
    venueAddress: '3106 Olive St, St. Louis, MO 63103',
    city: 'St. Louis, MO',
    date: 'Fri, Sep 18',
    showtime: '6:30 PM',
    doorsTime: '6:00 PM',
    suggestedMeetupTime: '6:00 PM',
    suggestedMeetupLocation: 'Olive St front patio (getting in line for ribs before sellout)',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1200',
    ticketUrl: 'https://pappyssmokehouse.com',
    ticketSectionInfo: 'Communal BBQ Picnic Table',
    priceRange: '$18 - $35',
    lineup: ['Memphis-Style Dry Rub Ribs', 'Smoked Burnt Ends', 'Sweet Baby Jane Sauce'],
    bagPolicy: 'Casual barbecue joint.',
    ageRestriction: 'All Ages',
    doorsConfirmed: true,
    description: 'Nationally acclaimed Memphis-style barbecue smoked for up to 14 hours over sweet apple and cherry wood in Midtown St. Louis.'
  },
  {
    id: 'evt-girl-and-the-goat',
    title: 'Dinner at Girl & the Goat',
    performerOrTeam: 'Chef Stephanie Izard',
    eventSubType: 'Other',
    category: 'Dining',
    venue: 'Girl & the Goat',
    venueAddress: '809 W Randolph St, Chicago, IL 60607',
    city: 'Chicago, IL',
    date: 'Sun, Sep 20',
    showtime: '7:00 PM',
    doorsTime: '6:45 PM',
    suggestedMeetupTime: '6:45 PM',
    suggestedMeetupLocation: 'West Loop Randolph Restaurant Row street entrance',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200',
    ticketUrl: 'https://girlandthegoat.com',
    ticketSectionInfo: 'Shared Table Reservation',
    priceRange: '$55 - $110',
    lineup: ['Wood Oven Roasted Pig Face', 'Green Beans in Fish Sauce Vinaigrette', 'Goat Empanadas'],
    bagPolicy: 'Upscale casual dining.',
    ageRestriction: 'All Ages',
    doorsConfirmed: true,
    description: 'Top Chef winner Stephanie Izard’s flagship West Loop destination serving inventive, globally inspired, bold family-style small plates.'
  },
  {
    id: 'evt-alinea-chicago',
    title: 'Modernist Gastronomic Tasting at Alinea',
    performerOrTeam: 'Chef Grant Achatz',
    eventSubType: 'Other',
    category: 'Dining',
    venue: 'Alinea',
    venueAddress: '1723 N Halsted St, Chicago, IL 60614',
    city: 'Chicago, IL',
    date: 'Fri, Sep 25',
    showtime: '7:30 PM',
    doorsTime: '7:15 PM',
    suggestedMeetupTime: '7:15 PM',
    suggestedMeetupLocation: 'Halsted St Gallery Entrance',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=1200',
    ticketUrl: 'https://www.exploretock.com/alinea',
    ticketSectionInfo: 'The Gallery or Salon Multi-Course Experience',
    priceRange: '$295 - $450',
    lineup: ['Edible Helium Balloons', 'Centerpiece Tabletop Dessert', '16-Course Modernist Tasting'],
    bagPolicy: 'Fine dining dress code (jackets recommended).',
    ageRestriction: 'Recommended 12+',
    doorsConfirmed: true,
    description: 'Three Michelin Star landmark by Grant Achatz delivering an avant-garde culinary performance that challenges all five senses.'
  },
  {
    id: 'evt-violet-hour-chicago',
    title: 'Craft Cocktails & Conversation at The Violet Hour',
    performerOrTeam: 'The Violet Hour Mixology Team',
    eventSubType: 'Other',
    category: 'Dining',
    venue: 'The Violet Hour',
    venueAddress: '1520 N Damen Ave, Chicago, IL 60622',
    city: 'Chicago, IL',
    date: 'Sat, Sep 19',
    showtime: '9:00 PM',
    doorsTime: '8:45 PM',
    suggestedMeetupTime: '8:45 PM',
    suggestedMeetupLocation: 'Damen Ave exterior mural door (look for the camouflaged handle)',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1200',
    ticketUrl: 'https://theviolethour.com',
    ticketSectionInfo: 'Velvet Lounge Seating',
    priceRange: '$18 - $45',
    lineup: ['Hand-Cut Clear Ice Libations', 'House-Infused Bitters', 'Artisanal Absinthe Service'],
    bagPolicy: 'No standing room, phone conversations discouraged.',
    ageRestriction: '21+',
    doorsConfirmed: true,
    description: 'James Beard Award-winning speakeasy behind a disguised mural in Wicker Park, celebrated for bespoke pre-prohibition cocktails.'
  },
  {
    id: 'evt-franklin-bbq-austin',
    title: 'Brisket & BBQ Gathering at Franklin Barbecue',
    performerOrTeam: 'Aaron Franklin & Pitmasters',
    eventSubType: 'Other',
    category: 'Dining',
    venue: 'Franklin Barbecue',
    venueAddress: '900 E 11th St, Austin, TX 78702',
    city: 'Austin, TX',
    date: 'Sat, Sep 26',
    showtime: '11:00 AM',
    doorsTime: '8:00 AM',
    suggestedMeetupTime: '8:00 AM',
    suggestedMeetupLocation: 'E 11th St line with camp chairs and coolers',
    image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&q=80&w=1200',
    ticketUrl: 'https://franklinbbq.com',
    ticketSectionInfo: 'Legendary Line Queue Outing',
    priceRange: '$35 - $75',
    lineup: ['Post Oak Smoked Prime Brisket', 'Pork Ribs', 'Jalapeño Cheddar Sausage'],
    bagPolicy: 'Bring lawn chairs, sun hats, and cold beverages for the social line wait.',
    ageRestriction: 'All Ages',
    doorsConfirmed: true,
    description: 'The world-famous Austin barbecue ritual. Join friends in the legendary morning line for the most tender post oak-smoked brisket on earth.'
  },
  {
    id: 'evt-katz-deli-nyc',
    title: "Pastrami on Rye Gathering at Katz's Delicatessen",
    performerOrTeam: "Katz's Master Carvers",
    eventSubType: 'Other',
    category: 'Dining',
    venue: "Katz's Delicatessen",
    venueAddress: '205 E Houston St, New York, NY 10002',
    city: 'New York, NY',
    date: 'Sun, Sep 27',
    showtime: '1:00 PM',
    doorsTime: '12:30 PM',
    suggestedMeetupTime: '12:30 PM',
    suggestedMeetupLocation: 'Houston St entrance by the ticket dispenser',
    image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&q=80&w=1200',
    ticketUrl: 'https://katzsdelicatessen.com',
    ticketSectionInfo: 'Shared Communal Table',
    priceRange: '$28 - $50',
    lineup: ['Hand-Carved Warm Pastrami on Rye', 'Full Sour Pickles', 'Matzoh Ball Soup'],
    bagPolicy: 'Keep your entry ticket safe until checkout!',
    ageRestriction: 'All Ages',
    doorsConfirmed: true,
    description: 'Iconic Lower East Side Jewish deli serving hand-carved pastrami sandwiches since 1888. A quintessential NYC culinary pilgrimage.'
  }
];

const MONTH_INDEX: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/**
 * Parses event dates into UNIX timestamps for chronological sorting (imminent/most recent first).
 * Standardizes both ISO strings and formatted strings to local noon to prevent timezone-drift false-positives.
 */
export function parseEventDateToTimestamp(dateStr?: string): number {
  if (!dateStr || !dateStr.trim()) return Infinity;
  const clean = dateStr.trim();

  // 1. ISO YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    return new Date(year, month, day, 12, 0, 0).getTime();
  }

  // 2. Formats like "Tue, Sep 08", "Sep 08", "Sep 8, 2026", "Fri-Sun, Oct 10-12"
  const match = clean.match(/(?:[A-Za-z]{3},?\s+)?([A-Za-z]{3})\s+(\d{1,2})(?:,?\s+(\d{4}))?/i);
  if (match) {
    const monthKey = match[1].toLowerCase();
    const month = MONTH_INDEX[monthKey];
    if (month !== undefined) {
      const day = parseInt(match[2], 10);
      const currentYear = new Date().getFullYear();
      let year = match[3] ? parseInt(match[3], 10) : currentYear;
      if (!match[3]) {
        const currentMonth = new Date().getMonth();
        if (month < currentMonth) {
          year = currentYear + 1;
        }
      }
      return new Date(year, month, day, 12, 0, 0).getTime();
    }
  }

  const fallback = Date.parse(clean);
  return isNaN(fallback) ? Infinity : fallback;
}

/**
 * Checks whether an event occurs today or in the future.
 */
export function isEventUpcoming(dateStr?: string): boolean {
  if (!dateStr || !dateStr.trim()) return true;
  const ts = parseEventDateToTimestamp(dateStr);
  if (!isFinite(ts)) return true;
  const now = new Date();
  const startOfTodayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime();
  return ts >= startOfTodayMs;
}

/**
 * Standardizes display dates to human-friendly strings like "Tue, Sep 08".
 */
export function formatDisplayDate(dateStr?: string): string {
  if (!dateStr || !dateStr.trim()) return 'Upcoming Date';
  const clean = dateStr.trim();
  if (/^[A-Za-z]{3},\s+[A-Za-z]{3}\s+\d{1,2}/.test(clean)) {
    return clean;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    try {
      const [year, month, day] = clean.split('-').map(Number);
      const d = new Date(year, month - 1, day, 12, 0, 0);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit' });
    } catch {
      return clean;
    }
  }
  return clean;
}

/**
 * Evaluates whether an event's city or address matches a targeted user/selected city.
 * Normalizes common variations like "St. Louis" vs "Saint Louis", state codes, and punctuation.
 */
export function matchesCityFilter(
  eventCity?: string,
  eventAddress?: string,
  targetCity?: string,
  radiusMiles?: number | 'metro',
  userCoords?: { lat: number; lng: number }
): boolean {
  if (
    !targetCity || 
    targetCity === 'All Cities' || 
    targetCity === 'All US Markets' || 
    targetCity.toLowerCase() === 'national' ||
    !targetCity.trim()
  ) {
    return true;
  }

  // 1. If explicit numeric radius is given and coordinates can be resolved, evaluate exact distance
  const centerCoords = userCoords || resolveCityCoordinates(targetCity);
  const eventCoords = resolveCityCoordinates(eventCity ? `${eventCity} ${eventAddress || ''}` : eventAddress);

  if (centerCoords && eventCoords && typeof radiusMiles === 'number') {
    const distMiles = calculateDistanceMiles(centerCoords.lat, centerCoords.lng, eventCoords.lat, eventCoords.lng);
    return distMiles <= radiusMiles;
  }

  const cleanEventCity = (eventCity || '').toLowerCase()
    .replace(/\bsaint\b/g, 'st')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const cleanAddress = (eventAddress || '').toLowerCase()
    .replace(/\bsaint\b/g, 'st')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const cleanTarget = targetCity.toLowerCase()
    .replace(/\bsaint\b/g, 'st')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip 2-letter state abbreviation if at the end of cleanTarget (e.g. "st louis mo" -> "st louis")
  const baseTarget = cleanTarget.replace(/\s+(mo|il|ca|ny|tx|fl|ga|co|wa|tn|oh|mi|pa|az|nc|ma|mn|nv|va|in|wi|or|md|la|ky|ok|ct|ut|al|ri|ak|ar|de|hi|id|ia|ks|me|ms|mt|ne|nh|nm|nd|sc|sd|vt|wv|wy)\b$/, '').trim();

  if (!baseTarget) return true;

  // Direct substring check in city or address
  if (cleanEventCity.includes(baseTarget) || cleanAddress.includes(baseTarget)) {
    return true;
  }

  // Token check (all tokens of target city must appear in event city or address)
  const targetTokens = baseTarget.split(' ').filter(t => t.length > 0);
  if (targetTokens.length > 1) {
    const allInCity = targetTokens.every(tok => cleanEventCity.includes(tok));
    const allInAddr = targetTokens.every(tok => cleanAddress.includes(tok));
    if (allInCity || allInAddr) {
      return true;
    }
  }

  // MSA check: If target maps to an MSA, check if component cities match or if event city belongs to the same MSA
  const targetMsa = findMsaByCity(targetCity) || findMsaByCity(baseTarget);
  if (targetMsa) {
    if (targetMsa.componentCities?.some(comp => {
      const c = comp.toLowerCase();
      return cleanEventCity.includes(c) || cleanAddress.includes(c);
    })) {
      return true;
    }

    if (eventCity) {
      const eventMsa = findMsaByCity(eventCity);
      if (eventMsa && eventMsa.cbsaCode === targetMsa.cbsaCode) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Calculates a relevance score for an event based on artist, title, venue, city, and date.
 */
export function computeEventRelevance(
  event: AutoPullEvent,
  query: string,
  userCity?: string
): number {
  if (!query || !query.trim()) {
    if (userCity && event.city.toLowerCase().includes(userCity.toLowerCase())) {
      return 50;
    }
    return 0;
  }

  const normalize = (s: string) =>
    s.toLowerCase().replace(/['’]s\b/g, 's').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  const qRaw = query.trim().toLowerCase();
  const qNorm = normalize(query);
  const qTokens = qNorm.split(' ').filter(Boolean);
  if (qTokens.length === 0) return 0;

  const performerNorm = normalize(event.performerOrTeam);
  const titleNorm = normalize(event.title);
  const venueNorm = normalize(event.venue);
  const cityNorm = normalize(event.city);
  const lineupNorm = normalize((event.lineup || []).join(' '));
  const fullHaystack = `${performerNorm} ${titleNorm} ${venueNorm} ${cityNorm} ${lineupNorm}`;
  const haystackWords = fullHaystack.split(' ');

  // For short tokens (<= 2 chars, like "ac" or "dc"), require whole-word match
  // to avoid false-positives on unrelated words like "Zach" or "Places"
  const isMatch = (words: string[], text: string, tok: string) => {
    if (tok.length <= 2) {
      return words.includes(tok);
    }
    return text.includes(tok);
  };

  const matchesAnyToken = qTokens.some(tok => isMatch(haystackWords, fullHaystack, tok));
  const rawMatch =
    event.performerOrTeam.toLowerCase().includes(qRaw) ||
    event.title.toLowerCase().includes(qRaw) ||
    event.venue.toLowerCase().includes(qRaw);

  if (!matchesAnyToken && !rawMatch) return -1; // Not relevant

  // If query contains specific non-city tokens, require at least one non-city token to match
  // (prevents returning all random events in a city when searching for a specific team/venue in that city)
  const nonCityTokens = qTokens.filter(
    t => !['chicago', 'austin', 'york', 'angeles', 'louis', 'dallas', 'seattle', 'denver', 'atlanta', 'boston', 'miami', 'nashville', 'san', 'st', 'new', 'los', 'city'].includes(t)
  );
  if (nonCityTokens.length > 0) {
    const matchesNonCity = nonCityTokens.some(tok => isMatch(haystackWords, fullHaystack, tok));
    if (!matchesNonCity && !rawMatch) {
      return -1;
    }
  }

  let score = 0;

  // 1. Exact or near-exact match on performer, title, or venue (highest priority)
  const isSportsMatchup =
    event.eventSubType === 'Sports' ||
    event.category === 'Active' ||
    /\b(vs\.?|v|at)\b/i.test(event.title);

  // Check if query is an exact match for one of the competing teams or lineup performers
  const qNormAlt = qNorm.endsWith('s') ? qNorm.slice(0, -1) : `${qNorm}s`;
  const isExactTeamInMatchup =
    isSportsMatchup &&
    (
      performerNorm === qNorm ||
      performerNorm === qNormAlt ||
      (event.lineup && event.lineup.some(l => {
        const lNorm = normalize(l);
        return lNorm === qNorm || lNorm === qNormAlt || lNorm.includes(qNorm) || qNorm.includes(lNorm);
      })) ||
      new RegExp(`(^|\\b)(${qNorm}|${qNormAlt})(\\b|$)`, 'i').test(titleNorm) ||
      new RegExp(`(^|\\b)(${qNorm}|${qNormAlt})(\\b|$)`, 'i').test(performerNorm)
    );

  if (isExactTeamInMatchup) {
    score += 1500;
  } else if (performerNorm === qNorm || event.performerOrTeam.toLowerCase() === qRaw) {
    score += 1500;
  } else if (titleNorm === qNorm || event.title.toLowerCase() === qRaw) {
    score += 1200;
  } else if (venueNorm === qNorm || venueNorm.startsWith(qNorm) || venueNorm.includes(qNorm)) {
    score += 1000;
  } else if (performerNorm.startsWith(qNorm) || qNorm.startsWith(performerNorm)) {
    score += 800;
  } else if (performerNorm.includes(qNorm)) {
    score += 600;
  } else if (titleNorm.includes(qNorm)) {
    score += 500;
  }

  // 2. All tokens present
  const matchesAllTokens = qTokens.every(tok => isMatch(haystackWords, fullHaystack, tok));
  if (matchesAllTokens) {
    score += 300;
  }

  // 3. Token-by-token scoring with word-boundary awareness
  for (const token of qTokens) {
    const perfWords = performerNorm.split(' ');
    if (perfWords.includes(token)) score += 150;
    else if (token.length > 2 && performerNorm.includes(token)) score += 60;

    const titleWords = titleNorm.split(' ');
    if (titleWords.includes(token)) score += 100;
    else if (token.length > 2 && titleNorm.includes(token)) score += 40;

    const venueWords = venueNorm.split(' ');
    if (venueWords.includes(token)) score += 80;
    else if (token.length > 2 && venueNorm.includes(token)) score += 30;

    const cityWords = cityNorm.split(' ');
    // Only grant city score if user explicitly specified a city to search in
    if (userCity && userCity !== 'All Cities' && userCity !== 'All US Markets' && userCity.toLowerCase() !== 'national') {
      if (cityWords.includes(token)) score += 100;
      else if (token.length > 2 && cityNorm.includes(token)) score += 40;
    }

    const lineupWords = lineupNorm.split(' ');
    if (lineupWords.includes(token)) score += 60;
    else if (token.length > 2 && lineupNorm.includes(token)) score += 20;
  }

  // 4. User's City / Query City match bonus
  if (userCity && userCity !== 'All Cities' && userCity !== 'All US Markets' && userCity.toLowerCase() !== 'national') {
    const uCityNorm = normalize(userCity);
    if (cityNorm.includes(uCityNorm) || uCityNorm.includes(cityNorm)) {
      score += 150;
    }
  }

  // 5. Confirmed schedule bonus
  if (event.doorsConfirmed) {
    score += 30;
  }

  return score;
}

/**
 * Resolves any arbitrary restaurant, bar, venue, or activity into a structured W8VR event draft.
 * Ensures that users setting up a hangout (dining, drinks, art walks, tours, recreation)
 * can search ANY local spot and have it auto-populated in 1 click.
 */
export function resolveDynamicOuting(query: string, userCity?: string): AutoPullEvent | null {
  if (!query || query.trim().length < 2) return null;
  const q = query.trim();
  const lower = q.toLowerCase();

  // If it's a URL or contains domain name, skip
  if (q.startsWith('http://') || q.startsWith('https://') || q.includes('.com') || q.includes('.org')) {
    return null;
  }

  // If query matches a sports team or matchup, skip dynamic dining outing
  if (
    /\b(bears?|cubs?|sox|bulls?|blackhawks?|packers?|vikings?|falcons?|patriots?|jets?|cowboys?|eagles?|giants?|lakers?|warriors?|celtics?|nfl|nba|mlb|nhl|mls)\b/i.test(lower) ||
    /\b(vs\.?|v\.|at)\b/i.test(lower)
  ) {
    return null;
  }

  const cityStr = userCity && userCity !== 'All Cities' ? userCity : 'Chicago, IL';
  const cleanTitle = q
    .replace(/^(visit|go to|dinner at|drinks at|hangout at|check out|outing to)\s+/i, '')
    .trim();

  // Determine category & subtype
  const isDining = /pizza|burger|taco|bbq|barbecue|steak|sushi|pasta|cafe|coffee|diner|bistro|brunch|kitchen|bakery|grill|restaurant|cantina|ramen|brewery|bar|pub|tavern|cocktail|wine|tasting|eats|deli|cheval|goat|pequod|alinea/i.test(lower);
  const isActive = /golf|padel|pickleball|climb|bouldering|run|marathon|fitness|gym|yoga|skate|tennis|hoops|soccer|cycling|football|classic|volleyball|court/i.test(lower);
  const isTourOrAttraction = /tour|museum|gallery|riverwalk|exhibit|aquarium|zoo|cruise|sightseeing|artwalk|architecture|observatory|fair/i.test(lower);
  const isNightlife = /club|nightclub|dj|dance|rave|lounge|prysm|smartbar|radius|tao|disco/i.test(lower);

  let category: EventCategory = 'Dining';
  let eventSubType: EventSubType = 'Other';
  let defaultMeetup = '6:30 PM';
  let defaultShow = '7:00 PM';
  let image = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200';
  let desc = `Group dining outing and table reservation at ${cleanTitle}. Coordinated on W8VR.`;
  let title = `Dinner & Hangout at ${cleanTitle}`;

  if (isActive) {
    category = 'Active';
    eventSubType = 'Sports';
    defaultMeetup = '9:30 AM';
    defaultShow = '10:00 AM';
    image = 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&q=80&w=1200';
    desc = `Group sports activity and meetup at ${cleanTitle}. Coordinated on W8VR.`;
    title = `Group Outing: ${cleanTitle}`;
  } else if (isNightlife) {
    category = 'Entertainment';
    eventSubType = 'Concert';
    defaultMeetup = '10:00 PM';
    defaultShow = '10:30 PM';
    image = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1200';
    desc = `Late night drinks, music, and group outing at ${cleanTitle}. Coordinated on W8VR.`;
    title = `Night Out at ${cleanTitle}`;
  } else if (isTourOrAttraction) {
    category = 'Entertainment';
    eventSubType = 'Other';
    defaultMeetup = '1:30 PM';
    defaultShow = '2:00 PM';
    image = 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&q=80&w=1200';
    desc = `Sightseeing, exploration, and group outing to ${cleanTitle}. Coordinated on W8VR.`;
    title = `Group Tour & Outing: ${cleanTitle}`;
  } else if (!isDining) {
    // General gathering or restaurant
    category = 'Dining';
    title = `Hangout & Drinks at ${cleanTitle}`;
    image = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200';
  }

  return {
    id: `dyn-venue-${cleanTitle.toLowerCase().replace(/[^\w]/g, '-')}`,
    title,
    performerOrTeam: cleanTitle,
    eventSubType,
    category,
    venue: cleanTitle,
    venueAddress: `${cleanTitle}, ${cityStr}`,
    city: cityStr,
    date: 'Upcoming Weekend',
    showtime: defaultShow,
    doorsTime: defaultMeetup,
    suggestedMeetupTime: defaultMeetup,
    suggestedMeetupLocation: `Meet inside front entrance / host stand at ${cleanTitle}`,
    image,
    ticketUrl: '',
    ticketSectionInfo: '',
    priceRange: isDining ? '$20 - $55' : 'Free / Varies',
    description: desc,
    doorsConfirmed: false,
    lineup: [cleanTitle],
    bagPolicy: 'Casual venue attire; standard bags permitted.',
    ageRestriction: isDining || isNightlife ? 'All Ages / 21+ at bar' : 'All Ages',
  };
}

/**
 * Searches the catalog of events with relevance ranking and chronological date sorting.
 */
export function searchAutoPullEvents(
  query: string,
  userCity?: string,
  strictCity: boolean = false,
  radiusMiles?: number | 'metro',
  userCoords?: { lat: number; lng: number }
): AutoPullEvent[] {
  const now = new Date();
  const startOfTodayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const isUpcoming = (evt: AutoPullEvent) => {
    return parseEventDateToTimestamp(evt.date) >= startOfTodayMs;
  };

  const centerCoords = userCoords || (userCity && userCity !== 'All US Markets' && userCity !== 'All Cities' ? resolveCityCoordinates(userCity) : undefined);

  const isCityMatch = (evt: AutoPullEvent) => {
    if (!strictCity || !userCity || userCity === 'All Cities' || userCity === 'All US Markets' || !userCity.trim()) {
      return true;
    }
    return matchesCityFilter(evt.city, evt.venueAddress, userCity, radiusMiles, centerCoords);
  };

  const populateDistance = (evt: AutoPullEvent): AutoPullEvent => {
    if (centerCoords) {
      const evtCoords = (evt.latitude && evt.longitude)
        ? { lat: evt.latitude, lng: evt.longitude }
        : resolveCityCoordinates(evt.city ? `${evt.city} ${evt.venueAddress}` : evt.venueAddress);
      if (evtCoords) {
        return {
          ...evt,
          distanceMi: calculateDistanceMiles(centerCoords.lat, centerCoords.lng, evtCoords.lat, evtCoords.lng),
        };
      }
    }
    return evt;
  };

  if (!query || !query.trim()) {
    return [...POPULAR_EVENTS_CATALOG]
      .filter(evt => isUpcoming(evt) && isCityMatch(evt))
      .sort((a, b) => {
        const aUserCity = userCity && a.city.toLowerCase().includes(userCity.toLowerCase()) ? 1 : 0;
        const bUserCity = userCity && b.city.toLowerCase().includes(userCity.toLowerCase()) ? 1 : 0;
        if (aUserCity !== bUserCity) return bUserCity - aUserCity;
        return parseEventDateToTimestamp(a.date) - parseEventDateToTimestamp(b.date);
      })
      .slice(0, 10)
      .map(populateDistance);
  }

  const scored = POPULAR_EVENTS_CATALOG
    .filter(evt => isUpcoming(evt) && isCityMatch(evt))
    .map(evt => ({ evt, score: computeEventRelevance(evt, query, userCity) }))
    .filter(item => item.score > 0);

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Tie-breaker: most recent / imminent date first
    return parseEventDateToTimestamp(a.evt.date) - parseEventDateToTimestamp(b.evt.date);
  });

  const results = scored.map(item => populateDistance(item.evt));

  // If query is at least 2 chars, provide a dynamic venue/dining outing option if not already an exact match
  if (query.trim().length >= 2) {
    const dynamicCandidate = resolveDynamicOuting(query, userCity);
    if (dynamicCandidate && isCityMatch(dynamicCandidate)) {
      const alreadyHasExact = results.some(
        r => r.title.toLowerCase() === dynamicCandidate.title.toLowerCase() ||
             r.venue.toLowerCase() === dynamicCandidate.venue.toLowerCase()
      );
      if (!alreadyHasExact) {
        const populatedDynamic = populateDistance(dynamicCandidate);
        // If no strong results found, place dynamic at top; otherwise append
        if (results.length === 0 || (scored[0] && scored[0].score < 400)) {
          results.unshift(populatedDynamic);
        } else {
          results.push(populatedDynamic);
        }
      }
    }
  }

  return results.slice(0, 25);
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

  const resolved = resolveEventSchedule({
    venueName: 'Local Arena / Music Hall',
    rawShowtimeStr: '8:00 PM',
    promoterNotes: raw,
  });

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
    showtime: resolved.showtime,
    doorsTime: resolved.doorsTime,
    suggestedMeetupTime: resolved.suggestedMeetupTime,
    suggestedMeetupLocation: 'Meet outside main gate / plaza bar',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=1200',
    ticketUrl: isTicketUrl ? raw : 'https://www.ticketmaster.com',
    ticketSectionInfo: 'General Admission / Lower Bowl',
    priceRange: '$50 - $150',
    lineup: [extractedTitle],
    bagPolicy: resolved.bagPolicy || 'Venue clear bag policy applies.',
    ageRestriction: 'All Ages',
    doorsConfirmed: resolved.doorsConfirmed,
    doorsSource: resolved.source,
    venueGateInfo: resolved.venueGateInfo,
    description: `Auto-pulled live gathering for ${extractedTitle}. Group outing organized on W8VR.`
  };
}
