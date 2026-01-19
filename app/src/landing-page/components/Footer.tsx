import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { cn } from "../../client/utils";

interface NavigationItem {
  name: string;
  href: string;
}

export default function Footer({
  footerNavigation,
}: {
  footerNavigation: {
    app: NavigationItem[];
    company: NavigationItem[];
  };
}) {
  return (
    <footer className="border-t-2 border-black dark:border-white bg-background pt-16 pb-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">

        {/* Trust Features - Aligned to 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
          {/* Money Back Sticker */}
          <div className="bg-[#FFEB3B] border-2 border-black dark:border-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_white] -rotate-1">
            <div className="text-[#0000FF] font-black text-2xl uppercase tracking-tighter leading-tight italic">
              100% Risk Free
            </div>
            <p className="text-[#0000FF] mt-2 font-bold text-sm leading-tight">
              30-day money back guarantee. <br />
              No questions asked.
            </p>
          </div>

          {/* Secure Payments Sticker */}
          <div className="bg-white dark:bg-zinc-900 border-2 border-black dark:border-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_white] rotate-1">
            <div className="text-foreground font-black text-2xl uppercase tracking-tighter leading-tight italic">
              Secure Checkout
            </div>
            <p className="text-muted-foreground mt-2 font-bold text-sm leading-tight">
              Encrypted payments <br />
              powered by Stripe.
            </p>
          </div>

          {/* Support Sticker */}
          <div className="bg-primary border-2 border-black dark:border-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_white] -rotate-1">
            <div className="text-black font-black text-2xl uppercase tracking-tighter leading-tight italic">
              Priority Help
            </div>
            <p className="text-black mt-2 font-bold text-sm leading-tight">
              Direct access to devs <br />
              for any issues.
            </p>
          </div>
        </div>

        {/* Footer Navigation - Now using 3 columns to align with Features above */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          <div className="space-y-6">
            <WaspRouterLink to={routes.LandingPageRoute.to} className="inline-block group">
              <div className="bg-primary p-2 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_white] -rotate-1 group-hover:rotate-0 transition-transform">
                <span className="text-2xl font-black italic tracking-tighter text-black uppercase">
                  Morph Scheduling
                </span>
              </div>
            </WaspRouterLink>
            <div className="border-l-4 border-primary pl-4 py-1">
              <p className="text-lg font-bold text-foreground leading-tight uppercase tracking-tight">
                The modern alternative to Acuity. <br />
                <span className="text-primary italic">Built for modern creators.</span>
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">Product</h4>
            <ul className="space-y-4">
              {footerNavigation.app.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-sm font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block transform"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">Company</h4>
            <ul className="space-y-4">
              {footerNavigation.company.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-sm font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors hover:translate-x-1 inline-block transform"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t-2 border-border/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="bg-[#FFEB3B] text-[#0000FF] px-4 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -rotate-1 text-xs font-black uppercase tracking-widest">
            © {new Date().getFullYear()} MorphSwift Studio.
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-xs font-black uppercase tracking-widest text-foreground hover:text-primary underline decoration-2 underline-offset-4">Privacy</a>
            <a href="#" className="text-xs font-black uppercase tracking-widest text-foreground hover:text-primary underline decoration-2 underline-offset-4">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
