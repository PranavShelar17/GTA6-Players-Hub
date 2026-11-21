import React from "react";
import type { Metadata } from "next";
import { NewsPageClient } from "@/components/news/NewsPageClient";

export const metadata: Metadata = {
  title: "GTA 6 News & Updates – Verified Rockstar Announcements & Bulletins",
  description:
    "Comprehensive GTA 6 news hub: Official Rockstar Games announcements, Take-Two earnings reports, PS5 Pro technical analyses, gameplay features, and strict 4-tier truth verification.",
  keywords: [
    "GTA 6 News",
    "Grand Theft Auto VI Updates",
    "Rockstar Newswire",
    "GTA 6 Release Date",
    "Take-Two Earnings GTA 6",
    "PS5 Pro GTA 6",
    "Vice City Map",
  ],
  openGraph: {
    title: "GTA 6 News & Updates – Official Bulletins & Verified Reports",
    description:
      "Explore verified GTA 6 news, technical analyses, and official releases with transparent source citations.",
    type: "website",
    url: "https://gta6playerhub.local/news",
  },
  twitter: {
    card: "summary_large_image",
    title: "GTA 6 News & Updates – GTA 6 Player Hub",
    description: "Verified Grand Theft Auto VI news bulletins and official announcements.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "GTA 6 News & Updates",
  "description": "Verified Grand Theft Auto VI news and editorial bulletins.",
  "url": "https://gta6playerhub.local/news",
  "publisher": {
    "@type": "Organization",
    "name": "GTA 6 Player Hub",
    "url": "https://gta6playerhub.local",
  },
};

export default function NewsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NewsPageClient />
    </>
  );
}
