import DashboardLayout from "./layout/DashboardLayout";
import { useAuth } from "wasp/client/auth";
import { useQuery } from "wasp/client/operations";
import { getOnboardingStatus, getDashboardStats, getBusinessByUser } from "wasp/client/operations";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import OnboardingModal from "./onboarding/OnboardingModal";
import { toast } from "../client/hooks/use-toast";
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
    ArrowRight,
    Loader2
} from "lucide-react";

type PeriodOption = 'today' | '7days' | '30days' | 'year';

export default function DashboardPage() {
    const { data: user } = useAuth();
    const { data: onboardingStatus, refetch: refetchOnboarding } = useQuery(getOnboardingStatus);
    const { data: business, isLoading: isLoadingBusiness, refetch: refetchBusiness } = useQuery(getBusinessByUser);
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('7days');
    const [showOnboardingModal, setShowOnboardingModal] = useState(false);

    // Check if we should show the onboarding modal
    useEffect(() => {
        // Show modal if user is loaded and either:
        // 1. They don't have a business linked
        // 2. They haven't completed onboarding (onboardingCompleted is false)
        if (user && !isLoadingBusiness) {
            const needsOnboarding = !business || (user as any).onboardingCompleted === false;
            setShowOnboardingModal(needsOnboarding);
        }
    }, [user, business, isLoadingBusiness]);

    // Show toast when onboarding is completed (only once ever)
    useEffect(() => {
        const toastKey = `onboarding-toast-shown-${user?.id}`;
        const hasShownToast = localStorage.getItem(toastKey) === 'true';

        if (onboardingStatus?.completionPercentage === 100 && !hasShownToast) {
            localStorage.setItem(toastKey, 'true');
            toast({
                title: "🎉 Congratulations!",
                description: "You've completed all onboarding tasks. Your scheduling page is ready!",
            });
        }
    }, [onboardingStatus?.completionPercentage, user?.id]);

    const handleOnboardingComplete = () => {
        setShowOnboardingModal(false);
        // Refetch data to get the newly created business
        refetchBusiness();
        refetchOnboarding();
        // Force reload to ensure all data is fresh
        window.location.reload();
    };

    const { data: dashboardStats, isLoading: isLoadingStats } = useQuery(
        getDashboardStats,
        { period: selectedPeriod }
    );

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

    const periodOptions: { value: PeriodOption; label: string }[] = [
        { value: 'today', label: 'Today' },
        { value: '7days', label: '7 Days' },
        { value: '30days', label: '30 Days' },
        { value: 'year', label: 'This Year' },
    ];

    const stats = dashboardStats ? [
        {
            label: "Total Bookings",
            value: dashboardStats.totalBookings.toString(),
            change: `${dashboardStats.totalBookingsChange >= 0 ? '+' : ''}${dashboardStats.totalBookingsChange}%`,
            trend: dashboardStats.totalBookingsChange >= 0 ? 'up' : 'down',
            icon: Calendar,
        },
        {
            label: "Revenue",
            value: `$${dashboardStats.revenue.toLocaleString()}`,
            change: `${dashboardStats.revenueChange >= 0 ? '+' : ''}${dashboardStats.revenueChange}%`,
            trend: dashboardStats.revenueChange >= 0 ? 'up' : 'down',
            icon: DollarSign,
        },
        {
            label: "New Clients",
            value: dashboardStats.newClients.toString(),
            change: `${dashboardStats.newClientsChange >= 0 ? '+' : ''}${dashboardStats.newClientsChange}%`,
            trend: dashboardStats.newClientsChange >= 0 ? 'up' : 'down',
            icon: Users,
        },
        {
            label: "Avg. Session",
            value: `${dashboardStats.avgSessionMinutes}m`,
            change: `${dashboardStats.avgSessionChange >= 0 ? '+' : ''}${dashboardStats.avgSessionChange}%`,
            trend: dashboardStats.avgSessionChange >= 0 ? 'up' : 'down',
            icon: Clock,
        },
    ] : [];

    const chartData = dashboardStats?.chartData || [];
    const maxBookings = Math.max(...chartData.map(d => d.bookings), 1);
    const totalChartBookings = chartData.reduce((sum, d) => sum + d.bookings, 0);

    return (
        <>
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
                            {/* Period Filter */}
                            <div className="flex items-center gap-2 mb-6 flex-wrap">
                                {periodOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setSelectedPeriod(option.value)}
                                        className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-2 border-black transition-all ${selectedPeriod === option.value
                                            ? 'bg-primary text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                            : 'bg-background hover:bg-muted'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>

                            {isLoadingStats ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <>
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                        {stats.map((stat) => (
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
                                        {/* Bookings Chart */}
                                        <div className="lg:col-span-2 bg-background border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                            <div className="flex items-center justify-between mb-6">
                                                <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                                    <TrendingUp className="size-5" />
                                                    Bookings
                                                </h2>
                                                <span className="text-xs font-bold text-muted-foreground uppercase">
                                                    {selectedPeriod === 'today' ? 'Today' : selectedPeriod === '7days' ? 'Last 7 days' : selectedPeriod === '30days' ? 'Last 30 days' : 'This Year'}
                                                </span>
                                            </div>

                                            {/* Bar Chart */}
                                            <div className="flex items-end justify-between gap-1 h-40 overflow-x-auto">
                                                {chartData.map((data, idx) => (
                                                    <div key={idx} className="flex-1 min-w-[20px] flex flex-col items-center gap-2">
                                                        <div
                                                            className="w-full bg-primary border-2 border-black transition-all hover:bg-primary/80"
                                                            style={{ height: `${(data.bookings / maxBookings) * 100}%`, minHeight: data.bookings > 0 ? '8px' : '2px' }}
                                                        />
                                                        <span className="text-[8px] font-bold uppercase truncate max-w-full">{data.label}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-4 pt-4 border-t-2 border-black/10 flex items-center justify-between">
                                                <p className="text-sm font-bold text-muted-foreground">
                                                    Total: <span className="text-foreground">{totalChartBookings} bookings</span>
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
                                                {dashboardStats?.upcomingAppointments.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground font-medium py-4 text-center">
                                                        No upcoming appointments
                                                    </p>
                                                ) : (
                                                    dashboardStats?.upcomingAppointments.map((appointment: any) => (
                                                        <div
                                                            key={appointment.id}
                                                            className="flex items-center gap-3 p-2 border-2 border-black/10 hover:border-black hover:bg-muted/50 transition-all"
                                                        >
                                                            <div className="bg-muted p-2 border-2 border-black/20">
                                                                <Clock className="size-3 text-muted-foreground" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold truncate">{appointment.clientName}</p>
                                                                <p className="text-[10px] text-muted-foreground font-medium uppercase">
                                                                    {appointment.serviceName}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs font-bold">{appointment.time}</p>
                                                                <p className="text-[10px] text-muted-foreground font-medium uppercase">
                                                                    {appointment.date}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </DashboardLayout>

            {/* Onboarding Modal for new users */}
            {
                showOnboardingModal && (
                    <OnboardingModal onComplete={handleOnboardingComplete} />
                )
            }
        </>
    );
}

