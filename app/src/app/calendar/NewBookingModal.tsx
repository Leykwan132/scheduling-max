import { useState, useEffect } from "react";
import { X, Calendar, User, Scissors, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../client/utils";

interface Service {
    id: string;
    name: string;
    duration: number;
    price: number;
}

interface Staff {
    id: string;
    name: string;
}

interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
}


interface NewBookingModalProps {
    services: Service[];
    staff: Staff[];
    customers?: Customer[];
    onClose: () => void;
    onSubmit: (booking: any) => void;
    onDelete?: (bookingId: string) => void;
    initialData?: any;
    bookingId?: string;
}

const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
];

export default function NewBookingModal({ services, staff, customers = [], onClose, onSubmit, onDelete, initialData, bookingId }: NewBookingModalProps) {
    const [formData, setFormData] = useState({
        clientName: "",
        clientPhone: "",
        date: format(new Date(), 'yyyy-MM-dd'),
        time: "09:00",
        serviceId: services[0]?.id || "",
        staffId: staff[0]?.id || "",
        notes: ""
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Populate form with initial data when editing
    useEffect(() => {
        if (initialData) {
            setFormData({
                clientName: initialData.clientName || "",
                clientPhone: initialData.clientPhone || "",
                date: initialData.date || format(new Date(), 'yyyy-MM-dd'),
                time: initialData.time || "09:00",
                serviceId: initialData.serviceId || services[0]?.id || "",
                staffId: initialData.staffId || staff[0]?.id || "",
                notes: initialData.notes || ""
            });
        }
    }, [initialData, services, staff]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const newErrors: Record<string, string> = {};
        if (!formData.clientName.trim()) newErrors.clientName = "Customer name is required";
        if (!formData.clientPhone.trim()) newErrors.clientPhone = "Phone number is required";
        if (!formData.date) newErrors.date = "Date is required";
        if (!formData.time) newErrors.time = "Time is required";
        else if (!availableTimeSlots.includes(formData.time)) newErrors.time = "Selected time is no longer available";
        if (!formData.serviceId) newErrors.serviceId = "Please select a service";
        if (!formData.staffId) newErrors.staffId = "Please select a staff member";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error("Booking failed:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedService = services.find(s => s.id === formData.serviceId);

    const availableTimeSlots = timeSlots.filter(slot => {
        const now = new Date();
        if (formData.date === format(now, 'yyyy-MM-dd')) {
            const [h, m] = slot.split(':').map(Number);
            const slotDate = new Date();
            slotDate.setHours(h, m, 0, 0);
            return slotDate > now;
        }
        return true;
    });

    useEffect(() => {
        if (availableTimeSlots.length > 0 && !availableTimeSlots.includes(formData.time)) {
            setFormData(prev => ({ ...prev, time: availableTimeSlots[0] }));
        }
    }, [formData.date, formData.time]);

    // Format duration for display
    const formatDuration = (minutes: number) => {
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
        return `${minutes}m`;
    };

    // Format time with AM/PM
    const formatTimeWithAMPM = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 fade-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-primary px-6 py-4 border-b-4 border-black flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">{bookingId ? "Edit Booking" : "New Booking"}</h2>
                        <p className="text-sm font-bold opacity-80">{bookingId ? "Update appointment details" : "Create a new appointment"}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-black/10 transition-colors border-2 border-black bg-white"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        {/* Customer Information Section */}
                        <div>
                            <h3 className="text-sm font-black uppercase text-muted-foreground mb-4 flex items-center gap-2">
                                <User className="size-4" />
                                Customer Information
                            </h3>
                            {/* Existing Customer Selection */}
                            <div className="mb-4">
                                <label className="block text-sm font-black uppercase mb-2">
                                    Select Existing Customer (Optional)
                                </label>
                                <select
                                    onChange={(e) => {
                                        const customer = customers.find(c => c.id === e.target.value);
                                        if (customer) {
                                            setFormData({
                                                ...formData,
                                                clientName: customer.name,
                                                clientPhone: customer.phone
                                            });
                                        }
                                    }}
                                    className="w-full px-4 py-3 border-2 border-black font-bold text-sm focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                                    defaultValue=""
                                >
                                    <option value="">Select a customer...</option>
                                    {customers.map(customer => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.name} ({customer.phone})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-4">
                                {/* Customer Name */}
                                <div>
                                    <label className="block text-sm font-black uppercase mb-2">
                                        Customer Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.clientName}
                                        onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                                        className={cn(
                                            "w-full px-4 py-3 border-2 border-black font-bold text-sm focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all",
                                            errors.clientName && "border-red-500"
                                        )}
                                        placeholder="Enter customer name"
                                    />
                                    {errors.clientName && (
                                        <p className="text-red-500 text-xs font-bold mt-1">{errors.clientName}</p>
                                    )}
                                </div>

                                {/* Phone Number */}
                                <div>
                                    <label className="block text-sm font-black uppercase mb-2">
                                        Phone Number *
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.clientPhone}
                                        onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                                        className={cn(
                                            "w-full px-4 py-3 border-2 border-black font-bold text-sm focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all",
                                            errors.clientPhone && "border-red-500"
                                        )}
                                        placeholder="+1 (555) 123-4567"
                                    />
                                    {errors.clientPhone && (
                                        <p className="text-red-500 text-xs font-bold mt-1">{errors.clientPhone}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Appointment Details Section */}
                        <div>
                            <h3 className="text-sm font-black uppercase text-muted-foreground mb-4 flex items-center gap-2">
                                <Calendar className="size-4" />
                                Appointment Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Date */}
                                <div>
                                    <label className="block text-sm font-black uppercase mb-2">
                                        Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className={cn(
                                            "w-full px-4 py-3 border-2 border-black font-bold text-sm focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all",
                                            errors.date && "border-red-500"
                                        )}
                                    />
                                    {errors.date && (
                                        <p className="text-red-500 text-xs font-bold mt-1">{errors.date}</p>
                                    )}
                                </div>

                                {/* Time */}
                                <div>
                                    <label className="block text-sm font-black uppercase mb-2">
                                        Time *
                                    </label>
                                    <select
                                        value={formData.time}
                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                        className={cn(
                                            "w-full px-4 py-3 border-2 border-black font-bold text-sm focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer",
                                            errors.time && "border-red-500"
                                        )}
                                    >
                                        {availableTimeSlots.length === 0 && <option value="">No times available</option>}
                                        {availableTimeSlots.map(slot => (
                                            <option key={slot} value={slot}>{formatTimeWithAMPM(slot)}</option>
                                        ))}
                                    </select>
                                    {errors.time && (
                                        <p className="text-red-500 text-xs font-bold mt-1">{errors.time}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Service & Staff Section */}
                        <div>
                            <h3 className="text-sm font-black uppercase text-muted-foreground mb-4 flex items-center gap-2">
                                <Scissors className="size-4" />
                                Service & Staff
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Service */}
                                <div>
                                    <label className="block text-sm font-black uppercase mb-2">
                                        Service *
                                    </label>
                                    <select
                                        value={formData.serviceId}
                                        onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                                        className={cn(
                                            "w-full px-4 py-3 border-2 border-black font-bold text-sm focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer",
                                            errors.serviceId && "border-red-500"
                                        )}
                                    >
                                        {services.length === 0 && <option value="">No services available</option>}
                                        {services.map(service => (
                                            <option key={service.id} value={service.id}>
                                                {service.name} - ${service.price} ({formatDuration(service.duration)})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.serviceId && (
                                        <p className="text-red-500 text-xs font-bold mt-1">{errors.serviceId}</p>
                                    )}
                                </div>

                                {/* Staff */}
                                <div>
                                    <label className="block text-sm font-black uppercase mb-2">
                                        Staff Member *
                                    </label>
                                    <select
                                        value={formData.staffId}
                                        onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                                        className={cn(
                                            "w-full px-4 py-3 border-2 border-black font-bold text-sm focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer",
                                            errors.staffId && "border-red-500"
                                        )}
                                    >
                                        {staff.length === 0 && <option value="">No staff available</option>}
                                        {staff.map(member => (
                                            <option key={member.id} value={member.id}>{member.name}</option>
                                        ))}
                                    </select>
                                    {errors.staffId && (
                                        <p className="text-red-500 text-xs font-bold mt-1">{errors.staffId}</p>
                                    )}
                                </div>
                            </div>

                            {/* Service Summary */}
                            {selectedService && (
                                <div className="mt-4 p-4 bg-muted/30 border-2 border-black">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-black text-sm">{selectedService.name}</p>
                                            <p className="text-xs text-muted-foreground font-medium mt-1">
                                                Duration: {formatDuration(selectedService.duration)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black">${selectedService.price}</p>
                                            <p className="text-xs text-muted-foreground font-bold uppercase">Price</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-black uppercase mb-2">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-black font-bold text-sm focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all resize-none"
                                rows={3}
                                placeholder="Add any special notes or requirements..."
                            />
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-6 py-4 border-t-4 border-black bg-muted/20 flex-shrink-0">
                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 border-2 border-black font-black text-sm uppercase hover:bg-muted/50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={cn(
                                "px-6 py-3 bg-primary border-2 border-black font-black text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all",
                                isSubmitting && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {isSubmitting ? (bookingId ? "Updating..." : "Creating...") : (bookingId ? "Update Booking" : "Create Booking")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
