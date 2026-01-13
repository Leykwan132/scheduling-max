import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, getUserBySlug, getAvailableSlots, createPublicBooking } from "wasp/client/operations";
import { Phone, Clock, DollarSign, ArrowLeft, Calendar as CalendarIcon, X, CheckCircle, Instagram, Facebook, Globe, Mail, MapPin } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { cn } from "../client/utils";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

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
        <div className="min-h-screen bg-[#FDFDFD] pb-32">
            {/* Distinct Header Section */}
            <div className="bg-secondary/50 border-b-4 border-black py-16 mb-12">
                <div className="max-w-2xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                        <div className="flex-shrink-0 relative">
                            {displayImage ? (
                                <div className="w-28 h-28 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-white rounded-full">
                                    <img src={displayImage} alt={displayName} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="w-28 h-28 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-primary flex items-center justify-center text-4xl font-black rounded-full">
                                    {displayName[0]}
                                </div>
                            )}
                        </div>

                        <div className="text-center md:text-left flex-1 min-w-0">
                            <h1 className="text-2xl md:text-5xl font-black uppercase tracking-tighter text-black mb-3 italic">
                                {displayName}
                            </h1>
                            {user.bio && (
                                <p className="text-black/70 font-bold text-sm mb-6 max-w-lg leading-relaxed">{user.bio}</p>
                            )}

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                {business?.instagramUrl && business.isInstagramEnabled && (
                                    <a href={business.instagramUrl.startsWith('http') ? business.instagramUrl : `https://${business.instagramUrl}`} target="_blank" rel="noopener noreferrer"
                                        className="p-3 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                                        <Instagram className="size-5" />
                                    </a>
                                )}
                                {business?.tiktokUrl && business.isTikTokEnabled && (
                                    <a href={business.tiktokUrl.startsWith('http') ? business.tiktokUrl : `https://${business.tiktokUrl}`} target="_blank" rel="noopener noreferrer"
                                        className="p-3 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                                        <div className="size-5 flex items-center justify-center font-black text-[10px]">TT</div>
                                    </a>
                                )}
                                {business?.facebookUrl && business.isFacebookEnabled && (
                                    <a href={business.facebookUrl.startsWith('http') ? business.facebookUrl : `https://${business.facebookUrl}`} target="_blank" rel="noopener noreferrer"
                                        className="p-3 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                                        <Facebook className="size-5" />
                                    </a>
                                )}
                                {business?.websiteUrl && business.isWebsiteEnabled && (
                                    <a href={business.websiteUrl.startsWith('http') ? business.websiteUrl : `https://${business.websiteUrl}`} target="_blank" rel="noopener noreferrer"
                                        className="p-3 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                                        <Globe className="size-5" />
                                    </a>
                                )}
                                {business?.phone && business.isPhoneEnabled && (
                                    <a href={`tel:${business.phone.replace(/\D/g, "")}`}
                                        className="p-3 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                                        <Phone className="size-5" />
                                    </a>
                                )}
                                {business?.contactEmail && business.isContactEmailEnabled && (
                                    <a href={`mailto:${business.contactEmail}`}
                                        className="p-3 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                                        <Mail className="size-5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4">
                {/* Services Grid */}
                <div>
                    <div className="flex items-center gap-4 mb-10">
                        <div className="h-1 flex-1 bg-black/10" />
                        <h2 className="text-lg font-black uppercase tracking-[0.2em] text-black/40 whitespace-nowrap">
                            Available Services
                        </h2>
                        <div className="h-1 flex-1 bg-black/10" />
                    </div>

                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
                        {services.length > 0 ? (
                            services.map((service: any) => (
                                <div
                                    key={service.id}
                                    className="group relative bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer flex flex-col h-full"
                                    onClick={() => handleBookService(service)}
                                >
                                    <div className="absolute top-0 right-0 bg-primary text-black border-l-4 border-b-4 border-black px-3 py-1 font-black z-10 text-xs uppercase tracking-wider">
                                        {service.duration} MIN
                                    </div>

                                    <div className="p-6 pb-2 flex-grow">
                                        <h3 className="text-2xl md:text-3xl font-black uppercase leading-8 mb-3 break-words hyphens-auto group-hover:text-primary transition-colors">
                                            {service.name}
                                        </h3>
                                        <div className="text-xl font-black italic tracking-tighter text-black/40 mb-4">
                                            ${service.price.toFixed(2)}
                                        </div>
                                        {service.description && (
                                            <p className="text-sm font-bold text-gray-600 leading-relaxed line-clamp-4">
                                                {service.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="p-6 pt-0 mt-auto">
                                        <button className="w-full bg-black text-white border-2 border-transparent py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-black group-hover:border-black transition-all">
                                            Book Now <ArrowLeft className="w-4 h-4 rotate-180" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full border-4 border-black border-dashed p-12 text-center text-black/40 font-black uppercase tracking-widest">
                                No services available at this time.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Booking Modal - Neo-Brutalist Style */}
            {selectedService && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b-4 border-black flex items-center justify-between bg-white">
                            <div>
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter">{selectedService.name}</h3>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[10px] font-black bg-primary px-2 py-0.5 uppercase border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{selectedService.duration} MIN</span>
                                    <span className="text-[10px] font-black bg-secondary px-2 py-0.5 uppercase border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">${selectedService.price.toFixed(2)}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedService(null)}
                                className="p-2 border-2 border-black hover:bg-neutral-100 transition-colors"
                            >
                                <X className="w-6 h-6 stroke-[3]" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="overflow-y-auto p-6 flex-1 bg-[#FDFDFD]">
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
                                    <div className="p-4 bg-primary/10 border-4 border-black shadow-[4px_4px_0px_0px_rgba(312,100,78,0.2)] flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center">
                                                <CalendarIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase">{format(selectedDate, 'MMM d, yyyy')}</p>
                                                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">AT {selectedTime && formatTimeWithAMPM(selectedTime)}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setBookingStep('time')}
                                            className="text-[10px] font-black uppercase tracking-widest py-1 px-2 border-2 border-black bg-white hover:bg-neutral-50"
                                        >
                                            Change
                                        </button>
                                    </div>

                                    <div className="space-y-5">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block px-1">Full Name</label>
                                            <input
                                                required
                                                type="text"
                                                className="w-full px-4 py-3 bg-white border-4 border-black font-bold focus:outline-none focus:ring-4 focus:ring-primary/40"
                                                placeholder="YOUR NAME"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block px-1">Phone</label>
                                                <input
                                                    required
                                                    type="tel"
                                                    className="w-full px-4 py-3 bg-white border-4 border-black font-bold focus:outline-none focus:ring-4 focus:ring-primary/40"
                                                    placeholder="PHONE NUMBER"
                                                    value={formData.phone}
                                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block px-1">Email</label>
                                                <input
                                                    type="email"
                                                    className="w-full px-4 py-3 bg-white border-4 border-black font-bold focus:outline-none focus:ring-4 focus:ring-primary/40"
                                                    placeholder="EMAIL (OPTIONAL)"
                                                    value={formData.email}
                                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block px-1">Notes</label>
                                            <textarea
                                                rows={2}
                                                className="w-full px-4 py-3 bg-white border-4 border-black font-bold focus:outline-none focus:ring-4 focus:ring-primary/40 resize-none"
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
                                    <div className="w-20 h-20 bg-primary border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mx-auto mb-8">
                                        <CheckCircle className="w-12 h-12 stroke-[3]" />
                                    </div>
                                    <h3 className="text-3xl font-black uppercase italic tracking-tighter">Booking Confirmed</h3>
                                    <p className="text-black font-bold text-sm leading-relaxed max-w-xs mx-auto uppercase">
                                        All set! See you on <span className="bg-primary/30 px-1">{format(selectedDate, 'MMM d')}</span> at <span className="bg-primary/30 px-1">{selectedTime && formatTimeWithAMPM(selectedTime)}</span>.
                                    </p>
                                    <div className="pt-8">
                                        <button
                                            onClick={() => setSelectedService(null)}
                                            className="w-full py-4 bg-black text-white border-4 border-black font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                                        >
                                            Close Window
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        {bookingStep !== 'success' && (
                            <div className="p-6 border-t-4 border-black bg-neutral-100">
                                {bookingStep === 'time' && (
                                    <button
                                        disabled={!selectedTime}
                                        onClick={handleConfirmTime}
                                        className="w-full py-5 bg-black text-white border-4 border-black font-black uppercase tracking-widest shadow-[8px_8px_0px_0px_rgba(312,100,78,0.5)] disabled:bg-neutral-300 disabled:border-neutral-400 disabled:shadow-none disabled:text-neutral-500 transition-all active:translate-y-1 active:translate-x-1 active:shadow-none"
                                    >
                                        Next
                                    </button>
                                )}
                                {bookingStep === 'details' && (
                                    <button
                                        form="booking-form"
                                        type="submit"
                                        className="w-full py-5 bg-primary text-black border-4 border-black font-black uppercase tracking-widest shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 hover:translate-x-1 transition-all active:bg-primary/80"
                                    >
                                        Confirm Booking
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

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
        </div>
    );
}
