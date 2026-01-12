import React, { useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { useQuery } from "wasp/client/operations";
import { getBookingsByBusiness } from "wasp/client/operations";
import { format } from "date-fns";
import { cn } from "../../client/utils";
import {
    Calendar,
    User,
    Clock,
    DollarSign,
    MoreHorizontal,
    Search,
    Filter,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ChevronDown
} from "lucide-react";

export default function BookingsPage() {
    const { data: bookingsData } = useQuery(getBookingsByBusiness);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [serviceFilter, setServiceFilter] = useState("all");
    const [staffFilter, setStaffFilter] = useState("all");
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Get unique services and staff for filter dropdowns
    const services = Array.from(new Set((bookingsData || []).map((b: any) => b.service?.name))).filter(Boolean);
    const staffMembers = Array.from(new Set((bookingsData || []).map((b: any) => b.staff?.name))).filter(Boolean);

    // Transform bookings data safely
    const appointments = (bookingsData || [])
        // .filter((booking: any) => booking.status !== 'cancelled') // Allow cancelled bookings to be shown in the list
        .map((booking: any) => ({
            id: booking.id,
            time: booking.startTime,
            client: booking.customer?.name || "Unknown",
            service: booking.service?.name || "Unknown Service",
            staff: booking.staff?.name || "Unassigned",
            duration: `${booking.duration}m`,
            status: booking.status,
            phone: booking.customer?.phone || "",
            date: new Date(booking.date),
            price: booking.price,
        }));

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
        const matchesService = serviceFilter === "all" || apt.service === serviceFilter;
        const matchesStaff = staffFilter === "all" || apt.staff === staffFilter;
        return matchesSearch && matchesStatus && matchesService && matchesStaff;
    });

    const sortedAndFilteredAppointments = getSortedAppointments(filteredAppointments);

    const handleSort = (key: string) => {
        setSortConfig((current) => {
            if (current?.key === key) {
                return current.direction === 'asc' ? { key, direction: 'desc' } : null;
            }
            return { key, direction: 'asc' };
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return "bg-green-200";
            case 'pending': return "bg-yellow-200";
            case 'cancelled': return "bg-red-200";
            default: return "bg-gray-200";
        }
    };

    const formatTimeWithAMPM = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    return (
        <DashboardLayout>
            <div className="w-full h-[calc(100vh-100px)] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                            Bookings
                        </h1>
                        <p className="text-muted-foreground mt-1 font-medium">
                            View and manage all your appointments.
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-black font-bold" />
                        <input
                            type="text"
                            placeholder="SEARCH..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border-2 border-black bg-white font-black text-sm uppercase focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-muted-foreground/70"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Service Filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-black" />
                            <select
                                value={serviceFilter}
                                onChange={(e) => setServiceFilter(e.target.value)}
                                className="pl-10 pr-8 py-3 border-2 border-black bg-white font-black text-sm uppercase focus:outline-none cursor-pointer hover:bg-muted/30 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all appearance-none min-w-[180px]"
                            >
                                <option value="all">SERVICE</option>
                                {services.map((service: any) => (
                                    <option key={service} value={service}>{service.toUpperCase()}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <ChevronDown className="size-4 text-black stroke-[3px]" />
                            </div>
                        </div>

                        {/* Staff Filter */}
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-black" />
                            <select
                                value={staffFilter}
                                onChange={(e) => setStaffFilter(e.target.value)}
                                className="pl-10 pr-8 py-3 border-2 border-black bg-white font-black text-sm uppercase focus:outline-none cursor-pointer hover:bg-muted/30 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all appearance-none min-w-[180px]"
                            >
                                <option value="all">STAFF</option>
                                {staffMembers.map((staff: any) => (
                                    <option key={staff} value={staff}>{staff.toUpperCase()}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <ChevronDown className="size-4 text-black stroke-[3px]" />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-black" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="pl-10 pr-8 py-3 border-2 border-black bg-white font-black text-sm uppercase focus:outline-none cursor-pointer hover:bg-muted/30 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all appearance-none min-w-[180px]"
                            >
                                <option value="all">STATUS</option>
                                <option value="confirmed">CONFIRMED</option>
                                <option value="pending">PENDING</option>
                                <option value="cancelled">CANCELLED</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <ChevronDown className="size-4 text-black stroke-[3px]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="flex justify-end p-1">
                    <p className="text-xs font-black uppercase text-muted-foreground">
                        {filteredAppointments.length} Result{filteredAppointments.length !== 1 ? 's' : ''} Found
                    </p>
                </div>
                <div className="flex-1 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-primary border-b-2 border-black">
                                <tr>
                                    <th
                                        className="p-4 font-black uppercase text-sm w-48 cursor-pointer hover:bg-black/5 transition-colors select-none group"
                                        onClick={() => handleSort('date')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Date & Time
                                            {sortConfig?.key === 'date' ? (
                                                sortConfig.direction === 'asc' ?
                                                    <ArrowUp className="size-3 text-black" /> :
                                                    <ArrowDown className="size-3 text-black" />
                                            ) : (
                                                <ArrowUpDown className="size-3 opacity-40 group-hover:opacity-100 transition-opacity" />
                                            )}
                                        </div>
                                    </th>
                                    <th className="p-4 font-black uppercase text-sm">Client</th>
                                    <th className="p-4 font-black uppercase text-sm">Service</th>
                                    <th className="p-4 font-black uppercase text-sm">Staff</th>
                                    <th className="p-4 font-black uppercase text-sm w-32">Status</th>
                                    <th
                                        className="p-4 font-black uppercase text-sm text-right cursor-pointer hover:bg-black/5 transition-colors select-none group"
                                        onClick={() => handleSort('price')}
                                    >
                                        <div className="flex items-center justify-end gap-2">
                                            Price
                                            {sortConfig?.key === 'price' ? (
                                                sortConfig.direction === 'asc' ?
                                                    <ArrowUp className="size-3 text-black" /> :
                                                    <ArrowDown className="size-3 text-black" />
                                            ) : (
                                                <ArrowUpDown className="size-3 opacity-40 group-hover:opacity-100 transition-opacity" />
                                            )}
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-black/10">
                                {sortedAndFilteredAppointments.map((apt: any) => (
                                    <tr key={apt.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-4">
                                            <div className="font-black text-sm">{format(apt.date, "MMM dd, yyyy")}</div>
                                            <div className="text-xs text-muted-foreground font-bold">{formatTimeWithAMPM(apt.time)}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-sm underline cursor-pointer">{apt.client}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-sm">{apt.service}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-sm">{apt.staff}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={cn(
                                                "inline-block px-2 py-1 border border-black text-[10px] font-black uppercase tracking-wide",
                                                getStatusColor(apt.status)
                                            )}>
                                                {apt.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="font-black text-sm flex items-center justify-end gap-1">
                                                <DollarSign className="size-3" />
                                                {apt.price}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredAppointments.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                            <p className="font-bold">No bookings found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
