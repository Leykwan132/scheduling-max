import { useState } from "react";
import { startOfWeek, endOfMonth, startOfMonth, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, format, isToday } from "date-fns";
import { cn } from "../../client/utils";
import { X } from "lucide-react";

interface Appointment {
    id: number;
    time: string;
    client: string;
    service: string;
    status: string;
    date: Date;
    duration?: string;
    staff?: string;
    phone?: string;
}

interface MonthViewProps {
    currentDate: Date;
    appointments: Appointment[];
    onAppointmentClick?: (e: React.MouseEvent, apt: Appointment) => void;
    isAppointmentPast?: (apt: Appointment) => boolean;
}

export default function MonthView({ currentDate, appointments, onAppointmentClick, isAppointmentPast }: MonthViewProps) {
    const [expandedDay, setExpandedDay] = useState<Date | null>(null);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Format time range (e.g., "2-4pm" or "9am-12pm")
    const formatTimeRange = (startTime: string, durationMinutes: number) => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(hours, minutes);

        const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

        const formatTime = (date: Date) => {
            let h = date.getHours();
            const m = date.getMinutes();
            const ampm = h >= 12 ? 'pm' : 'am';
            h = h % 12 || 12;
            return m > 0 ? `${h}:${m.toString().padStart(2, '0')}${ampm}` : `${h}${ampm}`;
        };

        const start = formatTime(startDate);
        const end = formatTime(endDate);

        // If both have same am/pm, only show it once at the end
        const startAmPm = startDate.getHours() >= 12 ? 'pm' : 'am';
        const endAmPm = endDate.getHours() >= 12 ? 'pm' : 'am';

        if (startAmPm === endAmPm) {
            return `${start.replace(/am|pm/, '')}-${end}`;
        }
        return `${start}-${end}`;
    };

    // Handle "more" click
    const handleMoreClick = (e: React.MouseEvent, day: Date) => {
        e.stopPropagation();
        setExpandedDay(day);
    };

    // Get appointments for expanded day
    const expandedDayAppointments = expandedDay
        ? appointments.filter(apt => isSameDay(apt.date, expandedDay))
        : [];

    return (
        <div className="h-full flex flex-col overflow-hidden bg-background relative">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b-2 border-black flex-shrink-0">
                {weekDays.map(day => (
                    <div key={day} className="p-2 text-center text-sm font-black uppercase bg-muted/30 border-r-2 border-black last:border-r-0">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 auto-rows-[minmax(110px,1fr)] flex-1 overflow-y-auto no-scrollbar">
                {calendarDays.map((day, dayIdx) => {
                    const dayAppointments = appointments
                        .filter(apt => isSameDay(apt.date, day))
                        .sort((a, b) => a.time.localeCompare(b.time)); // Sort by time
                    // Responsive: 2 on small screens, 3 on larger
                    const maxVisible = typeof window !== 'undefined' && window.innerWidth < 768 ? 2 : 3;
                    const visibleAppointments = dayAppointments.slice(0, maxVisible);
                    const hiddenCount = dayAppointments.length - maxVisible;

                    return (
                        <div
                            key={day.toString()}
                            className={cn(
                                "p-1.5 sm:p-2 border-b-2 border-r-2 border-black relative flex flex-col",
                                (dayIdx + 1) % 7 === 0 && "border-r-0",
                                !isSameMonth(day, monthStart) && "bg-muted/10 text-muted-foreground opacity-50",
                                isToday(day) && "bg-blue-50/50"
                            )}
                        >
                            {/* Date Number */}
                            <span className={cn(
                                "text-xs sm:text-sm font-bold mb-1 size-6 sm:size-7 flex items-center justify-center rounded-full flex-shrink-0",
                                isToday(day) && "bg-primary border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            )}>
                                {format(day, 'd')}
                            </span>

                            {/* Appointments Container - Fixed height to ensure more button visibility */}
                            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                {/* Visible Appointments */}
                                <div className="space-y-0.5 sm:space-y-1 overflow-hidden">
                                    {visibleAppointments.map(apt => {
                                        const isPast = isAppointmentPast?.(apt) || false;
                                        const timeRange = formatTimeRange(apt.time, parseInt(apt.duration || '60'));
                                        return (
                                            <div
                                                key={apt.id}
                                                onClick={(e) => onAppointmentClick?.(e, apt)}
                                                className={cn(
                                                    "text-[9px] sm:text-[10px] px-1.5 py-1 border border-black/20 font-medium truncate cursor-pointer transition-colors rounded-sm",
                                                    apt.status === 'confirmed' ? "bg-green-200 hover:bg-green-300" : "bg-yellow-200 hover:bg-yellow-300",
                                                    isPast && "opacity-40"
                                                )}
                                            >
                                                {apt.client.split(' ')[0]} • {timeRange}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* "+X more" button - Always at the bottom */}
                                {hiddenCount > 0 && (
                                    <button
                                        onClick={(e) => handleMoreClick(e, day)}
                                        className="mt-auto text-[9px] sm:text-[10px] font-black text-muted-foreground hover:text-black hover:bg-muted/50 px-1 py-0.5 transition-colors text-left flex-shrink-0"
                                    >
                                        +{hiddenCount} more
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Expanded Day Overlay */}
            {expandedDay && (
                <div
                    className="fixed inset-0 bg-black/50 z-[90] flex items-center justify-center p-4"
                    onClick={() => setExpandedDay(null)}
                >
                    <div
                        className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md max-h-[80vh] flex flex-col animate-in zoom-in-95 fade-in duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-primary px-4 py-3 border-b-2 border-black flex items-center justify-between flex-shrink-0">
                            <div>
                                <h3 className="font-black uppercase text-lg">
                                    {format(expandedDay, 'EEEE')}
                                </h3>
                                <p className="text-sm font-bold opacity-80">
                                    {format(expandedDay, 'MMMM d, yyyy')}
                                </p>
                            </div>
                            <button
                                onClick={() => setExpandedDay(null)}
                                className="p-2 hover:bg-black/10 transition-colors border-2 border-black bg-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Appointments Count */}
                        <div className="px-4 py-2 bg-muted/30 border-b border-black/10 flex-shrink-0">
                            <p className="text-xs font-black uppercase text-muted-foreground">
                                {expandedDayAppointments.length} Bookings
                            </p>
                        </div>

                        {/* Appointments List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {expandedDayAppointments
                                .sort((a, b) => a.time.localeCompare(b.time))
                                .map(apt => {
                                    const timeRange = formatTimeRange(apt.time, parseInt(apt.duration || '60'));
                                    return (
                                        <div
                                            key={apt.id}
                                            onClick={(e) => onAppointmentClick?.(e, apt)}
                                            className={cn(
                                                "p-3 border border-black/20 rounded cursor-pointer transition-colors",
                                                apt.status === 'confirmed' ? "bg-green-200 hover:bg-green-300" : "bg-yellow-200 hover:bg-yellow-300"
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-sm">{timeRange}</span>
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase px-1.5 py-0.5 border border-black/20 rounded-sm bg-white/50"
                                                )}>
                                                    {apt.status}
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold">{apt.client}</p>
                                            <p className="text-xs text-muted-foreground font-medium">{apt.service} • {apt.staff || 'Unassigned'}</p>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
