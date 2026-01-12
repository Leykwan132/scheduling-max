import { ChevronDown, LogOut, User, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { logout } from "wasp/client/auth";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { type User as UserEntity } from "wasp/entities";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../client/components/ui/dropdown-menu";
import { userMenuItems } from "./constants";

export function UserDropdown({ user }: { user: Partial<UserEntity> }) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="group flex items-center gap-2">
          <div className="bg-primary p-2 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_2px_white] group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-none transition-all">
            <User size={18} className="text-black" />
          </div>
          <ChevronDown className="size-4 text-foreground transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="rounded-none border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_white] p-0 min-w-[200px] mt-2">
        <div className="bg-primary border-b-2 border-black dark:border-white p-3">
          <p className="text-[10px] font-black uppercase tracking-tighter text-black/60 mb-1">Signed in as</p>
          <p className="text-xs font-black uppercase truncate text-black">{user.username || user.email}</p>
        </div>
        <div className="p-1.5 bg-background">
          <DropdownMenuItem className="rounded-none focus:bg-primary focus:text-black transition-none group/item border-2 border-black mb-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_white]">
            <WaspRouterLink
              to={routes.AppRoute.to}
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-between gap-3 p-2 font-black uppercase text-[12px] tracking-wider"
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard size={16} className="group-hover/item:rotate-12 transition-transform" />
                <span>Go to Dashboard</span>
              </div>
              <div className="bg-black text-white px-1.5 py-0.5 text-[10px] animate-pulse">
                ACTION REQUIRED
              </div>
            </WaspRouterLink>
          </DropdownMenuItem>
          {userMenuItems.map((item) => {
            if (item.isAuthRequired && !user) return null;
            if (item.isAdminOnly && (!user || !user.isAdmin)) return null;

            return (
              <DropdownMenuItem key={item.name} className="rounded-none focus:bg-primary focus:text-black transition-none group/item border-b border-black/5 last:border-0">
                <WaspRouterLink
                  to={item.to}
                  onClick={() => {
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 p-1.5 font-black uppercase text-[11px] tracking-wider"
                >
                  <item.icon size={14} className="group-hover/item:scale-110 transition-transform" />
                  {item.name}
                </WaspRouterLink>
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuItem className="rounded-none focus:bg-destructive focus:text-destructive-foreground transition-none group/item">
            <button
              type="button"
              onClick={() => logout()}
              className="flex w-full items-center gap-3 p-1.5 font-black uppercase text-[11px] tracking-wider"
            >
              <LogOut size={14} className="group-hover/item:translate-x-0.5 transition-transform" />
              Log Out
            </button>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
