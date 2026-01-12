import React, { useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { Plus } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { useQuery } from "wasp/client/operations";
import { useAuth } from "wasp/client/auth";
import { getBookingsByBusiness, getServicesByBusinessAndUserId, getBusinessByUser } from "wasp/client/operations";
import { createBooking, updateBooking, deleteBooking } from "wasp/client/operations";
import CalendarHeader from "./CalendarHeader";
import MonthView from "./MonthView";
import WeekView from "./WeekView";
import BookingPopup from "./BookingPopup";
import NewBookingModal from "./NewBookingModal";
import { ToastContainer } from "../../client/components/Toast";
import { cn } from "../../client/utils";
import { addMonths, subMonths, addWeeks, subWeeks, startOfToday } from "date-fns";

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(startOfToday());
    const [view, setView] = useState<'month' | 'week'>('week');
    const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
    const [popupPosition, setPopupPosition] = useState<{ top: number; left: number; right: number; bottom: number } | null>(null);
    const [showNewBookingModal, setShowNewBookingModal] = useState(false);
    const [editingBooking, setEditingBooking] = useState<any | null>(null);
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' }>>([]);

    // Fetch data from database
    const { data: shop } = useQuery(getBusinessByUser);
    const { data: bookingsData, refetch: refetchBookings } = useQuery(getBookingsByBusiness);
    const { data: user } = useAuth();
    const { data: servicesData } = useQuery(getServicesByBusinessAndUserId, shop?.id && user?.id ? { businessId: shop.id, userId: user.id } : undefined, { enabled: !!shop?.id && !!user?.id });

    // Transform bookings data for calendar display
    const appointments = (bookingsData || [])
        .filter((booking: any) => booking.status !== 'cancelled')
        .map((booking: any) => ({
            id: booking.id,
            time: booking.startTime,
            client: booking.customer?.name || "Unknown",
            service: booking.service?.name || "Unknown Service",
            staff: booking.staff?.username || "Unassigned",
            duration: `${booking.duration}m`,
            status: booking.status,
            phone: booking.customer?.phone || "",
            date: new Date(booking.date),
            price: booking.price,
        }));

    const handlePrev = () => {
        if (view === 'month') {
            setCurrentDate(curr => subMonths(curr, 1));
        } else {
            setCurrentDate(curr => subWeeks(curr, 1));
        }
    };

    const handleNext = () => {
        if (view === 'month') {
            setCurrentDate(curr => addMonths(curr, 1));
        } else {
            setCurrentDate(curr => addWeeks(curr, 1));
        }
    };

    const handleToday = () => {
        setCurrentDate(startOfToday());
    };

    // Helper function to format time with AM/PM
    const formatTimeWithAMPM = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const handleAppointmentClick = (e: React.MouseEvent, apt: any) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();

        setPopupPosition({
            top: rect.top,
            left: rect.left,
            right: rect.right,
            bottom: rect.bottom
        });
        setSelectedAppointment(apt);
    };

    const handleNewBooking = async (bookingData: any) => {
        try {
            if (editingBooking) {
                // Update existing booking
                await updateBooking({
                    id: editingBooking.id,
                    clientName: bookingData.clientName,
                    clientPhone: bookingData.clientPhone,
                    serviceId: bookingData.serviceId,
                    staffId: bookingData.staffId,
                    date: bookingData.date,
                    time: bookingData.time,
                    notes: bookingData.notes,
                });
            } else {
                // Create new booking
                await createBooking({
                    clientName: bookingData.clientName,
                    clientPhone: bookingData.clientPhone,
                    serviceId: bookingData.serviceId,
                    staffId: bookingData.staffId,
                    date: bookingData.date,
                    time: bookingData.time,
                    notes: bookingData.notes,
                });
            }
            refetchBookings();
            setEditingBooking(null);
        } catch (error) {
            console.error("Failed to save booking:", error);
        }
    };

    const handleDeleteBooking = async (bookingId: string) => {
        try {
            await deleteBooking({ id: bookingId });
            refetchBookings();
            setSelectedAppointment(null);
            setEditingBooking(null);
        } catch (error) {
            console.error("Failed to delete booking:", error);
        }
    };

    const handleConfirmBooking = async (id: number) => {
        try {
            await updateBooking({
                id: id.toString(),
                status: 'confirmed'
            });
            await refetchBookings();

            // Update the selected appointment with new status
            setSelectedAppointment((prev: any) => prev ? { ...prev, status: 'confirmed' } : null);

            // Show success toast
            const toastId = Date.now().toString();
            setToasts(prev => [...prev, { id: toastId, message: 'Booking confirmed successfully!', type: 'success' }]);
        } catch (error) {
            console.error("Failed to confirm booking:", error);
            const toastId = Date.now().toString();
            setToasts(prev => [...prev, { id: toastId, message: 'Failed to confirm booking', type: 'error' }]);
        }
    };

    const handleCancelBooking = async (id: number) => {
        try {
            await updateBooking({
                id: id.toString(),
                status: 'cancelled'
            });
            await refetchBookings();

            // Update the selected appointment with new status
            setSelectedAppointment((prev: any) => prev ? { ...prev, status: 'cancelled' } : null);

            // Show success toast
            const toastId = Date.now().toString();
            setToasts(prev => [...prev, { id: toastId, message: 'Booking cancelled successfully!', type: 'success' }]);
        } catch (error) {
            console.error("Failed to cancel booking:", error);
            const toastId = Date.now().toString();
            setToasts(prev => [...prev, { id: toastId, message: 'Failed to cancel booking', type: 'error' }]);
        }
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const handleEditBooking = () => {
        if (selectedAppointment) {
            // Find the full booking data from bookingsData
            const fullBooking = bookingsData?.find((b: any) => b.id === selectedAppointment.id);
            if (fullBooking) {
                setEditingBooking({
                    id: fullBooking.id,
                    clientName: fullBooking.customer.name,
                    clientPhone: fullBooking.customer.phone,
                    date: format(new Date(fullBooking.date), 'yyyy-MM-dd'),
                    time: fullBooking.startTime,
                    serviceId: fullBooking.serviceId,
                    staffId: fullBooking.staffId,
                    notes: fullBooking.notes || ""
                });
                setShowNewBookingModal(true);
                setSelectedAppointment(null); // Close popup
            }
        }
    };

    // Calculate today's revenue
    const todaysAppointments = appointments.filter((a: any) => isSameDay(new Date(a.date), new Date()));
    const todaysRevenue = todaysAppointments.reduce((sum: number, apt: any) => sum + (apt.price || 0), 0);

    // Helper function to check if appointment is in the past
    const isAppointmentPast = (appointment: any) => {
        const now = new Date();
        const [hours, minutes] = appointment.time.split(':').map(Number);
        const aptDateTime = new Date(appointment.date);
        aptDateTime.setHours(hours, minutes);
        return aptDateTime < now;
    };

    // Filter upcoming appointments for "Up Next" section
    const upcomingAppointments = todaysAppointments
        .filter((apt: any) => !isAppointmentPast(apt))
        .sort((a: any, b: any) => a.time.localeCompare(b.time));

    return (
        <DashboardLayout>
            <div className="w-full h-[calc(100vh-100px)] flex flex-col">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                            Calendar
                        </h1>
                        <p className="text-muted-foreground mt-1 font-medium">
                            Manage your appointments and schedule.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingBooking(null);
                            setShowNewBookingModal(true);
                        }}
                        className="bg-primary text-black px-4 py-2.5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex items-center gap-2 font-black text-sm uppercase"
                    >
                        <Plus className="size-4" />
                        <span className="hidden sm:inline">New Booking</span>
                        <span className="sm:hidden">New</span>
                    </button>
                </div>

                <div className="flex flex-col xl:flex-row h-full gap-6 min-h-0">
                    {/* Left Side: Calendar Grid */}
                    <div className="flex-1 flex flex-col min-h-0">
                        {/* Calendar Controls */}
                        <CalendarHeader
                            currentDate={currentDate}
                            view={view}
                            onPrev={handlePrev}
                            onNext={handleNext}
                            onToday={handleToday}
                            onViewChange={setView}
                        />

                        {/* Calendar View */}
                        <div className="flex-1 min-h-0 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
                            {view === 'month' ? (
                                <MonthView
                                    currentDate={currentDate}
                                    appointments={appointments}
                                    onAppointmentClick={handleAppointmentClick}
                                    isAppointmentPast={isAppointmentPast}
                                />
                            ) : (
                                <WeekView
                                    currentDate={currentDate}
                                    appointments={appointments}
                                    onAppointmentClick={handleAppointmentClick}
                                    isAppointmentPast={isAppointmentPast}
                                />
                            )}
                        </div>
                    </div>

                    {/* Right Side: Today's Quick View */}
                    <div className="w-full xl:w-80 flex-shrink-0 flex flex-col gap-4">
                        <div className="bg-blue-400 border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <h2 className="text-xl font-black uppercase tracking-tight mb-1">Today's Quick View</h2>
                            <p className="text-sm font-bold opacity-80">{format(new Date(), 'EEEE, MMM do')}</p>
                        </div>

                        <div className="bg-background border-2 border-black flex-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-black/10">
                                <div>
                                    <p className="text-3xl font-black">{todaysAppointments.length}</p>
                                    <p className="text-xs font-black uppercase text-muted-foreground">Bookings Done</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-black">${todaysRevenue.toFixed(0)}</p>
                                    <p className="text-xs font-black uppercase text-muted-foreground">Est. Rev</p>
                                </div>
                            </div>

                            <p className="text-xs font-black uppercase text-muted-foreground mb-3">Up Next</p>

                            <div className="space-y-3 overflow-y-auto flex-1 no-scrollbar">
                                {upcomingAppointments.map((apt: any, idx: number) => (
                                    <div
                                        key={apt.id}
                                        onClick={(e) => handleAppointmentClick(e, apt)}
                                        className={cn(
                                            "p-3 border-2 border-black transition-all hover:bg-muted/50 relative cursor-pointer",
                                            idx === 0 && "bg-blue-50 border-l-[6px] border-l-primary"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-black text-sm">{formatTimeWithAMPM(apt.time)}</span>
                                            <span className={cn(
                                                "text-[10px] font-black uppercase px-1.5 py-0.5 border border-black",
                                                apt.status === 'confirmed' ? "bg-green-200" : "bg-yellow-200"
                                            )}>
                                                {apt.status}
                                            </span>
                                        </div>
                                        <p className="font-bold text-sm truncate">{apt.client}</p>
                                        <p className="text-xs text-muted-foreground font-medium">{apt.service} • {apt.staff}</p>
                                    </div>
                                ))}

                                {upcomingAppointments.length === 0 && (
                                    <div className="text-center py-8 opacity-50">
                                        <p className="font-black text-sm uppercase">No Upcoming Bookings</p>
                                        <p className="text-xs">Enjoy your free time!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Booking Popup */}
            {selectedAppointment && popupPosition && (
                <BookingPopup
                    appointment={selectedAppointment}
                    position={popupPosition}
                    onClose={() => setSelectedAppointment(null)}
                    onEdit={handleEditBooking}
                    onConfirm={handleConfirmBooking}
                    onCancel={handleCancelBooking}
                />
            )}

            {/* New Booking Modal */}
            {showNewBookingModal && (
                <NewBookingModal
                    services={servicesData || []}
                    staff={[]}
                    onClose={() => {
                        setShowNewBookingModal(false);
                        setEditingBooking(null);
                    }}
                    onSubmit={handleNewBooking}
                    onDelete={handleDeleteBooking}
                    initialData={editingBooking}
                    bookingId={editingBooking?.id}
                />
            )}

            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </DashboardLayout>
    );
}
