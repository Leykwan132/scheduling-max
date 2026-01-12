import { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../utils';

export type ToastType = 'success' | 'error';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation
        setTimeout(() => setIsVisible(true), 10);

        // Auto-dismiss after 3 seconds
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for fade out animation
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div
            className={cn(
                "fixed top-4 right-4 z-[100] transition-all duration-300 transform",
                isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
            )}
        >
            <div
                className={cn(
                    "flex items-center gap-3 px-4 py-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-w-[300px] max-w-md",
                    type === 'success' ? "bg-green-200" : "bg-red-200"
                )}
            >
                {type === 'success' ? (
                    <CheckCircle2 className="size-5 flex-shrink-0" />
                ) : (
                    <AlertCircle className="size-5 flex-shrink-0" />
                )}
                <p className="font-bold text-sm flex-1">{message}</p>
                <button
                    onClick={() => {
                        setIsVisible(false);
                        setTimeout(onClose, 300);
                    }}
                    className="hover:bg-black/10 p-1 transition-colors"
                >
                    <X className="size-4" />
                </button>
            </div>
        </div>
    );
}

// Toast container component
interface ToastContainerProps {
    toasts: Array<{ id: string; message: string; type: ToastType }>;
    onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    return (
        <>
            {toasts.map((toast, index) => (
                <div key={toast.id} style={{ top: `${16 + index * 80}px` }} className="fixed right-4 z-[100]">
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => onRemove(toast.id)}
                    />
                </div>
            ))}
        </>
    );
}
