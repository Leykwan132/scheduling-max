import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import {
    X,
    Menu,
    User,
    LogOut,
    Home,
    Calendar,
    Palette,
    Package,
    Users,
    Tag,
    Settings,
    ChevronDown,
    ChevronRight,
    ClipboardList,
    Building2,
    Star,
    LayoutList
} from "lucide-react";
import { useAuth, logout } from "wasp/client/auth";
import logo from "../../client/static/logo.webp";
import { cn } from "../../client/utils";

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (arg: boolean) => void;
}

const AppSidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
    const { data: user } = useAuth();
    const location = useLocation();

    const trigger = useRef<any>(null);
    const sidebar = useRef<any>(null);

    // close on click outside
    useEffect(() => {
        const clickHandler = ({ target }: MouseEvent) => {
            if (!sidebar.current || !trigger.current) return;
            if (
                !sidebarOpen ||
                sidebar.current.contains(target) ||
                trigger.current.contains(target)
            )
                return;
            setSidebarOpen(false);
        };
        document.addEventListener("click", clickHandler);
        return () => document.removeEventListener("click", clickHandler);
    });

    // close if the esc key is pressed
    useEffect(() => {
        const keyHandler = ({ keyCode }: KeyboardEvent) => {
            if (!sidebarOpen || keyCode !== 27) return;
            setSidebarOpen(false);
        };
        document.addEventListener("keydown", keyHandler);
        return () => document.removeEventListener("keydown", keyHandler);
    });

    const navGroups = [
        {
            key: "none",
            label: null,
            items: [
                {
                    name: "Dashboard",
                    href: "/app",
                    icon: Home,
                },
                {
                    name: "Calendar",
                    href: "/app/calendar",
                    icon: Calendar,
                },
            ],
        },
        {
            key: "operations",
            label: "Operations",
            items: [
                {
                    name: "Business",
                    href: "/app/setup",
                    icon: Building2,
                },
                {
                    name: "Bookings",
                    href: "/app/bookings",
                    icon: ClipboardList,
                },
            ],
        },
        {
            key: "marketing",
            label: "Marketing",
            items: [
                {
                    name: "Customers",
                    href: "/app/clients",
                    icon: Users,
                },
                {
                    name: "Promos",
                    href: "/app/promos",
                    icon: Tag,
                },
                {
                    name: "Reviews",
                    href: "/app/reviews",
                    icon: Star,
                },
            ],
        },

        {
            key: "settings",
            label: "Settings",
            items: [
                {
                    name: "Integrations",
                    href: "/app/integrations",
                    icon: ClipboardList, // Using ClipboardList or Blocks/Zap if imported
                },
                {
                    name: "Team & Spots",
                    href: "/app/team",
                    icon: Settings,
                },
            ],
        },
    ];

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                ref={trigger}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 bg-primary p-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all"
            >
                <span className="sr-only">Open main menu</span>
                <Menu className="size-6 text-black" />
            </button>

            {/* Sidebar */}
            <aside
                ref={sidebar}
                className={cn(
                    "fixed lg:static z-40 h-screen w-64 bg-background border-r-2 border-black transition-all duration-300 ease-in-out flex flex-col relative",
                    {
                        "translate-x-0": sidebarOpen,
                        "-translate-x-full lg:translate-x-0": !sidebarOpen,
                    }
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-start p-4 border-b-2 border-black">
                    <WaspRouterLink to={routes.LandingPageRoute.to} className="flex items-center gap-2 overflow-hidden">
                        <div className="bg-primary p-1.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
                            <img src={logo} alt="Logo" className="w-5 h-5" />
                        </div>
                        <span className="font-black text-sm tracking-tight uppercase truncate">
                            ScheduleMax
                        </span>
                    </WaspRouterLink>

                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden ml-auto p-1 border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-x-[-2px]"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-3 min-h-0">
                    {navGroups.map((group) => (
                        <div key={group.key} className="mb-2">
                            {/* Group Label */}
                            {group.label && (
                                <div className="w-full px-3 py-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                                    {group.label}
                                </div>
                            )}

                            {/* Group Items */}
                            <ul className="space-y-1">
                                {group.items.map((item) => (
                                    <li key={item.name}>
                                        <NavLink
                                            to={item.href}
                                            end={item.href === "/app"}
                                            onClick={(e) => {
                                                // Only close sidebar on mobile (< 1024px)
                                                if (window.innerWidth < 1024) {
                                                    setSidebarOpen(false);
                                                }
                                            }}
                                            className={({ isActive }) =>
                                                cn(
                                                    "flex items-center gap-3 px-3 py-2.5 font-bold text-sm tracking-wide border-2 border-transparent transition-all",
                                                    {
                                                        "bg-primary text-black border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]":
                                                            isActive,
                                                        "hover:bg-muted hover:border-black/20": !isActive,
                                                    }
                                                )
                                            }
                                        >
                                            <item.icon className="size-5 flex-shrink-0" />
                                            <span className="truncate">{item.name}</span>
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>

                {/* User Section & Logout */}
                <div className="border-t-2 border-black bg-muted/30 mt-auto">
                    {/* User Info */}
                    {user && (
                        <div className="flex items-center gap-3 p-4">
                            <div className="bg-primary p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
                                <User size={16} className="text-black" />
                            </div>
                            <div className="overflow-hidden flex-1">
                                <p className="text-xs font-black uppercase truncate text-black">{user.username || user.email}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Pro Account</p>
                            </div>
                        </div>
                    )}

                    {/* Logout Button */}
                    <div className="p-3 pt-0">
                        <button
                            onClick={() => logout()}
                            className="w-full flex items-center gap-3 px-3 py-2 font-black text-[11px] uppercase tracking-wide border-2 border-black bg-red-500 text-white hover:bg-red-600 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                        >
                            <LogOut className="size-3.5" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </>
    );
};

export default AppSidebar;
