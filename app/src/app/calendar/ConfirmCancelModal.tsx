import { X, AlertTriangle } from "lucide-react";
import { cn } from "../../client/utils";

interface ConfirmCancelModalProps {
    customerName: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function ConfirmCancelModal({ customerName, onConfirm, onCancel, isLoading }: ConfirmCancelModalProps) {
    return (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md animate-in zoom-in-95 fade-in duration-200">
                {/* Header */}
                <div className="bg-red-500 px-6 py-4 border-b-4 border-black flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="size-6" />
                        <h2 className="text-xl font-black uppercase tracking-tight">Cancel Booking</h2>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="p-2 hover:bg-black/10 transition-colors border-2 border-black bg-white disabled:opacity-50"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-base font-bold">
                        Are you sure you want to cancel this booking for <span className="text-red-600">{customerName}</span>?
                    </p>
                    <div className="bg-blue-50 border-2 border-blue-300 p-4 rounded">
                        <p className="text-sm font-medium text-blue-900">
                            📧 A cancellation notification will be automatically sent to the customer to inform them about this change.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t-4 border-black bg-muted/20 flex gap-3 justify-end">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-6 py-3 border-2 border-black font-black text-sm uppercase hover:bg-muted/50 transition-all disabled:opacity-50"
                    >
                        Keep Booking
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={cn(
                            "px-6 py-3 bg-red-500 text-white border-2 border-black font-black text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all",
                            isLoading && "opacity-70 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? "Cancelling..." : "Yes, Cancel Booking"}
                    </button>
                </div>
            </div>
        </div>
    );
}
