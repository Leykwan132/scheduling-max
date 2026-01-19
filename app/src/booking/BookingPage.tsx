import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useAction, getUserBySlug, getAvailableSlots, createPublicBooking, reschedulePublicBooking, cancelPublicBooking } from "wasp/client/operations";
import { Phone, Clock, DollarSign, ArrowLeft, Calendar as CalendarIcon, X, CheckCircle, Instagram, Facebook, Globe, Mail, MapPin, ArrowRight, Loader2, Download, AlertTriangle } from "lucide-react";
import { format, startOfDay, addMinutes } from "date-fns";
import { cn } from "../client/utils";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { StyleConfig, parseStyleConfig, FONT_CSS, getButtonStyles, getContainerStyles } from "../shared/styleConfig";

// Get visitor's timezone
const getVisitorTimezone = (): string => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
        return "UTC";
    }
};


export default function BookingPage() {
    const { slug } = useParams<{ slug: string }>();
    const { data: user, isLoading, error } = useQuery(getUserBySlug, { slug: slug || "" });

    // Actions
    const rescheduleBookingAction = useAction(reschedulePublicBooking);
    const cancelBookingAction = useAction(cancelPublicBooking);

    const [selectedService, setSelectedService] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [bookingStep, setBookingStep] = useState<'time' | 'details' | 'success'>('time');

    // New state for enhanced confirmation flow
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdBooking, setCreatedBooking] = useState<any>(null);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [rescheduleDate, setRescheduleDate] = useState<Date>(startOfDay(new Date()));
    const [rescheduleTime, setRescheduleTime] = useState<string | null>(null);
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    // Auto-detect visitor's timezone
    const visitorTimezone = useMemo(() => getVisitorTimezone(), []);

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        notes: ""
    });

    const { data: availableSlots, isLoading: isLoadingSlots, refetch: refetchSlots } = useQuery(
        getAvailableSlots,
        {
            slug: slug || "",
            date: format(selectedDate, 'yyyy-MM-dd'),
            visitorTimezone,
            serviceId: selectedService?.id
        },
        {
            enabled: !!selectedService && bookingStep === 'time',
            // Refetch when date changes to ensure fresh data
            refetchOnMount: 'always',
            staleTime: 0,
        }
    );

    // Parse style config from user - must be before early returns
    const styleConfig = useMemo(() => parseStyleConfig((user as any)?.styleConfig), [user]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-black font-black uppercase tracking-widest animate-pulse">Loading...</div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <div className="border-4 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-sm">
                    <h1 className="text-3xl font-black uppercase mb-4">Page Not Found</h1>
                    <p className="text-muted-foreground mb-8">This booking link is invalid or has expired.</p>
                    <Link
                        to="/"
                        className="inline-block bg-primary text-black border-2 border-black px-6 py-3 font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                    >
                        Go back home
                    </Link>
                </div>
            </div>
        );
    }

    const business = user.business;
    const services = user.services || [];
    const displayName = user.username || business?.name || "Service Provider";
    const displayImage = user.profileImageUrl || business?.logoUrl;
    const displayPhone = business?.phone;

    const handleBookService = (service: any) => {
        setSelectedService(service);
        setBookingStep('time');
        setSelectedTime(null);
    };

    const handleConfirmTime = () => {
        if (selectedTime) {
            setBookingStep('details');
        }
    };

    const handleFinalizeBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const booking = await createPublicBooking({
                slug: slug!,
                serviceId: selectedService.id,
                date: format(selectedDate, 'yyyy-MM-dd'),
                time: selectedTime!,
                clientName: formData.name,
                clientPhone: formData.phone,
                clientEmail: formData.email,
                notes: formData.notes,
                visitorTimezone
            });
            // Redirect to dedicated appointment page
            window.location.href = `/appointment/${booking.id}`;
        } catch (err: any) {
            alert("Booking failed: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calendar link generators
    const generateGoogleCalendarUrl = () => {
        if (!selectedService || !selectedDate || !selectedTime) return '';
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const startDate = new Date(selectedDate);
        startDate.setHours(hours, minutes, 0, 0);
        const endDate = addMinutes(startDate, selectedService.duration);

        const formatForGoogle = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        const title = encodeURIComponent(`${selectedService.name} with ${displayName}`);
        const details = encodeURIComponent(`Appointment booked via MorphScheduling.\n\nService: ${selectedService.name}\nDuration: ${selectedService.duration} min\nPrice: $${selectedService.price.toFixed(2)}`);

        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatForGoogle(startDate)}/${formatForGoogle(endDate)}&details=${details}`;
    };

    const downloadICalFile = () => {
        if (!selectedService || !selectedDate || !selectedTime) return;
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const startDate = new Date(selectedDate);
        startDate.setHours(hours, minutes, 0, 0);
        const endDate = addMinutes(startDate, selectedService.duration);

        const formatForICal = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '').slice(0, 15) + 'Z';
        const uid = `${createdBooking?.id || Date.now()}@morphscheduling.com`;

        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MorphScheduling//Booking//EN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatForICal(new Date())}
DTSTART:${formatForICal(startDate)}
DTEND:${formatForICal(endDate)}
SUMMARY:${selectedService.name} with ${displayName}
DESCRIPTION:Service: ${selectedService.name}\\nDuration: ${selectedService.duration} min\\nPrice: $${selectedService.price.toFixed(2)}
END:VEVENT
END:VCALENDAR`;

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `appointment-${format(selectedDate, 'yyyy-MM-dd')}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Handle reschedule
    const handleReschedule = async () => {
        if (!createdBooking?.id || !rescheduleTime) return;
        setIsRescheduling(true);
        try {
            await rescheduleBookingAction({
                bookingId: createdBooking.id,
                newDate: format(rescheduleDate, 'yyyy-MM-dd'),
                newTime: rescheduleTime,
                visitorTimezone
            });
            // Update local state
            setSelectedDate(rescheduleDate);
            setSelectedTime(rescheduleTime);
            setShowRescheduleModal(false);
            setRescheduleTime(null);
        } catch (err: any) {
            alert("Reschedule failed: " + err.message);
        } finally {
            setIsRescheduling(false);
        }
    };

    // Handle cancel
    const handleCancel = async () => {
        if (!createdBooking?.id) return;
        setIsCancelling(true);
        try {
            await cancelBookingAction({ bookingId: createdBooking.id });
            setShowCancelModal(false);
            setSelectedService(null);
            setBookingStep('time');
            setCreatedBooking(null);
        } catch (err: any) {
            alert("Cancellation failed: " + err.message);
        } finally {
            setIsCancelling(false);
        }
    };



    return (
        <div
            className="min-h-screen pb-32"
            style={{
                background: styleConfig.background.type === 'gradient' && styleConfig.background.gradient
                    ? styleConfig.background.gradient
                    : styleConfig.background.color,
                fontFamily: FONT_CSS[styleConfig.font.family].name,
                color: styleConfig.font.color
            }}
        >
            {/* Google Font Import */}
            <link rel="stylesheet" href={FONT_CSS[styleConfig.font.family].import} />

            {/* Distinct Header Section */}
            <div className="pt-16 pb-0 mb-8">
                <div className="max-w-2xl mx-auto px-4">
                    <div className="flex flex-col items-center text-center gap-8">
                        {styleConfig.profile?.imagePosition !== 'bottom' && (
                            <div className={cn("flex-shrink-0 relative", styleConfig.profile?.imageWidth === 'full' ? "w-full" : "")}>
                                {displayImage ? (
                                    <div
                                        className={cn(
                                            "overflow-hidden bg-white relative z-10 transition-all",
                                            // Width
                                            styleConfig.profile?.imageWidth === 'full' ? "w-full" : "mx-auto",
                                            // Size (for non-full width)
                                            styleConfig.profile?.imageWidth !== 'full' && (
                                                styleConfig.profile?.imageSize === 'small' ? "size-28" :
                                                    styleConfig.profile?.imageSize === 'large' ? "size-56" : "size-40"
                                            ),
                                            // Height for full width
                                            styleConfig.profile?.imageWidth === 'full' && (
                                                styleConfig.profile?.imageSize === 'small' ? "h-40" :
                                                    styleConfig.profile?.imageSize === 'large' ? "h-80" : "h-60"
                                            ),
                                            // Shape
                                            styleConfig.profile?.imageShape === 'square' ? "rounded-none" :
                                                styleConfig.profile?.imageShape === 'rounded' ? "rounded-3xl" : "rounded-full",
                                            // Border
                                            styleConfig.profile?.imageBorderWidth === 'none' ? "border-0" :
                                                styleConfig.profile?.imageBorderWidth === 'thin' ? "border-2" :
                                                    styleConfig.profile?.imageBorderWidth === 'thick' ? "border-8" : "border-4"
                                        )}
                                        style={{ borderColor: styleConfig.profile?.imageBorderColor || styleConfig.font.color }}
                                    >
                                        <img src={displayImage} alt={displayName} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div
                                        className={cn(
                                            "flex items-center justify-center text-4xl font-black mx-auto transition-all",
                                            // Size
                                            styleConfig.profile?.imageSize === 'small' ? "size-28" :
                                                styleConfig.profile?.imageSize === 'large' ? "size-56" : "size-40",
                                            // Shape
                                            styleConfig.profile?.imageShape === 'square' ? "rounded-none" :
                                                styleConfig.profile?.imageShape === 'rounded' ? "rounded-3xl" : "rounded-full",
                                            // Border
                                            styleConfig.profile?.imageBorderWidth === 'none' ? "border-0" :
                                                styleConfig.profile?.imageBorderWidth === 'thin' ? "border-2" :
                                                    styleConfig.profile?.imageBorderWidth === 'thick' ? "border-8" : "border-4"
                                        )}
                                        style={{ backgroundColor: styleConfig.button.color, borderColor: styleConfig.profile?.imageBorderColor || styleConfig.font.color, color: styleConfig.button.textColor }}
                                    >
                                        {displayName[0]}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-3 w-full">
                            {styleConfig.profile?.titleEnabled !== false && (
                                <h1
                                    className={cn(
                                        "font-black tracking-tighter transition-all",
                                        styleConfig.profile?.titleSize === 'small' ? "text-xl" :
                                            styleConfig.profile?.titleSize === 'medium' ? "text-3xl" :
                                                styleConfig.profile?.titleSize === 'large' ? "text-5xl" :
                                                    styleConfig.profile?.titleSize === 'xl' ? "text-7xl" : "text-4xl"
                                    )}
                                    style={{ color: styleConfig.profile.titleColor }}
                                >
                                    {displayName}
                                </h1>
                            )}
                            {styleConfig.profile?.subtitleEnabled !== false && user.bio && (
                                <p
                                    className={cn(
                                        "font-medium max-w-lg mx-auto leading-relaxed transition-all",
                                        styleConfig.profile?.bioSize === 'small' ? "text-xs" :
                                            styleConfig.profile?.bioSize === 'large' ? "text-lg" : "text-sm"
                                    )}
                                    style={{ color: styleConfig.profile.bioColor }}
                                >
                                    {user.bio}
                                </p>
                            )}
                        </div>

                        {/* Profile Image - Bottom Position (Below Bio) */}
                        {styleConfig.profile?.imagePosition === 'bottom' && (
                            <div className={cn("relative", styleConfig.profile?.imageWidth === 'full' ? "w-full" : "")}>
                                {displayImage ? (
                                    <div
                                        className={cn(
                                            "overflow-hidden bg-white relative z-10 transition-all",
                                            // Width
                                            styleConfig.profile?.imageWidth === 'full' ? "w-full" : "mx-auto",
                                            // Size (for non-full width)
                                            styleConfig.profile?.imageWidth !== 'full' && (
                                                styleConfig.profile?.imageSize === 'small' ? "size-28" :
                                                    styleConfig.profile?.imageSize === 'large' ? "size-56" : "size-40"
                                            ),
                                            // Height for full width
                                            styleConfig.profile?.imageWidth === 'full' && (
                                                styleConfig.profile?.imageSize === 'small' ? "h-40" :
                                                    styleConfig.profile?.imageSize === 'large' ? "h-80" : "h-60"
                                            ),
                                            // Shape
                                            styleConfig.profile?.imageShape === 'square' ? "rounded-none" :
                                                styleConfig.profile?.imageShape === 'rounded' ? "rounded-3xl" : "rounded-full",
                                            // Border
                                            styleConfig.profile?.imageBorderWidth === 'none' ? "border-0" :
                                                styleConfig.profile?.imageBorderWidth === 'thin' ? "border-2" :
                                                    styleConfig.profile?.imageBorderWidth === 'thick' ? "border-8" : "border-4"
                                        )}
                                        style={{ borderColor: styleConfig.profile?.imageBorderColor || styleConfig.font.color }}
                                    >
                                        <img src={displayImage} alt={displayName} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div
                                        className={cn(
                                            "flex items-center justify-center text-4xl font-black mx-auto transition-all",
                                            // Size
                                            styleConfig.profile?.imageSize === 'small' ? "size-28" :
                                                styleConfig.profile?.imageSize === 'large' ? "size-56" : "size-40",
                                            // Shape
                                            styleConfig.profile?.imageShape === 'square' ? "rounded-none" :
                                                styleConfig.profile?.imageShape === 'rounded' ? "rounded-3xl" : "rounded-full",
                                            // Border
                                            styleConfig.profile?.imageBorderWidth === 'none' ? "border-0" :
                                                styleConfig.profile?.imageBorderWidth === 'thin' ? "border-2" :
                                                    styleConfig.profile?.imageBorderWidth === 'thick' ? "border-8" : "border-4"
                                        )}
                                        style={{ backgroundColor: styleConfig.button.color, borderColor: styleConfig.profile?.imageBorderColor || styleConfig.font.color, color: styleConfig.button.textColor }}
                                    >
                                        {displayName[0]}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Social Links (Top) */}
                        {styleConfig.profile?.socialEnabled !== false && styleConfig.profile?.socialPosition !== 'bottom' && (
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                {business?.instagramUrl && business.isInstagramEnabled && (
                                    <a href={business.instagramUrl.startsWith('http') ? business.instagramUrl : `https://${business.instagramUrl}`} target="_blank" rel="noopener noreferrer"
                                        className="p-3 bg-white/90 backdrop-blur transition-all hover:scale-105"
                                        style={getButtonStyles({ ...styleConfig.button, ...(styleConfig.socialButton || {}) })}>
                                        <Instagram className="size-5" style={{ color: styleConfig.socialButton?.textColor || styleConfig.button.textColor }} />
                                    </a>
                                )}
                                {business?.tiktokUrl && business.isTikTokEnabled && (
                                    <a href={business.tiktokUrl.startsWith('http') ? business.tiktokUrl : `https://${business.tiktokUrl}`} target="_blank" rel="noopener noreferrer"
                                        className="p-3 bg-white/90 backdrop-blur transition-all hover:scale-105"
                                        style={getButtonStyles({ ...styleConfig.button, ...(styleConfig.socialButton || {}) })}>
                                        <div className="size-5 flex items-center justify-center font-black text-[10px]" style={{ color: styleConfig.socialButton?.textColor || styleConfig.button.textColor }}>TT</div>
                                    </a>
                                )}
                                {business?.facebookUrl && business.isFacebookEnabled && (
                                    <a href={business.facebookUrl.startsWith('http') ? business.facebookUrl : `https://${business.facebookUrl}`} target="_blank" rel="noopener noreferrer"
                                        className="p-3 bg-white/90 backdrop-blur transition-all hover:scale-105"
                                        style={getButtonStyles({ ...styleConfig.button, ...(styleConfig.socialButton || {}) })}>
                                        <Facebook className="size-5" style={{ color: styleConfig.socialButton?.textColor || styleConfig.button.textColor }} />
                                    </a>
                                )}
                                {business?.websiteUrl && business.isWebsiteEnabled && (
                                    <a href={business.websiteUrl.startsWith('http') ? business.websiteUrl : `https://${business.websiteUrl}`} target="_blank" rel="noopener noreferrer"
                                        className="p-3 bg-white/90 backdrop-blur transition-all hover:scale-105"
                                        style={getButtonStyles({ ...styleConfig.button, ...(styleConfig.socialButton || {}) })}>
                                        <Globe className="size-5" style={{ color: styleConfig.socialButton?.textColor || styleConfig.button.textColor }} />
                                    </a>
                                )}
                                {business?.phone && business.isPhoneEnabled && (
                                    <a href={`tel:${business.phone.replace(/\D/g, "")}`}
                                        className="p-3 bg-white/90 backdrop-blur transition-all hover:scale-105"
                                        style={getButtonStyles({ ...styleConfig.button, ...(styleConfig.socialButton || {}) })}>
                                        <Phone className="size-5" style={{ color: styleConfig.socialButton?.textColor || styleConfig.button.textColor }} />
                                    </a>
                                )}
                                {business?.contactEmail && business.isContactEmailEnabled && (
                                    <a href={`mailto:${business.contactEmail}`}
                                        className="p-3 bg-white/90 backdrop-blur transition-all hover:scale-105"
                                        style={getButtonStyles({ ...styleConfig.button, ...(styleConfig.socialButton || {}) })}>
                                        <Mail className="size-5" style={{ color: styleConfig.socialButton?.textColor || styleConfig.button.textColor }} />
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>



            <div className="max-w-2xl mx-auto px-4">
                {/* Services Grid */}
                <div>
                    {services.length > 0 ? (
                        styleConfig.displayByCategory ? (
                            // Group services by category
                            (() => {
                                // Create category groups
                                const grouped: Record<string, typeof services> = {};
                                const uncategorized: typeof services = [];

                                services.forEach((service: any) => {
                                    if (service.category?.name) {
                                        if (!grouped[service.category.name]) {
                                            grouped[service.category.name] = [];
                                        }
                                        grouped[service.category.name].push(service);
                                    } else {
                                        uncategorized.push(service);
                                    }
                                });

                                // Sort category names alphabetically
                                const sortedCategories = Object.keys(grouped).sort();

                                return (
                                    <div className="space-y-8">
                                        {sortedCategories.map((categoryName) => (
                                            <div key={categoryName}>
                                                <h2
                                                    className="text-lg font-black uppercase tracking-wider mb-4"
                                                    style={{ color: styleConfig.font.color }}
                                                >
                                                    {categoryName}
                                                </h2>
                                                <div className="grid gap-4 grid-cols-1">
                                                    {grouped[categoryName].map((service: any) => (
                                                        <div
                                                            key={service.id}
                                                            className="group relative p-5 transition-all cursor-pointer hover:bg-black/[0.02]"
                                                            style={{
                                                                ...getContainerStyles(styleConfig),
                                                            }}
                                                            onClick={() => handleBookService(service)}
                                                        >
                                                            <div className="flex justify-between items-center gap-4">
                                                                <div style={{ color: styleConfig.font.color }}>
                                                                    <h3 className="text-lg font-bold mb-1">{service.name}</h3>
                                                                    {styleConfig.serviceButton?.enabled && (
                                                                        <div className="text-sm opacity-70">
                                                                            {service.duration} min • ${service.price.toFixed(2)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {styleConfig.serviceButton?.enabled ? (
                                                                    <div
                                                                        className="px-6 py-2.5 text-xs font-black uppercase tracking-wider whitespace-nowrap shadow-sm transition-transform group-hover:scale-105"
                                                                        style={{
                                                                            backgroundColor: styleConfig.serviceButton.color || styleConfig.button.color,
                                                                            color: styleConfig.serviceButton.textColor || styleConfig.button.textColor,
                                                                            borderRadius: styleConfig.button.shape === 'pill' ? '999px' : styleConfig.button.shape === 'rounded' ? '8px' : '0px',
                                                                        }}
                                                                    >
                                                                        {styleConfig.serviceButton.text}
                                                                    </div>
                                                                ) : (
                                                                    <ArrowRight className="size-5 flex-shrink-0 ml-4 transition-transform group-hover:translate-x-1" style={{ color: styleConfig.font.color }} />
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        {/* Uncategorized services */}
                                        {uncategorized.length > 0 && (
                                            <div>
                                                {sortedCategories.length > 0 && (
                                                    <h2
                                                        className="text-lg font-black uppercase tracking-wider mb-4 opacity-60"
                                                        style={{ color: styleConfig.font.color }}
                                                    >
                                                        Other
                                                    </h2>
                                                )}
                                                <div className="grid gap-4 grid-cols-1">
                                                    {uncategorized.map((service: any) => (
                                                        <div
                                                            key={service.id}
                                                            className="group relative p-5 transition-all cursor-pointer hover:bg-black/[0.02]"
                                                            style={{
                                                                ...getContainerStyles(styleConfig),
                                                            }}
                                                            onClick={() => handleBookService(service)}
                                                        >
                                                            <div className="flex justify-between items-center gap-4">
                                                                <div style={{ color: styleConfig.font.color }}>
                                                                    <h3 className="text-lg font-bold mb-1">{service.name}</h3>
                                                                    {styleConfig.serviceButton?.enabled && (
                                                                        <div className="text-sm opacity-70">
                                                                            {service.duration} min • ${service.price.toFixed(2)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {styleConfig.serviceButton?.enabled ? (
                                                                    <div
                                                                        className="px-6 py-2.5 text-xs font-black uppercase tracking-wider whitespace-nowrap shadow-sm transition-transform group-hover:scale-105"
                                                                        style={{
                                                                            backgroundColor: styleConfig.serviceButton.color || styleConfig.button.color,
                                                                            color: styleConfig.serviceButton.textColor || styleConfig.button.textColor,
                                                                            borderRadius: styleConfig.button.shape === 'pill' ? '999px' : styleConfig.button.shape === 'rounded' ? '8px' : '0px',
                                                                        }}
                                                                    >
                                                                        {styleConfig.serviceButton.text}
                                                                    </div>
                                                                ) : (
                                                                    <ArrowRight className="size-5 flex-shrink-0 ml-4 transition-transform group-hover:translate-x-1" style={{ color: styleConfig.font.color }} />
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()
                        ) : (
                            // Flat list (no grouping)
                            <div className="grid gap-4 grid-cols-1">
                                {services.map((service: any) => (
                                    <div
                                        key={service.id}
                                        className="group relative p-5 transition-all cursor-pointer hover:bg-black/[0.02]"
                                        style={{
                                            ...getContainerStyles(styleConfig),
                                        }}
                                        onClick={() => handleBookService(service)}
                                    >
                                        <div className="flex justify-between items-center gap-4">
                                            <div style={{ color: styleConfig.font.color }}>
                                                <h3 className="text-lg font-bold mb-1">{service.name}</h3>
                                                {styleConfig.serviceButton?.enabled && (
                                                    <div className="text-sm opacity-70">
                                                        {service.duration} min • ${service.price.toFixed(2)}
                                                    </div>
                                                )}
                                            </div>
                                            {styleConfig.serviceButton?.enabled ? (
                                                <div
                                                    className="px-6 py-2.5 text-xs font-black uppercase tracking-wider whitespace-nowrap shadow-sm transition-transform group-hover:scale-105"
                                                    style={{
                                                        backgroundColor: styleConfig.serviceButton.color || styleConfig.button.color,
                                                        color: styleConfig.serviceButton.textColor || styleConfig.button.textColor,
                                                        borderRadius: styleConfig.button.shape === 'pill' ? '999px' : styleConfig.button.shape === 'rounded' ? '8px' : '0px',
                                                    }}
                                                >
                                                    {styleConfig.serviceButton.text}
                                                </div>
                                            ) : (
                                                <ArrowRight className="size-5 flex-shrink-0 ml-4 transition-transform group-hover:translate-x-1" style={{ color: styleConfig.font.color }} />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        <div
                            className="border-2 border-dashed p-12 text-center font-bold uppercase tracking-widest opacity-50"
                            style={{ borderColor: styleConfig.font.color, color: styleConfig.font.color }}
                        >
                            No services available at this time.
                        </div>
                    )}
                </div>
            </div>

            {/* Social Links (Bottom) - Below Services */}
            {styleConfig.profile?.socialEnabled !== false && styleConfig.profile?.socialPosition === 'bottom' && (
                <div className="max-w-2xl mx-auto px-4 mt-12 mb-8">
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        {business?.instagramUrl && business.isInstagramEnabled && (
                            <a href={business.instagramUrl.startsWith('http') ? business.instagramUrl : `https://${business.instagramUrl}`} target="_blank" rel="noopener noreferrer"
                                className="p-3 bg-white/90 backdrop-blur transition-all hover:scale-105"
                                style={getButtonStyles({ ...styleConfig.button, ...(styleConfig.socialButton || {}) })}>
                                <Instagram className="size-5" style={{ color: styleConfig.socialButton?.textColor || styleConfig.button.textColor }} />
                            </a>
                        )}
                        {business?.tiktokUrl && business.isTikTokEnabled && (
                            <a href={business.tiktokUrl.startsWith('http') ? business.tiktokUrl : `https://${business.tiktokUrl}`} target="_blank" rel="noopener noreferrer"
                                className="p-3 bg-white/90 backdrop-blur transition-all hover:scale-105"
                                style={getButtonStyles({ ...styleConfig.button, ...(styleConfig.socialButton || {}) })}>
                                <div className="size-5 flex items-center justify-center font-black text-[10px]" style={{ color: styleConfig.socialButton?.textColor || styleConfig.button.textColor }}>TT</div>
                            </a>
                        )}
                        {business?.facebookUrl && business.isFacebookEnabled && (
                            <a href={business.facebookUrl.startsWith('http') ? business.facebookUrl : `https://${business.facebookUrl}`} target="_blank" rel="noopener noreferrer"
                                className="p-3 bg-white/90 backdrop-blur transition-all hover:scale-105"
                                style={getButtonStyles({ ...styleConfig.button, ...(styleConfig.socialButton || {}) })}>
                                <Facebook className="size-5" style={{ color: styleConfig.socialButton?.textColor || styleConfig.button.textColor }} />
                            </a>
                        )}
                        {business?.websiteUrl && business.isWebsiteEnabled && (
                            <a href={business.websiteUrl.startsWith('http') ? business.websiteUrl : `https://${business.websiteUrl}`} target="_blank" rel="noopener noreferrer"
                                className="p-3 bg-white/90 backdrop-blur transition-all hover:scale-105"
                                style={getButtonStyles({ ...styleConfig.button, ...(styleConfig.socialButton || {}) })}>
                                <Globe className="size-5" style={{ color: styleConfig.socialButton?.textColor || styleConfig.button.textColor }} />
                            </a>
                        )}
                        {business?.phone && business.isPhoneEnabled && (
                            <a href={`tel:${business.phone.replace(/\D/g, "")}`}
                                className="p-3 bg-white/90 backdrop-blur transition-all hover:scale-105"
                                style={getButtonStyles({ ...styleConfig.button, ...(styleConfig.socialButton || {}) })}>
                                <Phone className="size-5" style={{ color: styleConfig.socialButton?.textColor || styleConfig.button.textColor }} />
                            </a>
                        )}
                        {business?.contactEmail && business.isContactEmailEnabled && (
                            <a href={`mailto:${business.contactEmail}`}
                                className="p-3 bg-white/90 backdrop-blur transition-all hover:scale-105"
                                style={getButtonStyles({ ...styleConfig.button, ...(styleConfig.socialButton || {}) })}>
                                <Mail className="size-5" style={{ color: styleConfig.socialButton?.textColor || styleConfig.button.textColor }} />
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* Booking Modal - Neo-Brutalist Style */}
            {
                selectedService && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                        <div
                            className="w-full max-w-lg flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 overflow-hidden"
                            style={getContainerStyles(styleConfig)}
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: `${styleConfig.font.color}20` }}>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight" style={{ color: styleConfig.profile.titleColor }}>{selectedService.name}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: `${styleConfig.button.color}20`, color: styleConfig.button.color }}>{selectedService.duration} MIN</span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: `${styleConfig.font.color}10`, color: styleConfig.font.color }}>${selectedService.price.toFixed(2)}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedService(null)}
                                    className="p-2 hover:bg-black/5 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6" style={{ color: styleConfig.font.color }} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="overflow-y-auto p-6 flex-1 bg-transparent">
                                {bookingStep === 'time' && (
                                    <div className="space-y-8">
                                        {/* Date Selection */}
                                        <div>
                                            <label className="text-xs font-black uppercase tracking-widest text-black mb-4 block underline decoration-primary decoration-4 underline-offset-4">Select Date</label>
                                            <div className="flex flex-col items-center w-full">
                                                <div className="p-0 bg-white lg:scale-125 lg:origin-top lg:mb-20 transition-all">
                                                    <DayPicker
                                                        mode="single"
                                                        selected={selectedDate}
                                                        onSelect={(date) => {
                                                            if (date) {
                                                                setSelectedDate(date);
                                                                setSelectedTime(null);
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
                                                                border: 'none',
                                                                outline: 'none'
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
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <label className="text-xs font-black uppercase tracking-widest text-black underline decoration-primary decoration-4 underline-offset-4">Select Time</label>
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 border border-black/20 rounded text-[10px] font-bold text-gray-600">
                                                    <MapPin className="size-3" />
                                                    <span>{visitorTimezone.replace(/_/g, ' ')}</span>
                                                </div>
                                            </div>
                                            {isLoadingSlots ? (
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
                                            ) : availableSlots && availableSlots.length > 0 ? (
                                                <div className="grid grid-cols-3 gap-3">
                                                    {availableSlots.map((time) => (
                                                        <button
                                                            key={time}
                                                            onClick={() => setSelectedTime(time)}
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
                                                                        borderColor: `${styleConfig.font.color}30`, // Light border
                                                                        borderRadius: styleConfig.button.shape === 'pill' ? '9999px' : styleConfig.button.shape === 'rounded' ? '8px' : '0px',
                                                                    }
                                                                )
                                                            }}
                                                        >
                                                            {formatTimeWithAMPM(time)}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-10 bg-neutral-100 border-2 border-black border-dashed font-black uppercase tracking-widest text-xs opacity-50">
                                                    No availability found
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {bookingStep === 'details' && (
                                    <form id="booking-form" onSubmit={handleFinalizeBooking} className="space-y-6">
                                        <div className="p-4 border-2 flex items-center justify-between mb-8" style={{ ...getContainerStyles(styleConfig), boxShadow: 'none' }}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 flex items-center justify-center rounded-lg" style={{ backgroundColor: `${styleConfig.button.color}20` }}>
                                                    <CalendarIcon className="w-5 h-5" style={{ color: styleConfig.button.color }} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black uppercase" style={{ color: styleConfig.font.color }}>{format(selectedDate, 'MMM d, yyyy')}</p>
                                                    <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest" style={{ color: styleConfig.font.color }}>AT {selectedTime && formatTimeWithAMPM(selectedTime)}</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setBookingStep('time')}
                                                className="text-[10px] font-black uppercase tracking-widest py-1.5 px-3 rounded-md transition-colors"
                                                style={{ backgroundColor: `${styleConfig.font.color}10`, color: styleConfig.font.color }}
                                            >
                                                Change
                                            </button>
                                        </div>

                                        <div className="space-y-5">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block px-1 opacity-60" style={{ color: styleConfig.font.color }}>Full Name</label>
                                                <input
                                                    required
                                                    type="text"
                                                    className="w-full px-4 py-3 border-2 rounded-xl font-bold focus:outline-none transition-all bg-transparent"
                                                    style={{ borderColor: `${styleConfig.font.color}40`, color: styleConfig.font.color }}
                                                    placeholder="YOUR NAME"
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block px-1 opacity-60" style={{ color: styleConfig.font.color }}>Phone</label>
                                                    <input
                                                        required
                                                        type="tel"
                                                        className="w-full px-4 py-3 border-2 rounded-xl font-bold focus:outline-none transition-all bg-transparent"
                                                        style={{ borderColor: `${styleConfig.font.color}40`, color: styleConfig.font.color }}
                                                        placeholder="PHONE NUMBER"
                                                        value={formData.phone}
                                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block px-1 opacity-60" style={{ color: styleConfig.font.color }}>Email</label>
                                                    <input
                                                        type="email"
                                                        className="w-full px-4 py-3 border-2 rounded-xl font-bold focus:outline-none transition-all bg-transparent"
                                                        style={{ borderColor: `${styleConfig.font.color}40`, color: styleConfig.font.color }}
                                                        placeholder="EMAIL (OPTIONAL)"
                                                        value={formData.email}
                                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block px-1 opacity-60" style={{ color: styleConfig.font.color }}>Notes</label>
                                                <textarea
                                                    rows={2}
                                                    className="w-full px-4 py-3 border-2 rounded-xl font-bold focus:outline-none transition-all resize-none bg-transparent"
                                                    style={{ borderColor: `${styleConfig.font.color}40`, color: styleConfig.font.color }}
                                                    placeholder="ANY SPECIAL REQUESTS?"
                                                    value={formData.notes}
                                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </form>
                                )}

                                {bookingStep === 'success' && (
                                    <div className="py-4 space-y-6">
                                        {/* Back Link */}
                                        <button
                                            onClick={() => {
                                                setSelectedService(null);
                                                setBookingStep('time');
                                                setCreatedBooking(null);
                                                setFormData({ name: '', phone: '', email: '', notes: '' });
                                            }}
                                            className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors hover:opacity-70"
                                            style={{ color: styleConfig.font.color }}
                                        >
                                            <ArrowLeft className="size-4" />
                                            Schedule Another Appointment
                                        </button>

                                        {/* Success Header */}
                                        <div className="text-center space-y-4 pt-4">
                                            <div
                                                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg animate-in zoom-in duration-500"
                                                style={{ backgroundColor: styleConfig.button.color }}
                                            >
                                                <CheckCircle className="w-10 h-10" style={{ color: styleConfig.button.textColor }} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black uppercase tracking-tight" style={{ color: styleConfig.font.color }}>
                                                    Appointment Confirmed
                                                </h3>
                                                <p className="text-sm font-medium opacity-70 mt-1" style={{ color: styleConfig.font.color }}>
                                                    {formData.name}, your appointment is confirmed!
                                                </p>
                                            </div>
                                        </div>

                                        {/* Appointment Details Card */}
                                        <div
                                            className="p-4 border-l-4"
                                            style={{
                                                backgroundColor: `${styleConfig.font.color}08`,
                                                borderLeftColor: styleConfig.button.color
                                            }}
                                        >
                                            <p className="font-bold" style={{ color: styleConfig.font.color }}>
                                                {selectedService?.name} with {displayName}
                                            </p>
                                            <p className="text-sm font-medium mt-1" style={{ color: styleConfig.font.color }}>
                                                {format(selectedDate, 'EEEE, MMMM do, yyyy')}
                                            </p>
                                            <p className="text-sm font-medium opacity-70" style={{ color: styleConfig.font.color }}>
                                                {selectedTime && formatTimeWithAMPM(selectedTime)} - {selectedTime && formatTimeWithAMPM(
                                                    (() => {
                                                        const [h, m] = selectedTime.split(':').map(Number);
                                                        const endMinutes = h * 60 + m + (selectedService?.duration || 30);
                                                        return `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;
                                                    })()
                                                )} {visitorTimezone.replace(/_/g, ' ')}
                                            </p>
                                        </div>

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
                                                Add to iCal / Outlook
                                            </button>
                                            <a
                                                href={generateGoogleCalendarUrl()}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 py-3 px-4 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:opacity-80"
                                                style={getButtonStyles(styleConfig.button)}
                                            >
                                                <CalendarIcon className="size-4" />
                                                Add to Google
                                            </a>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3 pt-2">
                                            <button
                                                onClick={() => {
                                                    setRescheduleDate(selectedDate);
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
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            {bookingStep !== 'success' && (
                                <div className="p-6 border-t bg-black/5" style={{ borderColor: `${styleConfig.font.color}10` }}>
                                    {bookingStep === 'time' && (
                                        <button
                                            disabled={!selectedTime}
                                            onClick={handleConfirmTime}
                                            className="w-full py-5 font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                            style={getButtonStyles(styleConfig.button)}
                                        >
                                            Next step
                                        </button>
                                    )}
                                    {bookingStep === 'details' && (
                                        <button
                                            form="booking-form"
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full py-5 font-black uppercase tracking-widest shadow-xl transition-all disabled:opacity-70 flex items-center justify-center gap-3"
                                            style={getButtonStyles(styleConfig.button)}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="size-5 animate-spin" />
                                                    Confirming...
                                                </>
                                            ) : (
                                                'Confirm Booking'
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Branding - Neo-Brutalist Sticker */}
            <div className="fixed bottom-8 left-8 hidden md:block">
                <Link to="/" className="inline-block bg-white border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(312,100,78,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block -mb-1">Powered by</span>
                    <span className="text-sm font-black uppercase tracking-tighter italic">Morph Scheduling</span>
                </Link>
            </div>

            {/* Reschedule Modal */}
            {showRescheduleModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
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
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest mb-4 block" style={{ color: styleConfig.font.color }}>
                                    Select New Time
                                </label>
                                <RescheduleTimeSlots
                                    slug={slug || ''}
                                    date={format(rescheduleDate, 'yyyy-MM-dd')}
                                    serviceId={selectedService?.id}
                                    visitorTimezone={visitorTimezone}
                                    selectedTime={rescheduleTime}
                                    onSelectTime={setRescheduleTime}
                                    styleConfig={styleConfig}
                                />
                            </div>
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
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
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

            {/* Branding - Neo-Brutalist Sticker */}
            <div className="fixed bottom-8 left-8 hidden md:block">
                <Link to="/" className="inline-block bg-white border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(312,100,78,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block -mb-1">Powered by</span>
                    <span className="text-sm font-black uppercase tracking-tighter italic">MorphScheduling</span>
                </Link>
            </div>

            <div className="md:hidden flex justify-center mt-12">
                <Link to="/" className="bg-white border-2 border-black px-4 py-2 font-black uppercase tracking-widest text-[10px] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all">
                    Powered by Morph Scheduling
                </Link>
            </div>
        </div >
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
    styleConfig
}: {
    slug: string;
    date: string;
    serviceId?: string;
    visitorTimezone: string;
    selectedTime: string | null;
    onSelectTime: (time: string) => void;
    styleConfig: StyleConfig;
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
    );
}

// Helper function (needs to be accessible at module level for the helper component)
function formatTimeWithAMPM(time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}
