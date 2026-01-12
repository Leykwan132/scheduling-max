import DashboardLayout from "../layout/DashboardLayout";
import { TrendingUp, BarChart3, PieChart, AlertTriangle } from "lucide-react";

// Mock insights data
const mockMetrics = [
    { label: "Booking Rate", value: "87%", change: "+5%", trend: "up" },
    { label: "No-Show Rate", value: "8%", change: "-2%", trend: "down" },
    { label: "Avg Revenue/Client", value: "$68", change: "+12%", trend: "up" },
    { label: "Client Retention", value: "78%", change: "+3%", trend: "up" },
];

const mockTopServices = [
    { name: "Hair Cut", bookings: 127, revenue: 5715 },
    { name: "Full Service", bookings: 43, revenue: 6450 },
    { name: "Hair Color", bookings: 54, revenue: 6480 },
];

export default function InsightsPage() {
    return (
        <DashboardLayout>
            <div className="w-full">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                        Insights & Analytics
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium">
                        Track performance, trends, and key metrics.
                    </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {mockMetrics.map((metric) => (
                        <div
                            key={metric.label}
                            className="bg-background border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
                            <p className="text-xs font-black uppercase text-muted-foreground mb-2">{metric.label}</p>
                            <p className="text-3xl font-black mb-1">{metric.value}</p>
                            <p className={`text-xs font-bold ${metric.trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
                                {metric.change}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-6">
                    {/* Top Services */}
                    <div className="bg-background border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                        <h2 className="text-lg font-black uppercase mb-4 flex items-center gap-2">
                            <BarChart3 className="size-5" />
                            Top Services
                        </h2>
                        <div className="space-y-3">
                            {mockTopServices.map((service, index) => (
                                <div key={service.name} className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-primary border-2 border-black flex items-center justify-center font-black">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm">{service.name}</p>
                                        <p className="text-xs text-muted-foreground font-medium">
                                            {service.bookings} bookings
                                        </p>
                                    </div>
                                    <p className="font-black">${service.revenue}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* No-Show Report */}
                    <div className="bg-background border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                        <h2 className="text-lg font-black uppercase mb-4 flex items-center gap-2">
                            <AlertTriangle className="size-5" />
                            No-Show Tracking
                        </h2>
                        <div className="space-y-3">
                            <div className="p-3 border-2 border-yellow-500 bg-yellow-50">
                                <p className="font-bold text-sm">8% no-show rate</p>
                                <p className="text-xs text-muted-foreground font-medium mt-1">
                                    12 missed appointments this month
                                </p>
                            </div>
                            <div className="p-3 border-2 border-black/10">
                                <p className="font-bold text-sm">Most common day: Mondays</p>
                                <p className="text-xs text-muted-foreground font-medium mt-1">
                                    Consider reminder automation
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
