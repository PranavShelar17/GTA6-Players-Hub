"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  fetchHomeFeed, 
  HomeAggregatedResponse, 
  FALLBACK_HOME_DATA 
} from "@/lib/homeApi";
import { HeroSection } from "./HeroSection";
import { PersonalizedDashboardWidget } from "./PersonalizedDashboardWidget";
import { PlatformPillarsSection } from "./PlatformPillarsSection";
import { LatestNewsSection } from "./LatestNewsSection";
import { FeaturedDealsSection } from "./FeaturedDealsSection";
import { UpcomingEventsSection } from "./UpcomingEventsSection";
import { CommunityHighlightsSection } from "./CommunityHighlightsSection";
import { PCCompatibilitySection } from "./PCCompatibilitySection";
import { ProblemSolverSection } from "./ProblemSolverSection";
import { HomeSearch } from "./HomeSearch";

export function HomePageClient() {
  const { profile, preferences, isAuthenticated } = useAuth();
  const [feedData, setFeedData] = useState<HomeAggregatedResponse>(FALLBACK_HOME_DATA);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Preferred user options
  const preferredCountry = preferences?.preferred_country || profile?.country_code || "IN";
  const preferredCurrency = preferences?.preferred_currency || "INR";
  const preferredPlatform = preferences?.preferred_platform || profile?.preferred_platform || "PC";

  const loadFeed = useCallback(async () => {
    try {
      const result = await fetchHomeFeed({
        countryCode: preferredCountry,
        currency: preferredCurrency,
        platform: preferredPlatform,
      });

      setFeedData(result.data);
      setIsFallback(result.isFallback);
    } catch {
      setFeedData(FALLBACK_HOME_DATA);
      setIsFallback(true);
    }
  }, [preferredCountry, preferredCurrency, preferredPlatform]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    function handleOpenSearch() {
      setIsSearchOpen(true);
    }
    window.addEventListener("gta6:open-search", handleOpenSearch);
    return () => window.removeEventListener("gta6:open-search", handleOpenSearch);
  }, []);

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* 1. HERO SECTION */}
      <HeroSection onOpenSearch={() => setIsSearchOpen(true)} />

      {/* 2. PERSONALIZED DASHBOARD WIDGET (LOGGED-IN USERS) */}
      {isAuthenticated && <PersonalizedDashboardWidget />}

      {/* 3. PLATFORM PILLARS (SIX CORE SERVICES) */}
      <PlatformPillarsSection />

      {/* 4. LATEST GTA 6 NEWS & BULLETINS */}
      <LatestNewsSection news={feedData.news} isFallback={isFallback} />

      {/* 5. FEATURED GLOBAL EDITIONS & DEALS */}
      <FeaturedDealsSection
        deals={feedData.deals}
        preferredCurrency={preferredCurrency}
        preferredCountry={preferredCountry}
        isFallback={isFallback}
      />

      {/* 6. UPCOMING EVENTS & COMMUNITY HIGHLIGHTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <UpcomingEventsSection events={feedData.events} />
          <CommunityHighlightsSection community={feedData.community} />
        </div>
      </section>

      {/* 7. PC COMPATIBILITY QUICK ACCESS */}
      <PCCompatibilitySection />

      {/* 8. PROBLEM SOLVER QUICK ACCESS */}
      <ProblemSolverSection />

      {/* GLOBAL SEARCH MODAL */}
      <HomeSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
