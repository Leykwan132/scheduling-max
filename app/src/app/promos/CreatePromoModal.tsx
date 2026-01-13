import { useState } from "react";
import { useAction, createPromo } from "wasp/client/operations";
import { Loader2, X } from "lucide-react";

interface CreatePromoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreatePromoModal({ isOpen, onClose, onSuccess }: CreatePromoModalProps) {
    const createPromoAction = useAction(createPromo);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        code: "",
        type: "percent", // "percent" | "fixed"
        value: "",
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await createPromoAction({
                code: formData.code.toUpperCase(),
                type: formData.type,
                value: parseFloat(formData.value)
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to create promo");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="bg-background border-2 border-black w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b-2 border-black bg-muted">
                    <h2 className="font-black text-xl uppercase">Create New Promo</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black rounded-sm"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm font-medium border-2 border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wide">
                                Promo Code
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="SUMMER2025"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                className="w-full p-3 border-2 border-black font-bold focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all outline-none"
                            />
                            <p className="text-xs text-muted-foreground font-medium">
                                Codes are automatically uppercase.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold uppercase tracking-wide">
                                    Type
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full p-3 border-2 border-black font-bold focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all outline-none appearance-none bg-white"
                                >
                                    <option value="percent">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount ($)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold uppercase tracking-wide">
                                    Value
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step={formData.type === "percent" ? "1" : "0.01"}
                                        max={formData.type === "percent" ? "100" : undefined}
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                        className="w-full p-3 border-2 border-black font-bold focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all outline-none"
                                        placeholder={formData.type === "percent" ? "20" : "50.00"}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-muted-foreground pointer-events-none">
                                        {formData.type === "percent" ? "%" : "$"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary text-black p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-black uppercase tracking-wide disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin size-5" />
                                    Creating...
                                </>
                            ) : (
                                "Create Promo"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
