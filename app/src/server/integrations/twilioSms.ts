import twilio from 'twilio';
import { format } from 'date-fns';

// Initialize Twilio client
const getTwilioClient = () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
        console.warn('[Twilio] Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN environment variables');
        return null;
    }

    return twilio(accountSid, authToken);
};

const getTwilioPhoneNumber = () => {
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!phoneNumber) {
        console.warn('[Twilio] Missing TWILIO_PHONE_NUMBER environment variable');
        return null;
    }
    return phoneNumber;
};

// Format phone number to E.164 format
// Enforces US country code (+1)
const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // Ensure it starts with 1
    if (digits.startsWith('1')) {
        return `+${digits}`;
    }
    return `+1${digits}`;
};

// Format time for display
const formatTimeForSms = (date: Date): string => {
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export interface BookingNotificationData {
    bookingId: string;
    customerName: string;
    customerPhone: string;
    serviceName: string;
    providerName: string;
    startTimeUtc: Date;
    appointmentUrl: string;
}

/**
 * Send booking confirmation SMS
 */
export const sendBookingConfirmationSms = async (data: BookingNotificationData): Promise<boolean> => {
    if (!isSmsEnabled()) {
        console.log('[Twilio] SMS notifications are disabled (ENABLE_SMS_NOTIFICATIONS != true)');
        return false;
    }

    const client = getTwilioClient();
    const fromNumber = getTwilioPhoneNumber();

    if (!client || !fromNumber) {
        console.error('[Twilio] Cannot send SMS: Twilio not configured');
        return false;
    }

    const formattedPhone = formatPhoneNumber(data.customerPhone);
    if (!formattedPhone.startsWith('+1')) {
        console.warn(`[Twilio] Skipping SMS for non-US number: ${data.customerPhone}`);
        return false;
    }

    const formattedDate = format(data.startTimeUtc, 'EEEE, MMMM do');
    const formattedTime = formatTimeForSms(data.startTimeUtc);

    const messageBody = `Hi ${data.customerName}! Your appointment for ${data.serviceName} with ${data.providerName} is confirmed for ${formattedDate} at ${formattedTime}.

View or manage: ${data.appointmentUrl}

- Morph Scheduling`;

    try {
        const message = await client.messages.create({
            body: messageBody,
            from: fromNumber,
            to: formatPhoneNumber(data.customerPhone),
        });

        console.log(`[Twilio] Confirmation SMS sent successfully. SID: ${message.sid}`);
        return true;
    } catch (error: any) {
        console.error('[Twilio] Failed to send confirmation SMS:', error.message);
        return false;
    }
};

/**
 * Send 1-hour reminder SMS
 */
export const sendBookingReminderSms = async (data: BookingNotificationData): Promise<boolean> => {
    if (!isSmsEnabled()) {
        console.log('[Twilio] SMS notifications are disabled (ENABLE_SMS_NOTIFICATIONS != true)');
        return false;
    }

    const client = getTwilioClient();
    const fromNumber = getTwilioPhoneNumber();

    if (!client || !fromNumber) {
        console.error('[Twilio] Cannot send SMS: Twilio not configured');
        return false;
    }

    const formattedPhone = formatPhoneNumber(data.customerPhone);
    if (!formattedPhone.startsWith('+1')) {
        console.warn(`[Twilio] Skipping SMS for non-US number: ${data.customerPhone}`);
        return false;
    }

    const formattedTime = formatTimeForSms(data.startTimeUtc);

    const messageBody = `Reminder: Your ${data.serviceName} appointment with ${data.providerName} is in 1 hour (${formattedTime}).

View details: ${data.appointmentUrl}

- Morph Scheduling`;

    try {
        const message = await client.messages.create({
            body: messageBody,
            from: fromNumber,
            to: formatPhoneNumber(data.customerPhone),
        });

        console.log(`[Twilio] Reminder SMS sent successfully. SID: ${message.sid}`);
        return true;
    } catch (error: any) {
        console.error('[Twilio] Failed to send reminder SMS:', error.message);
        return false;
    }
};

/**
 * Check if SMS feature is enabled via environment variable
 * Set ENABLE_SMS_NOTIFICATIONS=true in .env.server to enable
 */
export const isSmsEnabled = (): boolean => {
    return process.env.ENABLE_SMS_NOTIFICATIONS === 'true';
};

/**
 * Check if Twilio is properly configured AND SMS is enabled
 */
export const isTwilioConfigured = (): boolean => {
    return isSmsEnabled() && !!(
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_PHONE_NUMBER
    );
};
