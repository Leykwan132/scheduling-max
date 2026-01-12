import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../client/utils";

interface CalendarHeaderProps {
    currentDate: Date;
    view: 'month' | 'week';
    onPrev: () => void;
    onNext: () => void;
    onToday: () => void;
    onViewChange: (view: 'month' | 'week') => void;
}

export default function CalendarHeader({
    currentDate,
    view,
    onPrev,
    onNext,
    onToday,
    onViewChange
}: CalendarHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-background border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-center gap-1">
                    <button
                        onClick={onPrev}
                        className="p-1 hover:bg-muted border-2 border-transparent hover:border-black transition-all"
                    >
                        <ChevronLeft className="size-5" />
                    </button>
                    <button
                        onClick={onNext}
                        className="p-1 hover:bg-muted border-2 border-transparent hover:border-black transition-all"
                    >
                        <ChevronRight className="size-5" />
                    </button>
                    <button
                        onClick={onToday}
                        className="ml-2 px-3 py-1 text-xs font-black uppercase border-2 border-black hover:bg-muted transition-all"
                    >
                        Today
                    </button>
                </div>

                <h2 className="text-xl font-black uppercase tracking-tight min-w-[150px] text-center sm:text-left">
                    {format(currentDate, 'MMMM yyyy')}
                </h2>
            </div>

            <div className="flex bg-muted p-1 border-2 border-black gap-1">
                <button
                    onClick={() => onViewChange('month')}
                    className={cn(
                        "px-4 py-1.5 text-xs font-black uppercase transition-all",
                        view === 'month'
                            ? "bg-primary border-2 border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            : "text-muted-foreground hover:text-black"
                    )}
                >
                    Month
                </button>
                <button
                    onClick={() => onViewChange('week')}
                    className={cn(
                        "px-4 py-1.5 text-xs font-black uppercase transition-all",
                        view === 'week'
                            ? "bg-primary border-2 border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            : "text-muted-foreground hover:text-black"
                    )}
                >
                    Week
                </button>
            </div>
        </div>
    );
}
