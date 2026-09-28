"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PRIMARY_NAV_ITEMS,
  SECONDARY_NAV_ITEMS,
  NavItem,
} from "@/lib/navigation";
import { Badge } from "@/components/ui/Badge";
import { Video, Shield } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const renderNavList = (items: NavItem[]) => {
    return (
      <ul className="space-y-1">
        {items.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cine-accent ${
                  isActive
                    ? "bg-cine-accent/15 text-white font-semibold border border-cine-accent/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-cine-surface border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? "text-cine-accent"
                        : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <Badge
                    variant={isActive ? "accent" : "outline"}
                    size="sm"
                    className="text-[9px] py-0 px-1.5"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-cine-surface/90 border-r border-cine-border/70 min-h-[calc(100vh-4rem)] p-4 justify-between">
      <div className="space-y-6">
        {/* Navigation Group 1 */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
            Creator Studio
          </div>
          {renderNavList(PRIMARY_NAV_ITEMS)}
        </div>

        {/* Navigation Group 2 */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
            Preferences
          </div>
          {renderNavList(SECONDARY_NAV_ITEMS)}
        </div>
      </div>

      {/* Sidebar Footer / Brand Badge */}
      <div className="pt-4 border-t border-cine-border/50">
        <div className="p-3 rounded-lg bg-cine-card/80 border border-cine-border/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cine-accent/10 border border-cine-accent/30 flex items-center justify-center text-cine-accent shrink-0">
            <Video className="w-4 h-4" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-semibold text-slate-200 truncate">
              Cinehashoots
            </span>
            <span className="text-[10px] text-cine-muted truncate">
              Sai Panga · Ecosystem
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
