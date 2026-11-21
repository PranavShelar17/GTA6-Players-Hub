"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, 
  X, 
  Search, 
  User, 
  Flame, 
  Cpu, 
  Wrench, 
  Tag, 
  Users, 
  Newspaper,
  CheckCircle2
} from "lucide-react";
import { useBackendHealth } from "@/hooks/useBackendHealth";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Home", href: "/", icon: Flame },
  { name: "Gaming Community", href: "/community", icon: Users },
  { name: "News & Updates", href: "/news", icon: Newspaper },
  { name: "PC Compatibility", href: "/pc-compatibility", icon: Cpu },
  { name: "Problem Solver", href: "/problem-solver", icon: Wrench },
  { name: "Price & Deals", href: "/price-deals", icon: Tag },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { status: apiStatus, healthData } = useBackendHealth();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1c212e] bg-[#090a0f]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <span className="font-black text-xl tracking-tight text-white flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-orange-500 to-rose-600 text-white font-extrabold text-sm tracking-wider">
                GTA VI
              </span>
              <span className="group-hover:text-orange-400 transition-colors">
                PLAYER HUB
              </span>
            </span>
          </Link>

          {/* Desktop Navigation (Exactly 6 Core Items) */}
          <nav className="hidden xl:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150 flex items-center gap-1.5",
                    active
                      ? "text-orange-400 bg-orange-500/10 font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-[#141722]"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", active ? "text-orange-400" : "text-slate-400")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Utilities: API Status, Search, Auth */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Backend Connection Status Pill */}
            <div 
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                apiStatus === "connected"
                  ? "bg-emerald-950/30 text-emerald-400 border-emerald-800/40"
                  : apiStatus === "loading"
                  ? "bg-amber-950/30 text-amber-400 border-amber-800/40"
                  : "bg-rose-950/30 text-rose-400 border-rose-800/40"
              )}
              title={apiStatus === "connected" ? `API v${healthData?.version} online` : "Connecting to FastAPI backend"}
            >
              {apiStatus === "connected" ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>API v{healthData?.version || "1.0"}</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>API Sync</span>
                </>
              )}
            </div>

            {/* Quick Search Trigger */}
            <Link
              href="/news"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#171b26] transition-colors"
              title="Search articles & discussions"
            >
              <Search className="w-4 h-4" />
            </Link>

            {/* Account Actions */}
            <div className="flex items-center gap-2 border-l border-[#1e2330] pl-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm" className="gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Register
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex xl:hidden items-center gap-2">
            <Link
              href="/login"
              className="text-xs font-semibold px-2.5 py-1.5 rounded bg-orange-500/10 text-orange-400 sm:hidden"
            >
              Log In
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#171b26] transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile / Tablet Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-b border-[#1e2330] bg-[#0c0e14] px-4 pt-3 pb-6 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#1c212d] text-xs text-slate-400">
            <span>Platform Navigation</span>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Backend Connected</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-3.5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 transition-colors",
                    active
                      ? "bg-orange-500/15 text-orange-400 font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-[#161a25]"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", active ? "text-orange-400" : "text-slate-400")} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#1c212d] flex items-center gap-2">
            <Link href="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="secondary" size="md" className="w-full">
                Log In
              </Button>
            </Link>
            <Link href="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" size="md" className="w-full">
                Register
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
