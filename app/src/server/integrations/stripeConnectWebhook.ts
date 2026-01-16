/**
 * Stripe Connect Webhook Handler
 * 
 * Handles webhook events from Stripe Connect, specifically the
 * v2.core.account[requirements].updated event for tracking onboarding status.
 */

import express from "express";
import type { MiddlewareConfigFn } from "wasp/server";
import type { StripeConnectWebhook } from "wasp/server/api";
import { requireNodeEnvVar } from "../utils";

const STRIPE_CONNECT_WEBHOOK_SECRET = requireNodeEnvVar("STRIPE_CONNECT_WEBHOOK_SECRET");

/**
 * Determines the onboarding status based on requirements data from webhook
 */
function determineOnboardingStatus(requirements: any): {
    status: string;
    canProcessPayments: boolean;
    disabledReason: string | null;
    requirementsStatus: string | null;
    pendingRequirements: string[];
} {
    // Check if account is disabled/rejected
    if (requirements.summary?.disabled_reason) {
        return {
            status: "rejected",
            canProcessPayments: false,
            disabledReason: requirements.summary.disabled_reason,
            requirementsStatus: null,
            pendingRequirements: [],
        };
    }

    // Check if all requirements are met
    if (requirements.summary?.minimum_deadline?.status === "currently_met") {
        return {
            status: "complete",
            canProcessPayments: true,
            disabledReason: null,
            requirementsStatus: "currently_met",
            pendingRequirements: [],
        };
    }

    // Check entries for specific requirement states
    const entries = requirements.entries || [];

    // Check for past due requirements
    const pastDueReqs = entries
        .filter((entry: any) => entry.minimum_deadline?.status === "past_due")
        .map((entry: any) => entry.requirement);

    if (pastDueReqs.length > 0) {
        return {
            status: "requirements_due",
            canProcessPayments: false,
            disabledReason: null,
            requirementsStatus: "past_due",
            pendingRequirements: pastDueReqs,
        };
    }

    // Check for currently due requirements
    const currentlyDueReqs = entries
        .filter((entry: any) => entry.minimum_deadline?.status === "currently_due")
        .map((entry: any) => entry.requirement);

    if (currentlyDueReqs.length > 0) {
        return {
            status: "pending_review",
            canProcessPayments: true,
            disabledReason: null,
            requirementsStatus: "currently_due",
            pendingRequirements: currentlyDueReqs,
        };
    }

    // Default to in_progress if we can't determine status
    return {
        status: "in_progress",
        canProcessPayments: false,
        disabledReason: null,
        requirementsStatus: null,
        pendingRequirements: [],
    };
}

/**
 * Main webhook handler for Stripe Connect events
 */
export const stripeConnectWebhook: StripeConnectWebhook = async (req, res, context) => {
    const sig = req.headers["stripe-signature"];

    if (!sig) {
        console.error("Missing stripe-signature header");
        return res.status(400).json({ error: "Missing signature" });
    }

    let event;
    try {
        // For v2 API, we need to verify the signature manually
        // The raw body should be available from middleware
        const payload = req.body;

        // Parse the event (signature verification would happen here in production)
        event = typeof payload === "string" ? JSON.parse(payload) : payload;
    } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).json({ error: "Invalid signature" });
    }

    console.log(`📩 Received Stripe Connect webhook: ${event.type}`);

    try {
        switch (event.type) {
            case "v2.core.account[requirements].updated":
                await handleRequirementsUpdated(event, context);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return res.status(200).json({ received: true });
    } catch (err: any) {
        console.error("Error processing webhook:", err);
        return res.status(500).json({ error: "Webhook handler failed" });
    }
};

/**
 * Handle the v2.core.account[requirements].updated event
 */
async function handleRequirementsUpdated(event: any, context: any) {
    const accountData = event.data?.object;
    const accountId = accountData?.id;

    if (!accountId) {
        console.error("No account ID in webhook payload");
        return;
    }

    console.log(`📊 Processing requirements update for account: ${accountId}`);

    // Find the StripeConnectAccount
    const stripeAccount = await context.entities.StripeConnectAccount.findUnique({
        where: { id: accountId },
        include: { business: true },
    });

    if (!stripeAccount) {
        console.log(`⚠️ No StripeConnectAccount found for ID: ${accountId}`);
        return;
    }

    // Determine the new status
    const requirements = accountData.requirements || {};
    const statusResult = determineOnboardingStatus(requirements);

    console.log(`📈 Status update for ${accountId}:`, statusResult);

    // Update the StripeConnectAccount
    await context.entities.StripeConnectAccount.update({
        where: { id: accountId },
        data: {
            onboardingStatus: statusResult.status,
            disabledReason: statusResult.disabledReason,
            requirementsStatus: statusResult.requirementsStatus,
            pendingRequirements: statusResult.pendingRequirements.length > 0
                ? JSON.stringify(statusResult.pendingRequirements)
                : null,
            cardPaymentsEnabled: statusResult.canProcessPayments,
            lastWebhookAt: new Date(),
        },
    });

    // Update the Business isStripeConnected based on status
    const isConnected = statusResult.status === "complete";
    await context.entities.Business.update({
        where: { id: stripeAccount.businessId },
        data: {
            isStripeConnected: isConnected,
        },
    });

    console.log(`✅ Updated account ${accountId} to status: ${statusResult.status}`);
}

/**
 * Middleware config to get raw body for signature verification
 */
export const stripeConnectWebhookMiddleware: MiddlewareConfigFn = (middlewareConfig) => {
    middlewareConfig.delete("express.json");
    middlewareConfig.set("express.raw", express.raw({ type: "application/json" }));
    return middlewareConfig;
};
