import { useState } from "react";
import { useQuery, getCustomersByBusiness } from "wasp/client/operations";
import DashboardLayout from "../layout/DashboardLayout";
import { Users, Plus, Mail, Phone, Search, Loader2 } from "lucide-react";

export default function ClientsPage() {
    const { data: clients, isLoading, error } = useQuery(getCustomersByBusiness);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredClients = clients?.filter((client: any) =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone.includes(searchQuery)
    );

    const formatDate = (dateString?: string) => {
        if (!dateString) return "No visits yet";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <DashboardLayout>
            <div className="w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                            Customers
                        </h1>
                        <p className="text-muted-foreground mt-2 font-medium">
                            Manage your client database and history.
                        </p>
                    </div>
                    <button className="bg-primary text-black px-4 py-2.5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex items-center gap-2 font-black text-sm uppercase">
                        <Plus className="size-4" />
                        Add Customer
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search customers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border-2 border-black font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        />
                    </div>
                </div>

                {/* Clients List */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="animate-spin size-8 text-primary" />
                    </div>
                ) : error ? (
                    <div className="text-red-500 font-medium">Error loading customers: {error.message}</div>
                ) : (
                    <div className="space-y-3">
                        {filteredClients?.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground font-medium">
                                No customers found.
                            </div>
                        ) : (
                            filteredClients?.map((client: any) => (
                                <div
                                    key={client.id}
                                    className="bg-background border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                                >
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="bg-primary p-3 border-2 border-black shrink-0">
                                                <Users className="size-5 text-black" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-black text-lg uppercase truncate">{client.name}</h3>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
                                                    {client.email && (
                                                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1 truncate">
                                                            <Mail className="size-3 shrink-0" />
                                                            {client.email}
                                                        </p>
                                                    )}
                                                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1 truncate">
                                                        <Phone className="size-3 shrink-0" />
                                                        {client.phone}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-left sm:text-right shrink-0">
                                            <p className="text-sm font-black whitespace-nowrap">
                                                {client._count?.bookings || 0} visits
                                            </p>
                                            <p className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                                                Last: {formatDate(client.bookings?.[0]?.date)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
