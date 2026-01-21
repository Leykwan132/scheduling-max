import type { GetUserBySlug, GetAvailableSlots, CreatePublicBooking, ReschedulePublicBooking, CancelPublicBooking, GetBookingById } from "wasp/server/operations";
import { HttpError } from "wasp/server";
import { getDownloadFileSignedURLFromS3 } from "../file-upload/s3Utils";
import { availableSlotsForWindow, type TimeRange } from "../utils/availableSlots";
import { createGoogleCalendarEvent, formatBookingForCalendar, updateGoogleCalendarEvent, deleteGoogleCalendarEvent } from "../server/integrations/googleCalendar";
import { sendBookingConfirmationSms, isTwilioConfigured, isSmsEnabled } from "../server/integrations/twilioSms";
import { sendBookingConfirmation } from "../server/integrations/bookingEmails";

export const getUserBySlug: GetUserBySlug<{ slug: string }, any> = async (args, context) => {
    const user = await context.entities.User.findUnique({
        where: { slug: args.slug },
        include: {
            business: true,
            services: {
                where: { isActive: true },
                orderBy: { createdAt: "asc" },
            },
            profileImageFile: {
                select: { s3Key: true }
            },
        },
    });

    if (!user) {
        throw new HttpError(404, "User not found");
    }

    // Generate signed URL for profile image
    let profileImageUrl: string | undefined = undefined;
    if (user.profileImageFile?.s3Key) {
        try {
            profileImageUrl = await getDownloadFileSignedURLFromS3({ s3Key: user.profileImageFile.s3Key });
        } catch (error) {
            console.error("Error generating signed URL for profile image:", error);
        }
    }

    return {
        ...user,
        profileImageUrl,
        profileImageFile: undefined,
        timezone: user.timezone || "UTC",
        smsEnabled: isSmsEnabled(), // Expose SMS feature status to frontend
    };
};

/**
 * Cal.com-style availability calculation using the availableSlotsForWindow utility.
 * 
 * Algorithm:
 * 1. Get working hours for the requested date
 * 2. Get existing bookings for that date
 * 3. Use availableSlotsForWindow to subtract busy times and generate slots
 * 4. Filter out past slots for today
 * 5. Return time strings (HH:MM) for frontend display
 * 
 * All times are treated as "minutes since midnight" using a reference date to avoid timezone issues.
 */

type GetAvailableSlotsArgs = {
    slug: string;
    date: string; // YYYY-MM-DD 
    visitorTimezone?: string;
    serviceId?: string;
};

