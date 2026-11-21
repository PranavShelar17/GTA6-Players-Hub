"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  CheckCircle2,
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronDown
} from "lucide-react";
import { useBackendHealth } from "@/hooks/useBackendHealth";
import { useAuth } from "@/context/AuthContext";
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
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { status: apiStatus, healthData } = useBackendHealth();
  const { user, profile, isAuthenticated, signOut } = useAuth();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // Close user dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await signOut();
    router.push("/");
  };

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Player";
  const initials = displayName.slice(0, 2).toUpperCase();

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
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("gta6:open-search"));
                }
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#171b26] transition-colors"
              title="Search articles & discussions (Ctrl+K)"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Account Actions / User Dropdown */}
            <div className="flex items-center gap-2 border-l border-[#1e2330] pl-3">
              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#141724] border border-[#23293a] hover:border-orange-500/40 transition-all text-left"
                  >
                    {profile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatar_url}
                        alt={displayName}
                        className="w-7 h-7 rounded-full object-cover border border-orange-500/40"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-500 to-rose-600 text-white font-black text-xs flex items-center justify-center">
                        {initials}
                      </div>
                    )}
                    <span className="text-xs font-bold text-slate-200 max-w-[100px] truncate">
                      {displayName}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#23293a] bg-[#0e111a] shadow-xl p-1.5 z-50 space-y-1">
                      <div className="px-3 py-2 border-b border-[#1c212e]">
                        <p className="text-xs font-bold text-white truncate">{displayName}</p>
                        <p className="text-[11px] text-slate-400 truncate">@{profile?.username || "player"}</p>
                      </div>

                      <Link
                        href="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-[#181d2c] rounded-lg transition-colors"
                      >
                        <User className="w-4 h-4 text-orange-400" />
                        Player Profile
                      </Link>

                      <Link
                        href="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-[#181d2c] rounded-lg transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                        Account Dashboard
                      </Link>

                      <Link
                        href="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-[#181d2c] rounded-lg transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        Preferences & Settings
                      </Link>

                      <div className="border-t border-[#1c212e] pt-1">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4 text-rose-400" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex xl:hidden items-center gap-2">
            {!isAuthenticated ? (
              <Link
                href="/login"
                className="text-xs font-semibold px-2.5 py-1.5 rounded bg-orange-500/10 text-orange-400 sm:hidden"
              >
                Log In
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="text-xs font-semibold px-2.5 py-1.5 rounded bg-orange-500/10 text-orange-400 sm:hidden"
              >
                Dashboard
              </Link>
            )}
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

          {/* If logged in on mobile, show user summary */}
          {isAuthenticated && (
            <div className="p-3 rounded-xl bg-[#141724] border border-[#23293a] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-rose-600 text-white font-bold text-xs flex items-center justify-center">
                  {initials}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{displayName}</p>
                  <p className="text-[11px] text-slate-400">@{profile?.username || "player"}</p>
                </div>
              </div>
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="secondary" size="sm">Dashboard</Button>
              </Link>
            </div>
          )}

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

          <div className="pt-3 border-t border-[#1c212d]">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" size="md" className="w-full">
                      Profile
                    </Button>
                  </Link>
                  <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="md" className="w-full">
                      Settings
                    </Button>
                  </Link>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full py-2.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-950/20 border border-rose-900/30 flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
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
            )}
          </div>
        </div>
      )}
    </header>
  );
}
