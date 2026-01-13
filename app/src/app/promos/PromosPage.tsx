import { useState } from "react";
import { useQuery, useAction, getPromosByBusiness, updatePromo, deletePromo } from "wasp/client/operations";
import DashboardLayout from "../layout/DashboardLayout";
import { Tag, Plus, Trash2, Copy, Loader2 } from "lucide-react";
import CreatePromoModal from "./CreatePromoModal";

export default function PromosPage() {
    const { data: promos, isLoading, error } = useQuery(getPromosByBusiness);
    const updatePromoAction = useAction(updatePromo);
    const deletePromoAction = useAction(deletePromo);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            await updatePromoAction({ id, isActive: !currentStatus });
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this promo code?")) {
            try {
                await deletePromoAction({ id });
            } catch (error) {
                console.error("Failed to delete promo", error);
            }
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add a toast notification here
    };

    return (
        <DashboardLayout>
            <div className="w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                            Promos & Discounts
                        </h1>
                        <p className="text-muted-foreground mt-2 font-medium">
                            Create and manage promotional codes and gift cards.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-primary text-black px-4 py-2.5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex items-center gap-2 font-black text-sm uppercase"
                    >
                        <Plus className="size-4" />
                        Create Promo
                    </button>
                </div>

                {/* Promos List */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="animate-spin size-8 text-primary" />
                    </div>
                ) : error ? (
                    <div className="text-red-500 font-medium">Error loading promos: {error.message}</div>
                ) : (
                    <div className="space-y-3">
                        {promos?.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground font-medium">
                                No active promotions. Create one to get started!
                            </div>
                        ) : (
                            promos?.map((promo: any) => (
                                <div
                                    key={promo.id}
                                    className={`bg-background border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${!promo.isActive ? 'opacity-70' : ''}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className={`p-3 border-2 border-black ${promo.isActive ? 'bg-primary' : 'bg-gray-200'}`}>
                                                <Tag className="size-5 text-black" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-black text-lg uppercase">{promo.code}</h3>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleToggleActive(promo.id, promo.isActive)}
                                                            className={`relative inline-flex h-6 w-11 items-center rounded-full border-2 border-black transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${promo.isActive ? 'bg-green-400' : 'bg-gray-200'
                                                                }`}
                                                        >
                                                            <span
                                                                className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${promo.isActive ? 'translate-x-[22px]' : 'translate-x-1'
                                                                    }`}
                                                            />
                                                        </button>
                                                        <span className="text-xs font-black uppercase">
                                                            {promo.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <p className="text-sm font-bold text-primary">
                                                        {promo.type === 'percent' ? `${promo.value}% OFF` : `$${promo.value} OFF`}
                                                    </p>
                                                    <button
                                                        onClick={() => copyToClipboard(promo.code)}
                                                        className="text-muted-foreground hover:text-black transition-colors"
                                                        title="Copy Code"
                                                    >
                                                        <Copy className="size-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(promo.id)}
                                            className="p-2 border-2 border-black bg-white hover:bg-red-100 hover:text-red-600 transition-all ml-4"
                                            title="Delete Promo"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                <CreatePromoModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={() => {
                        // Refetch is handled automatically by Wasp's useQuery cache invalidation?
                        // If not, we might need to invalidate explicitly, but usually actions invalidate basic entity queries.
                    }}
                />
            </div>
        </DashboardLayout>
    );
}
