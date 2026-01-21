import sgMail from '@sendgrid/mail';
import { getTimezoneFromPhone } from '../utils/timezoneDetection';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const DEFAULT_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'no-reply@morphscheduling.com';
const DEFAULT_FROM_NAME = 'Morph Scheduling';
const BASE_URL = process.env.WASP_WEB_CLIENT_URL || 'http://localhost:3000';

// Check if SendGrid is configured
export function isSendGridConfigured(): boolean {
    return !!process.env.SENDGRID_API_KEY;
}

// Types for booking email data
interface BookingEmailData {
    bookingId: string;
    customerName: string;
    customerEmail?: string; // Optional - some customers may not have email
    customerPhone?: string; // For timezone detection
    businessName: string;
    businessEmail?: string;
    businessTimezone?: string; // Business owner's timezone
    serviceName: string;
    startTimeUtc: Date; // UTC datetime - will be formatted per recipient
    location?: string;
}

// Send email using SendGrid dynamic template
async function sendTemplateEmail(params: {
    to: string;
    templateId: string;
    dynamicTemplateData: Record<string, any>;
}): Promise<boolean> {
    if (!isSendGridConfigured()) {
        console.log('[BookingEmails] SendGrid not configured, skipping email');
        return false;
    }

    if (!params.templateId) {
        console.log('[BookingEmails] No template ID provided, skipping email');
        return false;
    }

    if (!params.to) {
        console.log('[BookingEmails] No recipient email, skipping email');
        return false;
    }

    try {
        await sgMail.send({
            to: params.to,
            from: {
                email: DEFAULT_FROM_EMAIL,
                name: DEFAULT_FROM_NAME,
            },
            templateId: params.templateId,
            dynamicTemplateData: params.dynamicTemplateData,
        });
        console.log(`[BookingEmails] Email sent to ${params.to} with template ${params.templateId}`);
        return true;
    } catch (error: any) {
        console.error('[BookingEmails] Failed to send email:', error?.response?.body || error);
        return false;
    }
}

// Generate URLs
function getCustomerBookingUrl(bookingId: string): string {
    return `${BASE_URL}/appointment/${bookingId}`;
}

function getBusinessCalendarUrl(): string {
    return `${BASE_URL}/app/calendar`;
}

