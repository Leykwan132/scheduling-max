import { startOfWeek, endOfWeek, eachDayOfInterval, format, isToday, isSameDay } from "date-fns";
import { cn } from "../../client/utils";
import { Clock } from "lucide-react";

interface Appointment {
    id: number;
    time: string;
    client: string;
    service: string;
    status: string;
    duration: string;
    date: Date;
    staff?: string;
    phone?: string;
    isAllDay?: boolean;
    colors?: {
        bg: string;
        border: string;
        text: string;
    };
}

interface WeekViewProps {
    currentDate: Date;
    appointments: Appointment[];
    onAppointmentClick?: (e: React.MouseEvent, apt: Appointment) => void;
    isAppointmentPast?: (apt: Appointment) => boolean;
    schedule?: any;
}

export default function WeekView({ currentDate, appointments, onAppointmentClick, isAppointmentPast, schedule }: WeekViewProps) {

    const startDate = startOfWeek(currentDate);
    const endDate = endOfWeek(currentDate);

    const weekDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    // Calculate min/max hours from schedule across all days of the week
    const { minHour, maxHour, availableDays } = (() => {
        let min = 24;
        let max = 0;
        const available = new Set<string>();

        // 1. Check schedule
        if (schedule?.days && schedule.days.length > 0) {
            schedule.days.forEach((day: any) => {
                if (day.startTime && day.endTime) {
                    available.add(day.dayOfWeek);
                    const [startHour] = day.startTime.split(':').map(Number);
                    const [endHour] = day.endTime.split(':').map(Number);
                    min = Math.min(min, startHour);
                    max = Math.max(max, endHour);
                }
            });
        }

        // 2. Check appointments (essential to show bookings on weekends/off-hours)
        appointments.forEach(apt => {
            if (apt.time) {
                const [h] = apt.time.split(':').map(Number);
                min = Math.min(min, h);
                const durationMinutes = apt.duration.includes('h')
                    ? parseFloat(apt.duration) * 60
                    : parseInt(apt.duration) || 60;
                const endH = Math.ceil(h + (durationMinutes / 60));
                max = Math.max(max, endH);
            }
        });

        // 3. Fallbacks
        const finalMinHour = min === 24 ? 9 : Math.max(0, min);
        // Add 1 hour buffer after the last appointment/closing time
        const finalMaxHour = max === 0 ? 17 : Math.min(24, max + 1);

        return {
            minHour: finalMinHour,
            maxHour: finalMaxHour,
            availableDays: available
        };
    })();

    // Generate time slots from minHour to maxHour
    const timeSlots: number[] = [];
    for (let i = minHour; i < maxHour; i++) {
        timeSlots.push(i);
    }

    // Helper to calculate top offset and height based on time and duration
    const getPositionStyle = (time: string, durationStr: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        const startMinutes = (hours - minHour) * 60 + minutes;

        let durationMinutes = 60;
        if (durationStr.includes('h')) {
            durationMinutes = parseFloat(durationStr.replace('h', '')) * 60;
        } else if (durationStr.includes('m')) {
            durationMinutes = parseFloat(durationStr.replace('m', ''));
        }

        return {
            top: `${startMinutes}px`,
            height: `${durationMinutes}px`
        };
    };

    // Calculate current time position for the red line
    const getCurrentTimePosition = () => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const totalMinutes = (hours - minHour) * 60 + minutes;
        return totalMinutes;
    };

    const currentTimePosition = getCurrentTimePosition();
    const showCurrentTimeLine = currentTimePosition >= 0 && currentTimePosition <= ((maxHour - minHour) * 60);

    // Helper to check if a day is available
    const isDayAvailable = (day: Date) => {
        const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const dayOfWeek = dayNames[day.getDay()];
        return availableDays.has(dayOfWeek);
    };

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

    // Detect overlapping appointments and assign columns
    const getAppointmentLayout = (appointments: Appointment[]) => {
        if (appointments.length === 0) return [];

        // Convert time to minutes for easier comparison
        const getMinutes = (time: string) => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        };

        // Sort appointments by start time, then by duration (longer first)
        const sorted = [...appointments].sort((a, b) => {
            const aStart = getMinutes(a.time);
            const bStart = getMinutes(b.time);
            if (aStart !== bStart) return aStart - bStart;
            return parseInt(b.duration) - parseInt(a.duration);
        });

        // Assign columns using interval scheduling algorithm
        const layouts = sorted.map(apt => {
            const startMinutes = getMinutes(apt.time);
            const endMinutes = startMinutes + parseInt(apt.duration);
            return {
                appointment: apt,
                start: startMinutes,
                end: endMinutes,
                column: 0,
                totalColumns: 1
            };
        });

        // Find overlaps and assign columns
        for (let i = 0; i < layouts.length; i++) {
            const current = layouts[i];
            const overlapping = [current];

            // Find all appointments that overlap with current
            for (let j = 0; j < layouts.length; j++) {
                if (i === j) continue;
                const other = layouts[j];

                // Check if they overlap
                if (current.start < other.end && current.end > other.start) {
                    overlapping.push(other);
                }
            }

            // Assign column based on overlaps
            if (overlapping.length > 1) {
                const usedColumns = new Set(overlapping.filter(o => o !== current).map(o => o.column));
                let column = 0;
                while (usedColumns.has(column)) {
                    column++;
                }
                current.column = column;

                // Update total columns for all overlapping appointments
                const maxColumn = Math.max(...overlapping.map(o => o.column));
                overlapping.forEach(o => {
                    o.totalColumns = Math.max(o.totalColumns, maxColumn + 1);
                });
            }
        }

        return layouts;
    };

    return (
        <div className="overflow-hidden flex flex-col h-full bg-background/50">
            {/* Header: Days */}
            <div className="grid grid-cols-8 border-b-4 border-black flex-shrink-0 bg-white">
                <div className="p-4 border-r-4 border-black bg-neutral-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-neutral-400" />
                </div>
                {weekDays.map((day) => (
                    <div
                        key={day.toString()}
                        className={cn(
                            "p-3 text-center border-r-4 border-black last:border-r-0",
                            isToday(day) && "bg-primary/10",
                            !isDayAvailable(day) && "bg-neutral-50"
                        )}
                    >
                        <p className={cn(
                            "text-xs font-black uppercase text-muted-foreground tracking-widest",
                            !isDayAvailable(day) && "opacity-30"
                        )}>{format(day, 'EEE')}</p>
                        <div className={cn(
                            "mx-auto w-10 h-10 flex items-center justify-center rounded-full font-black text-xl mt-1 transition-all",
                            isToday(day) ? "bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]" : "text-black",
                            !isDayAvailable(day) && "opacity-30"
                        )}>
                            {format(day, 'd')}
                        </div>
                    </div>
                ))}
            </div>

            {/* Scrollable Grid */}
            <div className="flex-1 overflow-y-auto relative no-scrollbar">
                <div className="grid grid-cols-8">
                    {/* Time Column */}
                    <div className="border-r-4 border-black bg-neutral-50/50">
                        {timeSlots.map((hour) => (
                            <div key={hour} className="h-[60px] border-b-2 border-black/5 flex items-start justify-end pr-3 pt-2">
                                <span className="text-[10px] font-black uppercase text-neutral-400 tracking-tighter">
                                    {format(new Date().setHours(hour, 0), 'ha')}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Day Columns */}
                    {weekDays.map((day) => {
                        const dayAppointments = appointments.filter(apt => isSameDay(apt.date, day));
                        const layouts = getAppointmentLayout(dayAppointments);
                        const dayAvailable = isDayAvailable(day);

                        return (
                            <div
                                key={day.toString()}
                                className={cn(
                                    "border-r-4 border-black last:border-r-0 relative group",
                                    !dayAvailable && "bg-neutral-50"
                                )}
                            >
                                {/* Grid Background Lines */}
                                {timeSlots.map(hour => (
                                    <div key={hour} className={cn(
                                        "h-[60px] border-b-2 border-black/5 transition-colors group-hover:bg-black/5",
                                        !dayAvailable && "bg-neutral-100/20 shadow-inner"
                                    )}></div>
                                ))}

                                {/* Unavailable Day Indicator */}
                                {!dayAvailable && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                                        <p className="text-[10px] font-black uppercase text-neutral-300 rotate-[-90deg] tracking-[0.5em] whitespace-nowrap opacity-50">
                                            Unavailable
                                        </p>
                                    </div>
                                )}

                                {/* Appointments Overlay */}
                                {layouts.map(layout => {
                                    const apt = layout.appointment;
                                    const style = getPositionStyle(apt.time, apt.duration);
                                    const isPast = isAppointmentPast?.(apt) || false;
                                    const durationMinutes = parseInt(apt.duration);
                                    const timeRange = formatTimeRange(apt.time, durationMinutes);

                                    // Calculate horizontal position based on column
                                    const columnWidth = 100 / layout.totalColumns;
                                    const leftPercent = layout.column * columnWidth;
                                    const widthPercent = columnWidth;

                                    return (
                                        <div
                                            key={apt.id}
                                            style={{
                                                ...style,
                                                left: `${leftPercent}%`,
                                                width: `${widthPercent}%`,
                                                paddingLeft: '2px',
                                                paddingRight: '2px'
                                            }}
                                            onClick={(e) => onAppointmentClick?.(e, apt)}
                                            className={cn(
                                                "absolute rounded-sm p-1 text-[10px] overflow-hidden cursor-pointer transition-colors border-l-4",
                                                apt.colors?.bg || "bg-blue-200",
                                                apt.colors?.border || "border-l-blue-500",
                                                apt.colors?.text || "text-blue-900",
                                                "hover:brightness-95",
                                                isPast && "opacity-40"
                                            )}
                                        >
                                            <p className="truncate font-semibold">{apt.client}</p>
                                            <p className="truncate opacity-70 text-[9px]">
                                                {apt.isAllDay ? "All Day" : timeRange}
                                            </p>
                                        </div>
                                    );
                                })}

                                {/* Current Time Line - Red line showing current time */}
                                {isSameDay(day, new Date()) && showCurrentTimeLine && (
                                    <div
                                        className="absolute left-0 right-0 z-30 pointer-events-none"
                                        style={{ top: `${currentTimePosition}px` }}
                                    >
                                        <div className="relative">
                                            <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                                            <div className="h-0.5 bg-red-500"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
