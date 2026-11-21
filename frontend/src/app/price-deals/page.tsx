"use client";

import React, { useState } from "react";
import { 
  Tag, 
  Globe, 
  ShieldCheck, 
  Bell, 
  Heart, 
  Info,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";

const COUNTRIES = [
  { code: "IND", name: "India", currency: "INR", symbol: "₹" },
  { code: "USA", name: "United States", currency: "USD", symbol: "$" },
  { code: "GBR", name: "United Kingdom", currency: "GBP", symbol: "£" },
  { code: "EUR", name: "Europe", currency: "EUR", symbol: "€" },
  { code: "ARE", name: "UAE", currency: "AED", symbol: "AED " },
];

const DEMO_PRICES: Record<string, Array<{
  edition: string;
  platform: string;
  store: string;
  originalPrice: number;
  currentPrice: number;
  discount: number;
  isPreorder: boolean;
  productUrl: string;
}>> = {
  IND: [
    {
      edition: "Standard Edition",
      platform: "PlayStation 5",
      store: "PlayStation Store (India)",
      originalPrice: 5999,
      currentPrice: 5999,
      discount: 0,
      isPreorder: true,
      productUrl: "https://store.playstation.com"
    },
    {
      edition: "Deluxe Edition",
      platform: "Xbox Series X/S",
      store: "Xbox Marketplace (India)",
      originalPrice: 7999,
      currentPrice: 7499,
      discount: 6,
      isPreorder: true,
      productUrl: "https://www.xbox.com"
    },
    {
      edition: "Standard Edition",
      platform: "PC (Pending)",
      store: "Steam / Rockstar Store",
      originalPrice: 5999,
      currentPrice: 5999,
      discount: 0,
      isPreorder: true,
      productUrl: "https://store.steampowered.com"
    }
  ],
  USA: [
    {
      edition: "Standard Edition",
      platform: "PlayStation 5",
      store: "PlayStation Direct (US)",
      originalPrice: 69.99,
      currentPrice: 69.99,
      discount: 0,
      isPreorder: true,
      productUrl: "https://direct.playstation.com"
    },
    {
      edition: "Deluxe Edition",
      platform: "Xbox Series X",
      store: "Microsoft Store (US)",
      originalPrice: 89.99,
      currentPrice: 84.99,
      discount: 5,
      isPreorder: true,
      productUrl: "https://www.xbox.com"
    },
    {
      edition: "Standard Edition",
      platform: "PC (Pending)",
      store: "Rockstar Store",
      originalPrice: 69.99,
      currentPrice: 69.99,
      discount: 0,
      isPreorder: true,
      productUrl: "https://store.rockstargames.com"
    }
  ],
  GBR: [
    {
      edition: "Standard Edition",
      platform: "PlayStation 5",
      store: "PlayStation Store (UK)",
      originalPrice: 64.99,
      currentPrice: 64.99,
      discount: 0,
      isPreorder: true,
      productUrl: "https://store.playstation.com"
    },
    {
      edition: "Deluxe Edition",
      platform: "Xbox Series X",
      store: "Xbox Store (UK)",
      originalPrice: 79.99,
      currentPrice: 79.99,
      discount: 0,
      isPreorder: true,
      productUrl: "https://www.xbox.com"
    },
    {
      edition: "Standard Edition",
      platform: "PC (Pending)",
      store: "Rockstar Store",
      originalPrice: 64.99,
      currentPrice: 64.99,
      discount: 0,
      isPreorder: true,
      productUrl: "https://store.rockstargames.com"
    }
  ],
  EUR: [
    {
      edition: "Standard Edition",
      platform: "PlayStation 5",
      store: "PlayStation Store (EU)",
      originalPrice: 79.99,
      currentPrice: 79.99,
      discount: 0,
      isPreorder: true,
      productUrl: "https://store.playstation.com"
    },
    {
      edition: "Deluxe Edition",
      platform: "Xbox Series X",
      store: "Xbox Store (EU)",
      originalPrice: 99.99,
      currentPrice: 94.99,
      discount: 5,
      isPreorder: true,
      productUrl: "https://www.xbox.com"
    },
    {
      edition: "Standard Edition",
      platform: "PC (Pending)",
      store: "Rockstar Store",
      originalPrice: 79.99,
      currentPrice: 79.99,
      discount: 0,
      isPreorder: true,
      productUrl: "https://store.rockstargames.com"
    }
  ],
  ARE: [
    {
      edition: "Standard Edition",
      platform: "PlayStation 5",
      store: "PlayStation Store (UAE)",
      originalPrice: 289,
      currentPrice: 289,
      discount: 0,
      isPreorder: true,
      productUrl: "https://store.playstation.com"
    },
    {
      edition: "Deluxe Edition",
      platform: "Xbox Series X",
      store: "Xbox Store (UAE)",
      originalPrice: 349,
      currentPrice: 349,
      discount: 0,
      isPreorder: true,
      productUrl: "https://www.xbox.com"
    },
    {
      edition: "Standard Edition",
      platform: "PC (Pending)",
      store: "Rockstar Store",
      originalPrice: 289,
      currentPrice: 289,
      discount: 0,
      isPreorder: true,
      productUrl: "https://store.rockstargames.com"
    }
  ]
};

export default function PriceDealsPage() {
  const [selectedCountry, setSelectedCountry] = useState("IND");
  const [selectedPlatform, setSelectedPlatform] = useState("ALL");

  const currentCountry = COUNTRIES.find((c) => c.code === selectedCountry) || COUNTRIES[0];
  const deals = (DEMO_PRICES[selectedCountry] || DEMO_PRICES["IND"]).filter((d) => {
    if (selectedPlatform === "ALL") return true;
    return d.platform.toLowerCase().includes(selectedPlatform.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header Banner */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">
          <Tag className="w-4 h-4" />
          <span>Global Commerce Intelligence</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          GTA 6 Price & Deals Tracker
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl">
          Worldwide pricing intelligence across PlayStation 5, Xbox Series X/S, and PC, comparing verified store listings and currency rates.
        </p>
      </div>

      {/* DEMONSTRATION NOTICE BANNER */}
      <div className="mb-8 p-4 rounded-xl border border-amber-500/40 bg-amber-950/20 text-xs text-amber-200 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300">DEMONSTRATION DATA ONLY:</span> Store pricing shown below is illustrative demonstration data based on anticipated publisher regional tiers. Live scraping of authorized retailers (PlayStation Store, Xbox, Steam) and verified price-drop alerts will be activated in Phase 5.
        </div>
      </div>

      {/* Country & Currency Selector Bar */}
      <div className="p-4 rounded-xl border border-[#1e2330] bg-[#12141c] flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Globe className="w-4 h-4 text-orange-400 shrink-0" />
          <span className="text-xs font-bold text-white uppercase tracking-wider shrink-0">Select Region:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                onClick={() => setSelectedCountry(c.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCountry === c.code
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-[#181c28] text-slate-400 hover:text-white hover:bg-[#202636]"
                }`}
              >
                {c.name} ({c.currency})
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end text-xs text-slate-400">
          <span>Active Currency:</span>
          <span className="font-bold text-orange-400 px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
            {currentCountry.currency} ({currentCountry.symbol.trim()})
          </span>
        </div>
      </div>

      {/* Platform Tabs & Filter Bar */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-2 border-b border-[#1a1f2b]">
        <div className="flex items-center gap-2">
          {["ALL", "PlayStation", "Xbox", "PC"].map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPlatform(p)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                selectedPlatform === p
                  ? "bg-[#1f2535] text-white border border-[#30394e]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {p === "ALL" ? "All Platforms" : p}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500">
          Showing {deals.length} tracked editions
        </span>
      </div>

      {/* Price Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {deals.map((deal, idx) => (
          <Card key={idx} className="border-[#1e2330] flex flex-col justify-between hover:border-orange-500/30 transition-colors">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <Badge variant={deal.platform.includes("PC") ? "unconfirmed" : "verified"}>
                  {deal.platform}
                </Badge>
                {deal.discount > 0 && (
                  <Badge variant="official">
                    {deal.discount}% Discount
                  </Badge>
                )}
              </div>

              <CardTitle className="text-lg text-white mb-1">
                {deal.edition}
              </CardTitle>

              <div className="text-xs text-slate-400 mb-4 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{deal.store}</span>
              </div>

              {/* Price Tag */}
              <div className="p-4 rounded-xl bg-[#151926] border border-[#202738] mb-4">
                <div className="text-xs text-slate-400 mb-0.5">Estimated Retail Price</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">
                    {currentCountry.symbol}{deal.currentPrice.toLocaleString()}
                  </span>
                  {deal.discount > 0 && (
                    <span className="text-sm text-slate-500 line-through">
                      {currentCountry.symbol}{deal.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Last verified: Demo simulation
                </div>
              </div>
            </div>

            <CardFooter className="pt-3 border-t border-[#1a1f2b] flex items-center gap-2">
              <Button variant="primary" size="sm" className="flex-1 gap-1.5">
                <Bell className="w-3.5 h-3.5" />
                Price Alert
              </Button>
              <Button variant="secondary" size="sm" className="p-2" title="Add to Wishlist">
                <Heart className="w-4 h-4 text-rose-400" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Historical Price Trend & Retailer Standards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Price History Chart Placeholder */}
        <Card className="border-[#1e2330]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-white">Historical Price Tracking</CardTitle>
              <Badge variant="default">Recharts Ready</Badge>
            </div>
            <CardDescription>
              Interactive price trendline monitoring store discounts, seasonal sales, and currency fluctuation.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="h-44 w-full rounded-xl bg-[#11131c] border border-[#1d222e] p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>All-Time High: {currentCountry.symbol}7,999</span>
                <span>Current: {currentCountry.symbol}5,999</span>
                <span>All-Time Low: {currentCountry.symbol}5,499</span>
              </div>

              <div className="relative w-full h-20 flex items-center">
                <svg className="w-full h-full" viewBox="0 0 400 60" preserveAspectRatio="none">
                  <path
                    d="M 0 40 Q 100 15, 200 35 T 400 20"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="2.5"
                  />
                  <circle cx="0" cy="40" r="4" fill="#f97316" />
                  <circle cx="200" cy="35" r="4" fill="#f97316" />
                  <circle cx="400" cy="20" r="4" fill="#f97316" />
                </svg>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span>Announcement</span>
                <span>Pre-Order Window</span>
                <span>Current Date</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Authorized Stores Policy */}
        <Card className="border-[#1e2330]">
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Authorized Store Policy</span>
            </CardTitle>
            <CardDescription>
              Our integrity policy protects players from grey-market key reseller risks.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 text-xs text-slate-400 leading-relaxed">
            <p>
              • GTA 6 Player Hub exclusively tracks official, authorized digital stores: PlayStation Direct, Xbox Marketplace, Steam, Epic Games Store, and the Rockstar Games Store.
            </p>
            <p>
              • We never list unauthorized grey-market sellers or fake promo code generators.
            </p>
            <p>
              • Pre-orders will only become active when officially launched by Take-Two Interactive and platform distributors.
            </p>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
