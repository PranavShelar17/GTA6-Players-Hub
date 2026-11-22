import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[#181c26] bg-[#07080b] text-slate-400 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand & About */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-3">
              <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-orange-500 to-rose-600 text-white font-extrabold text-sm tracking-wider">
                GTA VI
              </span>
              <span className="font-black text-white text-lg tracking-tight">
                PLAYER HUB
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md mb-4">
              The premier independent gaming intelligence and player assistance platform for Grand Theft Auto VI. Tracking verified news, global pricing, hardware compatibility, and troubleshooting.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Independent platform adhering to fair-use and community standards.</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Platform Modules
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-orange-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-orange-400 transition-colors">
                  Gaming Community
                </Link>
              </li>
              <li>
                <Link href="/news" className="hover:text-orange-400 transition-colors">
                  News & Updates
                </Link>
              </li>
              <li>
                <Link href="/pc-compatibility" className="hover:text-orange-400 transition-colors">
                  PC Compatibility
                </Link>
              </li>
              <li>
                <Link href="/problem-solver" className="hover:text-orange-400 transition-colors">
                  Problem Solver
                </Link>
              </li>
              <li>
                <Link href="/price-deals" className="hover:text-orange-400 transition-colors">
                  Price & Deals
                </Link>
              </li>
            </ul>
          </div>

          {/* Player Account & Support */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Player Account
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dashboard" className="hover:text-orange-400 transition-colors">
                  Player Dashboard
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-orange-400 transition-colors">
                  Saved Wishlist
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-orange-400 transition-colors">
                  Events Calendar
                </Link>
              </li>
              <li>
                <Link href="/notifications" className="hover:text-orange-400 transition-colors">
                  Notification Center
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-orange-400 transition-colors">
                  Account Preferences
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-orange-400 transition-colors">
                  Sign In / Register
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Disclaimer & Bottom Bar */}
        <div className="border-t border-[#141822] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} GTA 6 Player Hub. Grand Theft Auto, GTA VI, and Rockstar Games are registered trademarks of Take-Two Interactive Software, Inc.
          </p>
          <p className="flex items-center gap-1">
            Engineered for the gaming community.
          </p>
        </div>
      </div>
    </footer>
  );
}
