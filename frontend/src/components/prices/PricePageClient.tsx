"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Tag, Sparkles, Bell, Heart, AlertCircle } from "lucide-react";
import {
  PriceRegion,
  PriceProductListItem,
  DealItem,
  PriceStats,
  PriceAlertItem,
  WishlistItem,
  fetchPriceProducts,
  fetchDeals,
  fetchPlayerPriceAlerts,
  fetchPlayerWishlist,
  deletePriceAlert,
} from "@/lib/priceApi";
import { PricePageHeader } from "./PricePageHeader";
import { RegionSelector } from "./RegionSelector";
import { PlatformFilter } from "./PlatformFilter";
import { EditionFilter } from "./EditionFilter";
import { PriceSearch } from "./PriceSearch";
import { FeaturedBestPrice } from "./FeaturedBestPrice";
import { PriceComparisonCard } from "./PriceComparisonCard";
import { DealCard } from "./DealCard";
import { PriceAlertCard } from "./PriceAlertCard";
import { TargetPriceForm } from "./TargetPriceForm";
import { PriceUnavailableState } from "./PriceUnavailableState";
import { PriceLoadingSkeleton } from "./PriceLoadingSkeleton";

interface PricePageClientProps {
  initialRegions: PriceRegion[];
  initialProducts: PriceProductListItem[];
  initialDeals: DealItem[];
  initialStats: PriceStats | null;
}