// Helper to format date in specific timezone
function formatDateInTimezone(date: Date, timezone: string): string {
    try {
        console.log("date", date);
        console.log("timezone", timezone);
        console.log("date.toLocaleString", date.toLocaleString('en-US', {
            timeZone: timezone,
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        }));
        return date.toLocaleString('en-US', {
            timeZone: timezone,
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    } catch (error) {
        console.error(`[formatDateInTimezone] Error formatting date for timezone ${timezone}:`, error);
        // Fallback to UTC if timezone is invalid
        return date.toLocaleString('en-US', {
            timeZone: 'UTC',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        }) + ' UTC';
    }
}

// ============================================
// BOOKING CONFIRMATION EMAILS
// ============================================

export async function sendBookingConfirmationToCustomer(data: BookingEmailData): Promise<boolean> {
    if (!data.customerEmail) {
        console.log('[BookingEmails] No customer email, skipping confirmation to customer');
        return false;
    }

    const templateId = process.env.SENDGRID_TEMPLATE_BOOKING_CONFIRMATION_CUSTOMER;

    // Detect customer timezone from phone number
    const customerTimezone = data.customerPhone ? getTimezoneFromPhone(data.customerPhone) : 'UTC';
    const formattedDateTime = formatDateInTimezone(data.startTimeUtc, customerTimezone);

    console.log("formattedDateTime", formattedDateTime);
    return sendTemplateEmail({
        to: data.customerEmail,
        templateId: templateId || '',
        dynamicTemplateData: {
            business: data.businessName,
            dateTime: formattedDateTime,
            service: data.serviceName,
            location: data.location || '',
            bookingUrl: getCustomerBookingUrl(data.bookingId),
        },
    });
}

export async function sendBookingConfirmationToBusiness(data: BookingEmailData): Promise<boolean> {
    if (!data.businessEmail) {
        console.log('[BookingEmails] No business email, skipping confirmation to business');
        return false;
    }

    const templateId = process.env.SENDGRID_TEMPLATE_BOOKING_CONFIRMATION_BUSINESS;

    // Use business timezone
    const businessTimezone = data.businessTimezone || 'UTC';
    const formattedDateTime = formatDateInTimezone(data.startTimeUtc, businessTimezone);

    return sendTemplateEmail({
        to: data.businessEmail,
        templateId: templateId || '',
        dynamicTemplateData: {
            customerName: data.customerName,
            dateTime: formattedDateTime,
            service: data.serviceName,
            location: data.location || '',
            bookingUrl: getBusinessCalendarUrl(),
        },
    });
}

export async function sendBookingConfirmation(data: BookingEmailData): Promise<void> {
    await Promise.all([
        sendBookingConfirmationToCustomer(data),
        sendBookingConfirmationToBusiness(data),
    ]);
}

// ============================================
// BOOKING UPDATE EMAILS
// ============================================

export async function sendBookingUpdateToCustomer(data: BookingEmailData): Promise<boolean> {
    if (!data.customerEmail) {
        console.log('[BookingEmails] No customer email, skipping update to customer');
        return false;
    }

    const templateId = process.env.SENDGRID_TEMPLATE_BOOKING_UPDATE_CUSTOMER;

    // Detect customer timezone from phone number
    const customerTimezone = data.customerPhone ? getTimezoneFromPhone(data.customerPhone) : 'UTC';
    const formattedDateTime = formatDateInTimezone(data.startTimeUtc, customerTimezone);

    return sendTemplateEmail({
        to: data.customerEmail,
        templateId: templateId || '',
        dynamicTemplateData: {
            business: data.businessName,
            dateTime: formattedDateTime,
            service: data.serviceName,
            location: data.location || '',
            bookingUrl: getCustomerBookingUrl(data.bookingId),
        },
    });
}

export async function sendBookingUpdateToBusiness(data: BookingEmailData): Promise<boolean> {
    if (!data.businessEmail) {
        console.log('[BookingEmails] No business email, skipping update to business');
        return false;
    }

    const templateId = process.env.SENDGRID_TEMPLATE_BOOKING_UPDATE_BUSINESS;

    // Use business timezone
    const businessTimezone = data.businessTimezone || 'UTC';
    const formattedDateTime = formatDateInTimezone(data.startTimeUtc, businessTimezone);

    return sendTemplateEmail({
        to: data.businessEmail,
        templateId: templateId || '',
        dynamicTemplateData: {
            customerName: data.customerName,
            dateTime: formattedDateTime,
            service: data.serviceName,
            location: data.location || '',
            bookingUrl: getBusinessCalendarUrl(),
        },
    });
}

export async function sendBookingUpdate(data: BookingEmailData): Promise<void> {
    await Promise.all([
        sendBookingUpdateToCustomer(data),
        sendBookingUpdateToBusiness(data),
    ]);
}

// ============================================
// BOOKING CANCELLATION EMAILS
// ============================================

export async function sendBookingCancellationToCustomer(data: BookingEmailData): Promise<boolean> {
    if (!data.customerEmail) {
        console.log('[BookingEmails] No customer email, skipping cancellation to customer');
        return false;
    }

    const templateId = process.env.SENDGRID_TEMPLATE_BOOKING_CANCELLATION_CUSTOMER;

    // Detect customer timezone from phone number
    const customerTimezone = data.customerPhone ? getTimezoneFromPhone(data.customerPhone) : 'UTC';
    const formattedDateTime = formatDateInTimezone(data.startTimeUtc, customerTimezone);

    return sendTemplateEmail({
        to: data.customerEmail,
        templateId: templateId || '',
        dynamicTemplateData: {
            business: data.businessName,
            dateTime: formattedDateTime,
            service: data.serviceName,
            bookingUrl: getCustomerBookingUrl(data.bookingId),
        },
    });
}

export async function sendBookingCancellationToBusiness(data: BookingEmailData): Promise<boolean> {
    if (!data.businessEmail) {
        console.log('[BookingEmails] No business email, skipping cancellation to business');
        return false;
    }

    const templateId = process.env.SENDGRID_TEMPLATE_BOOKING_CANCELLATION_BUSINESS;

    // Use business timezone
    const businessTimezone = data.businessTimezone || 'UTC';
    const formattedDateTime = formatDateInTimezone(data.startTimeUtc, businessTimezone);

    return sendTemplateEmail({
        to: data.businessEmail,
        templateId: templateId || '',
        dynamicTemplateData: {
            customerName: data.customerName,
            dateTime: formattedDateTime,
            service: data.serviceName,
            bookingUrl: getBusinessCalendarUrl(),
        },
    });
}

export async function sendBookingCancellation(data: BookingEmailData): Promise<void> {
    await Promise.all([
        sendBookingCancellationToCustomer(data),
        sendBookingCancellationToBusiness(data),
    ]);
}

// ============================================
// BOOKING REMINDER EMAILS
// ============================================

export async function sendBookingReminderToCustomer(data: BookingEmailData): Promise<boolean> {
    if (!data.customerEmail) {
        console.log('[BookingEmails] No customer email, skipping reminder to customer');
        return false;
    }

    const templateId = process.env.SENDGRID_TEMPLATE_BOOKING_REMINDER_CUSTOMER;

    // Detect customer timezone from phone number
    const customerTimezone = data.customerPhone ? getTimezoneFromPhone(data.customerPhone) : 'UTC';
    const formattedDateTime = formatDateInTimezone(data.startTimeUtc, customerTimezone);

    return sendTemplateEmail({
        to: data.customerEmail,
        templateId: templateId || '',
        dynamicTemplateData: {
            business: data.businessName,
            dateTime: formattedDateTime,
            service: data.serviceName,
            bookingUrl: getCustomerBookingUrl(data.bookingId),
        },
    });
}

export async function sendBookingReminderToBusiness(data: BookingEmailData): Promise<boolean> {
    if (!data.businessEmail) {
        console.log('[BookingEmails] No business email, skipping reminder to business');
        return false;
    }

    const templateId = process.env.SENDGRID_TEMPLATE_BOOKING_REMINDER_BUSINESS;

    // Use business timezone
    const businessTimezone = data.businessTimezone || 'UTC';
    const formattedDateTime = formatDateInTimezone(data.startTimeUtc, businessTimezone);

    return sendTemplateEmail({
        to: data.businessEmail,
        templateId: templateId || '',
        dynamicTemplateData: {
            customerName: data.customerName,
            dateTime: formattedDateTime,
            service: data.serviceName,
            bookingUrl: getBusinessCalendarUrl(),
        },
    });
}

export async function sendBookingReminder(data: BookingEmailData): Promise<void> {
    await Promise.all([
        sendBookingReminderToCustomer(data),
        sendBookingReminderToBusiness(data),
    ]);
}

// Export type for use in other files
export type { BookingEmailData };
