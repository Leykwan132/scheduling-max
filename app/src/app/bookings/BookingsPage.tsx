import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "wasp/client/operations";
import { useAuth } from "wasp/client/auth";
import { getBookingsByUser } from "wasp/client/operations";
import { format } from "date-fns";
import { cn } from "../../client/utils";
import {
    Calendar,
    User,
    Clock,
    DollarSign,
    Search,
    Filter,
    ArrowUpRight,
    Plus,
    ArrowLeft,
    ExternalLink,
    ChevronDown,
    MoreHorizontal
} from "lucide-react";

import DashboardLayout from "../layout/DashboardLayout";

export default function BookingsPage() {
    const { data: user } = useAuth();
    const { data: bookingsData, isLoading } = useQuery(getBookingsByUser);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [serviceFilter, setStatusService] = useState("all");
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const baseUrl = import.meta.env.REACT_APP_BASE_URL || window.location.origin;
    const bookingUrl = user?.slug ? `${baseUrl}/book/${user.slug}` : "";

    // Get unique services and staff for filter dropdowns
    const services = Array.from(new Set((bookingsData || []).map((b: any) => b.service?.name))).filter(Boolean);

    // Transform bookings data safely
    const appointments = (bookingsData || [])
        .map((booking: any) => {
            // Derive time from startTimeUtc
            const startUtc = new Date(booking.startTimeUtc);
            const time = `${startUtc.getUTCHours().toString().padStart(2, '0')}:${startUtc.getUTCMinutes().toString().padStart(2, '0')}`;

            // Derive duration from difference between endTimeUtc and startTimeUtc
            const endUtc = new Date(booking.endTimeUtc);
            const durationMinutes = Math.round((endUtc.getTime() - startUtc.getTime()) / 60000);

            return {
                id: booking.id,
                time,
                client: booking.customer?.name || "Unknown",
                service: booking.service?.name || "Unknown Service",
                staff: booking.staff?.name || "Unassigned",
                duration: `${durationMinutes}m`,
                status: booking.status,
                phone: booking.customer?.phone || "",
                date: new Date(booking.date),
                price: booking.price,
            };
        });

    const getSortedAppointments = (appointments: any[]) => {
        if (!sortConfig) return appointments;
        return [...appointments].sort((a, b) => {
            if (sortConfig.key === 'date') {
                const dateA = new Date(a.date);
                const [hoursA, minutesA] = a.time.split(':').map(Number);
                dateA.setHours(hoursA, minutesA);
                const dateB = new Date(b.date);
                const [hoursB, minutesB] = b.time.split(':').map(Number);
                dateB.setHours(hoursB, minutesB);
                return sortConfig.direction === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
            }
            if (sortConfig.key === 'price') {
                return sortConfig.direction === 'asc' ? a.price - b.price : b.price - a.price;
            }
            return 0;
        });
    };

    // Filter appointments based on search and filters
    const filteredAppointments = appointments.filter((apt: any) => {
        const matchesSearch = apt.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
            apt.service.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
        // Fix: logic was using undefined variable 'serviceFilter' in replacement content if I blindly copy-paste.
        // wait, I defined serviceFilter as `const [serviceFilter, setStatusService] = useState("all");` above in my replacement block.
        // Actually, the previous code had `const [serviceFilter, setServiceFilter] = useState("all");`
        // I should match the original code unless I see a bug.
        // Re-reading original code line 29: `const [serviceFilter, setServiceFilter] = useState("all");`
        // In my replacement block above I wrote `setStatusService`. I should fix that to `setServiceFilter`.

        const matchesService = serviceFilter === "all" || apt.service === serviceFilter;
        return matchesSearch && matchesStatus && matchesService;
    });

    const sortedAndFilteredAppointments = getSortedAppointments(filteredAppointments);

    const formatTimeWithAMPM = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return "bg-green-300 text-black";
            case 'pending': return "bg-yellow-300 text-black";
            case 'cancelled': return "bg-red-300 text-black";
            default: return "bg-gray-200 text-muted-foreground";
        }
    };

    return (
        <DashboardLayout>
            <div className="w-full max-w-5xl mx-auto pb-20">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                            Bookings
                        </h1>
                        <p className="text-muted-foreground mt-2 font-medium">
                            Manage and view all your client appointments.
                        </p>
                    </div>
                </div>

                {/* Main Action - New Appointment */}
                <div className="mb-8">
                    <div className="group relative bg-primary border-2 border-black p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black uppercase mb-2 flex items-center gap-2">
                                    <Plus className="size-6 stroke-[3px]" />
                                    New Appointment
                                </h2>
                                <p className="font-bold text-black/80 max-w-lg text-sm sm:text-base">
                                    Open your public booking page to schedule a new appointment for a client or walk-in.
                                </p>
                            </div>
                            <a
                                href={bookingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white text-black px-6 py-3 sm:px-8 sm:py-4 border-2 border-black font-black uppercase tracking-widest text-sm sm:text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center gap-2 whitespace-nowrap"
                            >
                                Book Now
                                <ExternalLink className="size-5" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Filters & Search - Modern & Simple */}
                <div className="sticky top-4 z-10 bg-neutral-50/95 backdrop-blur-sm py-4 mb-6 border-b-2 border-black/10">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-black" />
                            <input
                                type="text"
                                placeholder="Search clients or services..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 border-2 border-black bg-white font-bold focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all uppercase placeholder:normal-case"
                            />
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-3 border-2 border-black bg-white font-black uppercase focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                            >
                                <option value="all">All Status</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="pending">Pending</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Bookings List - Cards */}
                {isLoading ? (
                    <div className="text-center py-12 font-black uppercase animate-pulse">Loading bookings...</div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {sortedAndFilteredAppointments.length === 0 ? (
                            <div className="text-center py-16 border-2 border-dashed border-black/20">
                                <p className="font-bold text-muted-foreground">No bookings found matching your filters.</p>
                            </div>
                        ) : (
                            sortedAndFilteredAppointments.map((apt: any) => (
                                <div
                                    key={apt.id}
                                    className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                                >
                                    {/* Left: Time & Date */}
                                    <div className="flex items-start gap-4 min-w-[140px]">
                                        <div className="bg-black text-white p-3 text-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                                            <div className="text-xs font-black uppercase">{format(apt.date, "MMM")}</div>
                                            <div className="text-xl font-black">{format(apt.date, "dd")}</div>
                                        </div>
                                        <div>
                                            <div className="font-black text-xl">{formatTimeWithAMPM(apt.time)}</div>
                                            <div className="font-bold text-muted-foreground text-sm">{apt.duration}</div>
                                        </div>
                                    </div>

                                    {/* Middle: Client & Service */}
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-black text-lg">{apt.client}</h3>
                                            <span className={cn(
                                                "px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border border-black",
                                                getStatusColor(apt.status)
                                            )}>
                                                {apt.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm font-bold opacity-80">
                                            <span className="flex items-center gap-1">
                                                <MoreHorizontal className="size-4" />
                                                {apt.service}
                                            </span>
                                            {apt.phone && (
                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                    <User className="size-3" />
                                                    {apt.phone}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Price & Staff */}
                                    <div className="flex items-center justify-between md:flex-col md:items-end gap-2 md:min-w-[100px]">
                                        <div className="font-black text-xl flex items-center">
                                            <DollarSign className="size-4 stroke-[3px]" />
                                            {apt.price}
                                        </div>
                                        <div className="text-xs font-bold bg-neutral-100 px-2 py-1 border border-black uppercase text-center w-fit">
                                            {apt.staff}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
