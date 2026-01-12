import DashboardLayout from "../layout/DashboardLayout";
import { DollarSign, TrendingUp, CreditCard, Download } from "lucide-react";

// Mock financial data
const mockRevenue = [
    { month: "Jan", revenue: 4500, payouts: 4200, pending: 300 },
    { month: "Dec", revenue: 5200, payouts: 5000, pending: 200 },
    { month: "Nov", revenue: 4800, payouts: 4800, pending: 0 },
];

const mockTransactions = [
    { id: 1, date: "Jan 11, 2026", client: "Sarah Johnson", service: "Hair Cut", amount: 45, status: "paid" },
    { id: 2, date: "Jan 11, 2026", client: "Mike Chen", service: "Beard Trim", amount: 25, status: "paid" },
    { id: 3, date: "Jan 10, 2026", client: "Emma Wilson", service: "Hair Color", amount: 120, status: "pending" },
    { id: 4, date: "Jan 10, 2026", client: "James Brown", service: "Full Service", amount: 150, status: "paid" },
    { id: 5, date: "Jan 9, 2026", client: "Lisa Davis", service: "Hair Cut", amount: 45, status: "paid" },
];

export default function FinancesPage() {
    return (
        <DashboardLayout>
            <div className="w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                            Finances
                        </h1>
                        <p className="text-muted-foreground mt-2 font-medium">
                            Track revenue, payouts, and transactions.
                        </p>
                    </div>
                    <button className="bg-white text-black px-4 py-2.5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex items-center gap-2 font-black text-sm uppercase">
                        <Download className="size-4" />
                        Export
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-background border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center gap-2 mb-3">
                            <DollarSign className="size-5" />
                            <p className="text-xs font-black uppercase text-muted-foreground">Total Revenue</p>
                        </div>
                        <p className="text-3xl font-black">$14,500</p>
                        <p className="text-xs font-bold text-green-600 mt-1">+12% vs last month</p>
                    </div>
                    <div className="bg-background border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center gap-2 mb-3">
                            <CreditCard className="size-5" />
                            <p className="text-xs font-black uppercase text-muted-foreground">Paid Out</p>
                        </div>
                        <p className="text-3xl font-black">$14,000</p>
                        <p className="text-xs font-bold text-muted-foreground mt-1">Last 3 months</p>
                    </div>
                    <div className="bg-background border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="size-5" />
                            <p className="text-xs font-black uppercase text-muted-foreground">Pending</p>
                        </div>
                        <p className="text-3xl font-black">$500</p>
                        <p className="text-xs font-bold text-yellow-600 mt-1">Awaiting settlement</p>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-background border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <h2 className="text-lg font-black uppercase mb-4">Recent Transactions</h2>
                    <div className="space-y-2">
                        {mockTransactions.map((txn) => (
                            <div
                                key={txn.id}
                                className="flex items-center justify-between p-3 border-2 border-black/10 hover:border-black hover:bg-muted/50 transition-all"
                            >
                                <div className="flex-1">
                                    <p className="font-bold text-sm">{txn.client}</p>
                                    <p className="text-xs text-muted-foreground font-medium">{txn.service} • {txn.date}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="font-black text-lg">${txn.amount}</p>
                                    <span className={`px-3 py-1 border-2 border-black text-xs font-black uppercase ${txn.status === 'paid' ? 'bg-green-200' : 'bg-yellow-200'
                                        }`}>
                                        {txn.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
