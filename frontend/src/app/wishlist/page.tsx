import React from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function WishlistPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">My Game Wishlist</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Track GTA 6 editions and set custom price drop trigger thresholds.</p>
        </div>
        <Link href="/price-deals">
          <Button variant="outline" size="sm">Browse All Deals</Button>
        </Link>
      </div>

      <div className="p-4 rounded-xl border border-amber-900/40 bg-amber-950/20 text-xs text-amber-300 mb-6">
        <strong>Phase 1 Shell:</strong> Personal wishlists and automated email price alerts activate in Phase 5.
      </div>

      <div className="p-8 rounded-xl border border-[#1e2330] bg-[#10121a] text-center">
        <Heart className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">Your Wishlist is Ready</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
          Save your preferred game editions to receive instant notifications when prices change or discounts go live.
        </p>
        <Link href="/price-deals">
          <Button variant="primary" size="sm">Explore Price & Deals Tracker</Button>
        </Link>
      </div>
    </div>
  );
}