export const getAvailableSlots: GetAvailableSlots<GetAvailableSlotsArgs, string[]> = async (args, context) => {
    console.log("[getAvailableSlots] Called with:", args);

    const user = await context.entities.User.findUnique({
        where: { slug: args.slug },
        include: {
            schedules: {
                include: { days: true, overrides: true }
            }
        }
    });

    if (!user) throw new HttpError(404, "User not found");

    // Get service duration if serviceId provided, default to 30 min
    let serviceDuration = 30;
    if (args.serviceId) {
        const service = await context.entities.Service.findUnique({
            where: { id: args.serviceId }
        });
        if (service) {
            serviceDuration = service.duration;
        }
    }

    // Parse the requested date (YYYY-MM-DD format)
    const [year, month, day] = args.date.split('-').map(Number);

    // Get day of week for schedule lookup
    const requestedLocalDate = new Date(year, month - 1, day);
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayName = dayNames[requestedLocalDate.getDay()];

    console.log("[getAvailableSlots] Date:", args.date, "Day:", dayName);

    // STEP 1: Get working ranges for this day
    let workingRanges: { startTime: string; endTime: string }[] = [];

    if (user.schedules && user.schedules.length > 0) {
        const schedule = user.schedules[0];

        // Check for date-specific override
        const override = schedule.overrides.find((o: any) => o.date === args.date);

        if (override) {
            if (override.isUnavailable) {
                console.log("[getAvailableSlots] Day blocked by override");
                return [];
            }
            if (override.startTime && override.endTime) {
                workingRanges.push({
                    startTime: override.startTime,
                    endTime: override.endTime
                });
            }
        } else {
            // Get regular schedule for this day
            const daySlots = schedule.days.filter((d: any) => d.dayOfWeek === dayName);

            if (daySlots.length === 0) {
                console.log("[getAvailableSlots] Day off - no schedule for", dayName);
                return [];
            }

            workingRanges = daySlots.map((d: any) => ({
                startTime: d.startTime,
                endTime: d.endTime
            }));
        }
    } else {
        // Fallback to legacy fields
        if (!user.openingTime || !user.closingTime || !user.workDays) {
            console.log("[getAvailableSlots] No schedule configured");
            return [];
        }

        const workDays = user.workDays.toLowerCase().split(',').map(d => d.trim());
        if (!workDays.includes(dayName)) {
            console.log("[getAvailableSlots] Day off (legacy) -", dayName, "not in", workDays);
            return [];
        }

        workingRanges.push({
            startTime: user.openingTime,
            endTime: user.closingTime
        });
    }

    console.log("[getAvailableSlots] Working ranges:", workingRanges);

    // STEP 2: Get existing bookings and convert to TimeRange format
    const searchStartUtc = new Date(Date.UTC(year, month - 1, day - 1, 0, 0, 0));
    const searchEndUtc = new Date(Date.UTC(year, month - 1, day + 1, 23, 59, 59));

    console.log('searchStartUtc', searchStartUtc);
    console.log('searchEndUtc', searchEndUtc);
    console.log('user.id', user.id);
    const allBookings = await context.entities.Booking.findMany({
        where: {
            staffId: user.id,
            startTimeUtc: {
                gte: searchStartUtc,
                lte: searchEndUtc,
            },
            status: { notIn: ["cancelled"] }
        },
    });

    // Check if max appointments per day limit is reached
    if (user.maxAppointmentsMode === 'max_per_day' && user.maxAppointmentsPerDay && user.maxAppointmentsPerDay > 0) {
        const bookingsForDate = allBookings.filter((b: any) => {
            const bookingDateStr = b.startTimeUtc.toISOString().split('T')[0];
            return bookingDateStr === args.date;
        });

        if (bookingsForDate.length >= user.maxAppointmentsPerDay) {
            console.log("[getAvailableSlots] Max appointments reached for date:", args.date, `(${bookingsForDate.length}/${user.maxAppointmentsPerDay})`);
            return []; // No slots available - limit reached
        }
    }

    // Use a fixed reference date so all times are comparable
    const REFERENCE_DATE = Date.UTC(2000, 0, 1, 0, 0, 0);

    const bookingsAsTimeRanges: TimeRange[] = allBookings
        .filter((b: any) => {
            // Filter bookings for the requested date based on startTimeUtc
            const bookingDateStr = b.startTimeUtc.toISOString().split('T')[0];
            return bookingDateStr === args.date;
        })
        .map((b: any) => {
            // Extract hours/minutes from the UTC timestamps
            const startHours = b.startTimeUtc.getUTCHours();
            const startMins = b.startTimeUtc.getUTCMinutes();
            const startMinutes = startHours * 60 + startMins;

            const endHours = b.endTimeUtc.getUTCHours();
            const endMins = b.endTimeUtc.getUTCMinutes();
            const endMinutes = endHours * 60 + endMins;

            const startDate = new Date(REFERENCE_DATE + startMinutes * 60000);
            const endDate = new Date(REFERENCE_DATE + endMinutes * 60000);

            console.log("[getAvailableSlots] Booking:", `${startHours}:${startMins}`, "to", `${endHours}:${endMins}`);

            return { start: startDate, end: endDate };
        });

    console.log("[getAvailableSlots] Bookings count:", bookingsAsTimeRanges.length);

    // STEP 3: Calculate earliest allowed slot start (current LOCAL time + 5 min for today)
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isToday = args.date === todayStr;

    let earliestStart: Date | null = null;
    if (isToday) {
        const nowMinutes = now.getHours() * 60 + now.getMinutes() + 5;
        const roundedMinutes = Math.ceil(nowMinutes / 30) * 30;
        earliestStart = new Date(REFERENCE_DATE + roundedMinutes * 60000);
        console.log("[getAvailableSlots] Is today, earliest:", roundedMinutes, "minutes");
    }

    // STEP 4: For each working range, compute available slots using the utility
    const allSlots: string[] = [];

    for (const range of workingRanges) {
        const [startH, startM] = range.startTime.split(':').map(Number);
        const [endH, endM] = range.endTime.split(':').map(Number);

        const workingStartMinutes = startH * 60 + startM;
        const workingEndMinutes = endH * 60 + endM;

        const workingStart = new Date(REFERENCE_DATE + workingStartMinutes * 60000);
        const workingEnd = new Date(REFERENCE_DATE + workingEndMinutes * 60000);

        console.log("[getAvailableSlots] Working window:", range.startTime, "-", range.endTime);

        // Use the utility function - NO buffers for simplicity
        const slots = availableSlotsForWindow({
            workingStart,
            workingEnd,
            bookings: bookingsAsTimeRanges,
            slotLengthMinutes: serviceDuration,
            slotStepMinutes: 30,
            bufferBeforeMinutes: 0,  // No buffer
            bufferAfterMinutes: 0,   // No buffer
            earliestStart: earliestStart,
            alignToMinutes: 30,
            returnIso: false,
        }) as TimeRange[];

        console.log("[getAvailableSlots] Slots from utility:", slots.length);

        // Convert to HH:MM format
        for (const slot of slots) {
            const slotMs = slot.start.getTime() - REFERENCE_DATE;
            const totalMinutes = Math.floor(slotMs / 60000);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            allSlots.push(timeStr);
        }
    }

    const uniqueSlots = [...new Set(allSlots)].sort();
    console.log("[getAvailableSlots] Final slots:", uniqueSlots);

    return uniqueSlots;
};

