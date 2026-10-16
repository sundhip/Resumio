import crypto from 'crypto';
import { db } from '../database/db.js';
import { NotificationService } from './notificationService.js';

export interface CalendarEventDetails {
  id: string;
  title: string;
  description: string;
  startTimeIso: string;
  endTimeIso: string;
  timeZone: string;
  locationOrUrl: string;
  organizerEmail: string;
  attendeeEmail: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export class SchedulingService {
  /**
   * Generates a standard RFC 5545 iCalendar (.ics) format string
   */
  public static generateIcsCalendarInvite(event: CalendarEventDetails): string {
    const formatIcsDate = (isoString: string): string => {
      const date = new Date(isoString);
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const startIcs = formatIcsDate(event.startTimeIso);
    const endIcs = formatIcsDate(event.endTimeIso);
    const nowIcs = formatIcsDate(new Date().toISOString());

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Resumio Platform//ATS Scheduling V2//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${event.id}@resumio.ai`,
      `DTSTAMP:${nowIcs}`,
      `DTSTART:${startIcs}`,
      `DTEND:${endIcs}`,
      `SUMMARY:${event.title.replace(/[,;]/g, ' ')}`,
      `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
      `LOCATION:${event.locationOrUrl}`,
      `ORGANIZER;CN=Recruiting Team:mailto:${event.organizerEmail}`,
      `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;CN=Candidate:mailto:${event.attendeeEmail}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder: Upcoming Interview with Resumio',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
  }

  /**
   * Generates timezone-safe availability slots for candidate self-scheduling
   */
  public static getAvailabilitySlots(
    recruiterId: string,
    targetDate: string,
    timeZone: string = 'UTC'
  ): TimeSlot[] {
    const dateObj = new Date(targetDate);
    const datePrefix = dateObj.toISOString().slice(0, 10);

    const standardSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
    const slots: TimeSlot[] = [];

    // Query existing recruiter scheduled interviews for that day
    const existing = db.prepare(`
      SELECT scheduled_at, duration_minutes
      FROM interviews
      WHERE recruiter_id = ? AND scheduled_at LIKE ? AND status IN ('Scheduled', 'Rescheduled')
    `).all(recruiterId, `${datePrefix}%`) as any[];

    const bookedHours = new Set(
      existing.map((item) => new Date(item.scheduled_at).getUTCHours())
    );

    for (const slot of standardSlots) {
      const [hourStr, minStr] = slot.split(':');
      const hour = parseInt(hourStr, 10);
      const isAvailable = !bookedHours.has(hour);

      slots.push({
        startTime: `${datePrefix}T${slot}:00Z`,
        endTime: `${datePrefix}T${hour + 1}:${minStr}:00Z`,
        isAvailable,
      });
    }

    return slots;
  }
}
