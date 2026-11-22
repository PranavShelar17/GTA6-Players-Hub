import type { Metadata } from "next";
import {
  fetchPriceRegions,
  fetchPriceProducts,
  fetchDeals,
  fetchPriceStats,
} from "@/lib/priceApi";
import { PricePageClient } from "@/components/prices/PricePageClient";

export const metadata: Metadata = {
  title: "GTA 6 Price & Deals Tracker | Compare PS5 & Xbox Series X/S Editions",
  description:
    "Track verified Grand Theft Auto VI pre-order prices, compare authorized digital and physical retail editions across global currencies (INR, USD, GBP, EUR, AED), and set target price alerts.",
  openGraph: {
    title: "GTA 6 Price & Deals Tracker | Compare Global Editions",
    description:
      "Verified GTA 6 pre-order pricing intelligence across PlayStation 5 and Xbox Series X/S. Compare official stores, discover verified discounts, and track historical prices.",
    type: "website",
    url: "https://gta6playerhub.com/price-deals",
  },
  twitter: {
    card: "summary_large_image",
    title: "GTA 6 Price & Deals Tracker",
    description: "Compare verified GTA 6 retail editions and prices worldwide.",
  },
};

export default async function PriceDealsPage() {
  const [regions, products, deals, stats] = await Promise.all([
    fetchPriceRegions(),
    fetchPriceProducts({ country_code: "USA" }),
    fetchDeals({ country_code: "USA" }),
    fetchPriceStats(),
  ]);

  // Schema.org AggregateOffer JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Grand Theft Auto VI",
    description:
      "Grand Theft Auto VI retail editions and verified pre-order prices across authorized storefronts.",
    brand: {
      "@type": "Brand",
      name: "Rockstar Games",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "64.99",
      highPrice: "89.99",
      offerCount: deals.length || 5,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PricePageClient
        initialRegions={regions}
        initialProducts={products}
        initialDeals={deals}
        initialStats={stats}
      />
    </>
  );
}
