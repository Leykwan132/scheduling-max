import { routes } from "wasp/client/router";

export function Announcement() {
  return (
    <div className="bg-[#FFEB3B] text-[#0000FF] border-b-2 border-black flex w-full items-center justify-center gap-3 p-2 text-center font-black tracking-widest uppercase">
      <span className="hidden lg:block text-xs lg:text-sm text-[#0000FF]">
        🔥 🎉 LIMITED TIME LIFETIME DEAL AVAILABLE! 🎉 🔥
      </span>
      <div className="bg-[#0000FF] w-px h-4 hidden lg:block mx-1 opacity-20"></div>
      <a
        href={routes.PricingPageRoute.to}
        className="underline hover:no-underline cursor-pointer transition-opacity hover:opacity-80 text-xs lg:text-sm font-black"
      >
        Get the deal today →
      </a>
    </div>
  );
}
