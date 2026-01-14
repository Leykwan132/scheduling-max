import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDisconnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    integrationName: string;
    isLoading?: boolean;
}

export default function ConfirmDisconnectModal({
    isOpen,
    onClose,
    onConfirm,
    integrationName,
    isLoading = false,
}: ConfirmDisconnectModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b-4 border-black">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-100 p-2 border-2 border-red-300">
                            <AlertTriangle className="size-6 text-red-600" />
                        </div>
                        <h2 className="text-xl font-black uppercase">Disconnect {integrationName}?</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 border-2 border-transparent hover:border-black transition-colors"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <p className="text-gray-700 font-medium">
                        Are you sure you want to disconnect <span className="font-bold">{integrationName}</span>?
                    </p>
                    <div className="bg-yellow-50 border-2 border-yellow-200 p-4">
                        <p className="text-sm text-yellow-800 font-medium">
                            This will remove all stored credentials and you'll need to reconnect to use this integration again.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t-4 border-black bg-gray-50">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 font-bold text-sm uppercase border-2 border-black bg-white hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 font-bold text-sm uppercase border-2 border-black bg-red-500 text-white hover:bg-red-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all disabled:opacity-50"
                    >
                        {isLoading ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                </div>
            </div>
        </div>
    );
}