type CreatePublicBookingArgs = {
    slug: string;
    serviceId: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    notes?: string;
    visitorTimezone?: string;
    reminderPreference?: string; // "sms", "email", or "both"
};

/**
 * Helper function to convert local time in a specific timezone to UTC
 * @param year - Full year (e.g., 2026)
 * @param month - Month (1-12)
 * @param day - Day of month
 * @param hour - Hour (0-23)
 * @param minute - Minute (0-59)
 * @param timezone - IANA timezone string (e.g., 'Asia/Singapore')
 * @returns Date object representing the UTC time
 */
function localTimeToUTC(year: number, month: number, day: number, hour: number, minute: number, timezone: string): Date {
    // Create an ISO date string
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;

    // Create a reference UTC date  
    const utcRef = new Date(dateString + 'Z'); // Z suffix means UTC

    // Format this UTC date as it appears in the target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const parts = formatter.formatToParts(utcRef);
    const tzYear = parseInt(parts.find(p => p.type === 'year')!.value);
    const tzMonth = parseInt(parts.find(p => p.type === 'month')!.value);
    const tzDay = parseInt(parts.find(p => p.type === 'day')!.value);
    const tzHour = parseInt(parts.find(p => p.type === 'hour')!.value);
    const tzMinute = parseInt(parts.find(p => p.type === 'minute')!.value);

    // Calculate the offset in minutes
    const targetMinutes = hour * 60 + minute;
    const tzMinutes = tzHour * 60 + tzMinute;
    const dayDiff = (year - tzYear) * 1440 + (month - tzMonth) * 43200 + (day - tzDay) * 1440; // Rough day difference
    const offsetMinutes = tzMinutes - targetMinutes + dayDiff;

    // Apply offset to get the correct UTC time
    return new Date(utcRef.getTime() - offsetMinutes * 60000);
}

