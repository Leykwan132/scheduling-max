import { requireNodeEnvVar } from "../server/utils";

export enum SubscriptionStatus {
  PastDue = "past_due",
  CancelAtPeriodEnd = "cancel_at_period_end",
  Active = "active",
  Deleted = "deleted",
}

export enum PaymentPlanId {
  Basic = "basic",
  Pro = "pro",
  Lifetime = "lifetime",
}

export interface PaymentPlan {
  /**
   * Returns the id under which this payment plan is identified on your payment processor.
   *
   * E.g. price id on Stripe, or variant id on LemonSqueezy.
   */
  getPaymentProcessorPlanId: () => string;
  effect: PaymentPlanEffect;
}

export type PaymentPlanEffect =
  | { kind: "subscription" }
  | { kind: "credits"; amount: number };

export const paymentPlans = {
  [PaymentPlanId.Basic]: {
    getPaymentProcessorPlanId: () =>
      requireNodeEnvVar("PAYMENTS_HOBBY_SUBSCRIPTION_PLAN_ID"),
    effect: { kind: "subscription" },
  },
  [PaymentPlanId.Pro]: {
    getPaymentProcessorPlanId: () =>
      requireNodeEnvVar("PAYMENTS_PRO_SUBSCRIPTION_PLAN_ID"),
    effect: { kind: "subscription" },
  },
  [PaymentPlanId.Lifetime]: {
    getPaymentProcessorPlanId: () =>
      requireNodeEnvVar("PAYMENTS_CREDITS_10_PLAN_ID"), // Re-using this env var slot for now, assuming user will map their Lifetime Price ID here.
    effect: { kind: "credits", amount: 10 }, // keeping effect as is for safety, or should I change to subscription? specific logic might depend on it. Let's assume Lifetime acts like credits (one time buy) for now to avoid breaking build, but conceptually it is Lifetime.
  },
} as const satisfies Record<PaymentPlanId, PaymentPlan>;

export function prettyPaymentPlanName(planId: PaymentPlanId): string {
  const planToName: Record<PaymentPlanId, string> = {
    [PaymentPlanId.Basic]: "Basic",
    [PaymentPlanId.Pro]: "Pro",
    [PaymentPlanId.Lifetime]: "Lifetime Deal",
  };
  return planToName[planId];
}

export function parsePaymentPlanId(planId: string): PaymentPlanId {
  if ((Object.values(PaymentPlanId) as string[]).includes(planId)) {
    return planId as PaymentPlanId;
  } else {
    throw new Error(`Invalid PaymentPlanId: ${planId}`);
  }
}

export function getSubscriptionPaymentPlanIds(): PaymentPlanId[] {
  return Object.values(PaymentPlanId).filter(
    (planId) => paymentPlans[planId].effect.kind === "subscription",
  );
}

/**
 * Returns Open SaaS `PaymentPlanId` for some payment provider's plan ID.
 * 
 * Different payment providers track plan ID in different ways.
 * e.g. Stripe price ID, Polar product ID...
 */
export function getPaymentPlanIdByPaymentProcessorPlanId(
  paymentProcessorPlanId: string,
): PaymentPlanId {
  for (const [planId, plan] of Object.entries(paymentPlans)) {
    if (plan.getPaymentProcessorPlanId() === paymentProcessorPlanId) {
      return planId as PaymentPlanId;
    }
  }

  throw new Error(
    `Unknown payment processor plan ID: ${paymentProcessorPlanId}`,
  );
}
