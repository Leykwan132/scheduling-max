import React, { useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { useAuth } from "wasp/client/auth";
import { getBusinessByUser, disconnectGoogleCalendar, updateIntegrations, getGoogleAuthUrl, createStripeAccount, getStripeOnboardingLink, disconnectStripe } from "wasp/client/operations";
import { useQuery, useAction } from "wasp/client/operations";
import { Calendar, Link2, Check, Zap } from "lucide-react";
import ConfirmDisconnectModal from "./ConfirmDisconnectModal";

export default function IntegrationsPage() {
    const { data: user } = useAuth();

    const { data: business, refetch } = useQuery(getBusinessByUser);
    const updateIntegrationsFn = useAction(updateIntegrations);
    const disconnectGoogleFn = useAction(disconnectGoogleCalendar);
    const createStripeAccountFn = useAction(createStripeAccount);
    const getStripeOnboardingLinkFn = useAction(getStripeOnboardingLink);
    const disconnectStripeFn = useAction(disconnectStripe);

    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        integration: 'google' | 'stripe' | null;
        isLoading: boolean;
    }>({
        isOpen: false,
        integration: null,
        isLoading: false,
    });

    const [isConnectingStripe, setIsConnectingStripe] = useState(false);

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
                    setIsConnectingStripe(true);
                    try {
                        // Step 1: Create Stripe account (if not exists)
                        await createStripeAccountFn({});

                        // Step 2: Get onboarding link
                        const linkResult: any = await getStripeOnboardingLinkFn({});

                        if (linkResult.onboardingUrl) {
                            // Redirect to Stripe onboarding
                            window.location.href = linkResult.onboardingUrl;
                        } else {
                            // Unexpected - refresh the page
                            await refetch();
                            setIsConnectingStripe(false);
                        }
                    } catch (err) {
                        setIsConnectingStripe(false);
                        throw err;
                    }
                } else {
                    // Show confirmation modal for Stripe
                    setModalState({ isOpen: true, integration: 'stripe', isLoading: false });
                }
            }
        } catch (error) {
            console.error("Failed to update integration:", error);
            alert(`Failed to ${currentValue ? 'disconnect' : 'connect'} ${key === 'google' ? 'Google Calendar' : 'Stripe'}. Please try again.`);
        }
    };

    const handleConfirmDisconnect = async () => {
        setModalState(prev => ({ ...prev, isLoading: true }));

        try {
            if (modalState.integration === 'google') {
                await disconnectGoogleFn({});
            } else if (modalState.integration === 'stripe') {
                await disconnectStripeFn({});
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

            {/* Loading Modal for Connecting Stripe */}
            {isConnectingStripe && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div className="relative bg-background border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full text-center">
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative">
                                <div className="size-16 border-4 border-black border-t-primary rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Link2 className="size-6" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase mb-2">Connecting Stripe</h3>
                                <p className="text-muted-foreground font-medium">
                                    Please wait while we set up your Stripe account and prepare the onboarding...
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
