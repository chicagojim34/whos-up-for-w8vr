import { type EventItem } from '../types';

/**
 * Parses human dates (e.g. "Fri, Nov 14", "Today", "Tomorrow", "Sat, Oct 25")
 * and times (e.g. "5:30 PM", "8:00 PM") into a Date object.
 */
export function parseEventDateTime(dateStr: string, timeStr?: string): Date {
  const now = new Date();
  let targetYear = now.getFullYear();
  let targetMonth = now.getMonth();
  let targetDay = now.getDate();

  const lowerDate = (dateStr || '').toLowerCase().trim();

  if (lowerDate.includes('today')) {
    // Keep today's date
  } else if (lowerDate.includes('tomorrow')) {
    targetDay += 1;
  } else {
    // Try matching month names: e.g. "Nov 14", "Oct 25", "Dec 07"
    const monthMap: { [k: string]: number } = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };

    const match = dateStr?.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})/i);
    if (match) {
      const monthKey = match[1].toLowerCase().slice(0, 3);
      if (monthMap[monthKey] !== undefined) {
        targetMonth = monthMap[monthKey];
        targetDay = parseInt(match[2], 10);
        // If the date passed already this year, push to next year
        if (targetMonth < now.getMonth() || (targetMonth === now.getMonth() && targetDay < now.getDate() - 30)) {
          targetYear += 1;
        }
      }
    }
  }

  // Parse time: e.g. "5:30 PM", "11:00 AM", "8:00 PM"
  let hours = 19; // Default 7 PM
  let minutes = 0;

  if (timeStr) {
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10);
      minutes = parseInt(timeMatch[2], 10);
      const ampm = (timeMatch[3] || '').toLowerCase();
      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
    }
  }

  return new Date(targetYear, targetMonth, targetDay, hours, minutes, 0);
}

/**
 * Formats a Date object into iCalendar UTC format (YYYYMMDDTHHMMSSZ).
 */
