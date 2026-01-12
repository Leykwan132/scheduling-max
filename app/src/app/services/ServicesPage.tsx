import DashboardLayout from "../layout/DashboardLayout";
import { Package, Plus, Edit, Trash2 } from "lucide-react";

// Mock services data
const mockServices = [
    { id: 1, name: "Hair Cut", duration: 60, price: 45, active: true, bookings: 127 },
    { id: 2, name: "Beard Trim", duration: 30, price: 25, active: true, bookings: 89 },
    { id: 3, name: "Hair Color", duration: 120, price: 120, active: true, bookings: 54 },
    { id: 4, name: "Full Service", duration: 90, price: 150, active: true, bookings: 43 },
    { id: 5, name: "Kids Cut", duration: 45, price: 30, active: false, bookings: 12 },
];

export default function ServicesPage() {
    return (
        <DashboardLayout>
            <div className="w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                            Services
                        </h1>
                        <p className="text-muted-foreground mt-2 font-medium">
                            Manage your services, pricing, and durations.
                        </p>
                    </div>
                    <button className="bg-primary text-black px-4 py-2.5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex items-center gap-2 font-black text-sm uppercase">
                        <Plus className="size-4" />
                        Add Service
                    </button>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {mockServices.map((service) => (
                        <div
                            key={service.id}
                            className="group relative bg-background border-2 border-black p-5 aspect-square flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                        >
                            <div>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="bg-primary p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        <Package className="size-4 text-black" />
                                    </div>
                                    <span className={`px-1.5 py-0.5 text-[8px] font-black border-2 border-black uppercase whitespace-nowrap ${service.active ? 'bg-green-200' : 'bg-gray-200'
                                        }`}>
                                        {service.active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <h3 className="font-black text-sm uppercase leading-tight line-clamp-2">{service.name}</h3>
                                <p className="text-[10px] text-muted-foreground mt-1 font-bold">
                                    {service.bookings} bookings
                                </p>
                            </div>

                            <div className="mt-auto pt-2 border-t-2 border-black/5">
                                <p className="text-xl font-black leading-none">${service.price}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
                                    {service.duration} min
                                </p>
                            </div>

                            <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button className="p-2 border-2 border-black bg-white hover:bg-muted transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]">
                                    <Edit className="size-4" />
                                </button>
                                <button className="p-2 border-2 border-black bg-red-100 hover:bg-red-200 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]">
                                    <Trash2 className="size-4 text-red-600" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
