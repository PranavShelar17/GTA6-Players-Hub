"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Bell, Info } from "lucide-react";
import {
  PriceProductDetail,
  PriceComparisonResponse,
  PriceHistoryResponse,
  PriceRegion,
  comparePrices,
  fetchPriceHistory,
} from "@/lib/priceApi";
import { RegionSelector } from "./RegionSelector";
import { PriceComparisonTable } from "./PriceComparisonTable";
import { PriceHistoryChart } from "./PriceHistoryChart";
import { PriceHistorySummary } from "./PriceHistorySummary";
import { TargetPriceForm } from "./TargetPriceForm";
import { PriceWishlistButton } from "./PriceWishlistButton";
import { PriceUnavailableState } from "./PriceUnavailableState";

interface PriceDetailPageClientProps {
  product: PriceProductDetail;
  initialComparison: PriceComparisonResponse | null;
  initialHistory: PriceHistoryResponse | null;
  regions: PriceRegion[];
  defaultCountryCode?: string;
}

export function PriceDetailPageClient({
  product,
  initialComparison,
  initialHistory,
  regions,
  defaultCountryCode = "USA",
}: PriceDetailPageClientProps) {
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(defaultCountryCode);
  const [comparison, setComparison] = useState<PriceComparisonResponse | null>(initialComparison);
  const [history, setHistory] = useState<PriceHistoryResponse | null>(initialHistory);
  const [token, setToken] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("gta6_auth_token") || localStorage.getItem("sb-token");
      if (stored) setToken(stored);
    } catch {}
  }, []);

  // Update comparison & history when region changes
  useEffect(() => {
    let isMounted = true;
    async function updateRegionData() {
      try {
        const [comp, hist] = await Promise.all([
          comparePrices(product.slug, selectedCountryCode),
          fetchPriceHistory(product.slug, selectedCountryCode),
        ]);
        if (isMounted) {
          setComparison(comp);
          setHistory(hist);
        }
      } catch (err) {
        console.error("Failed to update regional comparison:", err);
      }
    }

    updateRegionData();
    return () => {
      isMounted = false;
    };
  }, [selectedCountryCode, product.slug]);

  const selectedRegion = useMemo(() => {
    return regions.find((r) => r.country_code === selectedCountryCode) || regions[0];
  }, [regions, selectedCountryCode]);

  const isPC = product.platform === "PC";

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 pb-20">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="border-b border-[#202738] bg-[#0c0e17] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link
            href="/price-deals"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Prices & Deals</span>
          </Link>

          <div className="flex items-center gap-2">
            <PriceWishlistButton productId={product.id} token={token} />
            {!isPC && (
              <button
                onClick={() => setAlertOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-xl text-xs font-bold transition-colors"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Price Alert</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Product Overview Header */}
        <div className="bg-[#12151f] border border-[#202738] rounded-2xl p-6 sm:p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full">
                  {product.platform}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-[#0c0e17] px-2.5 py-1 rounded border border-[#1d2335]">
                  {product.edition}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Catalog Item
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                {product.name}
              </h1>

              <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
                {product.description ||
                  "Verified price tracking for Grand Theft Auto VI across official digital storefronts and authorized retailers."}
              </p>
            </div>

            {/* Price Box */}
            <div className="bg-[#0c0e17] border border-[#202738] rounded-2xl p-6 lg:text-right shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Best Available Price ({selectedRegion?.currency_code})
              </span>
              {isPC ? (
                <div className="text-sm font-bold text-amber-400">
                  Official PC Pricing Not Available
                </div>
              ) : (
                <div className="text-3xl sm:text-4xl font-mono font-black text-white">
                  {comparison?.best_offer
                    ? `${selectedRegion?.currency_symbol}${comparison.best_offer.current_price}`
                    : "TBA"}
                </div>
              )}
              {comparison?.best_offer && (
                <p className="text-xs text-emerald-400 font-semibold mt-1">
                  At {comparison.best_offer.store_name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Region Selector Bar */}
        <div className="bg-[#0f121c] border border-[#202738] rounded-2xl p-4 sm:p-5 mb-8">
          <RegionSelector
            regions={regions}
            selectedCountryCode={selectedCountryCode}
            onSelectRegion={setSelectedCountryCode}
          />
        </div>

        {/* PC Unannounced Guard */}
        {isPC ? (
          <PriceUnavailableState isPC={true} />
        ) : (
          <div className="space-y-8">
            {/* Price History Section */}
            {history && (
              <div>
                <PriceHistorySummary
                  currentPrice={history.current_verified_price}
                  lowestPrice={history.historical_lowest_price}
                  highestPrice={history.historical_highest_price}
                  totalObservations={history.total_observations}
                  trackingStart={history.tracking_period_start}
                  currencySymbol={selectedRegion?.currency_symbol || "$"}
                />

                <PriceHistoryChart
                  dataPoints={history.data_points}
                  currencySymbol={selectedRegion?.currency_symbol || "$"}
                />
              </div>
            )}

            {/* Retailer Store Comparison Table */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Authorized Retailer Comparisons
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live verified offers in {selectedRegion?.region_name} ({selectedRegion?.currency_code}).
                  </p>
                </div>
              </div>

              {comparison && (
                <PriceComparisonTable
                  offers={comparison.offers}
                />
              )}
            </div>

            {/* Tax & Legal Transparency Notice */}
            <div className="bg-[#12151f] border border-[#1e2436] rounded-xl p-4 text-xs text-slate-400 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-300">
                <Info className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Verification & Pricing Transparency Policy</span>
              </div>
              <p>
                {comparison?.tax_disclosure ||
                  "All displayed prices reflect real-time observations from authorized stores."}
              </p>
              <p className="text-slate-500">
                We do not simulate fake discounts or predict unconfirmed prices. External store links open authorized distributor storefronts.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Target Price Dialog */}
      {selectedRegion && (
        <TargetPriceForm
          productId={product.id}
          productName={product.name}
          regionId={selectedRegion.id}
          currencyCode={selectedRegion.currency_code}
          currencySymbol={selectedRegion.currency_symbol}
          currentPrice={comparison?.best_offer?.current_price || 0}
          token={token}
          isOpen={alertOpen}
          onClose={() => setAlertOpen(false)}
        />
      )}
    </div>
  );
}