function formatIcsDate(d: Date): string {
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Escapes characters for iCalendar text fields.
 */
function escapeIcsText(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generates an RFC 5545 compliant iCalendar string from W8VR events.
 */
export function generateIcsCalendar(events: EventItem[], calendarTitle = "W8VR Schedule"): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//W8VR//Social Calendar Subscription 2.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calendarTitle}`,
    `X-WR-CALDESC:Your live updated hangouts and events on W8VR`,
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H'
  ];

  const now = new Date();
  const dtstamp = formatIcsDate(now);

  for (const evt of events) {
    // Event start time calculation:
    // If startsAt exists, start from that Date. If meetupTime is present, adjust start time.
    let startDate: Date;
    if (evt.startsAt) {
      startDate = new Date(evt.startsAt);
      if (evt.meetupTime) {
        const timeMatch = evt.meetupTime.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
        if (timeMatch) {
          let h = parseInt(timeMatch[1], 10);
          const m = parseInt(timeMatch[2], 10);
          const ampm = (timeMatch[3] || '').toLowerCase();
          if (ampm === 'pm' && h < 12) h += 12;
          if (ampm === 'am' && h === 12) h = 0;
          startDate.setHours(h, m, 0, 0);
        }
      }
    } else {
      const startTimeStr = evt.meetupTime || '7:00 PM';
      startDate = parseEventDateTime('', startTimeStr);
    }
    
    // Event duration: 3.5 hours
    const endDate = new Date(startDate.getTime() + 3.5 * 60 * 60 * 1000);

    // Build rich description with dual-times and ticket/venue info
    const descParts: string[] = [];

    if (evt.performerOrTeam) {
      descParts.push(`⭐ PERFORMER / MATCHUP: ${evt.performerOrTeam}`);
    }

    if (evt.showtime && evt.meetupTime) {
      descParts.push(`📍 1. GROUP MEETUP: ${evt.meetupTime} at ${evt.meetupLocation || evt.location}`);
      if (evt.doorsTime) {
        descParts.push(`🚪 2. DOORS OPEN: ${evt.doorsTime}`);
      }
      descParts.push(`⚡ 3. OFFICIAL SHOWTIME / KICKOFF: ${evt.showtime} at ${evt.location}`);
    } else {
      descParts.push(`🕒 START TIME: ${evt.startsAt}`);
    }

    if (evt.ticketSectionInfo) {
      descParts.push(`🎟️ TARGET SEATING: ${evt.ticketSectionInfo}`);
    }

    if (evt.ticketUrl) {
      descParts.push(`🎫 BUY TICKETS: ${evt.ticketUrl}`);
    }

    if (evt.bagPolicy) {
      descParts.push(`🎒 ENTRY / BAG POLICY: ${evt.bagPolicy}`);
    }

    if (evt.ageRestriction) {
      descParts.push(`🔞 AGE REQUIREMENT: ${evt.ageRestriction}`);
    }

    if (evt.vibe) {
      descParts.push(`\nTHE VIBE:\n${evt.vibe}`);
    }

    descParts.push(`\nW8VR Event ID: ${evt.id}`);
    descParts.push(`Open on W8VR: https://w8vr.app/event/${evt.id}`);

    const summary = evt.performerOrTeam 
      ? `${evt.title} (${evt.performerOrTeam})`
      : evt.title;

    const locationText = evt.meetupLocation 
      ? `${evt.meetupLocation} (Pre-meet) / ${evt.location}`
      : evt.venueAddress || evt.location;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:w8vr-${evt.id}-${startDate.getFullYear()}@w8vr.app`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART:${formatIcsDate(startDate)}`);
    lines.push(`DTEND:${formatIcsDate(endDate)}`);
    lines.push(`SUMMARY:${escapeIcsText(summary)}`);
    lines.push(`DESCRIPTION:${escapeIcsText(descParts.join('\n'))}`);
    lines.push(`LOCATION:${escapeIcsText(locationText)}`);
    lines.push(`STATUS:CONFIRMED`);
    lines.push(`URL:https://w8vr.app/event/${evt.id}`);

    // Add 1-hour pre-meetup reminder alarm
    lines.push('BEGIN:VALARM');
    lines.push('TRIGGER:-PT60M');
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:${escapeIcsText(`Reminder: Meetup for ${evt.title} in 1 hour!`)}`);
    lines.push('END:VALARM');

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Downloads a live generated .ics file directly in the browser.
 */
export function downloadIcsFile(events: EventItem[], filename = 'w8vr-schedule.ics'): void {
  const icsContent = generateIcsCalendar(events);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Returns platform-specific 1-click subscription and webcal URLs.
 */
export function getCalendarSubscriptionUrls(events: EventItem[], filter: 'attending' | 'all') {
  // Production subscription feed link
  const host = typeof window !== 'undefined' ? window.location.host : 'w8vr.app';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
  
  // Hosted live feed URL (with filter token)
  const httpsFeedUrl = `${protocol}//${host}/api/calendar/subscribe?user=felix&filter=${filter}`;
  const webcalUrl = httpsFeedUrl.replace(/^https?:\/\//i, 'webcal://');

  // Google Calendar 1-click subscription URL
  const googleCalendarUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`;

  // Outlook Web / Office 365 1-click subscription URL
  const outlookLiveUrl = `https://outlook.live.com/calendar/0/addcalendar?url=${encodeURIComponent(webcalUrl)}&name=W8VR%20Schedule`;
  const office365Url = `https://outlook.office.com/calendar/0/addfromweb?url=${encodeURIComponent(webcalUrl)}&name=W8VR%20Schedule`;

  // Dynamic Data URL for local/offline testing
  const icsData = generateIcsCalendar(events);
  const dataUri = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsData)}`;

  return {
    httpsFeedUrl,
    webcalUrl,
    googleCalendarUrl,
    outlookLiveUrl,
    office365Url,
    dataUri
  };
}
