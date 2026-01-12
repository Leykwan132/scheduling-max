import DashboardLayout from "./layout/DashboardLayout";
import { useAuth } from "wasp/client/auth";
import { Link } from "react-router-dom";
import {
    Link as LinkIcon,
    ExternalLink,
    TrendingUp,
    Calendar,
    Users,
    DollarSign,
    Clock,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";

// Mock data for now - this would come from actual queries later
const mockStats = [
    {
        label: "Total Bookings",
        value: "127",
        change: "+12%",
        trend: "up",
        icon: Calendar,
    },
    {
        label: "Revenue",
        value: "$2,450",
        change: "+8%",
        trend: "up",
        icon: DollarSign,
    },
    {
        label: "New Clients",
        value: "23",
        change: "+18%",
        trend: "up",
        icon: Users,
    },
    {
        label: "Avg. Session",
        value: "45m",
        change: "-5%",
        trend: "down",
        icon: Clock,
    },
];

const mockUpcomingAppointments = [
    { id: 1, client: "Sarah Johnson", service: "Hair Cut", time: "10:00 AM", date: "Today" },
    { id: 2, client: "Mike Chen", service: "Beard Trim", time: "11:30 AM", date: "Today" },
    { id: 3, client: "Emma Wilson", service: "Hair Color", time: "2:00 PM", date: "Today" },
    { id: 4, client: "James Brown", service: "Full Service", time: "9:00 AM", date: "Tomorrow" },
    { id: 5, client: "Lisa Davis", service: "Hair Cut", time: "10:30 AM", date: "Tomorrow" },
];

const mockWeeklyData = [
    { day: "Mon", bookings: 8 },
    { day: "Tue", bookings: 12 },
    { day: "Wed", bookings: 6 },
    { day: "Thu", bookings: 15 },
    { day: "Fri", bookings: 18 },
    { day: "Sat", bookings: 22 },
    { day: "Sun", bookings: 4 },
];

export default function DashboardPage() {
    const { data: user } = useAuth();
    const maxBookings = Math.max(...mockWeeklyData.map(d => d.bookings));

    return (
        <DashboardLayout>
            <div className="w-full">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                        Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}!
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium">
                        Here's what's happening with your business today.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {mockStats.map((stat) => (
                        <div
                            key={stat.label}
                            className="bg-background border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="bg-primary p-1.5 border-2 border-black">
                                    <stat.icon className="size-4 text-black" />
                                </div>
                                <div className={`flex items-center gap-1 text-xs font-bold ${stat.trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
                                    {stat.change}
                                    {stat.trend === 'up' ? (
                                        <ArrowUpRight className="size-3" />
                                    ) : (
                                        <ArrowDownRight className="size-3" />
                                    )}
                                </div>
                            </div>
                            <p className="text-2xl font-black">{stat.value}</p>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mt-1">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Weekly Bookings Chart */}
                    <div className="lg:col-span-2 bg-background border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                <TrendingUp className="size-5" />
                                Weekly Bookings
                            </h2>
                            <span className="text-xs font-bold text-muted-foreground uppercase">Last 7 days</span>
                        </div>

                        {/* Simple Bar Chart */}
                        <div className="flex items-end justify-between gap-2 h-40">
                            {mockWeeklyData.map((data) => (
                                <div key={data.day} className="flex-1 flex flex-col items-center gap-2">
                                    <div
                                        className="w-full bg-primary border-2 border-black transition-all hover:bg-primary/80"
                                        style={{ height: `${(data.bookings / maxBookings) * 100}%`, minHeight: '8px' }}
                                    />
                                    <span className="text-[10px] font-bold uppercase">{data.day}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t-2 border-black/10 flex items-center justify-between">
                            <p className="text-sm font-bold text-muted-foreground">
                                Total: <span className="text-foreground">{mockWeeklyData.reduce((sum, d) => sum + d.bookings, 0)} bookings</span>
                            </p>
                            <p className="text-xs font-bold text-green-600 flex items-center gap-1">
                                <ArrowUpRight className="size-3" />
                                15% vs last week
                            </p>
                        </div>
                    </div>

                    {/* Upcoming Appointments */}
                    <div className="bg-background border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                <Calendar className="size-5" />
                                Upcoming
                            </h2>
                            <Link to="/app/calendar" className="text-xs font-bold text-primary uppercase hover:underline">
                                View All
                            </Link>
                        </div>

                        <div className="space-y-3">
                            {mockUpcomingAppointments.slice(0, 5).map((appointment) => (
                                <div
                                    key={appointment.id}
                                    className="flex items-center gap-3 p-2 border-2 border-black/10 hover:border-black hover:bg-muted/50 transition-all"
                                >
                                    <div className="bg-muted p-2 border-2 border-black/20">
                                        <Clock className="size-3 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold truncate">{appointment.client}</p>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase">
                                            {appointment.service}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold">{appointment.time}</p>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase">
                                            {appointment.date}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8">
                    <h2 className="text-lg font-black uppercase tracking-tight mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Links Card */}
                        <Link to="/app/links" className="group block">
                            <div className="bg-background border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_hsl(312,100%,78%)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-primary p-2 border-2 border-black">
                                        <LinkIcon className="size-5 text-black" />
                                    </div>
                                    <h3 className="text-lg font-black uppercase tracking-tight">
                                        Manage Links
                                    </h3>
                                </div>
                                <p className="text-muted-foreground font-medium text-sm">
                                    Update your booking page, services, and pricing.
                                </p>
                                <div className="mt-3 flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wide group-hover:underline">
                                    Go to Links
                                    <ExternalLink className="size-3" />
                                </div>
                            </div>
                        </Link>

                        {/* Settings Card */}
                        <Link to="/app/settings" className="group block">
                            <div className="bg-background border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_hsl(312,100%,78%)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-muted p-2 border-2 border-black">
                                        <span className="text-lg">⚙️</span>
                                    </div>
                                    <h3 className="text-lg font-black uppercase tracking-tight">
                                        Settings
                                    </h3>
                                </div>
                                <p className="text-muted-foreground font-medium text-sm">
                                    Manage your account, notifications, and preferences.
                                </p>
                                <div className="mt-3 flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wide group-hover:underline">
                                    Go to Settings
                                    <ExternalLink className="size-3" />
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
