import React, { useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { useAuth } from "wasp/client/auth";
import { getBusinessByUser, disconnectGoogleCalendar, updateIntegrations, getGoogleAuthUrl } from "wasp/client/operations";
import { useQuery, useAction } from "wasp/client/operations";
import { Calendar, Link2, Check, Zap } from "lucide-react";
import ConfirmDisconnectModal from "./ConfirmDisconnectModal";

export default function IntegrationsPage() {
    const { data: user } = useAuth();

    const { data: business, refetch } = useQuery(getBusinessByUser);
    const updateIntegrationsFn = useAction(updateIntegrations);
    const disconnectGoogleFn = useAction(disconnectGoogleCalendar);

    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        integration: 'google' | 'stripe' | null;
        isLoading: boolean;
    }>({
        isOpen: false,
        integration: null,
        isLoading: false,
    });

    const handleIntegrationToggle = async (key: 'google' | 'stripe', currentValue: boolean) => {
        try {
            if (key === 'google') {
                if (!currentValue) {
                    // Start Google OAuth flow
                    const authUrl = await getGoogleAuthUrl();
                    window.location.href = authUrl;
                } else {
                    // Show confirmation modal
                    setModalState({ isOpen: true, integration: 'google', isLoading: false });
                }
            } else {
                if (!currentValue) {
                    // Connect Stripe (placeholder)
                    await updateIntegrationsFn({ isStripeConnected: true });
                    await refetch();
                } else {
                    // Show confirmation modal for Stripe
                    setModalState({ isOpen: true, integration: 'stripe', isLoading: false });
                }
            }
        } catch (error) {
            console.error("Failed to update integration:", error);
            alert("Failed to update integration settings.");
        }
    };

    const handleConfirmDisconnect = async () => {
        setModalState(prev => ({ ...prev, isLoading: true }));

        try {
            if (modalState.integration === 'google') {
                await disconnectGoogleFn({});
            } else if (modalState.integration === 'stripe') {
                await updateIntegrationsFn({ isStripeConnected: false });
            }

            // Refetch business data to update UI
            await refetch();

            // Close modal
            setModalState({ isOpen: false, integration: null, isLoading: false });
        } catch (error) {
            console.error("Failed to disconnect:", error);
            alert("Failed to disconnect integration.");
            setModalState(prev => ({ ...prev, isLoading: false }));
        }
    };

    const integrations = [
        {
            id: 'google',
            icon: Calendar,
            label: "Google Calendar",
            description: "Sync your appointments with Google Calendar to avoid double bookings.",
            action: () => handleIntegrationToggle('google', !!business?.isGoogleCalendarConnected),
            isConnected: !!business?.isGoogleCalendarConnected,
            comingSoon: false,
        },
        {
            id: 'stripe',
            icon: Link2,
            label: "Stripe",
            description: "Accept payments securely from your customers.",
            action: () => handleIntegrationToggle('stripe', !!business?.isStripeConnected),
            isConnected: !!business?.isStripeConnected,
            comingSoon: false,
        },
    ];

    return (
        <DashboardLayout>
            <div className="w-full max-w-3xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight flex items-center gap-3">
                        <Zap className="size-8" />
                        Integrations
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium">
                        Connect external tools to supercharge your workflow.
                    </p>
                </div>

                {/* Integrations List */}
                <div className="space-y-4">
                    {integrations.map((item) => (
                        <div
                            key={item.id}
                            className="bg-background border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between"
                        >
                            <div className="flex items-start gap-4">
                                <div className="bg-muted p-3 border-2 border-black/20 shrink-0">
                                    <item.icon className="size-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-black uppercase text-lg">
                                            {item.label}
                                        </h3>
                                        {item.comingSoon && (
                                            <span className="text-[10px] font-bold bg-muted px-2 py-0.5 border border-black/20 uppercase">
                                                Coming Soon
                                            </span>
                                        )}
                                        {item.isConnected && (
                                            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 border border-green-200 uppercase flex items-center gap-1">
                                                <Check className="size-3" />
                                                Connected
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground font-medium max-w-md">
                                        {item.description}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={item.action}
                                className={`
                                    px-6 py-2.5 font-bold text-sm uppercase border-2 border-black transition-all whitespace-nowrap
                                    ${item.isConnected
                                        ? "bg-red-50 text-red-600 hover:bg-red-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
                                        : "bg-primary text-black hover:bg-primary/90 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                                    }
                                `}
                            >
                                {item.isConnected ? "Disconnect" : "Connect"}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmDisconnectModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, integration: null, isLoading: false })}
                onConfirm={handleConfirmDisconnect}
                integrationName={modalState.integration === 'google' ? 'Google Calendar' : 'Stripe'}
                isLoading={modalState.isLoading}
            />
        </DashboardLayout>
    );
}
