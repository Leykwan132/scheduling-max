/**
 * Stripe Connect v2 API Integration
 * 
 * This module handles the Stripe Connect integration using the v2 API.
 * It allows businesses to connect their Stripe accounts to accept payments.
 */

import { requireNodeEnvVar } from "../utils";

const STRIPE_API_KEY = requireNodeEnvVar("STRIPE_API_KEY");
const STRIPE_V2_API_URL = "https://api.stripe.com/v2/core/accounts";
const STRIPE_API_VERSION = "2025-07-30.preview";

export interface CreateStripeAccountArgs {
    businessName: string;
    contactEmail: string;
    country?: string;
    currency?: string;
}

export interface StripeAccountResponse {
    id: string;
    display_name: string;
    contact_email: string;
    dashboard: string;
    identity: {
        country: string;
        entity_type: string;
        business_details?: {
            registered_name: string;
        };
    };
    configuration: {
        customer: Record<string, any>;
        merchant: {
            capabilities: {
                card_payments: {
                    requested: boolean;
                    status?: string;
                };
            };
        };
    };
    requirements?: {
        currently_due: string[];
        eventually_due: string[];
        past_due: string[];
    };
}

/**
 * Creates a Stripe Connect account using the v2 API
 */
export async function createStripeConnectAccount(
    args: CreateStripeAccountArgs
): Promise<StripeAccountResponse> {
    const { businessName, contactEmail, country = "us", currency = "usd" } = args;

    const requestBody = {
        contact_email: contactEmail,
        display_name: businessName,
        dashboard: "full",
        identity: {
            business_details: {
                registered_name: businessName,
            },
            country: country,
            entity_type: "company",
        },
        configuration: {
            merchant: {
                capabilities: {
                    card_payments: {
                        requested: true,
                    },
                },
            },
        },
        defaults: {
            currency: currency,
            responsibilities: {
                fees_collector: "stripe",
                losses_collector: "stripe",
            },
            locales: ["en-US"],
        },
        include: [
            "configuration.merchant",
            "identity",
            "requirements",
        ],
    };

    const response = await fetch(STRIPE_V2_API_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${STRIPE_API_KEY}`,
            "Stripe-Version": STRIPE_API_VERSION,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Stripe API error:", errorText);
        throw new Error(`Failed to create Stripe account: ${response.statusText}`);
    }

    const data = await response.json();
    return data as StripeAccountResponse;
}

/**
 * Creates an account link for onboarding using Stripe v2 API
 * This generates a URL that the user can visit to complete their Stripe account setup
 */
export async function createAccountLink(
    accountId: string,
    returnUrl: string,
    refreshUrl: string
): Promise<string> {
    const requestBody = {
        account: accountId,
        use_case: {
            type: "account_onboarding",
            account_onboarding: {
                collection_options: {
                    fields: "eventually_due",
                },
                configurations: ["merchant"],
                return_url: returnUrl,
                refresh_url: refreshUrl,
            },
        },
    };

    const response = await fetch("https://api.stripe.com/v2/core/account_links", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${STRIPE_API_KEY}`,
            "Stripe-Version": STRIPE_API_VERSION,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Stripe account link error:", errorText);
        throw new Error(`Failed to create account link: ${response.statusText}`);
    }

    const data = await response.json();
    return data.url;
}

/**
 * Retrieves account information
 */
export async function getStripeAccount(
    accountId: string
): Promise<StripeAccountResponse> {
    const url = `${STRIPE_V2_API_URL}/${accountId}?include[]=configuration.customer&include[]=configuration.merchant&include[]=identity&include[]=requirements`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${STRIPE_API_KEY}`,
            "Stripe-Version": STRIPE_API_VERSION,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Stripe API error:", errorText);
        throw new Error(`Failed to retrieve Stripe account: ${response.statusText}`);
    }

    const data = await response.json();
    return data as StripeAccountResponse;
}
