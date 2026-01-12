import DashboardLayout from "../layout/DashboardLayout";
import { Users, Plus, Mail, Phone, Search } from "lucide-react";

// Mock clients data
const mockClients = [
    { id: 1, name: "Sarah Johnson", email: "sarah@email.com", phone: "(555) 123-4567", totalBookings: 12, lastVisit: "Jan 5, 2026" },
    { id: 2, name: "Mike Chen", email: "mike@email.com", phone: "(555) 234-5678", totalBookings: 8, lastVisit: "Jan 8, 2026" },
    { id: 3, name: "Emma Wilson", email: "emma@email.com", phone: "(555) 345-6789", totalBookings: 15, lastVisit: "Jan 10, 2026" },
    { id: 4, name: "James Brown", email: "james@email.com", phone: "(555) 456-7890", totalBookings: 6, lastVisit: "Jan 9, 2026" },
    { id: 5, name: "Lisa Davis", email: "lisa@email.com", phone: "(555) 567-8901", totalBookings: 10, lastVisit: "Jan 11, 2026" },
];

export default function ClientsPage() {
    return (
        <DashboardLayout>
            <div className="w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                            Clients
                        </h1>
                        <p className="text-muted-foreground mt-2 font-medium">
                            Manage your client database and history.
                        </p>
                    </div>
                    <button className="bg-primary text-black px-4 py-2.5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex items-center gap-2 font-black text-sm uppercase">
                        <Plus className="size-4" />
                        Add Client
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search clients..."
                            className="w-full pl-12 pr-4 py-3 border-2 border-black font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        />
                    </div>
                </div>

                {/* Clients List */}
                <div className="space-y-3">
                    {mockClients.map((client) => (
                        <div
                            key={client.id}
                            className="bg-background border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="bg-primary p-3 border-2 border-black">
                                        <Users className="size-5 text-black" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-black text-lg uppercase">{client.name}</h3>
                                        <div className="flex items-center gap-4 mt-1">
                                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                                <Mail className="size-3" />
                                                {client.email}
                                            </p>
                                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                                <Phone className="size-3" />
                                                {client.phone}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black">{client.totalBookings} visits</p>
                                    <p className="text-xs font-medium text-muted-foreground">Last: {client.lastVisit}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
