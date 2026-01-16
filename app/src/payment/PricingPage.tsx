import { CheckCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "wasp/client/auth";
import {
  generateCheckoutSession,
  getCustomerPortalUrl,
  useQuery,
} from "wasp/client/operations";
import { Alert, AlertDescription } from "../client/components/ui/alert";
import { Button } from "../client/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardTitle,
} from "../client/components/ui/card";
import { cn } from "../client/utils";
import {
  PaymentPlanId,
  paymentPlans,
  prettyPaymentPlanName,
  SubscriptionStatus,
} from "./plans";
import Footer from "../landing-page/components/Footer";
import { footerNavigation } from "../landing-page/contentSections";

const bestDealPaymentPlanId: PaymentPlanId = PaymentPlanId.Lifetime;

interface PaymentPlanCard {
  name: string;
  price: string;
  description: string;
  features: string[];
}

export const paymentPlanCards: Record<PaymentPlanId, PaymentPlanCard> = {
  [PaymentPlanId.Basic]: {
    name: prettyPaymentPlanName(PaymentPlanId.Basic),
    price: "$9",
    description: "For individuals just getting started.",
    features: ["50 Appointments/mo", "1 Calendar sync", "Stripe integration", "Coupons & discount codes", "Custom landing page", "MorphScheduling branding"],
  },
  [PaymentPlanId.Pro]: {
    name: prettyPaymentPlanName(PaymentPlanId.Pro),
    price: "$20",
    description: "For growing businesses needing more power.",
    features: [
      "Unlimited Appointments",
      "5 Calendars sync",
      "Role-based staff management",
      "Multiple rooms + locations",
      "Email reminders & follow-ups",
      "Client tipping",
      "Bundled Appointment Packages",
      "Automated Review Collection",
      "Custom brand colors and logo"
    ],
  },
  [PaymentPlanId.Lifetime]: {
    name: prettyPaymentPlanName(PaymentPlanId.Lifetime),
    price: "$99",
    description: "Limited Time Offer: One-time payment, forever access.",
    features: [
      "Everything in Pro",
      "Up to 10 Calendars (Double Pro)",
      "Advanced Reporting (No-shows, Trends)",
      "Lifetime Platform Updates",
    ],
  },
};