export const createPublicBooking: CreatePublicBooking<CreatePublicBookingArgs, any> = async (args, context) => {
    const { slug, serviceId, date, time, clientName, clientPhone, clientEmail, notes, reminderPreference = 'email' } = args;

    console.log("[createPublicBooking] Called with:", { slug, serviceId, date, time });

    const user = await context.entities.User.findUnique({
        where: { slug },
        include: {
            business: true,
            schedules: {
                include: { days: true, overrides: true }
            }
        }
    });

    if (!user || !user.businessId) throw new HttpError(404, "Provider not found");

    const service = await context.entities.Service.findUnique({
        where: { id: serviceId }
    });

    if (!service) throw new HttpError(404, "Service not found");

    // Parse the booking date and time
    const [year, month, day] = date.split('-').map(Number);
    const [startH, startM] = time.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = startMinutes + service.duration;

    const bookingDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

    console.log("[createPublicBooking] Booking date (UTC):", bookingDate.toISOString());

    // Check if booking is in the past
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentTimeMin = now.getHours() * 60 + now.getMinutes();

    if (date < todayStr || (date === todayStr && startMinutes <= currentTimeMin)) {
        throw new HttpError(400, "Cannot book a time slot in the past");
    }

    // Get day of week
    const localDate = new Date(year, month - 1, day);
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayName = dayNames[localDate.getDay()];

    // Check if slot is within working hours
    let isWithinSchedule = false;
    let workingRanges: { start: number; end: number }[] = [];

    if (user.schedules && user.schedules.length > 0) {
        const schedule = user.schedules[0];
        const override = schedule.overrides.find((o: any) => o.date === date);

        if (override) {
            if (override.isUnavailable) {
                throw new HttpError(400, "Selected date is unavailable");
            }
            if (override.startTime && override.endTime) {
                const [sH, sM] = override.startTime.split(':').map(Number);
                const [eH, eM] = override.endTime.split(':').map(Number);
                workingRanges.push({ start: sH * 60 + sM, end: eH * 60 + eM });
            }
        } else {
            const daySlots = schedule.days.filter((d: any) => d.dayOfWeek === dayName);

            if (daySlots.length === 0) {
                throw new HttpError(400, "Selected date is unavailable (day off)");
            }

            workingRanges = daySlots.map((d: any) => {
                const [sH, sM] = d.startTime.split(':').map(Number);
                const [eH, eM] = d.endTime.split(':').map(Number);
                return { start: sH * 60 + sM, end: eH * 60 + eM };
            });
        }

        isWithinSchedule = workingRanges.some(r => startMinutes >= r.start && endMinutes <= r.end);

    } else {
        if (!user.openingTime || !user.closingTime || !user.workDays) {
            throw new HttpError(400, "Provider has not set up availability");
        }

        const workDays = user.workDays.toLowerCase().split(',').map(d => d.trim());

        if (!workDays.includes(dayName)) {
            throw new HttpError(400, "Selected date is a day off");
        }

        const [openH, openM] = user.openingTime.split(':').map(Number);
        const [closeH, closeM] = user.closingTime.split(':').map(Number);
        const openMin = openH * 60 + openM;
        const closeMin = closeH * 60 + closeM;

        if (startMinutes >= openMin && endMinutes <= closeMin) {
            isWithinSchedule = true;
        }
    }

    if (!isWithinSchedule) {
        throw new HttpError(400, "Selected time is outside of working hours");
    }

    // Check for overlaps with existing bookings
    const searchStartUtc = new Date(Date.UTC(year, month - 1, day - 1, 0, 0, 0));
    const searchEndUtc = new Date(Date.UTC(year, month - 1, day + 1, 23, 59, 59));

    const allBookings = await context.entities.Booking.findMany({
        where: {
            staffId: user.id,
            startTimeUtc: {
                gte: searchStartUtc,
                lte: searchEndUtc,
            },
            status: { notIn: ["cancelled"] }
        },
    });

    const existingBookings = allBookings.filter((b: any) => {
        const bookingDateStr = b.startTimeUtc.toISOString().split('T')[0];
        return bookingDateStr === date;
    });

    console.log("[createPublicBooking] Existing bookings for", date, ":", existingBookings.length);

    // Simple overlap check using UTC timestamps (no buffers)
    const hasOverlap = existingBookings.some((b: any) => {
        const bStartMin = b.startTimeUtc.getUTCHours() * 60 + b.startTimeUtc.getUTCMinutes();
        const bEndMin = b.endTimeUtc.getUTCHours() * 60 + b.endTimeUtc.getUTCMinutes();

        const overlaps = startMinutes < bEndMin && endMinutes > bStartMin;
        if (overlaps) {
            console.log("[createPublicBooking] Overlap with booking at", `${b.startTimeUtc.getUTCHours()}:${b.startTimeUtc.getUTCMinutes()}`);
        }
        return overlaps;
    });

    if (hasOverlap) {
        throw new HttpError(409, "Selected time slot is already booked");
    }

    // Upsert Customer
    let customer = await context.entities.Customer.findFirst({
        where: {
            phone: clientPhone,
            businessId: user.businessId
        }
    });

    if (!customer) {
        customer = await context.entities.Customer.create({
            data: {
                name: clientName,
                phone: clientPhone,
                email: clientEmail,
                businessId: user.businessId,
                userId: user.id
            }
        });
    }

    // Compute UTC timestamps - convert from business timezone to UTC
    const businessTimezone = user.timezone || 'UTC';
    console.log('[createPublicBooking] Converting local time to UTC:', { date, time, timezone: businessTimezone });

    const startTimeUtc = localTimeToUTC(year, month, day, startH, startM, businessTimezone);
    const endTimeUtc = new Date(startTimeUtc.getTime() + service.duration * 60000);

    console.log('[createPublicBooking] Computed times:', {
        startTimeUtc: startTimeUtc.toISOString(),
        endTimeUtc: endTimeUtc.toISOString()
    });

    // Create Booking
    let booking = await context.entities.Booking.create({
        data: {
            businessId: user.businessId,
            customerId: customer.id,
            serviceId: service.id,
            staffId: user.id,
            date: bookingDate,
            price: service.price,
            notes,
            status: "confirmed",
            startTimeUtc,
            endTimeUtc,
            reminderPreference,
        }
    });

    console.log("[createPublicBooking] Created booking:", booking.id);

    // Sync to Google Calendar if staff has connected
    if (user.googRefreshToken) {
        try {
            const eventData = formatBookingForCalendar({
                service,
                customer,
                staff: {
                    username: user.username,
                    business: user.business || null,
                    timezone: user.timezone || null,
                },
                startTimeUtc,
                endTimeUtc,
                notes,
                price: service.price,
            });
            const eventId = await createGoogleCalendarEvent(user.googRefreshToken, eventData);

            if (eventId) {
                booking = await context.entities.Booking.update({
                    where: { id: booking.id },
                    data: { googleCalendarEventId: eventId },
                });
                console.log("[createPublicBooking] Synced to Google Calendar:", eventId);
            }
        } catch (error) {
            console.error('[createPublicBooking] Failed to sync to Google Calendar:', error);
        }
    }

    // Send confirmation SMS if preference is 'sms' or 'both'
    if ((reminderPreference === 'sms' || reminderPreference === 'both') && isTwilioConfigured()) {
        try {
            const baseUrl = process.env.WASP_WEB_CLIENT_URL || 'http://localhost:3000';
            const appointmentUrl = `${baseUrl}/appointment/${booking.id}`;

            await sendBookingConfirmationSms({
                bookingId: booking.id,
                customerName: clientName,
                customerPhone: clientPhone,
                serviceName: service.name,
                providerName: user.username || user.business?.name || 'Provider',
                startTimeUtc,
                appointmentUrl,
            });
            console.log('[createPublicBooking] Confirmation SMS sent');
        } catch (error) {
            console.error('[createPublicBooking] Failed to send confirmation SMS:', error);
        }
    }

    // Send confirmation emails to customer and business
    try {
        await sendBookingConfirmation({
            bookingId: booking.id,
            customerName: clientName,
            customerEmail: clientEmail,
            customerPhone: clientPhone,
            businessName: user.business?.name || user.username || 'Business',
            businessEmail: user.email || undefined,
            businessTimezone: user.timezone || 'UTC',
            serviceName: service.name,
            startTimeUtc,
            location: service.location || user.location || undefined,
        });
        console.log('[createPublicBooking] Confirmation emails sent');
    } catch (error) {
        console.error('[createPublicBooking] Failed to send confirmation emails:', error);
    }

    return booking;
};

