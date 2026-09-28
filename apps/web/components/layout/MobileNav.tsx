"use client";

import React, { useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Sparkles, Video } from "lucide-react";
import {
  PRIMARY_NAV_ITEMS,
  SECONDARY_NAV_ITEMS,
  NavItem,
} from "@/lib/navigation";
import { Badge } from "@/components/ui/Badge";

export interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();

  // Handle escape key to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Prevent background body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

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
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cine-accent ${
                  isActive
                    ? "bg-cine-accent/20 text-white font-semibold border border-cine-accent/40"
                    : "text-slate-300 hover:text-white hover:bg-cine-card border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? "text-cine-accent" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <Badge variant={isActive ? "accent" : "outline"} size="sm">
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
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Navigation drawer"
      className="fixed inset-0 z-50 lg:hidden flex"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Drawer content */}
      <div className="relative w-4/5 max-w-xs bg-cine-surface border-r border-cine-border p-5 flex flex-col justify-between h-full z-10 shadow-2xl overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-cine-border/60 mb-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cine-accent to-cine-rose flex items-center justify-center text-white">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-white text-base tracking-tight">
                CINEHA<span className="text-cine-accent">.AI</span>
              </span>
            </div>

            <button
              onClick={onClose}
              type="button"
              aria-label="Close navigation menu"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-cine-card border border-cine-border min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cine-accent"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Sections */}
          <div className="space-y-6">
            <div>
              <div className="px-2 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                Creator Studio
              </div>
              {renderNavList(PRIMARY_NAV_ITEMS)}
            </div>

            <div>
              <div className="px-2 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                Preferences
              </div>
              {renderNavList(SECONDARY_NAV_ITEMS)}
            </div>
          </div>
        </div>

        {/* Footer Brand Info */}
        <div className="pt-4 border-t border-cine-border/50 mt-6">
          <div className="p-3 rounded-lg bg-cine-card border border-cine-border/60 flex items-center gap-3">
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
      </div>
    </div>
  );
}
