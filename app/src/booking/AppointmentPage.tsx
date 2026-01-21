import { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useAction, getBookingById, getAvailableSlots, reschedulePublicBooking, cancelPublicBooking } from "wasp/client/operations";
import { CheckCircle, Calendar as CalendarIcon, ArrowLeft, Download, Loader2, AlertTriangle, X, Clock, User } from "lucide-react";
import { format, startOfDay, addMinutes } from "date-fns";
import { cn } from "../client/utils";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { StyleConfig, parseStyleConfig, FONT_CSS, getButtonStyles, getContainerStyles } from "../shared/styleConfig";

// Format time with AM/PM
function formatTimeWithAMPM(time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Get base URL for appointment links
const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    return '';
};

export default function AppointmentPage() {
    const { bookingId } = useParams<{ bookingId: string }>();
    const navigate = useNavigate();
    const { data: booking, isLoading, error, refetch } = useQuery(getBookingById, { bookingId: bookingId || "" });

    // Use business/staff timezone for display (defaulting to UTC if not set)
    const businessTimezone = useMemo(() => (booking?.staff as any)?.timezone || 'UTC', [booking?.staff]);

    // Actions
    const rescheduleBookingAction = useAction(reschedulePublicBooking);
    const cancelBookingAction = useAction(cancelPublicBooking);

    // Modal states
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [rescheduleDate, setRescheduleDate] = useState<Date>(startOfDay(new Date()));
    const [rescheduleTime, setRescheduleTime] = useState<string | null>(null);
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    // Parse style config from provider
    const styleConfig = useMemo(() => parseStyleConfig((booking?.staff as any)?.styleConfig), [booking?.staff]);

    // Extract booking details
    const service = booking?.service;
    const staff = booking?.staff;
    const customer = booking?.customer;
    const business = staff?.business;
    const displayName = staff?.username || business?.name || "Service Provider";
    const displayImage = staff?.profileImageUrl || business?.logoUrl;

    // Get appointment URL
    const appointmentUrl = `${getBaseUrl()}/appointment/${bookingId}`;

    // Get booking time as string in business timezone
    const getBookingTimeString = () => {
        if (!booking?.startTimeUtc) return '';
        const date = new Date(booking.startTimeUtc);
        // Format in business timezone and extract time
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: businessTimezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        return formatter.format(date).replace(/^(\d{1,2}):(\d{2})$/, (_, h, m) =>
            `${h.padStart(2, '0')}:${m}`
        );
    };

    const getBookingEndTimeString = () => {
        if (!booking?.endTimeUtc) return '';
        const date = new Date(booking.endTimeUtc);
        // Format in business timezone and extract time
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: businessTimezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        return formatter.format(date).replace(/^(\d{1,2}):(\d{2})$/, (_, h, m) =>
            `${h.padStart(2, '0')}:${m}`
        );
    };

    // Calendar link generators
    const generateGoogleCalendarUrl = () => {
        if (!service || !booking?.startTimeUtc || !booking?.endTimeUtc) return '';
        const startDate = new Date(booking.startTimeUtc);
        const endDate = new Date(booking.endTimeUtc);

        const formatForGoogle = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        const title = encodeURIComponent(`${service.name} with ${business?.name}`);
        const details = encodeURIComponent(`Appointment booked via Morph Scheduling.\n\nService: ${service.name}\nDuration: ${service.duration} min\nPrice: $${service.price.toFixed(2)}\n\nView or manage your appointment:\n${appointmentUrl}`);

        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatForGoogle(startDate)}/${formatForGoogle(endDate)}&details=${details}`;
    };

    const downloadICalFile = () => {
        if (!service || !booking?.startTimeUtc || !booking?.endTimeUtc) return;
        const startDate = new Date(booking.startTimeUtc);
        const endDate = new Date(booking.endTimeUtc);

        const formatForICal = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '').slice(0, 15) + 'Z';
        const uid = `${booking.id}@morphscheduling.com`;

        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MorphScheduling//Booking//EN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatForICal(new Date())}
DTSTART:${formatForICal(startDate)}
DTEND:${formatForICal(endDate)}
SUMMARY:${service.name} with ${business?.name || displayName}
DESCRIPTION:Service: ${service.name}\\nDuration: ${service.duration} min\\nPrice: $${service.price.toFixed(2)}\\n\\nView or manage: ${appointmentUrl}
URL:${appointmentUrl}
END:VEVENT
END:VCALENDAR`;

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `appointment-${format(new Date(booking.startTimeUtc), 'yyyy-MM-dd')}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Handle reschedule
    const handleReschedule = async () => {
        if (!booking?.id || !rescheduleTime) return;
        setIsRescheduling(true);
        try {
            await rescheduleBookingAction({
                bookingId: booking.id,
                newDate: format(rescheduleDate, 'yyyy-MM-dd'),
                newTime: rescheduleTime,
                visitorTimezone: businessTimezone // Use business timezone
            });
            setShowRescheduleModal(false);
            setRescheduleTime(null);
            refetch();
        } catch (err: any) {
            alert("Reschedule failed: " + err.message);
        } finally {
            setIsRescheduling(false);
        }
    };

    // Handle cancel
    const handleCancel = async () => {
        if (!booking?.id) return;
        setIsCancelling(true);
        try {
            await cancelBookingAction({ bookingId: booking.id });
            setShowCancelModal(false);
            refetch();
        } catch (err: any) {
            alert("Cancellation failed: " + err.message);
        } finally {
            setIsCancelling(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
                <div className="flex items-center gap-3">
                    <Loader2 className="size-6 animate-spin" />
                    <span className="font-black uppercase tracking-widest">Loading appointment...</span>
                </div>
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
                <div className="text-center space-y-4 p-8 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <AlertTriangle className="size-12 mx-auto text-red-600" />
                    <h1 className="text-2xl font-black uppercase">Appointment Not Found</h1>
                    <p className="text-gray-600">This appointment may have been deleted or the link is invalid.</p>
                    <Link to="/" className="inline-block mt-4 px-6 py-3 bg-black text-white font-bold uppercase tracking-widest">
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

    const isCancelled = booking.status === 'cancelled';

    return (
        <div
            className="min-h-screen py-8 px-4"
            style={{
                background: styleConfig.background.type === 'gradient' && styleConfig.background.gradient
                    ? styleConfig.background.gradient
                    : styleConfig.background.color,
                fontFamily: styleConfig.font.family,
                ...FONT_CSS[styleConfig.font.family]
            }}
        >
            <div className="max-w-lg mx-auto">
                {/* Back Link */}
                {staff?.slug && (
                    <Link
                        to={`/book/${staff.slug}`}
                        className="inline-flex items-center gap-2 mb-6 text-sm font-bold uppercase tracking-wider transition-colors hover:opacity-70"
                        style={{ color: styleConfig.font.color }}
                    >
                        <ArrowLeft className="size-4" />
                        Schedule Another Appointment
                    </Link>
                )}

                {/* Main Card */}
                <div
                    className="overflow-hidden"
                    style={getContainerStyles(styleConfig)}
                >
                    {/* Header */}
                    <div className="p-8 text-center space-y-4 border-b" style={{ borderColor: `${styleConfig.font.color}15` }}>
                        {isCancelled ? (
                            <>
                                <div
                                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                                    style={{ backgroundColor: '#FEE2E2' }}
                                >
                                    <X className="w-10 h-10 text-red-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black uppercase tracking-tight" style={{ color: styleConfig.font.color }}>
                                        Appointment Cancelled
                                    </h1>
                                    <p className="text-sm font-medium opacity-70 mt-1" style={{ color: styleConfig.font.color }}>
                                        This appointment has been cancelled.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div
                                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg"
                                    style={{ backgroundColor: styleConfig.button.color }}
                                >
                                    <CheckCircle className="w-10 h-10" style={{ color: styleConfig.button.textColor }} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black uppercase tracking-tight" style={{ color: styleConfig.font.color }}>
                                        Appointment Confirmed
                                    </h1>
                                    <p className="text-sm font-medium opacity-70 mt-1" style={{ color: styleConfig.font.color }}>
                                        {customer?.name}, your appointment is confirmed!
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Appointment Details */}
                    <div className="p-6 space-y-6">
                        {/* Provider Info */}
                        <div className="flex items-center gap-4">
                            {displayImage ? (
                                <img src={displayImage} alt={displayName} className="size-14 rounded-full object-cover border-2" style={{ borderColor: styleConfig.font.color }} />
                            ) : (
                                <div className="size-14 rounded-full flex items-center justify-center border-2" style={{ borderColor: styleConfig.font.color, backgroundColor: `${styleConfig.font.color}10` }}>
                                    <User className="size-7" style={{ color: styleConfig.font.color }} />
                                </div>
                            )}
                            <div>
                                <p className="font-bold text-lg" style={{ color: styleConfig.font.color }}>{business.name}</p>
                                {business?.name && business.name !== displayName && (
                                    <p className="text-sm opacity-70" style={{ color: styleConfig.font.color }}>{business.phone}</p>
                                )}
                            </div>
                        </div>

                        {/* Service Details Card */}
                        <div
                            className="p-4 border-l-4"
                            style={{
                                backgroundColor: `${styleConfig.font.color}08`,
                                borderLeftColor: isCancelled ? '#DC2626' : styleConfig.button.color
                            }}
                        >
                            <p className="font-bold text-lg" style={{ color: styleConfig.font.color }}>
                                {service?.name}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-sm" style={{ color: styleConfig.font.color }}>
                                <CalendarIcon className="size-4 opacity-70" />
                                <span className="font-medium">
                                    {booking.startTimeUtc && format(new Date(booking.startTimeUtc), 'EEEE, MMMM do, yyyy')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-sm opacity-70" style={{ color: styleConfig.font.color }}>
                                <Clock className="size-4" />
                                <span>
                                    {formatTimeWithAMPM(getBookingTimeString())} - {formatTimeWithAMPM(getBookingEndTimeString())} ({businessTimezone.replace(/_/g, ' ')})
                                </span>
                            </div>
                            {service?.price && (
                                <p className="mt-2 text-sm font-bold" style={{ color: styleConfig.button.color }}>
                                    ${service.price.toFixed(2)}
                                </p>
                            )}
                        </div>

                        {!isCancelled && (
                            <>
                                {/* Calendar Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={downloadICalFile}
                                        className="flex-1 py-3 px-4 border-2 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:opacity-80"
                                        style={{
                                            borderColor: styleConfig.font.color,
                                            color: styleConfig.font.color,
                                            borderRadius: styleConfig.button.shape === 'pill' ? '9999px' : styleConfig.button.shape === 'rounded' ? '8px' : '0px'
                                        }}
                                    >
                                        <Download className="size-4" />
                                        iCal / Outlook
                                    </button>
                                    <a
                                        href={generateGoogleCalendarUrl()}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 py-3 px-4 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:opacity-80"
                                        style={getButtonStyles(styleConfig.button)}
                                    >
                                        <CalendarIcon className="size-4" />
                                        Google
                                    </a>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            if (booking?.startTimeUtc) {
                                                setRescheduleDate(startOfDay(new Date(booking.startTimeUtc)));
                                            }
                                            setShowRescheduleModal(true);
                                        }}
                                        className="flex-1 py-3 px-4 border-2 font-bold text-sm uppercase tracking-wider transition-all hover:opacity-80"
                                        style={{
                                            borderColor: `${styleConfig.font.color}40`,
                                            color: styleConfig.font.color,
                                            borderRadius: styleConfig.button.shape === 'pill' ? '9999px' : styleConfig.button.shape === 'rounded' ? '8px' : '0px'
                                        }}
                                    >
                                        Reschedule
                                    </button>
                                    <button
                                        onClick={() => setShowCancelModal(true)}
                                        className="flex-1 py-3 px-4 border-2 font-bold text-sm uppercase tracking-wider transition-all hover:opacity-80"
                                        style={{
                                            borderColor: `${styleConfig.font.color}40`,
                                            color: styleConfig.font.color,
                                            borderRadius: styleConfig.button.shape === 'pill' ? '9999px' : styleConfig.button.shape === 'rounded' ? '8px' : '0px'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Branding */}
                <div className="flex justify-center mt-8">
                    <Link to="/" className="bg-white border-2 border-black px-4 py-2 font-black uppercase tracking-widest text-[10px] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                        Powered by MorphScheduling
                    </Link>
                </div>
            </div>

            {/* Reschedule Modal */}
            {showRescheduleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div
                        className="w-full max-w-lg flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 overflow-hidden"
                        style={getContainerStyles(styleConfig)}
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: `${styleConfig.font.color}20` }}>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight" style={{ color: styleConfig.profile.titleColor }}>
                                    Reschedule Appointment
                                </h3>
                                <p className="text-sm opacity-70 mt-1" style={{ color: styleConfig.font.color }}>
                                    Select a new date and time
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowRescheduleModal(false);
                                    setRescheduleTime(null);
                                }}
                                className="p-2 hover:bg-black/5 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" style={{ color: styleConfig.font.color }} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="overflow-y-auto p-6 flex-1 bg-transparent space-y-6">
                            {/* Date Selection */}
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest mb-4 block" style={{ color: styleConfig.font.color }}>
                                    Select New Date
                                </label>
                                <div className="flex flex-col items-center w-full">
                                    <div className="p-0 bg-white">
                                        <DayPicker
                                            mode="single"
                                            selected={rescheduleDate}
                                            onSelect={(date) => {
                                                if (date) {
                                                    setRescheduleDate(date);
                                                    setRescheduleTime(null);
                                                }
                                            }}
                                            disabled={{ before: startOfDay(new Date()) }}
                                            classNames={{
                                                selected: `text-white`,
                                                chevron: "fill-black",
                                                day: "p-1",
                                            }}
                                            modifiersClassNames={{
                                                disabled: "bg-gray-200 text-gray-400 opacity-50 cursor-not-allowed",
                                                today: "font-black underline decoration-2 underline-offset-4",
                                            }}
                                            modifiersStyles={{
                                                selected: {
                                                    backgroundColor: styleConfig.button.color,
                                                    color: styleConfig.button.textColor,
                                                    borderRadius: styleConfig.button.shape === 'pill' ? '50%' : styleConfig.button.shape === 'rounded' ? '8px' : '0px',
                                                    fontWeight: 'bold',
                                                },
                                                today: {
                                                    textDecorationColor: styleConfig.button.color
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Time Slots */}
                            {staff?.slug && (
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest mb-4 block" style={{ color: styleConfig.font.color }}>
                                        Select New Time
                                    </label>
                                    <RescheduleTimeSlots
                                        slug={staff.slug}
                                        date={format(rescheduleDate, 'yyyy-MM-dd')}
                                        serviceId={service?.id}
                                        visitorTimezone={businessTimezone}
                                        selectedTime={rescheduleTime}
                                        onSelectTime={setRescheduleTime}
                                        styleConfig={styleConfig}
                                        businessTimezone={businessTimezone}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t bg-black/5" style={{ borderColor: `${styleConfig.font.color}10` }}>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowRescheduleModal(false);
                                        setRescheduleTime(null);
                                    }}
                                    className="flex-1 py-4 border-2 font-black uppercase tracking-widest transition-all"
                                    style={{
                                        borderColor: `${styleConfig.font.color}40`,
                                        color: styleConfig.font.color,
                                        borderRadius: styleConfig.button.shape === 'pill' ? '9999px' : styleConfig.button.shape === 'rounded' ? '8px' : '0px'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReschedule}
                                    disabled={!rescheduleTime || isRescheduling}
                                    className="flex-1 py-4 font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    style={getButtonStyles(styleConfig.button)}
                                >
                                    {isRescheduling ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        'Confirm Reschedule'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div
                        className="w-full max-w-sm animate-in zoom-in-95 duration-300"
                        style={getContainerStyles(styleConfig)}
                    >
                        {/* Modal Content */}
                        <div className="p-6 text-center space-y-4">
                            <div
                                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                                style={{ backgroundColor: '#FEE2E2' }}
                            >
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight" style={{ color: styleConfig.font.color }}>
                                    Cancel Appointment?
                                </h3>
                                <p className="text-sm opacity-70 mt-2" style={{ color: styleConfig.font.color }}>
                                    Are you sure you want to cancel this appointment? This action cannot be undone.
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-6 pt-0 flex gap-3">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 py-4 font-black uppercase tracking-widest transition-all"
                                style={getButtonStyles(styleConfig.button)}
                            >
                                Keep Appointment
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={isCancelling}
                                className="flex-1 py-4 border-2 font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                style={{
                                    borderColor: '#DC2626',
                                    color: '#DC2626',
                                    backgroundColor: 'transparent',
                                    borderRadius: styleConfig.button.shape === 'pill' ? '9999px' : styleConfig.button.shape === 'rounded' ? '8px' : '0px'
                                }}
                            >
                                {isCancelling ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Cancelling...
                                    </>
                                ) : (
                                    'Cancel Appointment'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper component for reschedule time slots
function RescheduleTimeSlots({
    slug,
    date,
    serviceId,
    visitorTimezone,
    selectedTime,
    onSelectTime,
    styleConfig,
    businessTimezone
}: {
    slug: string;
    date: string;
    serviceId?: string;
    visitorTimezone: string;
    selectedTime: string | null;
    onSelectTime: (time: string) => void;
    styleConfig: StyleConfig;
    businessTimezone: string;
}) {
    const { data: availableSlots, isLoading } = useQuery(
        getAvailableSlots,
        { slug, date, visitorTimezone, serviceId },
        { enabled: !!slug && !!date }
    );

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 py-4">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-600">
                        Fetching availability...
                    </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-12 bg-neutral-100 border-2 border-black animate-pulse" />)}
                </div>
            </div>
        );
    }

    if (!availableSlots || availableSlots.length === 0) {
        return (
            <div className="text-center py-10 bg-neutral-100 border-2 border-black border-dashed font-black uppercase tracking-widest text-xs opacity-50">
                No availability found
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Timezone indicator */}
            <div className="flex items-center justify-end gap-1.5 px-2 py-1 bg-gray-100 border border-black/20 rounded text-[10px] font-bold text-gray-600 w-fit ml-auto">
                <Clock className="size-3" />
                <span>{businessTimezone.replace(/_/g, ' ')}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {availableSlots.map((time) => (
                    <button
                        key={time}
                        onClick={() => onSelectTime(time)}
                        className={cn(
                            "py-4 font-black text-xl tracking-tighter transition-all flex items-center justify-center",
                            selectedTime === time ? "shadow-md scale-[1.02]" : "hover:opacity-80 border-2"
                        )}
                        style={{
                            ...(selectedTime === time
                                ? getButtonStyles(styleConfig.button)
                                : {
                                    backgroundColor: 'transparent',
                                    color: styleConfig.font.color,
                                    borderColor: `${styleConfig.font.color}30`,
                                    borderRadius: styleConfig.button.shape === 'pill' ? '9999px' : styleConfig.button.shape === 'rounded' ? '8px' : '0px',
                                }
                            )
                        }}
                    >
                        {formatTimeWithAMPM(time)}
                    </button>
                ))}
            </div>
        </div>
    );
}
