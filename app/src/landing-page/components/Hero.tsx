import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { Button } from "../../client/components/ui/button";

export default function Hero() {
    return (
        <div className="relative w-full pt-16 pb-24 lg:pt-32 lg:pb-32 overflow-hidden bg-background border-b border-black">

            <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10 grid lg:grid-cols-2 gap-12 items-center">

                {/* Left Column: Typography & CTAs */}
                <div className="text-left space-y-6">
                    {/* Main Headline - Bold & Heavy */}
                    <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-foreground leading-[0.9]">
                        MORE VALUE THAN ACUITY.
                        <br />
                        <span className="text-primary-foreground bg-primary inline-block px-2 transform -rotate-1 mt-2">
                            LESS USAGE COST.
                        </span>
                    </h1>

                    {/* Subheadline - Clean & Readable */}
                    <p className="text-xl text-muted-foreground max-w-lg leading-relaxed font-medium border-l-4 border-primary pl-4">
                        The scheduling platform designed for modern creators.
                        Automated gap-filling, lifetime pricing, and custom branding.
                    </p>

                    {/* CTA Buttons - Gumroad Style */}
                    <div className="flex flex-col sm:flex-row items-start gap-4 pt-4">
                        <Button
                            size="lg"
                            className="bg-primary text-primary-foreground hover:bg-primary hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all rounded-none border-2 border-black dark:border-white px-8 py-6 text-xl font-bold shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_white] uppercase tracking-wide"
                            asChild
                        >
                            <WaspRouterLink to={routes.SignupRoute.to}>
                                Start Selling
                            </WaspRouterLink>
                        </Button>

                        <Button
                            size="lg"
                            variant="outline"
                            className="bg-white text-black hover:bg-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all rounded-none border-2 border-black dark:border-white px-8 py-6 text-xl font-bold shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_white] uppercase tracking-wide"
                            asChild
                        >
                            <WaspRouterLink to={routes.PricingPageRoute.to}>
                                View Pricing
                            </WaspRouterLink>
                        </Button>
                    </div>
                </div>

                {/* Right Column: Product Shot Frame */}
                <div className="relative">
                    <div className="relative z-10 bg-white border-2 border-black dark:border-white rounded-sm shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_white] overflow-hidden aspect-video group hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
                        {/* Abstract Browser Chrome */}
                        <div className="h-8 border-b-2 border-black bg-pink-100 flex items-center px-4 gap-2">
                            <div className="w-3 h-3 rounded-full bg-black border border-black"></div>
                            <div className="w-3 h-3 rounded-full bg-white border border-black"></div>
                        </div>
                        {/* Content Placeholder / Screenshot Area */}
                        <div className="p-8 flex items-center justify-center h-full bg-neutral-50">
                            <div className="text-center">
                                <div className="text-4xl font-black text-black mb-2">SCHEDULE MAX</div>
                                <div className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Dashboard Preview</div>
                            </div>
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute -top-6 -right-6 w-16 h-16 bg-accent border-2 border-black rounded-full flex items-center justify-center text-xs font-black -rotate-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-20">
                        NEW!
                    </div>
                </div>

            </div>
        </div>
    );
}
