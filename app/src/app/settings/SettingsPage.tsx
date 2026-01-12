import React, { useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { useAuth, logout } from "wasp/client/auth";
import { LogOut, User, Bell, Shield, CreditCard, HelpCircle, DollarSign } from "lucide-react";

export default function SettingsPage() {
    const { data: user } = useAuth();
    const [currency, setCurrency] = useState("USD");

    const settingsSections = [
        {
            title: "Account",
            items: [
                {
                    icon: User,
                    label: "Profile",
                    description: "Update your personal information",
                    action: () => { },
                    disabled: true,
                    comingSoon: true,
                },
                {
                    icon: Bell,
                    label: "Notifications",
                    description: "Manage email and push notifications",
                    action: () => { },
                    disabled: true,
                    comingSoon: true,
                },
            ],
        },
        {
            title: "Billing",
            items: [
                {
                    icon: CreditCard,
                    label: "Subscription",
                    description: "Manage your subscription and billing",
                    action: () => { },
                    disabled: true,
                    comingSoon: true,
                },
            ],
        },
        {
            title: "Support",
            items: [
                {
                    icon: HelpCircle,
                    label: "Help Center",
                    description: "Get help and contact support",
                    action: () => { },
                    disabled: true,
                    comingSoon: true,
                },
            ],
        },
    ];

    return (
        <DashboardLayout>
            <div className="w-full max-w-3xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                        Settings
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium">
                        Manage your account and preferences.
                    </p>
                </div>

                {/* User Info Card */}
                {user && (
                    <div className="bg-background border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-8">
                        <div className="flex items-center gap-4">
                            <div className="bg-primary p-3 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                                <User size={24} className="text-black" />
                            </div>
                            <div>
                                <p className="font-black text-lg uppercase">
                                    {user.username || user.email?.split("@")[0]}
                                </p>
                                <p className="text-sm text-muted-foreground font-medium">
                                    {user.email}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Preferences Section - Currency */}
                <div className="mb-8">
                    <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">
                        Preferences
                    </h2>
                    <div className="bg-background border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center gap-4">
                            <div className="bg-muted p-2 border-2 border-black/20">
                                <DollarSign className="size-5" />
                            </div>
                            <div className="flex-1">
                                <label className="block font-bold uppercase text-sm mb-1">Currency</label>
                                <p className="text-xs text-muted-foreground font-medium mb-3">
                                    Select your preferred currency for effective pricing
                                </p>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="w-full bg-white border-2 border-black px-3 py-2 font-bold text-sm focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="CAD">CAD ($)</option>
                                    <option value="AUD">AUD ($)</option>
                                    <option value="SGD">SGD (S$)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Settings Sections */}
                {settingsSections.map((section) => (
                    <div key={section.title} className="mb-8">
                        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">
                            {section.title}
                        </h2>
                        <div className="space-y-3">
                            {section.items.map((item) => (
                                <button
                                    key={item.label}
                                    onClick={item.action}
                                    disabled={item.disabled}
                                    className="w-full text-left bg-background border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="bg-muted p-2 border-2 border-black/20">
                                            <item.icon className="size-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold uppercase text-sm">
                                                    {item.label}
                                                </p>
                                                {item.comingSoon && (
                                                    <span className="text-[10px] font-bold bg-muted px-2 py-0.5 border border-black/20 uppercase">
                                                        Coming Soon
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground font-medium mt-1">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Sign Out Section */}
                <div className="pt-6 border-t-2 border-black/10">
                    <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">
                        Session
                    </h2>
                    <button
                        onClick={() => logout()}
                        className="w-full flex items-center gap-4 bg-red-500 text-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-red-600 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                    >
                        <div className="bg-white/20 p-2 border-2 border-white/30">
                            <LogOut className="size-5" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="font-black uppercase text-sm">
                                Sign Out
                            </p>
                            <p className="text-xs font-medium mt-0.5 opacity-80">
                                Log out of your account
                            </p>
                        </div>
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
}
