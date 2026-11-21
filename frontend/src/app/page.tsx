import React from "react";
import type { Metadata } from "next";
import { HomePageClient } from "@/components/home/HomePageClient";

export const metadata: Metadata = {
  title: "GTA 6 Player Hub – Premier Grand Theft Auto VI Intelligence Platform",
  description:
    "Enterprise player platform for Grand Theft Auto VI: Verified news from Rockstar Newswire, worldwide price intelligence, hardware compatibility diagnostics, AI technical troubleshooter, and player community.",
  keywords: [
    "GTA 6",
    "Grand Theft Auto VI",
    "Vice City",
    "Rockstar Games",
    "GTA 6 News",
    "GTA 6 Price Tracker",
    "GTA 6 PC Requirements",
    "GTA 6 PC Compatibility",
    "Gaming Problem Solver",
    "GTA 6 Release Date",
  ],
  authors: [{ name: "GTA 6 Player Hub Editorial Team" }],
  openGraph: {
    title: "GTA 6 Player Hub – Premier Grand Theft Auto VI Intelligence Platform",
    description:
      "Verified GTA 6 news, global retail pre-order price tracking, PC compatibility analyzer, and community hub for Grand Theft Auto VI.",
    type: "website",
    locale: "en_US",
    siteName: "GTA 6 Player Hub",
  },
  twitter: {
    card: "summary_large_image",
    title: "GTA 6 Player Hub – Premier Grand Theft Auto VI Intelligence Platform",
    description: "Verified news, PC compatibility diagnostics, pre-order tracker, and gaming problem solver.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://gta6playerhub.local/#website",
      "url": "https://gta6playerhub.local/",
      "name": "GTA 6 Player Hub",
      "description": "Premier Grand Theft Auto VI Player Intelligence Platform",
      "potentialAction": [
        {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://gta6playerhub.local/news?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      ],
      "inLanguage": "en-US",
    },
    {
      "@type": "Organization",
      "@id": "https://gta6playerhub.local/#organization",
      "name": "GTA 6 Player Hub",
      "url": "https://gta6playerhub.local/",
      "logo": "https://gta6playerhub.local/icon.png",
      "sameAs": [],
    },
  ],
};

export default function HomePage() {
  return (
    <>
      {/* Structured Data (Schema.org) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <HomePageClient />
    </>
  );
}
