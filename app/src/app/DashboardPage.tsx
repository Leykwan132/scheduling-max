import DashboardLayout from "./layout/DashboardLayout";
import { useAuth } from "wasp/client/auth";
import { useQuery } from "wasp/client/operations";
import { getOnboardingStatus } from "wasp/client/operations";
import { Link } from "react-router-dom";
import {
    TrendingUp,
    Calendar,
    Users,
    DollarSign,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    CheckCircle2,
    Circle,
    ArrowRight
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
    const { data: onboardingStatus } = useQuery(getOnboardingStatus);
    const maxBookings = Math.max(...mockWeeklyData.map(d => d.bookings));

    const onboardingSteps = [
        {
            key: 'services',
            label: 'Create appointment types',
            completed: onboardingStatus?.hasServices || false,
            link: '/app/services'
        },
        {
            key: 'availability',
            label: 'Set your availability',
            completed: onboardingStatus?.hasAvailability || false,
            link: '/app/availability'
        },
        {
            key: 'design',
            label: 'Customize design',
            completed: onboardingStatus?.hasCustomizedDesign || false,
            link: '/app/setup?tab=style'
        }
    ];

    const isOnboardingComplete = onboardingStatus?.completionPercentage === 100;

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

                {/* Onboarding Checklist - Only show if not complete */}
                {!isOnboardingComplete && onboardingStatus && (
                    <div className="bg-background border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
                        <div className="flex items-center justify-between p-4 border-b-2 border-black/10">
                            <h2 className="font-black uppercase tracking-tight">Set up your scheduling page</h2>
                            <div className="flex items-center gap-2">
                                <div className="relative size-8">
                                    <svg className="size-8 -rotate-90" viewBox="0 0 36 36">
                                        <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                                        <circle
                                            cx="18" cy="18" r="15"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeDasharray={`${(onboardingStatus.completionPercentage / 100) * 94.2} 94.2`}
                                            className="text-primary"
                                        />
                                    </svg>
                                </div>
                                <span className="text-sm font-bold">{onboardingStatus.completionPercentage}%</span>
                            </div>
                        </div>
                        <div className="divide-y divide-black/10">
                            {onboardingSteps.map((step) => (
                                <Link
                                    key={step.key}
                                    to={step.link}
                                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        {step.completed ? (
                                            <CheckCircle2 className="size-5 text-green-600" />
                                        ) : (
                                            <Circle className="size-5 text-gray-300" />
                                        )}
                                        <span className={`font-medium ${step.completed ? 'text-muted-foreground line-through' : ''}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                    <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Dashboard Data - Only show when onboarding is complete */}
                {isOnboardingComplete && (
                    <>
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
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
