import { useRef, useEffect, useState } from "react";
import { X, Phone, User, Clock, Briefcase, Edit2, Check, Loader2 } from "lucide-react";
import { cn } from "../../client/utils";
import ConfirmCancelModal from "./ConfirmCancelModal";

interface Appointment {
    id: number;
    time: string;
    client: string;
    service: string;
    status: string;
    duration?: string;
    date: Date;
    staff?: string;
    phone?: string;
}

interface BookingPopupProps {
    appointment: Appointment;
    position: { top: number; left: number; right: number; bottom: number };
    onClose: () => void;
    onEdit?: () => void;
    onConfirm?: (id: number) => Promise<void>;
    onCancel?: (id: number) => Promise<void>;
}

// Format time with AM/PM
const formatTimeWithAMPM = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export default function BookingPopup({ appointment, position, onClose, onEdit, onConfirm, onCancel }: BookingPopupProps) {
    const popupRef = useRef<HTMLDivElement>(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    const handleConfirm = async () => {
        if (!onConfirm) return;
        setIsConfirming(true);
        try {
            await onConfirm(appointment.id);
        } finally {
            setIsConfirming(false);
        }
    };

    const handleCancelClick = () => {
        setShowCancelModal(true);
    };

    const handleCancelConfirm = async () => {
        if (!onCancel) return;
        setIsCancelling(true);
        try {
            await onCancel(appointment.id);
            setShowCancelModal(false);
        } finally {
            setIsCancelling(false);
        }
    };

    // Calculate dynamic position
    const calculatePosition = () => {
        const popupWidth = 260;
        const popupHeight = 360; // Increased height for Edit button
        const padding = 10;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left: number;
        let top: number;

        // Horizontal positioning: prefer left, fallback to right
        if (position.left - popupWidth - padding > 0) {
            // Place to the left of the element
            left = position.left - popupWidth - padding;
        } else if (position.right + popupWidth + padding < viewportWidth) {
            // Place to the right of the element
            left = position.right + padding;
        } else {
            // Center it if neither side works
            left = Math.max(padding, (viewportWidth - popupWidth) / 2);
        }

        // Vertical positioning: check if we're in the bottom half of the viewport
        const elementMiddle = (position.top + position.bottom) / 2;
        const isInBottomHalf = elementMiddle > viewportHeight / 2;

        if (isInBottomHalf) {
            // If in bottom half, position popup above the element
            top = position.top - popupHeight - padding;

            // Make sure it doesn't go above viewport
            if (top < padding) {
                top = padding;
            }
        } else {
            // If in top half, align with element top
            top = position.top;

            // If popup would go below viewport, move it up
            if (top + popupHeight > viewportHeight - padding) {
                top = viewportHeight - popupHeight - padding;
            }
        }

        // Final check: ensure popup is always visible
        top = Math.max(padding, Math.min(top, viewportHeight - popupHeight - padding));

        return { left, top };
    };

    const { left, top } = calculatePosition();

    // Close popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    return (
        <div
            ref={popupRef}
            style={{
                position: 'fixed',
                top: `${top}px`,
                left: `${left}px`,
            }}
            className="w-64 bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-[100] animate-in fade-in zoom-in-95 duration-150"
        >
            {/* Popup Header */}
            <div className={cn(
                "px-4 py-3 border-b-2 border-black flex items-center justify-between",
                appointment.status === 'confirmed' ? "bg-green-200" : "bg-yellow-200"
            )}>
                <span className="font-black uppercase text-sm">Booking Details</span>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-black/10 transition-colors"
                >
                    <X className="size-4" />
                </button>
            </div>

            {/* Popup Content */}
            <div className="p-4 space-y-3">
                {/* Customer Name */}
                <div className="flex items-start gap-3">
                    <User className="size-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div>
                        <p className="text-xs font-bold uppercase text-muted-foreground">Customer</p>
                        <p className="font-black text-sm">{appointment.client}</p>
                    </div>
                </div>

                {/* Phone Number */}
                <div className="flex items-start gap-3">
                    <Phone className="size-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div>
                        <p className="text-xs font-bold uppercase text-muted-foreground">Phone</p>
                        <p className="font-bold text-sm">{appointment.phone || '+1 (555) 123-4567'}</p>
                    </div>
                </div>

                {/* Time */}
                <div className="flex items-start gap-3">
                    <Clock className="size-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div>
                        <p className="text-xs font-bold uppercase text-muted-foreground">Time</p>
                        <p className="font-bold text-sm">
                            {formatTimeWithAMPM(appointment.time)}
                            {appointment.duration && ` • ${appointment.duration}`}
                        </p>
                    </div>
                </div>

                {/* Staff in Charge */}
                <div className="flex items-start gap-3">
                    <Briefcase className="size-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div>
                        <p className="text-xs font-bold uppercase text-muted-foreground">Staff in Charge</p>
                        <p className="font-bold text-sm">{appointment.staff || 'Not Assigned'}</p>
                    </div>
                </div>

                {/* Service */}
                <div className="pt-2 border-t border-black/10">
                    <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Service</p>
                    <p className="font-black text-sm">{appointment.service}</p>
                </div>

                {/* Status Badge */}
                <div className="pt-2">
                    <span className={cn(
                        "text-xs font-black uppercase px-2 py-1 border-2 border-black",
                        appointment.status === 'confirmed' ? "bg-green-200" : "bg-yellow-200"
                    )}>
                        {appointment.status}
                    </span>
                </div>
            </div>

            {/* Action Button */}
            {appointment.status === 'pending' && onConfirm ? (
                <div className="p-3 border-t-2 border-black">
                    <button
                        onClick={handleConfirm}
                        disabled={isConfirming}
                        className={cn(
                            "w-full bg-green-500 text-white px-4 py-2 border-2 border-black font-black text-sm uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2",
                            isConfirming && "opacity-70 cursor-not-allowed"
                        )}
                    >
                        {isConfirming ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                Confirming...
                            </>
                        ) : (
                            <>
                                <Check className="size-4" />
                                Confirm Booking
                            </>
                        )}
                    </button>
                </div>
            ) : onEdit && (
                <>
                    <div className="p-3 border-t-2 border-black">
                        <button
                            onClick={onEdit}
                            className="w-full bg-primary text-black px-4 py-2 border-2 border-black font-black text-sm uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2"
                        >
                            <Edit2 className="size-4" />
                            Edit Booking
                        </button>
                    </div>
                    {onCancel && (
                        <div className="px-3 pb-3">
                            <button
                                onClick={handleCancelClick}
                                disabled={isCancelling}
                                className={cn(
                                    "w-full bg-red-500 text-white px-4 py-2 border-2 border-black font-black text-sm uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2",
                                    isCancelling && "opacity-70 cursor-not-allowed"
                                )}
                            >
                                {isCancelling ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Cancelling...
                                    </>
                                ) : (
                                    <>
                                        <X className="size-4" />
                                        Cancel Booking
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Cancel Confirmation Modal */}
            {showCancelModal && (
                <ConfirmCancelModal
                    customerName={appointment.client}
                    onConfirm={handleCancelConfirm}
                    onCancel={() => setShowCancelModal(false)}
                    isLoading={isCancelling}
                />
            )}
        </div>
    );
}