// Types for reschedule action
type ReschedulePublicBookingArgs = {
    bookingId: string;
    newDate: string; // YYYY-MM-DD
    newTime: string; // HH:MM
    visitorTimezone?: string;
};

export const reschedulePublicBooking: ReschedulePublicBooking<ReschedulePublicBookingArgs, any> = async (args, context) => {
    const { bookingId, newDate, newTime } = args;

    console.log("[reschedulePublicBooking] Called with:", { bookingId, newDate, newTime });

    // Get existing booking with all related data
    const existingBooking = await context.entities.Booking.findUnique({
        where: { id: bookingId },
        include: {
            service: true,
            staff: {
                include: {
                    business: true,
                    schedules: {
                        include: { days: true, overrides: true }
                    }
                }
            },
            customer: true
        }
    });

    if (!existingBooking) {
        throw new HttpError(404, "Booking not found");
    }

    if (existingBooking.status === 'cancelled') {
        throw new HttpError(400, "Cannot reschedule a cancelled booking");
    }

    const user = existingBooking.staff;
    const service = existingBooking.service;

    // Parse new date and time
    const [year, month, day] = newDate.split('-').map(Number);
    const [startH, startM] = newTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = startMinutes + service.duration;

    // Check if booking is in the past
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentTimeMin = now.getHours() * 60 + now.getMinutes();

    if (newDate < todayStr || (newDate === todayStr && startMinutes <= currentTimeMin)) {
        throw new HttpError(400, "Cannot reschedule to a time slot in the past");
    }

    // Get day of week
    const localDate = new Date(year, month - 1, day);
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayName = dayNames[localDate.getDay()];

    // Check if slot is within working hours
    let isWithinSchedule = false;
    let workingRanges: { start: number; end: number }[] = [];

    if (user.schedules && user.schedules.length > 0) {
        const schedule = user.schedules[0];
        const override = schedule.overrides.find((o: any) => o.date === newDate);

        if (override) {
            if (override.isUnavailable) {
                throw new HttpError(400, "Selected date is unavailable");
            }
            if (override.startTime && override.endTime) {
                const [sH, sM] = override.startTime.split(':').map(Number);
                const [eH, eM] = override.endTime.split(':').map(Number);
                workingRanges.push({ start: sH * 60 + sM, end: eH * 60 + eM });
            }
        } else {
            const daySlots = schedule.days.filter((d: any) => d.dayOfWeek === dayName);

            if (daySlots.length === 0) {
                throw new HttpError(400, "Selected date is unavailable (day off)");
            }

            workingRanges = daySlots.map((d: any) => {
                const [sH, sM] = d.startTime.split(':').map(Number);
                const [eH, eM] = d.endTime.split(':').map(Number);
                return { start: sH * 60 + sM, end: eH * 60 + eM };
            });
        }

        isWithinSchedule = workingRanges.some(r => startMinutes >= r.start && endMinutes <= r.end);
    }

    if (!isWithinSchedule) {
        throw new HttpError(400, "Selected time is outside of working hours");
    }

    // Check for overlaps with existing bookings (excluding current booking)
    const searchStartUtc = new Date(Date.UTC(year, month - 1, day - 1, 0, 0, 0));
    const searchEndUtc = new Date(Date.UTC(year, month - 1, day + 1, 23, 59, 59));

    const allBookings = await context.entities.Booking.findMany({
        where: {
            staffId: user.id,
            id: { not: bookingId }, // Exclude current booking
            startTimeUtc: {
                gte: searchStartUtc,
                lte: searchEndUtc,
            },
            status: { notIn: ["cancelled"] }
        },
    });

    const existingBookings = allBookings.filter((b: any) => {
        const bookingDateStr = b.startTimeUtc.toISOString().split('T')[0];
        return bookingDateStr === newDate;
    });

    const hasOverlap = existingBookings.some((b: any) => {
        const bStartMin = b.startTimeUtc.getUTCHours() * 60 + b.startTimeUtc.getUTCMinutes();
        const bEndMin = b.endTimeUtc.getUTCHours() * 60 + b.endTimeUtc.getUTCMinutes();
        return startMinutes < bEndMin && endMinutes > bStartMin;
    });

    if (hasOverlap) {
        throw new HttpError(409, "Selected time slot is already booked");
    }

    // Compute new UTC timestamps - convert from business timezone to UTC
    const businessTimezone = user.timezone || 'UTC';
    const newStartTimeUtc = localTimeToUTC(year, month, day, startH, startM, businessTimezone);
    const newEndTimeUtc = new Date(newStartTimeUtc.getTime() + service.duration * 60000);
    const newBookingDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

    // Update booking
    let updatedBooking = await context.entities.Booking.update({
        where: { id: bookingId },
        data: {
            date: newBookingDate,
            startTimeUtc: newStartTimeUtc,
            endTimeUtc: newEndTimeUtc,
        },
        include: {
            service: true,
            customer: true,
            staff: true
        }
    });

    console.log("[reschedulePublicBooking] Updated booking:", updatedBooking.id);

    // Update Google Calendar event if exists
    if (user.googRefreshToken && existingBooking.googleCalendarEventId) {
        try {
            const eventData = formatBookingForCalendar({
                service,
                customer: existingBooking.customer,
                staff: {
                    username: user.username,
                    business: user.business || null,
                    timezone: user.timezone || null,
                },
                startTimeUtc: newStartTimeUtc,
                endTimeUtc: newEndTimeUtc,
                notes: existingBooking.notes,
                price: service.price,
            });
            await updateGoogleCalendarEvent(user.googRefreshToken, existingBooking.googleCalendarEventId, eventData);
            console.log("[reschedulePublicBooking] Updated Google Calendar event");
        } catch (error) {
            console.error('[reschedulePublicBooking] Failed to update Google Calendar:', error);
        }
    }

    return updatedBooking;
};

