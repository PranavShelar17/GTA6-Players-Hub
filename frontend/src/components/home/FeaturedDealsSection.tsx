import React from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { HomeDealItem } from "@/lib/homeApi";
import { HomePageEmptyState } from "./HomePageEmptyState";

interface FeaturedDealsSectionProps {
  deals: HomeDealItem[];
  preferredCurrency?: string;
  preferredCountry?: string;
  isFallback?: boolean;
}

export function FeaturedDealsSection({
  deals,
  preferredCurrency = "INR",
  preferredCountry = "IN",
  isFallback,
}: FeaturedDealsSectionProps) {
  if (!deals || deals.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <SectionHeader
          tag="Price Intelligence"
          title="Featured Global Editions & Deals"
          subtitle="Comparing verified store offerings across international currencies."
          viewAllHref="/price-deals"
          viewAllLabel="All Prices & Deals"
        />
        <HomePageEmptyState
          title="No Deals Available"
          description="Deals and price listings for your selected region are currently updating. Explore all listings in the Price Tracker."
        />
      </section>
    );
  }

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return "TBA";
    switch (currency) {
      case "INR":
        return `₹${price.toLocaleString("en-IN")}`;
      case "USD":
        return `$${price.toFixed(2)}`;
      case "EUR":
        return `€${price.toFixed(2)}`;
      case "GBP":
        return `£${price.toFixed(2)}`;
      default:
        return `${currency} ${price.toLocaleString()}`;
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <SectionHeader
        tag="Price Intelligence"
        title="Featured Global Editions & Deals"
        subtitle={`Comparing verified retail pre-orders in ${preferredCountry} (${preferredCurrency}).`}
        viewAllHref="/price-deals"
        viewAllLabel="All Prices & Deals"
      />

      {isFallback && (
        <div className="mb-4 text-xs text-slate-400 bg-[#12151f] border border-[#202738] rounded-lg px-3.5 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-orange-400">[DEMONSTRATION DATA]:</span>
            <span>Sample retail edition comparison. Live price feeds from authorized stores connect in Phase 5.</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {deals.map((deal) => {
          const isHighlight = deal.platform.includes("Xbox") || deal.discount_percentage > 0;
          return (
            <Card
              key={deal.id}
              className={`flex flex-col justify-between transition-all duration-200 ${
                isHighlight
                  ? "border-orange-500/40 bg-[#131624] shadow-lg shadow-orange-950/10"
                  : "border-[#202738] hover:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {deal.platform}
                  </span>
                  <Badge variant={deal.current_price > 0 ? "verified" : "unconfirmed"}>
                    {deal.retailer_name}
                  </Badge>
                </div>

                <CardTitle className="text-xl mb-3">{deal.edition_name}</CardTitle>

                <div className="my-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">
                      {formatPrice(deal.current_price, deal.currency)}
                    </span>
                    {deal.original_price && deal.original_price > deal.current_price && (
                      <span className="text-sm line-through text-slate-500">
                        {formatPrice(deal.original_price, deal.currency)}
                      </span>
                    )}
                    {deal.discount_percentage > 0 && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        -{deal.discount_percentage}%
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {deal.is_preorder ? "Pre-order Reservation" : "Official Purchase"}
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  {deal.current_price > 0
                    ? `Verified retail edition listing for ${deal.platform}. Pre-order price protection and instant drop alerts available.`
                    : "Official digital edition listing pending announcement. Add to your wishlist to receive immediate release notifications."}
                </p>
              </div>

              <div>
                <Link href="/price-deals">
                  <Button
                    variant={isHighlight ? "primary" : "secondary"}
                    size="sm"
                    className="w-full gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {deal.current_price > 0 ? "Track Price / Alert" : "Add to Watchlist"}
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
