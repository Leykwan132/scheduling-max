import { sendBookingReminderSms, isTwilioConfigured } from '../integrations/twilioSms';

/**
 * Appointment Reminder Job
 * 
 * This job runs every 5 minutes and sends 1-hour reminders to customers
 * who have bookings starting in 55-65 minutes.
 */
export const sendAppointmentReminders = async (_args: any, context: any) => {
    console.log('[AppointmentReminders] Starting reminder job...');

    if (!isTwilioConfigured()) {
        console.log('[AppointmentReminders] Twilio not configured, skipping SMS reminders');
        return { processed: 0, sent: 0 };
    }

    const now = new Date();

    // Find bookings starting in 55-65 minutes (1 hour ± 5 minutes buffer)
    const reminderWindowStart = new Date(now.getTime() + 55 * 60 * 1000);
    const reminderWindowEnd = new Date(now.getTime() + 65 * 60 * 1000);

    console.log(`[AppointmentReminders] Looking for bookings between ${reminderWindowStart.toISOString()} and ${reminderWindowEnd.toISOString()}`);

    // Get bookings that need reminders
    const bookings = await context.entities.Booking.findMany({
        where: {
            startTimeUtc: {
                gte: reminderWindowStart,
                lte: reminderWindowEnd,
            },
            status: 'confirmed',
            reminderSent: false,
            reminderPreference: {
                in: ['sms', 'both']
            }
        },
        include: {
            customer: true,
            service: true,
            staff: {
                include: {
                    business: true
                }
            }
        }
    });

    console.log(`[AppointmentReminders] Found ${bookings.length} bookings to remind`);

    let sentCount = 0;

    for (const booking of bookings) {
        try {
            const baseUrl = process.env.WASP_WEB_CLIENT_URL || 'http://localhost:3000';
            const appointmentUrl = `${baseUrl}/appointment/${booking.id}`;

            let smsSuccess = false;
            let emailSuccess = false;

            // Send SMS reminder if configured
            if (isTwilioConfigured() && (booking.reminderPreference === 'sms' || booking.reminderPreference === 'both')) {
                smsSuccess = await sendBookingReminderSms({
                    bookingId: booking.id,
                    customerName: booking.customer.name,
                    customerPhone: booking.customer.phone,
                    serviceName: booking.service.name,
                    providerName: booking.staff.username || booking.staff.business?.name || 'Provider',
                    startTimeUtc: booking.startTimeUtc,
                    appointmentUrl,
                });
            }

            // Send email reminder
            try {
                const { sendBookingReminder } = await import('../integrations/bookingEmails');

                await sendBookingReminder({
                    bookingId: booking.id,
                    customerName: booking.customer.name,
                    customerEmail: booking.customer.email || undefined,
                    customerPhone: booking.customer.phone,
                    businessName: booking.staff.business?.name || booking.staff.username || 'Business',
                    businessEmail: booking.staff.email || undefined,
                    businessTimezone: booking.staff.timezone || 'UTC',
                    serviceName: booking.service.name,
                    startTimeUtc: booking.startTimeUtc,
                });
                emailSuccess = true;
                console.log(`[AppointmentReminders] Email reminder sent for booking ${booking.id}`);
            } catch (emailError) {
                console.error(`[AppointmentReminders] Failed to send email reminder for booking ${booking.id}:`, emailError);
            }

            if (smsSuccess || emailSuccess) {
                // Mark reminder as sent
                await context.entities.Booking.update({
                    where: { id: booking.id },
                    data: { reminderSent: true }
                });
                sentCount++;
                console.log(`[AppointmentReminders] Reminder sent for booking ${booking.id} (SMS: ${smsSuccess}, Email: ${emailSuccess})`);
            }
        } catch (error) {
            console.error(`[AppointmentReminders] Failed to send reminder for booking ${booking.id}:`, error);
        }
    }

    console.log(`[AppointmentReminders] Job complete. Sent ${sentCount}/${bookings.length} reminders`);

    return {
        processed: bookings.length,
        sent: sentCount
    };
};