// Types for cancel action
type CancelPublicBookingArgs = {
    bookingId: string;
};

export const cancelPublicBooking: CancelPublicBooking<CancelPublicBookingArgs, any> = async (args, context) => {
    const { bookingId } = args;

    console.log("[cancelPublicBooking] Called with:", { bookingId });

    // Get existing booking with all related data for emails
    const existingBooking = await context.entities.Booking.findUnique({
        where: { id: bookingId },
        include: {
            staff: {
                include: { business: true }
            },
            customer: true,
            service: true
        }
    });

    if (!existingBooking) {
        throw new HttpError(404, "Booking not found");
    }

    if (existingBooking.status === 'cancelled') {
        throw new HttpError(400, "Booking is already cancelled");
    }

    // Update booking status
    const cancelledBooking = await context.entities.Booking.update({
        where: { id: bookingId },
        data: {
            status: 'cancelled'
        }
    });

    console.log("[cancelPublicBooking] Cancelled booking:", cancelledBooking.id);

    // Delete Google Calendar event if exists
    if (existingBooking.staff.googRefreshToken && existingBooking.googleCalendarEventId) {
        try {
            await deleteGoogleCalendarEvent(existingBooking.staff.googRefreshToken, existingBooking.googleCalendarEventId);
            console.log("[cancelPublicBooking] Deleted Google Calendar event");
        } catch (error) {
            console.error('[cancelPublicBooking] Failed to delete Google Calendar event:', error);
        }
    }

    // Send cancellation emails to customer and business
    try {
        const { sendBookingCancellation } = await import("../server/integrations/bookingEmails");

        await sendBookingCancellation({
            bookingId: existingBooking.id,
            customerName: existingBooking.customer.name,
            customerEmail: existingBooking.customer.email || undefined,
            customerPhone: existingBooking.customer.phone,
            businessName: existingBooking.staff.business?.name || existingBooking.staff.username || 'Business',
            businessEmail: existingBooking.staff.email || undefined,
            businessTimezone: existingBooking.staff.timezone || 'UTC',
            serviceName: existingBooking.service.name,
            startTimeUtc: existingBooking.startTimeUtc,
        });
        console.log('[cancelPublicBooking] Cancellation emails sent');
    } catch (error) {
        console.error('[cancelPublicBooking] Failed to send cancellation emails:', error);
    }

    return cancelledBooking;
};

