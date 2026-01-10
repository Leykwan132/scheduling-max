import { LogIn, Menu } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Link as ReactRouterLink } from "react-router-dom";
import { useAuth } from "wasp/client/auth";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../../client/components/ui/sheet";
import { throttleWithTrailingInvocation } from "../../../shared/utils";
import { UserDropdown } from "../../../user/UserDropdown";
import { UserMenuItems } from "../../../user/UserMenuItems";
import { useIsLandingPage } from "../../hooks/useIsLandingPage";
import logo from "../../static/logo.webp";
import { cn } from "../../utils";
import { Announcement } from "./Announcement";

export interface NavigationItem {
  name: string;
  to: string;
}

export default function NavBar({
  navigationItems,
}: {
  navigationItems: NavigationItem[];
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const isLandingPage = useIsLandingPage();

  useEffect(() => {
    const throttledHandler = throttleWithTrailingInvocation(() => {
      setIsScrolled(window.scrollY > 0);
    }, 50);

    window.addEventListener("scrolled", throttledHandler);

    return () => {
      window.removeEventListener("scroll", throttledHandler);
      throttledHandler.cancel();
    };
  }, []);

  return (
    <>
      {isLandingPage && <Announcement />}
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300 border-b-2 border-black dark:border-white bg-background",
          isScrolled && "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_white]"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav
            className="flex items-center justify-between h-16 lg:h-20"
            aria-label="Global"
          >
            <div className="flex items-center gap-8">
              <WaspRouterLink
                to={routes.LandingPageRoute.to}
                className="flex items-center group transition-transform active:scale-95"
              >
                <div className="bg-primary p-1.5 border-2 border-black dark:border-white rotate-3 group-hover:rotate-0 transition-transform shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_2px_white]">
                  <NavLogo />
                </div>
                <span className="ml-3 text-xl lg:text-2xl font-black tracking-tighter text-foreground uppercase italic px-1">
                  ScheduleMax
                </span>
              </WaspRouterLink>

              <ul className="hidden lg:flex items-center gap-8">
                {renderNavigationItems(navigationItems)}
              </ul>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-6">
                <NavBarDesktopUserDropdown />
              </div>
              <NavBarMobileMenu navigationItems={navigationItems} />
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}

function NavBarDesktopUserDropdown() {
  const { data: user, isLoading: isUserLoading } = useAuth();

  return (
    <div className="flex items-center gap-4">
      {isUserLoading ? null : !user ? (
        <WaspRouterLink
          to={routes.LoginRoute.to}
        >
          <div className="bg-white text-black border-2 border-black px-4 py-2 font-black text-sm uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2">
            Log in{" "}
            <LogIn size="14" />
          </div>
        </WaspRouterLink>
      ) : (
        <UserDropdown user={user} />
      )}
    </div>
  );
}

function NavBarMobileMenu({
  navigationItems,
}: {
  navigationItems: NavigationItem[];
}) {
  const { data: user, isLoading: isUserLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex lg:hidden">
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="bg-primary p-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <span className="sr-only">Open main menu</span>
            <Menu className="size-6 text-black" aria-hidden="true" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] border-l-4 border-black dark:border-white rounded-none p-0">
          <div className="p-6 bg-primary border-b-4 border-black dark:border-white">
            <SheetHeader>
              <SheetTitle className="flex items-center">
                <WaspRouterLink to={routes.LandingPageRoute.to} onClick={() => setMobileMenuOpen(false)}>
                  <span className="text-2xl font-black italic tracking-tighter text-black uppercase">ScheduleMax</span>
                </WaspRouterLink>
              </SheetTitle>
            </SheetHeader>
          </div>
          <div className="p-6">
            <div className="flex flex-col gap-6">
              <ul className="space-y-4">
                {renderNavigationItems(navigationItems, setMobileMenuOpen)}
              </ul>
              <div className="h-px bg-black/10 dark:bg-white/10" />
              <div className="flex flex-col gap-4">
                {isUserLoading ? null : !user ? (
                  <WaspRouterLink to={routes.LoginRoute.to} onClick={() => setMobileMenuOpen(false)}>
                    <div className="bg-white text-black border-2 border-black p-3 font-black text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none uppercase tracking-widest">
                      Log in
                    </div>
                  </WaspRouterLink>
                ) : (
                  <ul className="space-y-2">
                    <UserMenuItems
                      user={user}
                      onItemClick={() => setMobileMenuOpen(false)}
                    />
                  </ul>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function renderNavigationItems(
  navigationItems: NavigationItem[],
  setMobileMenuOpen?: Dispatch<SetStateAction<boolean>>,
) {
  const menuStyles = cn(
    "text-sm font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors py-2 px-1",
    {
      "text-lg block w-full border-b border-black/5 dark:border-white/5 py-4": !!setMobileMenuOpen,
    }
  );

  return navigationItems.map((item) => {
    return (
      <li key={item.name}>
        <ReactRouterLink
          to={item.to}
          className={menuStyles}
          onClick={setMobileMenuOpen && (() => setMobileMenuOpen(false))}
          target={item.to.startsWith("http") ? "_blank" : undefined}
        >
          {item.name}
        </ReactRouterLink>
      </li>
    );
  });
}

const NavLogo = () => (
  <img
    className="size-6 transition-all"
    src={logo}
    alt="ScheduleMax App"
  />
);