export function PricePageClient({
  initialRegions,
  initialProducts,
  initialDeals,
  initialStats,
}: PricePageClientProps) {
  const [regions] = useState<PriceRegion[]>(initialRegions);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("USA");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("ALL");
  const [selectedEdition, setSelectedEdition] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"catalog" | "deals" | "alerts" | "wishlist">("catalog");

  const [products, setProducts] = useState<PriceProductListItem[]>(initialProducts);
  const [deals, setDeals] = useState<DealItem[]>(initialDeals);
  const [stats] = useState<PriceStats | null>(initialStats);
  const [loading, setLoading] = useState<boolean>(false);

  // Player Wishlist & Alerts state
  const [token, setToken] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<PriceAlertItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  // Alert Dialog Modal state
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    productId: string;
    productName: string;
    currentPrice: number;
  }>({
    isOpen: false,
    productId: "",
    productName: "",
    currentPrice: 0,
  });

  // Extract auth token from Supabase / localStorage on mount if available
  useEffect(() => {
    try {
      const stored = localStorage.getItem("gta6_auth_token") || localStorage.getItem("sb-token");
      if (stored) {
        setToken(stored);
      }
    } catch {
      // LocalStorage access restricted or unavailable
    }
  }, []);

  // Fetch updated catalog on region/filter change
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [prods, dls] = await Promise.all([
          fetchPriceProducts({
            platform: selectedPlatform !== "ALL" ? selectedPlatform : undefined,
            edition: selectedEdition !== "ALL" ? selectedEdition : undefined,
            search: searchQuery || undefined,
            country_code: selectedCountryCode,
          }),
          fetchDeals({
            platform: selectedPlatform !== "ALL" ? selectedPlatform : undefined,
            country_code: selectedCountryCode,
          }),
        ]);

        if (isMounted) {
          setProducts(prods);
          setDeals(dls);
        }
      } catch (err) {
        console.error("Failed to load price data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [selectedCountryCode, selectedPlatform, selectedEdition, searchQuery]);

  // Load Alerts and Wishlist when respective tabs are opened
  useEffect(() => {
    if (!token) return;
    if (activeTab === "alerts") {
      fetchPlayerPriceAlerts(token).then(setAlerts);
    } else if (activeTab === "wishlist") {
      fetchPlayerWishlist(token, selectedCountryCode).then(setWishlist);
    }
  }, [activeTab, token, selectedCountryCode]);

  const selectedRegion = useMemo(() => {
    return regions.find((r) => r.country_code === selectedCountryCode) || regions[0];
  }, [regions, selectedCountryCode]);

  const bestDeal = useMemo(() => {
    return deals.length > 0 ? deals[0] : null;
  }, [deals]);

  const handleOpenAlert = (productId: string, productName: string, price: number) => {
    if (!token) {
      alert("Please log in to set target price alerts.");
      return;
    }
    setAlertDialog({
      isOpen: true,
      productId,
      productName,
      currentPrice: price,
    });
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!token) return;
    const ok = await deletePriceAlert(alertId, token);
    if (ok) {
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 pb-20">
      <PricePageHeader
        lastUpdated={stats?.last_verified_at}
        totalDeals={stats?.total_deals}
        totalVerified={stats?.total_verified_observations}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#202738] pb-4 mb-6 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "catalog"
                ? "bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20"
                : "text-slate-400 hover:text-white bg-[#12151f] border border-[#202738]"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>All Editions & Stores</span>
          </button>

          <button
            onClick={() => setActiveTab("deals")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "deals"
                ? "bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20"
                : "text-slate-400 hover:text-white bg-[#12151f] border border-[#202738]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Verified Deals ({deals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("alerts")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "alerts"
                ? "bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20"
                : "text-slate-400 hover:text-white bg-[#12151f] border border-[#202738]"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Price Alerts {alerts.length > 0 && `(${alerts.length})`}</span>
          </button>

          <button
            onClick={() => setActiveTab("wishlist")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "wishlist"
                ? "bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20"
                : "text-slate-400 hover:text-white bg-[#12151f] border border-[#202738]"
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Wishlist {wishlist.length > 0 && `(${wishlist.length})`}</span>
          </button>
        </div>

        {/* Region & Filtering Controls */}
        <div className="bg-[#0f121c] border border-[#202738] rounded-2xl p-4 sm:p-5 mb-8 space-y-4">
          <RegionSelector
            regions={regions}
            selectedCountryCode={selectedCountryCode}
            onSelectRegion={setSelectedCountryCode}
          />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-3 border-t border-[#1b2133]">
            <div className="flex flex-wrap items-center gap-2">
              <PlatformFilter
                selectedPlatform={selectedPlatform}
                onSelectPlatform={setSelectedPlatform}
              />
              <EditionFilter
                selectedEdition={selectedEdition}
                onSelectEdition={setSelectedEdition}
              />
            </div>

            <PriceSearch
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
        </div>

        {/* Selected Region Tax & Conversion Disclosure */}
        <div className="bg-[#12151f] border border-[#1f2638] rounded-xl px-4 py-2.5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
          <div>
            <span>Region: <strong className="text-white">{selectedRegion?.region_name}</strong></span>
            <span className="mx-2">•</span>
            <span>
              {selectedRegion?.tax_inclusive
                ? "Prices include regional VAT/Sales Tax."
                : "Prices exclude US state sales tax (calculated at checkout)."}
            </span>
          </div>
          {selectedCountryCode !== "IND" && selectedRegion && (
            <div className="text-[11px] text-slate-400">
              Reference Exchange Rate: 1 {selectedRegion.currency_code} ≈ ₹{selectedRegion.exchange_rate_to_inr} INR
            </div>
          )}
        </div>

        {/* Tab 1: Catalog View */}
        {activeTab === "catalog" && (
          <div>
            {bestDeal && !searchQuery && selectedPlatform === "ALL" && (
              <FeaturedBestPrice deal={bestDeal} />
            )}

            {selectedPlatform === "PC" && (
              <PriceUnavailableState isPC={true} />
            )}

            {loading ? (
              <PriceLoadingSkeleton />
            ) : products.length === 0 ? (
              <div className="text-center py-16 bg-[#12151f] rounded-2xl border border-[#202738]">
                <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">No products match your filter</h3>
                <p className="text-xs text-slate-400">Try adjusting your platform, edition, or search criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((prod) => (
                  <PriceComparisonCard
                    key={prod.id}
                    product={prod}
                    token={token}
                    onSetAlert={handleOpenAlert}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Verified Deals */}
        {activeTab === "deals" && (
          <div>
            {deals.length === 0 ? (
              <div className="text-center py-16 bg-[#12151f] rounded-2xl border border-[#202738]">
                <Tag className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">No Active Discounts in {selectedRegion?.region_name}</h3>
                <p className="text-xs text-slate-400">
                  Authorized stores currently list full standard pre-order MSRP. We only display verified discounts.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deals.map((deal) => (
                  <DealCard key={deal.observation_id} deal={deal} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Price Alerts */}
        {activeTab === "alerts" && (
          <div className="space-y-4">
            {!token ? (
              <div className="bg-[#12151f] border border-[#202738] rounded-2xl p-8 text-center max-w-lg mx-auto">
                <Bell className="w-10 h-10 text-orange-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-2">Player Authentication Required</h3>
                <p className="text-xs text-slate-400 mb-6">
                  Log in to your GTA 6 Player Hub account to configure personalized target price alerts and receive price-drop notifications.
                </p>
                <a
                  href="/login"
                  className="inline-flex px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20"
                >
                  Log In to Account
                </a>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-16 bg-[#12151f] rounded-2xl border border-[#202738]">
                <Bell className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">No Active Price Alerts</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Browse editions in the catalog and click &quot;Alert&quot; to set your target purchase price.
                </p>
                <button
                  onClick={() => setActiveTab("catalog")}
                  className="px-5 py-2 bg-[#1b2131] hover:bg-[#252c42] text-slate-200 text-xs font-semibold rounded-lg"
                >
                  Browse Catalog
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <PriceAlertCard
                    key={alert.id}
                    alert={alert}
                    onDelete={handleDeleteAlert}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Wishlist */}
        {activeTab === "wishlist" && (
          <div>
            {!token ? (
              <div className="bg-[#12151f] border border-[#202738] rounded-2xl p-8 text-center max-w-lg mx-auto">
                <Heart className="w-10 h-10 text-rose-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-2">Player Authentication Required</h3>
                <p className="text-xs text-slate-400 mb-6">
                  Log in to your account to save products to your personal wishlist and track prices.
                </p>
                <a
                  href="/login"
                  className="inline-flex px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20"
                >
                  Log In to Account
                </a>
              </div>
            ) : wishlist.length === 0 ? (
              <div className="text-center py-16 bg-[#12151f] rounded-2xl border border-[#202738]">
                <Heart className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">Your Wishlist Is Empty</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Click the heart icon on any product in the catalog to save it to your wishlist.
                </p>
                <button
                  onClick={() => setActiveTab("catalog")}
                  className="px-5 py-2 bg-[#1b2131] hover:bg-[#252c42] text-slate-200 text-xs font-semibold rounded-lg"
                >
                  Browse Catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlist.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#12151f] border border-[#202738] rounded-2xl p-6 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-[#0c0e17] px-2 py-0.5 rounded border border-[#1d2335]">
                          {item.platform}
                        </span>
                        <span className="text-xs text-slate-500 uppercase">{item.edition}</span>
                      </div>
                      <h4 className="text-base font-bold text-white mb-2">{item.product_name}</h4>
                    </div>
                    <div className="pt-4 border-t border-[#1b2131] flex items-center justify-between">
                      <span className="text-xl font-mono font-black text-white">
                        {item.currency_symbol}{item.lowest_verified_price || "TBA"}
                      </span>
                      <a
                        href={`/price-deals/${item.slug}`}
                        className="px-4 py-2 bg-[#181c2b] hover:bg-[#202538] text-slate-200 rounded-lg text-xs font-bold"
                      >
                        Compare
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Target Price Dialog */}
      {selectedRegion && (
        <TargetPriceForm
          productId={alertDialog.productId}
          productName={alertDialog.productName}
          regionId={selectedRegion.id}
          currencyCode={selectedRegion.currency_code}
          currencySymbol={selectedRegion.currency_symbol}
          currentPrice={alertDialog.currentPrice}
          token={token}
          isOpen={alertDialog.isOpen}
          onClose={() => setAlertDialog((prev) => ({ ...prev, isOpen: false }))}
          onSuccess={() => {
            if (token) fetchPlayerPriceAlerts(token).then(setAlerts);
          }}
        />
      )}
    </div>
  );
}
