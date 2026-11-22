import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchPriceProductDetail,
  comparePrices,
  fetchPriceHistory,
  fetchPriceRegions,
} from "@/lib/priceApi";
import { PriceDetailPageClient } from "@/components/prices/PriceDetailPageClient";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await fetchPriceProductDetail(resolvedParams.slug, "USA");

  if (!product) {
    return {
      title: "Product Not Found | GTA 6 Player Hub",
    };
  }

  return {
    title: `${product.name} | Verified Price & History | GTA 6 Player Hub`,
    description: `Track real-time verified prices, compare authorized retailer offers, and explore price history for ${product.name}.`,
    openGraph: {
      title: `${product.name} - Price Tracker`,
      description: `Verified store comparisons and historical pricing for ${product.name}.`,
      type: "website",
    },
  };
}

export default async function PriceDetailPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const countryCode = (resolvedSearchParams.country_code as string) || "USA";

  const [product, regions] = await Promise.all([
    fetchPriceProductDetail(resolvedParams.slug, countryCode),
    fetchPriceRegions(),
  ]);

  if (!product) {
    notFound();
  }

  const [comparison, history] = await Promise.all([
    comparePrices(product.slug, countryCode),
    fetchPriceHistory(product.slug, countryCode),
  ]);

  // Schema.org Product Offer JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: {
      "@type": "Brand",
      name: "Rockstar Games",
    },
    offers: comparison?.offers.map((offer) => ({
      "@type": "Offer",
      price: offer.current_price,
      priceCurrency: offer.currency_code,
      url: offer.product_url,
      seller: {
        "@type": "Organization",
        name: offer.store_name,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PriceDetailPageClient
        product={product}
        initialComparison={comparison}
        initialHistory={history}
        regions={regions}
        defaultCountryCode={countryCode}
      />
    </>
  );
}
