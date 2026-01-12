import DashboardLayout from "../layout/DashboardLayout";
import { Settings, Plus, Users as UsersIcon, MapPin } from "lucide-react";

// Mock team data
const mockStaff = [
    { id: 1, name: "Jane Smith", role: "Senior Stylist", bookings: 45, status: "active" },
    { id: 2, name: "John Doe", role: "Barber", bookings: 38, status: "active" },
    { id: 3, name: "Maria Garcia", role: "Stylist", bookings: 12, status: "inactive" },
];

const mockRooms = [
    { id: 1, name: "Room A", capacity: 2, status: "available" },
    { id: 2, name: "Room B", capacity: 1, status: "occupied" },
    { id: 3, name: "VIP Suite", capacity: 3, status: "available" },
];

export default function TeamPage() {
    return (
        <DashboardLayout>
            <div className="w-full">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                        Team & Spots
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium">
                        Manage staff members and room capacity.
                    </p>
                </div>

                {/* Staff Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-black uppercase flex items-center gap-2">
                            <UsersIcon className="size-5" />
                            Staff Members
                        </h2>
                        <button className="bg-primary text-black px-4 py-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex items-center gap-2 font-black text-sm uppercase">
                            <Plus className="size-4" />
                            Add Staff
                        </button>
                    </div>
                    <div className="space-y-3">
                        {mockStaff.map((staff) => (
                            <div
                                key={staff.id}
                                className="bg-background border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-black text-lg uppercase">{staff.name}</h3>
                                            <span className={`px-2 py-0.5 text-[10px] font-black border-2 border-black uppercase ${staff.status === 'active' ? 'bg-green-200' : 'bg-gray-200'
                                                }`}>
                                                {staff.status}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground mt-1">
                                            {staff.role} • {staff.bookings} bookings this month
                                        </p>
                                    </div>
                                    <button className="px-4 py-2 border-2 border-black bg-white hover:bg-muted transition-all font-black text-xs uppercase">
                                        Edit
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rooms Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-black uppercase flex items-center gap-2">
                            <MapPin className="size-5" />
                            Rooms & Spots
                        </h2>
                        <button className="bg-white text-black px-4 py-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex items-center gap-2 font-black text-sm uppercase">
                            <Plus className="size-4" />
                            Add Room
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {mockRooms.map((room) => (
                            <div
                                key={room.id}
                                className="bg-background border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            >
                                <h3 className="font-black text-lg uppercase mb-2">{room.name}</h3>
                                <p className="text-sm font-medium text-muted-foreground mb-3">
                                    Capacity: {room.capacity}
                                </p>
                                <span className={`inline-block px-2 py-1 text-[10px] font-black border-2 border-black uppercase ${room.status === 'available' ? 'bg-green-200' : 'bg-yellow-200'
                                    }`}>
                                    {room.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