const PricingPage = () => {
  const [isPaymentLoading, setIsPaymentLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: user } = useAuth();
  const isUserSubscribed =
    !!user &&
    !!user.subscriptionStatus &&
    user.subscriptionStatus !== SubscriptionStatus.Deleted;

  const {
    data: customerPortalUrl,
    isLoading: isCustomerPortalUrlLoading,
    error: customerPortalUrlError,
  } = useQuery(getCustomerPortalUrl, { enabled: isUserSubscribed });

  const navigate = useNavigate();

  async function handleBuyNowClick(paymentPlanId: PaymentPlanId) {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      setIsPaymentLoading(true);

      const checkoutResults = await generateCheckoutSession(paymentPlanId);

      if (checkoutResults?.sessionUrl) {
        window.open(checkoutResults.sessionUrl, "_self");
      } else {
        throw new Error("Error generating checkout session URL");
      }
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Error processing payment. Please try again later.");
      }
      setIsPaymentLoading(false);
    }
  }

  const handleCustomerPortalClick = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (customerPortalUrlError) {
      setErrorMessage("Error fetching Customer Portal URL");
      return;
    }

    if (!customerPortalUrl) {
      setErrorMessage(`Customer Portal does not exist for user ${user.id}`);
      return;
    }

    window.open(customerPortalUrl, "_blank");
  };

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <div className="py-10 lg:mt-10 flex-grow">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div id="pricing" className="mx-auto max-w-4xl text-center">
            <h2 className="text-foreground mt-2 text-4xl font-black tracking-tight sm:text-5xl uppercase">
              Pick your <span className="text-primary">pricing</span>
            </h2>
          </div>
          <div className="mx-auto mt-8 flex justify-center">
            <p className="text-foreground max-w-2xl text-center text-lg md:text-xl font-black uppercase tracking-tighter leading-tight bg-white dark:bg-zinc-900 border-2 border-black dark:border-white p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_white] -rotate-1">
              Simple, transparent pricing. <br className="hidden md:block" /> No hidden fees.
            </p>
          </div>
          {errorMessage && (
            <Alert variant="destructive" className="mt-8">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-12 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8">
            {Object.values(PaymentPlanId).map((planId) => (
              <Card
                key={planId}
                className={cn(
                  "relative flex grow flex-col justify-between overflow-hidden transition-all duration-300 rounded-none border-2 border-black dark:border-white",
                  {
                    "bg-card shadow-[12px_12px_0px_0px_hsl(312,100%,78%)] scale-[1.05] z-10":
                      planId === bestDealPaymentPlanId,
                    "bg-card shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]":
                      planId !== bestDealPaymentPlanId,
                  },
                )}
              >
                {planId === bestDealPaymentPlanId && (
                  <div className="bg-[#FFEB3B] text-[#0000FF] w-full text-center py-2 font-black tracking-widest uppercase border-b-2 border-black dark:border-white text-xs lg:text-sm">
                    🔥 LIMITED TIME LIFETIME DEAL 🔥
                  </div>
                )}

                <CardContent className={cn("h-full justify-between p-8 xl:p-10", { "pt-6": planId === bestDealPaymentPlanId })}>
                  <div className="flex items-center justify-between gap-x-4">
                    <CardTitle
                      id={planId}
                      className="text-foreground text-3xl font-black leading-8 tracking-tight uppercase"
                    >
                      {paymentPlanCards[planId].name}
                    </CardTitle>
                  </div>

                  {planId === PaymentPlanId.Lifetime ? (
                    <div className="mt-4 p-4 bg-[#FFEB3B] border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_white] -rotate-1">
                      <p className="text-[#0000FF] text-xs font-black uppercase tracking-widest leading-tight">
                        ⏰ Limited Time Offer
                      </p>
                      <div className="mt-1 h-0.5 bg-[#0000FF]/20 w-full" />
                      <p className="text-[#0000FF] mt-2 text-sm font-black leading-tight uppercase italic">
                        One-time payment. <br />
                        Forever access.
                      </p>
                    </div>
                  ) : planId === PaymentPlanId.Pro ? (
                    <div className="mt-4 p-4 bg-primary border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_white] rotate-1">
                      <p className="text-black text-xs font-black uppercase tracking-widest leading-tight">
                        🚀 Most Popular
                      </p>
                      <div className="mt-1 h-0.5 bg-black/20 w-full" />
                      <p className="text-black mt-2 text-sm font-black leading-tight uppercase italic">
                        Advanced Features. <br />
                        Grow your business.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 p-4 bg-white dark:bg-zinc-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_white] -rotate-1">
                      <p className="text-foreground text-xs font-black uppercase tracking-widest leading-tight">
                        🌱 Starter Plan
                      </p>
                      <div className="mt-1 h-0.5 bg-black/10 dark:bg-white/10 w-full" />
                      <p className="text-foreground mt-2 text-sm font-black leading-tight uppercase italic">
                        Essential Tools. <br />
                        Get started fast.
                      </p>
                    </div>
                  )}

                  <div className="mt-8 flex items-baseline gap-x-1">
                    <span className="text-foreground text-6xl font-black tracking-tighter">
                      {paymentPlanCards[planId].price}
                    </span>
                    <span className="text-muted-foreground text-sm font-bold uppercase tracking-widest">
                      {paymentPlans[planId].effect.kind === "subscription" &&
                        "/mo"}
                      {paymentPlans[planId].effect.kind === "credits" &&
                        "once"}
                    </span>
                  </div>
                  <ul
                    role="list"
                    className="text-foreground mt-8 space-y-4 text-sm leading-6"
                  >
                    {paymentPlanCards[planId].features.map((feature) => (
                      <li key={feature} className="flex gap-x-3 font-bold items-start">
                        <CheckCircle
                          className="text-primary h-5 w-5 flex-none"
                          aria-hidden="true"
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="p-8 pt-0">
                  {isUserSubscribed ? (
                    <Button
                      onClick={handleCustomerPortalClick}
                      disabled={isCustomerPortalUrlLoading}
                      className="w-full rounded-none border-2 border-black dark:border-white font-black text-xl h-14 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_white] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all bg-white text-black"
                    >
                      MANAGE PLAN
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleBuyNowClick(planId)}
                      className={cn(
                        "w-full rounded-none border-2 border-black dark:border-white font-black text-xl h-14 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_white] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all uppercase tracking-wider",
                        {
                          "bg-primary text-black hover:bg-primary/90": planId === bestDealPaymentPlanId,
                          "bg-white text-black hover:bg-neutral-100": planId !== bestDealPaymentPlanId,
                        }
                      )}
                      disabled={isPaymentLoading}
                    >
                      {!!user ? "Get Started →" : "Join Now →"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Enterprise CTA - Specific to Pricing Page */}
          <div className="border-t-2 border-black/10 dark:border-white/10 pt-12 pb-24 flex flex-col items-center">
            <div className="bg-black text-white px-6 py-2 font-black uppercase tracking-widest text-sm transform -rotate-1 mb-4">
              Need more power?
            </div>
            <h3 className="text-3xl font-black uppercase tracking-tight text-center">
              Bigger team? Multi-location agency?
            </h3>
            <p className="text-muted-foreground mt-2 text-center max-w-xl font-medium">
              If you need more than 10 calendars or custom enterprise features, <br className="hidden md:block" />
              reach out to us for a custom package.
            </p>
            <div className="mt-8">
              <a href="mailto:support@morphscheduling.com" className="bg-primary text-black border-2 border-black px-8 py-4 font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                Contact Sales →
              </a>
            </div>
          </div>
        </div>
      </div>
      <Footer footerNavigation={footerNavigation} />
    </div>
  );
};

export default PricingPage;