// Types for getBookingById query
type GetBookingByIdArgs = {
    bookingId: string;
};

export const getBookingById: GetBookingById<GetBookingByIdArgs, any> = async (args, context) => {
    const { bookingId } = args;

    const booking = await context.entities.Booking.findUnique({
        where: { id: bookingId },
        include: {
            service: true,
            customer: true,
            staff: {
                include: {
                    business: true,
                    profileImageFile: {
                        select: { s3Key: true }
                    }
                }
            }
        }
    });

    if (!booking) {
        throw new HttpError(404, "Booking not found");
    }

    // Generate signed URL for staff profile image
    let staffProfileImageUrl: string | undefined = undefined;
    if (booking.staff.profileImageFile?.s3Key) {
        try {
            staffProfileImageUrl = await getDownloadFileSignedURLFromS3({ s3Key: booking.staff.profileImageFile.s3Key });
        } catch (error) {
            console.error("Error generating signed URL for staff profile image:", error);
        }
    }

    return {
        ...booking,
        staff: {
            ...booking.staff,
            profileImageUrl: staffProfileImageUrl,
            profileImageFile: undefined,
        }
    };
};

/**
 * Get intake form for a specific category (public - no auth required)
 * Used by BookingPage to show form questions before contact details
 */
export const getFormForCategory = async (args: { categoryId: string }, context: any) => {
    if (!args.categoryId) return null;

    const form = await context.entities.IntakeForm.findFirst({
        where: {
            categories: { some: { id: args.categoryId } },
            isInternal: false // Only show non-internal forms to clients
        },
        include: {
            questions: { orderBy: { order: 'asc' } }
        }
    });

    return form;
};

/**
 * Save form response when booking is created
 */
export const saveFormResponse = async (
    args: { formId: string; bookingId: string; answers: Record<string, any> },
    context: any
) => {
    const response = await context.entities.FormResponse.create({
        data: {
            formId: args.formId,
            bookingId: args.bookingId,
            answers: JSON.stringify(args.answers)
        }
    });

    return response;
};
