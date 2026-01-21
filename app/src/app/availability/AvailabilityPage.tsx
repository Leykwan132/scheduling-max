import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { Clock, Plus, Trash2, Calendar, X, Edit2, Globe, Search, Check, ChevronDown } from "lucide-react";
import { useQuery, useAction } from "wasp/client/operations";
import { getSchedule, updateSchedule, updateScheduleOverride, updateUserProfile } from "wasp/client/operations";
import { useAuth } from "wasp/client/auth";
import { cn } from "../../client/utils";
import { ToastContainer } from "../../client/components/Toast";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { format } from "date-fns";

const DAYS_OF_WEEK = [
    { key: "mon", label: "Mon" },
    { key: "tue", label: "Tue" },
    { key: "wed", label: "Wed" },
    { key: "thu", label: "Thu" },
    { key: "fri", label: "Fri" },
    { key: "sat", label: "Sat" },
    { key: "sun", label: "Sun" },
];

// Helper function to format time from 24-hour to 12-hour format
const formatTime = (time: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    return minutes > 0 ? `${displayHours}:${minutes.toString().padStart(2, '0')}${period}` : `${displayHours}${period}`;
};

export default function AvailabilityPage() {
    const { data: user } = useAuth();
    const { data: schedule, refetch: refetchSchedule } = useQuery(getSchedule);
    const updateScheduleAction = useAction(updateSchedule);
    const updateScheduleOverrideAction = useAction(updateScheduleOverride);
    const updateUserProfileAction = useAction(updateUserProfile);

    const [scheduleDays, setScheduleDays] = useState<{ dayOfWeek: string; startTime: string; endTime: string }[]>([]);
    const [overrides, setOverrides] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' }>>([]);
    const [initialScheduleState, setInitialScheduleState] = useState<string>("");
    const [timezone, setTimezone] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [isTimezoneOpen, setIsTimezoneOpen] = useState(false);
    const [timezoneSearchQuery, setTimezoneSearchQuery] = useState("");

    // Override modal state
    const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
    const [overrideForm, setOverrideForm] = useState({ dates: [] as string[], isUnavailable: false, startTime: "09:00", endTime: "17:00" });
    const [selectedDates, setSelectedDates] = useState<Date[] | undefined>([]);
    const [editingOverrideId, setEditingOverrideId] = useState<string | null>(null);
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

    // Maximum Appointments State
    const [maxAppointmentsMode, setMaxAppointmentsMode] = useState<string>("fully_booked");
    const [maxAppointmentsPerDay, setMaxAppointmentsPerDay] = useState<number>(0);

    useEffect(() => {
        if (schedule) {
            setScheduleDays(schedule.days || []);
            setOverrides(schedule.overrides || []);
            setInitialScheduleState(JSON.stringify({ days: schedule.days || [] }));
        } else {
            setScheduleDays([]);
        }
    }, [schedule]);

    useEffect(() => {
        if (user?.timezone) {
            setTimezone(user.timezone);
        }
        // Also load max appointments settings
        if (user) {
            setMaxAppointmentsMode((user as any).maxAppointmentsMode || "fully_booked");
            setMaxAppointmentsPerDay((user as any).maxAppointmentsPerDay || 0);
        }
    }, [user]);

    const isScheduleDirty = useMemo(() => {
        if (!initialScheduleState) return false;
        const currentState = JSON.stringify({ days: scheduleDays });
        return currentState !== initialScheduleState;
    }, [scheduleDays, initialScheduleState]);

    const addToast = (message: string, type: 'success' | 'error') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const handleSaveSchedule = async () => {
        if (!schedule?.id) return;
        setIsSaving(true);
        try {
            await updateScheduleAction({
                scheduleId: schedule.id,
                days: scheduleDays
            });

            // Also save max appointments settings to user profile
            await updateUserProfileAction({
                maxAppointmentsMode,
                maxAppointmentsPerDay
            });

            await refetchSchedule();
            addToast("Availability saved!", 'success');
        } catch (error: any) {
            addToast("Failed to save changes: " + error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateDay = (day: string, status: 'unavailable' | 'available', startTime?: string, endTime?: string) => {
        const newDays = scheduleDays.filter(d => d.dayOfWeek !== day);
        if (status === 'available') {
            newDays.push({
                dayOfWeek: day,
                startTime: startTime || "09:00",
                endTime: endTime || "17:00"
            });
        }
        setScheduleDays(newDays);
    };

    const getDayStatus = (day: string): { status: 'unavailable' | 'available'; times?: { start: string; end: string } } => {
        const daySlot = scheduleDays.find(d => d.dayOfWeek === day);
        if (!daySlot) return { status: 'unavailable' };
        return {
            status: 'available',
            times: { start: daySlot.startTime, end: daySlot.endTime }
        };
    };

    const handleEditOverride = (override: any) => {
        setSelectedDates([new Date(override.date)]);
        setOverrideForm({
            dates: [],
            isUnavailable: override.isUnavailable,
            startTime: override.startTime || "09:00",
            endTime: override.endTime || "17:00"
        });
        setEditingOverrideId(override.id);
        setIsOverrideModalOpen(true);
    };

    const handleDeleteOverride = (id: string) => {
        setDeleteConfirmationId(id);
    };

    const confirmDeleteOverride = async () => {
        if (!deleteConfirmationId || !schedule?.id) return;
        setIsSaving(true);
        try {
            await updateScheduleOverrideAction({
                scheduleId: schedule.id,
                id: deleteConfirmationId,
                dates: [],
                isUnavailable: false,
                action: 'delete'
            });
            await refetchSchedule();
            addToast("Override deleted!", "success");
            setDeleteConfirmationId(null);
        } catch (error: any) {
            addToast("Failed to delete override: " + error.message, "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleTimezoneChange = async (newTimezone: string) => {
        setTimezone(newTimezone);
        setIsTimezoneOpen(false);
        setTimezoneSearchQuery("");
        try {
            await updateUserProfileAction({
                timezone: newTimezone
            });
            addToast("Timezone updated!", 'success');
        } catch (error: any) {
            addToast("Failed to update timezone: " + error.message, 'error');
        }
    };

    const handleSaveOverride = async () => {
        if (!schedule?.id) return;
        const formattedDates = (selectedDates || []).map(d => format(d, 'yyyy-MM-dd'));
        if (formattedDates.length === 0) {
            addToast("Please select at least one date", "error");
            return;
        }
        setIsSaving(true);
        try {
            await updateScheduleOverrideAction({
                scheduleId: schedule.id,
                id: editingOverrideId || undefined,
                dates: formattedDates,
                isUnavailable: overrideForm.isUnavailable,
                startTime: overrideForm.isUnavailable ? undefined : overrideForm.startTime,
                endTime: overrideForm.isUnavailable ? undefined : overrideForm.endTime,
                action: editingOverrideId ? 'upsert' : 'upsert'
            });
            await refetchSchedule();
            setIsOverrideModalOpen(false);
            setOverrideForm({ dates: [], isUnavailable: false, startTime: "09:00", endTime: "17:00" });
            setSelectedDates([]);
            setEditingOverrideId(null);
            addToast("Override saved!", "success");
        } catch (error: any) {
            addToast("Failed to save override: " + error.message, "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="w-full max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                        Availability
                    </h1>
                    <p className="text-muted-foreground mt-1 font-medium text-sm">
                        Set your working hours and manage special dates.
                    </p>
                </div>

                {/* Weekly Schedule - Compact Table */}
                <div className="bg-background border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-black uppercase flex items-center gap-2">
                                <Clock className="size-5" />
                                Weekly Schedule
                            </h2>
                            {/* Timezone Selector */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsTimezoneOpen(!isTimezoneOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 border-2 border-black/20 text-xs font-bold bg-white hover:bg-muted/30 transition-colors"
                                >
                                    <Globe className="size-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">{timezone}</span>
                                    <ChevronDown className={cn("size-3 transition-transform", isTimezoneOpen && "rotate-180")} />
                                </button>

                                {isTimezoneOpen && (
                                    <div className="absolute top-full left-0 mt-2 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 w-80 max-h-60 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                                        <div className="p-2 border-b-2 border-black/10 sticky top-0 bg-white z-10">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                                <input
                                                    type="text"
                                                    placeholder="Search timezone..."
                                                    value={timezoneSearchQuery}
                                                    onChange={(e) => setTimezoneSearchQuery(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 text-sm font-bold border-2 border-black/20 focus:border-black focus:outline-none transition-colors"
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                        <div className="overflow-y-auto flex-1 p-1">
                                            {Intl.supportedValuesOf('timeZone')
                                                .filter(tz => tz.toLowerCase().includes(timezoneSearchQuery.toLowerCase()))
                                                .map((tz) => (
                                                    <button
                                                        key={tz}
                                                        onClick={() => handleTimezoneChange(tz)}
                                                        className={cn(
                                                            "w-full text-left px-3 py-2 text-sm font-bold hover:bg-black hover:text-white transition-colors flex items-center justify-between group",
                                                            timezone === tz && "bg-black/5"
                                                        )}
                                                    >
                                                        {tz}
                                                        {timezone === tz && (
                                                            <Check className="size-4 opacity-100 group-hover:text-white" />
                                                        )}
                                                    </button>
                                                ))}
                                            {Intl.supportedValuesOf('timeZone').filter(tz => tz.toLowerCase().includes(timezoneSearchQuery.toLowerCase())).length === 0 && (
                                                <div className="p-4 text-center text-sm font-bold text-muted-foreground">
                                                    No timezones found
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        {isScheduleDirty && (
                            <button
                                onClick={handleSaveSchedule}
                                disabled={isSaving}
                                className="bg-yellow-200 text-black px-4 py-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] font-black text-sm uppercase transition-all"
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                        )}
                    </div>

                    <div className="border-2 border-black">
                        {/* Table Header */}
                        <div className="grid grid-cols-[120px_100px_1fr] border-b-2 border-black bg-muted/30">
                            <div className="px-4 py-2 font-black text-xs uppercase border-r-2 border-black">Day</div>
                            <div className="px-4 py-2 font-black text-xs uppercase border-r-2 border-black">Status</div>
                            <div className="px-4 py-2 font-black text-xs uppercase">Hours</div>
                        </div>

                        {/* Table Rows */}
                        {DAYS_OF_WEEK.map(({ key, label }, idx) => {
                            const dayInfo = getDayStatus(key);
                            const isAvailable = dayInfo.status === 'available';

                            return (
                                <div
                                    key={key}
                                    className={cn(
                                        "grid grid-cols-[120px_100px_1fr]",
                                        idx < DAYS_OF_WEEK.length - 1 && "border-b-2 border-black"
                                    )}
                                >
                                    <div className="px-4 py-3 font-bold text-sm border-r-2 border-black flex items-center">
                                        {label}
                                    </div>
                                    <div className="px-4 py-3 border-r-2 border-black flex items-center">
                                        {/* Toggle Switch */}
                                        <button
                                            onClick={() => handleUpdateDay(key, isAvailable ? 'unavailable' : 'available')}
                                            className={cn(
                                                "relative inline-flex h-6 w-11 items-center border-2 border-black transition-colors",
                                                isAvailable ? "bg-green-400" : "bg-gray-300"
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "inline-block h-4 w-4 transform border-2 border-black bg-white transition-transform",
                                                    isAvailable ? "translate-x-5" : "translate-x-0.5"
                                                )}
                                            />
                                        </button>
                                    </div>
                                    <div className="px-4 py-3 flex items-center gap-2">
                                        {isAvailable ? (
                                            <>
                                                <input
                                                    type="time"
                                                    value={dayInfo.times?.start || "09:00"}
                                                    onChange={(e) => handleUpdateDay(key, 'available', e.target.value, dayInfo.times?.end)}
                                                    className="px-3 py-1.5 border-2 border-black font-bold text-sm flex-1"
                                                />
                                                <span className="font-black text-sm">to</span>
                                                <input
                                                    type="time"
                                                    value={dayInfo.times?.end || "17:00"}
                                                    onChange={(e) => handleUpdateDay(key, 'available', dayInfo.times?.start, e.target.value)}
                                                    className="px-3 py-1.5 border-2 border-black font-bold text-sm flex-1"
                                                />
                                            </>
                                        ) : (
                                            <span className="text-sm text-muted-foreground font-medium">Unavailable</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Maximum Appointments Section */}
                <div className="bg-background border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6">
                    <h2 className="text-lg font-black uppercase flex items-center gap-2 mb-4">
                        <Clock className="size-5" />
                        Maximum Appointments
                    </h2>
                    <p className="text-xs text-muted-foreground font-medium mb-4">
                        Control how many appointments you accept per day.
                    </p>

                    <div className="space-y-4">
                        <label className="flex items-start gap-3 cursor-pointer p-3 border-2 border-black/20 hover:border-black transition-colors">
                            <input
                                type="radio"
                                name="maxAppointmentsMode"
                                value="fully_booked"
                                checked={maxAppointmentsMode === "fully_booked"}
                                onChange={() => setMaxAppointmentsMode("fully_booked")}
                                className="w-4 h-4 mt-0.5 accent-black"
                            />
                            <div>
                                <span className="font-bold text-sm">Accept appointments until fully booked</span>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Customers can book any available time slot until all slots are filled.
                                </p>
                            </div>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer p-3 border-2 border-black/20 hover:border-black transition-colors">
                            <input
                                type="radio"
                                name="maxAppointmentsMode"
                                value="max_per_day"
                                checked={maxAppointmentsMode === "max_per_day"}
                                onChange={() => setMaxAppointmentsMode("max_per_day")}
                                className="w-4 h-4 mt-0.5 accent-black"
                            />
                            <div className="flex-1">
                                <span className="font-bold text-sm">Accept a maximum number of appointments per day</span>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Limit the total number of bookings per day regardless of available time slots.
                                </p>

                                {maxAppointmentsMode === "max_per_day" && (
                                    <div className="mt-3 flex items-center gap-3">
                                        <span className="text-sm font-bold">Max per day:</span>
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={maxAppointmentsPerDay || ""}
                                            onChange={(e) => setMaxAppointmentsPerDay(parseInt(e.target.value) || 0)}
                                            className="w-20 px-3 py-2 border-2 border-black font-bold text-center"
                                            placeholder="5"
                                        />
                                    </div>
                                )}
                            </div>
                        </label>
                    </div>
                </div>

                {/* Date Overrides - Full Width Below */}
                <div className="bg-background border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h2 className="text-lg font-black uppercase flex items-center gap-2">
                                <Calendar className="size-5" />
                                Date Overrides
                            </h2>
                            <p className="text-xs text-muted-foreground font-medium mt-1">
                                Set specific dates as unavailable (holidays, time off) or customize hours for special days
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setEditingOverrideId(null);
                                setSelectedDates([]);
                                setOverrideForm({ dates: [], isUnavailable: false, startTime: "09:00", endTime: "17:00" });
                                setIsOverrideModalOpen(true);
                            }}
                            className="bg-primary text-black px-4 py-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex items-center gap-2 font-black text-sm uppercase flex-shrink-0"
                        >
                            <Plus className="size-4" />
                            Add Override
                        </button>
                    </div>

                    {overrides && overrides.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                            {overrides.map((override) => (
                                <div key={override.id} className="p-4 border-2 border-black bg-muted/20 relative group hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                                    <p className="font-black text-sm">{format(new Date(override.date), 'MMM d, yyyy')}</p>
                                    <p className="text-xs text-muted-foreground font-medium mt-1">
                                        {override.isUnavailable ? (
                                            <span className="text-red-600 font-black">UNAVAILABLE</span>
                                        ) : (
                                            `${formatTime(override.startTime)} - ${formatTime(override.endTime)}`
                                        )}
                                    </p>
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => handleEditOverride(override)}
                                            className="flex-1 p-2 border-2 border-black bg-white hover:bg-muted text-xs font-bold uppercase"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteOverride(override.id)}
                                            className="p-2 border-2 border-black bg-red-100 hover:bg-red-200"
                                        >
                                            <Trash2 className="size-4 text-red-600" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed border-black/20 mt-4">
                            <Calendar className="size-12 mx-auto mb-3 text-muted-foreground/50" />
                            <p className="text-muted-foreground text-sm font-medium">No overrides set</p>
                            <p className="text-muted-foreground text-xs mt-1">Add special dates with custom hours or mark days as unavailable</p>
                        </div>
                    )}
                </div>

                {/* Override Modal */}
                {isOverrideModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
                        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md animate-in zoom-in-95 fade-in duration-200">
                            <div className="bg-primary px-6 py-4 border-b-4 border-black flex items-center justify-between">
                                <h2 className="text-xl font-black uppercase">{editingOverrideId ? "Edit" : "Add"} Override</h2>
                                <button onClick={() => {
                                    setIsOverrideModalOpen(false);
                                    setSelectedDates([]);
                                }} className="p-2 border-2 border-black bg-white">
                                    <X className="size-4" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-black uppercase mb-2">Select Date(s)</label>
                                    <div className="flex flex-col items-center w-full">
                                        <div className="border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                                            <DayPicker
                                                {...({
                                                    mode: editingOverrideId ? "single" : "multiple",
                                                    selected: selectedDates,
                                                    onSelect: (dates: Date | Date[] | undefined) => setSelectedDates(dates ? (Array.isArray(dates) ? dates : [dates]) : []),
                                                } as any)}
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
                                    {selectedDates && selectedDates.length > 0 && (
                                        <div className="mt-3 p-3 bg-muted/20 border-2 border-black/10">
                                            <p className="text-xs font-black uppercase mb-2">Selected Dates ({selectedDates.length})</p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedDates.map((date, idx) => (
                                                    <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-primary border border-black text-xs font-bold">
                                                        <span>{format(date, 'MMM d')}</span>
                                                        {!editingOverrideId && (
                                                            <button
                                                                onClick={() => setSelectedDates(selectedDates.filter((_, i) => i !== idx))}
                                                                className="hover:text-red-600"
                                                            >
                                                                <X className="size-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={overrideForm.isUnavailable}
                                            onChange={(e) => setOverrideForm({ ...overrideForm, isUnavailable: e.target.checked })}
                                            className="w-4 h-4 border-2 border-black"
                                        />
                                        <span className="font-bold text-sm">Mark as Unavailable</span>
                                    </label>
                                </div>
                                {!overrideForm.isUnavailable && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-black uppercase mb-2">Start</label>
                                            <input
                                                type="time"
                                                value={overrideForm.startTime}
                                                onChange={(e) => setOverrideForm({ ...overrideForm, startTime: e.target.value })}
                                                className="w-full px-3 py-2 border-2 border-black font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-black uppercase mb-2">End</label>
                                            <input
                                                type="time"
                                                value={overrideForm.endTime}
                                                onChange={(e) => setOverrideForm({ ...overrideForm, endTime: e.target.value })}
                                                className="w-full px-3 py-2 border-2 border-black font-bold"
                                            />
                                        </div>
                                    </div>
                                )}
                                <button
                                    onClick={handleSaveOverride}
                                    disabled={isSaving || !selectedDates || selectedDates.length === 0}
                                    className="w-full bg-primary text-black px-4 py-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] font-black text-sm uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? "Saving..." : `Save Override${selectedDates && selectedDates.length > 1 ? 's' : ''}`}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirmationId && (
                    <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
                        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm">
                            <div className="bg-red-500 px-6 py-4 border-b-4 border-black text-white">
                                <h2 className="text-xl font-black uppercase">Delete Override?</h2>
                            </div>
                            <div className="p-6">
                                <p className="font-bold mb-6">Are you sure you want to delete this override?</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setDeleteConfirmationId(null)}
                                        className="flex-1 py-3 border-2 border-black font-black text-sm uppercase hover:bg-muted/50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDeleteOverride}
                                        disabled={isSaving}
                                        className="flex-1 py-3 bg-red-500 text-white border-2 border-black font-black text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-70"
                                    >
                                        {isSaving ? "Deleting..." : "Delete"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <ToastContainer toasts={toasts} onRemove={removeToast} />
            </div>
        </DashboardLayout>
    );
}
