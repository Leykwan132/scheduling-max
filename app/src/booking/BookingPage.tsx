import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, getUserBySlug, getAvailableSlots, createPublicBooking } from "wasp/client/operations";
import { Phone, Clock, DollarSign, ArrowLeft, Calendar as CalendarIcon, X, CheckCircle, Instagram, Facebook, Globe, Mail, MapPin, ArrowRight } from "lucide-react";
import { format, startOfDay } from "date-fns";
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

// Format time with AM/PM
const formatTimeWithAMPM = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export default function BookingPage() {
    const { slug } = useParams<{ slug: string }>();
    const { data: user, isLoading, error } = useQuery(getUserBySlug, { slug: slug || "" });

    const [selectedService, setSelectedService] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [bookingStep, setBookingStep] = useState<'time' | 'details' | 'success'>('time');

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
        try {
            await createPublicBooking({
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
            setBookingStep('success');
        } catch (err: any) {
            alert("Booking failed: " + err.message);
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
            <div className="py-16 mb-12">
                <div className="max-w-2xl mx-auto px-4">
                    <div className="flex flex-col items-center text-center gap-6">
                        <div className="flex-shrink-0 relative">
                            {displayImage ? (
                                <div
                                    className={cn(
                                        "overflow-hidden bg-white mx-auto mb-4",
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
                                    style={{ borderColor: styleConfig.profile?.imageBorderColor || styleConfig.font.color }}
                                >
                                    <img src={displayImage} alt={displayName} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div
                                    className={cn(
                                        "flex items-center justify-center text-4xl font-black mx-auto mb-4",
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

                        <div className="flex-1 min-w-0">
                            {styleConfig.profile?.titleEnabled !== false && (
                                <h1
                                    className={cn(
                                        "font-black tracking-tighter mb-3",
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
                                        "font-medium mb-6 max-w-lg mx-auto leading-relaxed",
                                        styleConfig.profile?.bioSize === 'small' ? "text-xs" :
                                            styleConfig.profile?.bioSize === 'large' ? "text-lg" : "text-sm"
                                    )}
                                    style={{ color: styleConfig.profile.bioColor }}
                                >
                                    {user.bio}
                                </p>
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
            </div>



            <div className="max-w-2xl mx-auto px-4">
                {/* Services Grid */}
                <div>
                    <div className="flex items-center gap-4 mb-10">
                        <div className="h-px flex-1" style={{ backgroundColor: `${styleConfig.font.color}20` }} />
                        <h2
                            className="text-sm font-black uppercase tracking-[0.2em] whitespace-nowrap"
                            style={{ color: `${styleConfig.font.color}60` }}
                        >
                            Available Services
                        </h2>
                        <div className="h-px flex-1" style={{ backgroundColor: `${styleConfig.font.color}20` }} />
                    </div>

                    <div className="grid gap-4 grid-cols-1">
                        {services.length > 0 ? (
                            services.map((service: any) => (
                                <div
                                    key={service.id}
                                    className="group relative p-5 transition-all cursor-pointer hover:bg-black/[0.02]"
                                    style={{
                                        ...getContainerStyles(styleConfig),
                                        // Only apply specific hover effects or overrides if needed
                                    }}
                                    onClick={() => handleBookService(service)}
                                >
                                    <div className="flex justify-between items-center gap-4">
                                        <div style={{ color: styleConfig.font.color }}>
                                            <h3 className="text-lg font-bold mb-1">{service.name}</h3>
                                            <div className="text-sm opacity-70">
                                                {service.duration} min • ${service.price.toFixed(2)}
                                            </div>
                                            {service.description && (
                                                <p className="text-sm opacity-60 mt-2 line-clamp-2" style={{ color: styleConfig.profile.bioColor }}>{service.description}</p>
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
                            ))
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
                                                <div className="border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
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
                                                            chevron: "fill-black",
                                                            day: "p-1",
                                                        }}
                                                        modifiersClassNames={{
                                                            disabled: "bg-gray-200 text-gray-400 opacity-50 cursor-not-allowed",
                                                            selected: "bg-primary text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold rounded-none hover:bg-primary hover:text-black focus:bg-primary focus:text-black active:bg-primary active:text-black",
                                                            today: "font-black underline decoration-2 underline-offset-4 decoration-black",
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
                                                                "py-4 border-4 border-black font-black text-xl tracking-tighter transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1",
                                                                selectedTime === time
                                                                    ? "bg-black text-white"
                                                                    : "bg-white hover:bg-primary transition-colors text-black"
                                                            )}
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
                                    <div className="py-8 text-center space-y-6">
                                        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl" style={{ backgroundColor: styleConfig.button.color }}>
                                            <CheckCircle className="w-12 h-12" style={{ color: styleConfig.button.textColor }} />
                                        </div>
                                        <h3 className="text-3xl font-black uppercase tracking-tight" style={{ color: styleConfig.font.color }}>Booking Confirmed</h3>
                                        <p className="font-bold text-sm leading-relaxed max-w-xs mx-auto uppercase opacity-70" style={{ color: styleConfig.font.color }}>
                                            All set! See you on <span className="px-1" style={{ color: styleConfig.button.color }}>{format(selectedDate, 'MMM d')}</span> at <span className="px-1" style={{ color: styleConfig.button.color }}>{selectedTime && formatTimeWithAMPM(selectedTime)}</span>.
                                        </p>
                                        <div className="pt-8">
                                            <button
                                                onClick={() => setSelectedService(null)}
                                                className="w-full py-4 font-black uppercase tracking-widest transition-all"
                                                style={getButtonStyles(styleConfig.button)}
                                            >
                                                Close Window
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
                                            className="w-full py-5 font-black uppercase tracking-widest shadow-xl transition-all"
                                            style={getButtonStyles(styleConfig.button)}
                                        >
                                            Confirm Booking
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
                    <span className="text-sm font-black uppercase tracking-tighter italic">ScheduleMax</span>
                </Link>
            </div>

            <div className="md:hidden flex justify-center mt-12">
                <Link to="/" className="bg-white border-2 border-black px-4 py-2 font-black uppercase tracking-widest text-[10px] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all">
                    Powered by ScheduleMax
                </Link>
            </div>
        </div >
    );
}
