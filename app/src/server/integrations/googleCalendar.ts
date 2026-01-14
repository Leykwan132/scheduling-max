import { getGoogleAccessToken } from './google';

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

interface BookingEventData {
    title: string;
    description: string;
    startTimeUtc: Date;
    endTimeUtc: Date;
    customerEmail?: string;
}

/**
 * Creates a new event in the user's primary Google Calendar
 */
export const createGoogleCalendarEvent = async (
    refreshToken: string,
    data: BookingEventData
): Promise<string | null> => {
    try {
        const accessToken = await getGoogleAccessToken(refreshToken);

        const event = {
            summary: data.title,
            description: data.description,
            start: {
                dateTime: data.startTimeUtc.toISOString(),
                timeZone: 'UTC',
            },
            end: {
                dateTime: data.endTimeUtc.toISOString(),
                timeZone: 'UTC',
            },
            attendees: data.customerEmail ? [{ email: data.customerEmail }] : undefined,
        };

        const response = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Failed to create Google Calendar event:', error);
            return null;
        }

        const createdEvent = await response.json();
        console.log('✅ Created Google Calendar event:', createdEvent.id);
        return createdEvent.id;
    } catch (error) {
        console.error('Error creating Google Calendar event:', error);
        return null;
    }
};

/**
 * Updates an existing event in the user's primary Google Calendar
 */
export const updateGoogleCalendarEvent = async (
    refreshToken: string,
    eventId: string,
    data: BookingEventData
): Promise<boolean> => {
    try {
        const accessToken = await getGoogleAccessToken(refreshToken);

        const event = {
            summary: data.title,
            description: data.description,
            start: {
                dateTime: data.startTimeUtc.toISOString(),
                timeZone: 'UTC',
            },
            end: {
                dateTime: data.endTimeUtc.toISOString(),
                timeZone: 'UTC',
            },
        };

        const response = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Failed to update Google Calendar event:', error);
            return false;
        }

        console.log('✅ Updated Google Calendar event:', eventId);
        return true;
    } catch (error) {
        console.error('Error updating Google Calendar event:', error);
        return false;
    }
};

/**
 * Deletes an event from the user's primary Google Calendar
 */
export const deleteGoogleCalendarEvent = async (
    refreshToken: string,
    eventId: string
): Promise<boolean> => {
    try {
        const accessToken = await getGoogleAccessToken(refreshToken);

        const response = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        // 204 = success (no content), 410 = already deleted
        if (response.status === 204 || response.status === 410) {
            console.log('✅ Deleted Google Calendar event:', eventId);
            return true;
        }

        const error = await response.json();
        console.error('Failed to delete Google Calendar event:', error);
        return false;
    } catch (error) {
        console.error('Error deleting Google Calendar event:', error);
        return false;
    }
};

/**
 * Helper to format booking data for Google Calendar
 */
export const formatBookingForCalendar = (booking: {
    service: { name: string };
    customer: { name: string; phone: string; email?: string | null };
    staff?: { username?: string | null };
    startTimeUtc: Date;
    endTimeUtc: Date;
    notes?: string | null;
    price: number;
}): BookingEventData => {
    const description = [
        `Client: ${booking.customer.name}`,
        `Phone: ${booking.customer.phone}`,
        `Service: ${booking.service.name}`,
        `Price: $${booking.price.toFixed(2)}`,
        booking.notes ? `Notes: ${booking.notes}` : null,
    ].filter(Boolean).join('\n');

    return {
        title: `${booking.service.name} - ${booking.customer.name}`,
        description,
        startTimeUtc: booking.startTimeUtc,
        endTimeUtc: booking.endTimeUtc,
        customerEmail: booking.customer.email || undefined,
    };
};

/**
 * Fetches events from the user's primary Google Calendar for a given time range
 */
export const fetchGoogleCalendarEvents = async (
    refreshToken: string,
    timeMin: Date,
    timeMax: Date
): Promise<Array<{
    id: string;
    title: string;
    start: Date;
    end: Date;
    description?: string;
}>> => {
    try {
        const accessToken = await getGoogleAccessToken(refreshToken);

        const url = new URL(`${GOOGLE_CALENDAR_API}/calendars/primary/events`);
        url.searchParams.append('timeMin', timeMin.toISOString());
        url.searchParams.append('timeMax', timeMax.toISOString());
        url.searchParams.append('singleEvents', 'true');
        url.searchParams.append('orderBy', 'startTime');

        const response = await fetch(url.toString(), {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Failed to fetch Google Calendar events:', error);
            return [];
        }

        const data = await response.json();
        const events = data.items || [];

        return events.map((event: any) => ({
            id: event.id,
            title: event.summary || '(No title)',
            start: new Date(event.start.dateTime || event.start.date),
            end: new Date(event.end.dateTime || event.end.date),
            description: event.description,
        }));
    } catch (error) {
        console.error('Error fetching Google Calendar events:', error);
        return [];
    }
};
