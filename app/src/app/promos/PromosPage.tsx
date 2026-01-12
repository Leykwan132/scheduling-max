import DashboardLayout from "../layout/DashboardLayout";
import { Tag, Plus, Edit, Copy } from "lucide-react";

// Mock promos data
const mockPromos = [
    { id: 1, name: "New Client 20% Off", code: "NEW20", discount: "20%", uses: 23, active: true },
    { id: 2, name: "Summer Special", code: "SUMMER50", discount: "$50", uses: 45, active: true },
    { id: 3, name: "Loyalty Reward", code: "LOYAL15", discount: "15%", uses: 67, active: true },
    { id: 4, name: "Winter Sale", code: "WINTER30", discount: "30%", uses: 12, active: false },
];

export default function PromosPage() {
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
                    <button className="bg-primary text-black px-4 py-2.5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex items-center gap-2 font-black text-sm uppercase">
                        <Plus className="size-4" />
                        Create Promo
                    </button>
                </div>

                {/* Promos List */}
                <div className="space-y-3">
                    {mockPromos.map((promo) => (
                        <div
                            key={promo.id}
                            className="bg-background border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="bg-primary p-3 border-2 border-black">
                                        <Tag className="size-5 text-black" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-black text-lg uppercase">{promo.name}</h3>
                                            <span className={`px-2 py-0.5 text-[10px] font-black border-2 border-black uppercase ${promo.active ? 'bg-green-200' : 'bg-gray-200'
                                                }`}>
                                                {promo.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1">
                                            <div className="flex items-center gap-2 px-3 py-1 bg-muted border-2 border-black/20">
                                                <span className="font-mono font-black text-sm">{promo.code}</span>
                                                <button className="hover:scale-110 transition-transform">
                                                    <Copy className="size-3" />
                                                </button>
                                            </div>
                                            <p className="text-sm font-bold text-primary">
                                                {promo.discount} discount
                                            </p>
                                            <p className="text-sm font-bold text-muted-foreground">
                                                {promo.uses} uses
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button className="p-2 border-2 border-black bg-white hover:bg-muted transition-all">
                                    <Edit className="size-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
