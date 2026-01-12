import React, { useState } from "react";
import AppSidebar from "./AppSidebar";
import { cn } from "../../client/utils";
import { HelpCircle } from "lucide-react";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="h-screen overflow-hidden bg-background flex flex-col lg:flex-row relative">
            <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <main className="flex-1 overflow-y-auto bg-neutral-50/50 w-full">
                {/* Floating Contact Support Button */}
                <button
                    onClick={() => {
                        // Placeholder - could open a modal or redirect to support
                        alert("Contact support feature coming soon!");
                    }}
                    className="fixed bottom-6 right-6 z-40 bg-primary text-black px-4 py-2.5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all group flex items-center gap-2 font-black text-sm uppercase tracking-wide"
                    title="Contact Support"
                >
                    <HelpCircle className="size-4 group-hover:rotate-12 transition-transform" />
                    <span className="hidden sm:inline">Contact Support</span>
                </button>

                <div className="w-full h-full p-4 sm:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
